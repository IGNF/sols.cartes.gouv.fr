/**
 * `fetch` for the GPF capabilities, which the GPF sometimes accepts and never answers, answers late, or
 * stops sending halfway through the body (D-carto-1, D-carto-11). Rather than abandoning a request after a
 * fixed wait (a slow but working server then never gets through), another request is sent alongside
 * whenever no request has made progress (response headers or body bytes) for `hedgeDelayMs`, up to
 * `attempts` requests: the first one read to the end wins and the others are aborted. A slow network that
 * keeps receiving bytes never triggers a new request, and nothing ever fails while bytes keep coming.
 * Requests bypass the HTTP cache (`no-store`): the browser makes a request wait for an identical one in
 * flight (cache lock), so a hedge would hang behind the first one (measured in Chromium: 5 loads in 90
 * without capabilities). The GPF capabilities carry no validator nor freshness header: nothing is lost.
 */
export class TimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Pas de réponse de ${new URL(url).host} en ${timeoutMs / 1000} s`);
    this.name = 'TimeoutError';
  }
}

export interface HedgeOptions {
  signal?: AbortSignal;
  /** Wait without any progress before another request is sent; the earlier ones keep running. */
  hedgeDelayMs: number;
  /** Requests sent at most. */
  attempts: number;
  /** Wait without any progress on any request after which every request is aborted (TimeoutError). */
  deadlineMs: number;
}

function abortError(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError');
}

/** Reads the whole body, calling `onProgress` on each chunk, and returns an equivalent buffered Response. */
async function readFully(response: Response, onProgress: () => void): Promise<Response> {
  const init = {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
  if (!response.body) return new Response(null, init);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.length;
    onProgress();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return new Response(body, init);
}

/**
 * Resolves with the first successful response, its body already read (the caller reads it at once). A
 * request that fails (network error, body cut) or answers with an HTTP error while no other one is in
 * flight sends the next one at once; when every request has failed, the last HTTP error response is
 * returned (the caller reports its status) or the last error thrown.
 */
export function fetchHedged(
  url: string,
  { signal, hedgeDelayMs, attempts, deadlineMs }: HedgeOptions,
): Promise<Response> {
  if (signal?.aborted) return Promise.reject(abortError(signal));
  return new Promise<Response>((resolve, reject) => {
    const controllers = new Set<AbortController>();
    let sent = 0;
    let settled = false;
    let lastResponse: Response | null = null;
    let lastError: unknown = null;
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined;
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (outcome: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(hedgeTimer);
      clearTimeout(deadlineTimer);
      signal?.removeEventListener('abort', onAbort);
      controllers.forEach((controller) => controller.abort());
      outcome();
    };
    /** The next request goes `hedgeDelayMs` after the last request sent or the last progress. */
    const armHedge = () => {
      clearTimeout(hedgeTimer);
      if (sent < attempts) hedgeTimer = setTimeout(send, hedgeDelayMs);
    };
    const armDeadline = () => {
      clearTimeout(deadlineTimer);
      deadlineTimer = setTimeout(
        () => finish(() => reject(new TimeoutError(url, deadlineMs))),
        deadlineMs,
      );
    };
    /** Headers or bytes arrived on some request: postpone the next request and the deadline. */
    const progress = () => {
      if (settled) return;
      armHedge();
      armDeadline();
    };
    const failed = () => {
      if (settled || controllers.size > 0) return;
      if (sent < attempts) {
        send();
        return;
      }
      if (lastResponse) finish(() => resolve(lastResponse as Response));
      else finish(() => reject(lastError));
    };
    const send = () => {
      sent += 1;
      const controller = new AbortController();
      controllers.add(controller);
      armHedge();
      fetch(url, { signal: controller.signal, cache: 'no-store' })
        .then(async (response) => {
          if (settled) return;
          progress();
          if (!response.ok) {
            controllers.delete(controller);
            lastResponse = response;
            failed();
            return;
          }
          const full = await readFully(response, progress);
          controllers.delete(controller);
          finish(() => resolve(full));
        })
        .catch((error: unknown) => {
          if (settled) return;
          controllers.delete(controller);
          lastError = error;
          failed();
        });
    };
    const onAbort = () => finish(() => reject(abortError(signal as AbortSignal)));
    signal?.addEventListener('abort', onAbort);
    armDeadline();
    send();
  });
}

/**
 * TanStack Query retry rule for the GPF capabilities: no new round after a TimeoutError (fetchHedged
 * already sent every request), `retries` more rounds for other errors (HTTP error, unreadable document).
 */
export function shouldRetryGpfRequest(retries: number) {
  return (failureCount: number, error: Error): boolean =>
    !(error instanceof TimeoutError) && failureCount < retries;
}
