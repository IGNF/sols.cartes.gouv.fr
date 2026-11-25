import { useQuery } from '@tanstack/react-query';
import { GPF_REQUEST_RETRIES, GPF_REQUEST_RETRY_DELAY_MS } from '../config/map';
import { shouldRetryGpfRequest } from '../map/fetchHedged';
import { fetchWmtsCapabilities, WMTS_CAPABILITIES_URL } from '../map/wmtsCapabilities';

export const wmtsCapabilitiesQueryKey = ['gpf', 'capabilities', WMTS_CAPABILITIES_URL] as const;

/**
 * GPF WMTS GetCapabilities, fetched once and cached for the session. The GPF can hang or delay a request:
 * `fetchHedged` sends others alongside until one answers; a new round only follows an HTTP error or an
 * unreadable document, never the deadline (D-carto-11).
 */
export default function useWmtsCapabilities() {
  return useQuery({
    queryKey: wmtsCapabilitiesQueryKey,
    queryFn: ({ signal }) => fetchWmtsCapabilities(signal),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: shouldRetryGpfRequest(GPF_REQUEST_RETRIES),
    retryDelay: GPF_REQUEST_RETRY_DELAY_MS,
  });
}
