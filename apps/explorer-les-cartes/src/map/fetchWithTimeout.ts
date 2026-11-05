/**
 * `fetch` that gives up after `timeoutMs`: the GPF sometimes accepts a capabilities request and never
 * answers (no response, no error), which would leave the map without its base layer forever.
 * The returned error is a `TimeoutError` so the caller (TanStack Query) can retry.
 */
export class TimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Pas de réponse de ${new URL(url).host} en ${timeoutMs / 1000} s`);
    this.name = 'TimeoutError';
  }
}

export async function fetchWithTimeout(
  url: string,
  { signal, timeoutMs }: { signal?: AbortSignal; timeoutMs: number },
): Promise<Response> {
  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('Aborted', 'AbortError');
  }
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new TimeoutError(url, timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
