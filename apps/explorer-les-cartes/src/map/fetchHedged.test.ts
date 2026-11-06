import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchHedged, shouldRetryGpfRequest, TimeoutError } from './fetchHedged';

const URL_ = 'https://data.geopf.fr/wmts?REQUEST=GetCapabilities';
const OPTIONS = { hedgeDelayMs: 1500, attempts: 3, deadlineMs: 10_000 };

interface Pending {
  signal: AbortSignal;
  answer: (response: Response) => void;
  fail: (error: unknown) => void;
}

/** A fetch whose requests stay pending until the test answers them; they honour abort like a browser. */
function controlledFetch() {
  const requests: Pending[] = [];
  const fetchMock = vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const signal = init.signal as AbortSignal;
        signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        requests.push({ signal, answer: resolve, fail: reject });
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return { requests, fetchMock };
}

/** A 200 response whose body the test feeds chunk by chunk (or never ends). */
function streamedResponse() {
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream = controller;
    },
  });
  const encoder = new TextEncoder();
  return {
    response: new Response(body, { status: 200 }),
    send: (text: string) => stream.enqueue(encoder.encode(text)),
    end: () => stream.close(),
  };
}

describe('fetchHedged', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('rend la première réponse sans autre requête quand elle arrive à temps', async () => {
    const { requests, fetchMock } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    requests[0]?.answer(new Response('ok'));
    expect(await (await pending).text()).toBe('ok');
    await vi.advanceTimersByTimeAsync(OPTIONS.deadlineMs);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('contourne le cache HTTP : une requête doublée n’attend pas la première (verrou du cache)', async () => {
    const { requests, fetchMock } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    await vi.advanceTimersByTimeAsync(OPTIONS.hedgeDelayMs);
    expect(fetchMock.mock.calls.map(([, init]) => init.cache)).toEqual(['no-store', 'no-store']);
    requests[1]?.answer(new Response('ok'));
    await pending;
  });

  it('envoie une autre requête sans réponse au bout du délai et garde la première qui répond (D-carto-11)', async () => {
    const { requests, fetchMock } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    await vi.advanceTimersByTimeAsync(OPTIONS.hedgeDelayMs - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The first request is still running: a hung one is not abandoned by the hedge.
    expect(requests[0]?.signal.aborted).toBe(false);
    requests[1]?.answer(new Response('second'));
    expect(await (await pending).text()).toBe('second');
    expect(requests[0]?.signal.aborted).toBe(true);
  });

  it('accepte une première requête lente qui répond après l’envoi des suivantes', async () => {
    const { requests } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    await vi.advanceTimersByTimeAsync(OPTIONS.hedgeDelayMs * 2);
    expect(requests).toHaveLength(3);
    requests[0]?.answer(new Response('lente'));
    expect(await (await pending).text()).toBe('lente');
    expect(requests[1]?.signal.aborted).toBe(true);
    expect(requests[2]?.signal.aborted).toBe(true);
    expect(requests[0]?.signal.aborted).toBe(false);
  });

  it('n’envoie pas plus de requêtes que prévu et échoue en TimeoutError à l’échéance', async () => {
    const { requests, fetchMock } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    const assertion = expect(pending).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(OPTIONS.deadlineMs - 1);
    expect(fetchMock).toHaveBeenCalledTimes(OPTIONS.attempts);
    expect(requests.some((r) => r.signal.aborted)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(requests.every((r) => r.signal.aborted)).toBe(true);
  });

  it('envoie aussitôt la requête suivante après une erreur réseau, et rend la dernière erreur', async () => {
    const { requests, fetchMock } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    const assertion = expect(pending).rejects.toThrow('réseau 3');
    for (let i = 0; i < OPTIONS.attempts; i += 1) {
      requests[i]?.fail(new TypeError(`réseau ${i + 1}`));
      await vi.advanceTimersByTimeAsync(0);
    }
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(OPTIONS.attempts);
  });

  it('réessaie après une erreur HTTP puis rend la dernière réponse en erreur si aucune ne réussit', async () => {
    const { requests } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    requests[0]?.answer(new Response('', { status: 502 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(requests).toHaveLength(2);
    requests[1]?.answer(new Response('ok'));
    expect((await pending).status).toBe(200);

    const { requests: all } = controlledFetch();
    const failing = fetchHedged(URL_, OPTIONS);
    for (let i = 0; i < OPTIONS.attempts; i += 1) {
      all[i]?.answer(new Response('', { status: 500 + i }));
      await vi.advanceTimersByTimeAsync(0);
    }
    expect((await failing).status).toBe(502);
  });

  it('transmet l’annulation de l’appelant à toutes les requêtes, sans délai dépassé', async () => {
    const { requests } = controlledFetch();
    const caller = new AbortController();
    const pending = fetchHedged(URL_, { ...OPTIONS, signal: caller.signal });
    await vi.advanceTimersByTimeAsync(OPTIONS.hedgeDelayMs);
    caller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(requests.every((r) => r.signal.aborted)).toBe(true);
  });

  it('envoie une autre requête quand le corps de la première s’arrête en route (D-carto-11)', async () => {
    const { requests, fetchMock } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    const first = streamedResponse();
    requests[0]?.answer(first.response);
    first.send('<Capabilities>');
    await vi.advanceTimersByTimeAsync(OPTIONS.hedgeDelayMs - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    requests[1]?.answer(new Response('<Capabilities/>'));
    expect(await (await pending).text()).toBe('<Capabilities/>');
    expect(requests[0]?.signal.aborted).toBe(true);
  });

  it('n’envoie rien d’autre tant que le corps arrive, même lentement, et le rend entier', async () => {
    const { requests, fetchMock } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    const slow = streamedResponse();
    requests[0]?.answer(slow.response);
    for (let i = 0; i < 12; i += 1) {
      await vi.advanceTimersByTimeAsync(OPTIONS.hedgeDelayMs - 100);
      slow.send(`${i};`);
    }
    slow.end();
    // 12 × 1.4 s = 16.8 s, beyond the deadline: bytes kept coming, nothing failed.
    expect(await (await pending).text()).toBe('0;1;2;3;4;5;6;7;8;9;10;11;');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('échoue en TimeoutError quand plus rien n’arrive, corps compris', async () => {
    const { requests } = controlledFetch();
    const pending = fetchHedged(URL_, OPTIONS);
    const assertion = expect(pending).rejects.toBeInstanceOf(TimeoutError);
    const stalled = streamedResponse();
    requests[0]?.answer(stalled.response);
    stalled.send('<Cap');
    await vi.advanceTimersByTimeAsync(OPTIONS.deadlineMs);
    await assertion;
    expect(requests).toHaveLength(OPTIONS.attempts);
    expect(requests.every((r) => r.signal.aborted)).toBe(true);
  });

  it('respecte un signal déjà annulé', async () => {
    const { fetchMock } = controlledFetch();
    const caller = new AbortController();
    caller.abort();
    await expect(fetchHedged(URL_, { ...OPTIONS, signal: caller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('shouldRetryGpfRequest', () => {
  it('ne relance pas après une échéance dépassée, relance les autres erreurs dans la limite', () => {
    const retry = shouldRetryGpfRequest(1);
    expect(retry(0, new TimeoutError(URL_, 16_000))).toBe(false);
    expect(retry(0, new Error('HTTP 500'))).toBe(true);
    expect(retry(1, new Error('HTTP 500'))).toBe(false);
  });
});
