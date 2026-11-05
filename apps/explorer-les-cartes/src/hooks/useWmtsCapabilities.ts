import { useQuery } from '@tanstack/react-query';
import { GPF_REQUEST_RETRIES, GPF_REQUEST_RETRY_DELAY_MS } from '../config/map';
import { fetchWmtsCapabilities, WMTS_CAPABILITIES_URL } from '../map/wmtsCapabilities';

export const wmtsCapabilitiesQueryKey = ['gpf', 'capabilities', WMTS_CAPABILITIES_URL] as const;

/**
 * GPF WMTS GetCapabilities, fetched once and cached for the session. Each attempt times out (the GPF can
 * hang a request) and is retried a few times.
 */
export default function useWmtsCapabilities() {
  return useQuery({
    queryKey: wmtsCapabilitiesQueryKey,
    queryFn: ({ signal }) => fetchWmtsCapabilities(signal),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: GPF_REQUEST_RETRIES,
    retryDelay: GPF_REQUEST_RETRY_DELAY_MS,
  });
}
