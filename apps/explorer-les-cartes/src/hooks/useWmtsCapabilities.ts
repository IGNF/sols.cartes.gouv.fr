import { useQuery } from '@tanstack/react-query';
import { fetchWmtsCapabilities, WMTS_CAPABILITIES_URL } from '../map/wmtsCapabilities';

export const wmtsCapabilitiesQueryKey = ['gpf', 'capabilities', WMTS_CAPABILITIES_URL] as const;

/** GPF WMTS GetCapabilities, fetched once and cached for the session. */
export default function useWmtsCapabilities() {
  return useQuery({
    queryKey: wmtsCapabilitiesQueryKey,
    queryFn: ({ signal }) => fetchWmtsCapabilities(signal),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
