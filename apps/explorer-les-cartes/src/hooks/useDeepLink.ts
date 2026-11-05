import { useEffect, useState } from 'react';
import { GPF_ENDPOINTS } from '../config/urls';
import { findSolsLayer } from '../data/solsLayers';
import type { SolsService } from '../data/solsLayersSchema';
import { readDeepLink } from '../map/deepLink';
import { toOverlayRef } from '../map/overlays';
import { findWmtsLayer } from '../map/wmtsCapabilities';
import { useMapStore } from '../store/useMapStore';
import useWmsCapabilities from './useWmsCapabilities';
import useWmtsCapabilities from './useWmtsCapabilities';

export type DeepLinkStatus =
  | { state: 'none' }
  | { state: 'checking'; name: string }
  | { state: 'added'; name: string; title: string }
  | { state: 'not-found'; name: string }
  | { state: 'unsupported'; name: string; type: string };

const ENDPOINTS: Record<SolsService, string> = {
  wmts: GPF_ENDPOINTS.wmts,
  'wms-raster': GPF_ENDPOINTS.wmsRaster,
  'wms-vector': GPF_ENDPOINTS.wmsVector,
  wfs: GPF_ENDPOINTS.wfs,
  tms: GPF_ENDPOINTS.tms,
};

type Lookup = { state: 'found'; title: string } | { state: 'absent' } | { state: 'pending' };

/**
 * Reads the "Voir sur la carte" link once (`l` permalink, or the `layer/type/url` alias). The layer is
 * looked up in sols-layers.json for each candidate service, then in the live capabilities of the
 * candidates in order (wms-r then wms-v for WMS, wmts for WMTS), and added to the map if published.
 */
export default function useDeepLink(search: string = window.location.search): DeepLinkStatus {
  const [request] = useState(() => readDeepLink(search));
  const addOverlay = useMapStore((state) => state.addOverlay);

  const layerRequest = request?.kind === 'layer' ? request : null;
  const candidates = layerRequest?.candidates ?? [];
  const name = request?.name ?? '';
  const known = candidates
    .map((service) => ({ service, match: findSolsLayer(service, name) }))
    .find((entry) => entry.match);
  const live = layerRequest && !known;
  const raster = useWmsCapabilities(
    live && candidates.includes('wms-raster') ? 'wms-raster' : null,
  );
  const vector = useWmsCapabilities(
    live && candidates.includes('wms-vector') ? 'wms-vector' : null,
  );
  const wmts = useWmtsCapabilities();

  const lookup = (service: SolsService): Lookup => {
    if (service === 'wmts') {
      if (wmts.isPending) return { state: 'pending' };
      const info = wmts.data ? findWmtsLayer(wmts.data, name) : null;
      return info ? { state: 'found', title: info.title } : { state: 'absent' };
    }
    const query = service === 'wms-raster' ? raster : service === 'wms-vector' ? vector : null;
    if (!query) return { state: 'absent' };
    if (query.isPending) return { state: 'pending' };
    const entry = query.data?.get(name);
    return entry ? { state: 'found', title: entry.title } : { state: 'absent' };
  };

  let status: DeepLinkStatus = { state: 'none' };
  let found: { service: SolsService; title: string } | null = null;
  if (request?.kind === 'unsupported') status = { state: 'unsupported', name, type: request.type };
  else if (request?.kind === 'invalid') status = { state: 'not-found', name };
  else if (known?.match) found = { service: known.service, title: known.match.layer.title };
  else if (layerRequest) {
    status = { state: 'not-found', name };
    for (const service of candidates) {
      const result = lookup(service);
      if (result.state === 'pending') {
        status = { state: 'checking', name };
        break;
      }
      if (result.state === 'found') {
        found = { service, title: result.title };
        break;
      }
    }
  }
  if (found) status = { state: 'added', name, title: found.title };

  const foundService = found?.service ?? null;
  const foundTitle = found?.title ?? '';
  useEffect(() => {
    if (!foundService || request?.kind !== 'layer') return;
    addOverlay({
      ...toOverlayRef(
        { service: foundService, name: request.name, endpoint: ENDPOINTS[foundService] },
        foundTitle,
      ),
      ...(request.opacity !== undefined ? { opacity: request.opacity } : {}),
      ...(request.visible !== undefined ? { visible: request.visible } : {}),
    });
  }, [foundService, foundTitle, request, addOverlay]);

  return status;
}
