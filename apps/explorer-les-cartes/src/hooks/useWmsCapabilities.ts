import { useQuery } from '@tanstack/react-query';
import { buildCapabilitiesUrl, GPF_ENDPOINTS } from '../config/urls';
import { indexWmsLayers, type CapabilitiesIndex } from '../data/capabilitiesIndex';

export type WmsFlavour = 'wms-raster' | 'wms-vector';

const ENDPOINTS: Record<WmsFlavour, string> = {
  'wms-raster': GPF_ENDPOINTS.wmsRaster,
  'wms-vector': GPF_ENDPOINTS.wmsVector,
};

export function wmsCapabilitiesUrl(flavour: WmsFlavour): string {
  return buildCapabilitiesUrl(ENDPOINTS[flavour], 'WMS', '1.3.0');
}

async function fetchWmsIndex(flavour: WmsFlavour, signal: AbortSignal): Promise<CapabilitiesIndex> {
  const response = await fetch(wmsCapabilitiesUrl(flavour), { signal });
  if (!response.ok) throw new Error(`Capacités WMS indisponibles (HTTP ${response.status})`);
  const doc = new DOMParser().parseFromString(await response.text(), 'text/xml');
  return indexWmsLayers(doc);
}

/** GPF WMS capabilities (layer names and titles), fetched only when `flavour` is set (deep links to unknown layers). */
export default function useWmsCapabilities(flavour: WmsFlavour | null) {
  return useQuery({
    queryKey: ['gpf', 'capabilities', flavour ? wmsCapabilitiesUrl(flavour) : null],
    queryFn: ({ signal }) => fetchWmsIndex(flavour as WmsFlavour, signal),
    enabled: flavour !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
