import { useEffect, useState } from 'react';
import { GPF_ENDPOINTS } from '../config/urls';
import { findSolsLayer } from '../data/solsLayers';
import type { SolsService } from '../data/solsLayersSchema';
import { parseDeepLink, resolveDeepLink, type DeepLinkTarget } from '../map/deepLink';
import { toOverlayRef } from '../map/overlays';
import { findWmtsLayer } from '../map/wmtsCapabilities';
import { useMapStore } from '../store/useMapStore';
import useWmsCapabilities, { type WmsFlavour } from './useWmsCapabilities';
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

function initialTarget(search: string): { name: string; target: DeepLinkTarget } | null {
  const link = parseDeepLink(search);
  return link ? { name: link.layer, target: resolveDeepLink(link) } : null;
}

/**
 * Reads `?layer=&type=&url=` once: a layer of sols-layers.json is added at once; an unknown one is checked
 * against the live capabilities (TanStack Query) and added if published; otherwise the status says why.
 */
export default function useDeepLink(search: string = window.location.search): DeepLinkStatus {
  const [link] = useState(() => initialTarget(search));
  const addOverlay = useMapStore((state) => state.addOverlay);

  const target = link?.target.kind === 'layer' ? link.target : null;
  const known = target ? findSolsLayer(target.service, target.name) : null;
  const liveService = target && !known ? target.service : null;
  const wmsFlavour: WmsFlavour | null =
    liveService === 'wms-raster' || liveService === 'wms-vector' ? liveService : null;
  const wms = useWmsCapabilities(wmsFlavour);
  const wmts = useWmtsCapabilities();

  let status: DeepLinkStatus = { state: 'none' };
  let toAdd: { title: string } | null = null;
  if (link) {
    const name = link.name;
    if (link.target.kind === 'unsupported')
      status = { state: 'unsupported', name, type: link.target.type };
    else if (link.target.kind === 'invalid' || !target) status = { state: 'not-found', name };
    else if (known) toAdd = { title: known.layer.title };
    else if (target.service === 'wmts') {
      if (wmts.isPending) status = { state: 'checking', name };
      else {
        const info = wmts.data ? findWmtsLayer(wmts.data, name) : null;
        if (info) toAdd = { title: info.title };
        else status = { state: 'not-found', name };
      }
    } else if (wmsFlavour) {
      if (wms.isPending) status = { state: 'checking', name };
      else {
        const entry = wms.data?.get(name);
        if (entry) toAdd = { title: entry.title };
        else status = { state: 'not-found', name };
      }
    } else status = { state: 'not-found', name };
    if (toAdd) status = { state: 'added', name, title: toAdd.title };
  }

  const addKey = status.state === 'added' ? status.name : null;
  const addTitle = status.state === 'added' ? status.title : '';
  useEffect(() => {
    if (!addKey || link?.target.kind !== 'layer') return;
    const { service, name } = link.target;
    addOverlay(toOverlayRef({ service, name, endpoint: ENDPOINTS[service] }, addTitle));
  }, [addKey, addTitle, link, addOverlay]);

  return status;
}
