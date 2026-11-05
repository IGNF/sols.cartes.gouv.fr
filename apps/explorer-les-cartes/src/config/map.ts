/**
 * Map configuration: base layers, initial view and control options.
 * Layer names are checked against the GPF WMTS GetCapabilities at runtime (src/map/createWmtsLayer.ts)
 * and were validated on 2026-11-05 (doc/agents/gpf-sols-data.md).
 */
import type { DefaultsOptions } from 'ol/control/defaults';
import type { Options as AttributionOptions } from 'ol/control/Attribution';
import type { Options as FullScreenOptions } from 'ol/control/FullScreen';
import type { Options as ScaleLineOptions } from 'ol/control/ScaleLine';
import type { Options as ZoomOptions } from 'ol/control/Zoom';
import type { LayerSwitcherOptions, SearchEngineOptions } from '../map/geopf';
import { EXTERNAL_LINKS } from './urls';

/** WMTS version requested from the GPF. */
export const WMTS_VERSION = '1.0.0';

export interface BaseLayerDefinition {
  /** Stable id used in the client store. */
  id: string;
  /** WMTS layer identifier on https://data.geopf.fr/wmts. */
  layerName: string;
}

/**
 * Candidate raster base layers, in display order. Only those published in the GPF WMTS GetCapabilities
 * are offered (src/map/baseLayerCatalogue.ts); their label is the capabilities title.
 * On 2026-11-05: all present except GEOGRAPHICALGRIDSYSTEMS.MAPS (not in the public capabilities).
 * CADASTRALPARCELS.PARCELLAIRE_EXPRESS is published but transparent: an overlay, not a background.
 */
export const BASE_LAYER_CANDIDATES = [
  { id: 'plan-ign', layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2' },
  { id: 'orthophotos', layerName: 'ORTHOIMAGERY.ORTHOPHOTOS' },
  { id: 'cartes-ign', layerName: 'GEOGRAPHICALGRIDSYSTEMS.MAPS' },
  { id: 'relief', layerName: 'ELEVATION.SLOPES' },
  { id: 'etat-major', layerName: 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40' },
  { id: 'photos-1950-1965', layerName: 'ORTHOIMAGERY.ORTHOPHOTOS.1950-1965' },
] as const satisfies readonly BaseLayerDefinition[];

export type BaseLayerId = (typeof BASE_LAYER_CANDIDATES)[number]['id'];

export const DEFAULT_BASE_LAYER_ID: BaseLayerId = 'plan-ign';

/** Attribution shown for every GPF base layer (the WMTS capabilities carry no attribution). */
export const GPF_ATTRIBUTION = `<a href="${EXTERNAL_LINKS.cartesGouv}" target="_blank" rel="noopener noreferrer">IGN – Géoplateforme</a>`;

/** Initial view: metropolitan France, Web Mercator. */
export const INITIAL_VIEW = {
  centerLonLat: [2.5, 46.6],
  zoom: 6,
  minZoom: 2,
  maxZoom: 19,
} as const;

/** Options of the geopf-extensions LayerSwitcher control (names checked in LayerSwitcher.d.ts). */
export const LAYER_SWITCHER_OPTIONS: LayerSwitcherOptions = {
  position: 'top-right',
  collapsed: true,
  panel: true,
  counter: true,
  allowDelete: false,
  allowEdit: false,
};

/** Accessible name of the map container. */
export const MAP_LABEL = 'Carte interactive des données sols';

/**
 * OpenLayers default controls: zoom and attribution are replaced by their geopf-extensions versions
 * (src/hooks/useMapControls.ts); rotation keeps the OL control with a French label.
 */
export const DEFAULT_CONTROLS_OPTIONS: DefaultsOptions = {
  zoom: false,
  attribution: false,
  rotateOptions: { tipLabel: 'Réinitialiser l’orientation' },
};

/** Position of a geopf-extensions control (values listed in Controls/Control.js). */
export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Options of the map tools; geopf-ext Zoom/FullScreen/Attribution take OL options plus `position`. */
export const MAP_TOOLS_OPTIONS = {
  zoom: { position: 'top-left' } satisfies ZoomOptions & { position: ControlPosition },
  fullScreen: {
    position: 'top-left',
    tipLabel: 'Plein écran',
  } satisfies FullScreenOptions & { position: ControlPosition },
  attribution: {
    collapsible: true,
    collapsed: false,
    tipLabel: 'Sources des données',
  } satisfies AttributionOptions,
  scaleLine: { units: 'metric', minWidth: 80 } satisfies ScaleLineOptions,
  search: {
    collapsed: false,
    placeholder: 'Rechercher un lieu, une adresse',
    displayButtonGeolocate: true,
    displayButtonAdvancedSearch: false,
    displayButtonCoordinateSearch: false,
    resources: { search: false },
    zoomTo: 'auto',
  } satisfies SearchEngineOptions,
};

/**
 * Accessible names of the geopf-extensions dialogs, keyed by their id prefix.
 * geopf-extensions 1.0.0-beta.16 renders them as DSFR `fr-modal` dialogs without a name.
 */
export const GEOPF_DIALOG_LABELS: Readonly<Record<string, string>> = {
  GPlayersList: 'Gestionnaire de couches',
  GPlayerInfoPanel: 'Informations sur la couche',
  GPlayerStylePanel: 'Style de la couche',
  GPautoCompleteList: 'Suggestions de lieux',
  GPgeocodeResultsList: 'Résultats de la recherche de lieu',
};

/** Id of the base layer side panel (target of the toggle button). */
export const BASE_LAYER_PANEL_ID = 'panneau-fonds-de-carte';
