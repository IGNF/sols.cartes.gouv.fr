/**
 * Map configuration: base layers, initial view and control options.
 * Layer names are checked against the GPF WMTS GetCapabilities at runtime (src/map/createWmtsLayer.ts)
 * and were validated on 2026-11-05 (doc/agents/gpf-sols-data.md).
 */
import type { DefaultsOptions } from 'ol/control/defaults';
import type { LayerSwitcherOptions } from 'geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher';

/** WMTS version requested from the GPF. */
export const WMTS_VERSION = '1.0.0';

export interface BaseLayerDefinition {
  /** Stable id used in the client store. */
  id: string;
  /** WMTS layer identifier on https://data.geopf.fr/wmts. */
  layerName: string;
}

export const BASE_LAYERS = [
  { id: 'plan-ign', layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2' },
] as const satisfies readonly BaseLayerDefinition[];

export type BaseLayerId = (typeof BASE_LAYERS)[number]['id'];

export const DEFAULT_BASE_LAYER_ID: BaseLayerId = 'plan-ign';

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

/** French labels of the OpenLayers default controls (option names from ol/control/defaults). */
export const DEFAULT_CONTROLS_OPTIONS: DefaultsOptions = {
  zoomOptions: { zoomInTipLabel: 'Zoomer', zoomOutTipLabel: 'Dézoomer' },
  rotateOptions: { tipLabel: 'Réinitialiser l’orientation' },
  attributionOptions: { tipLabel: 'Sources des données' },
};

/**
 * Accessible names of the LayerSwitcher dialogs, keyed by their id prefix.
 * geopf-extensions 1.0.0-beta.16 renders them as DSFR `fr-modal` dialogs without a name.
 */
export const LAYER_SWITCHER_DIALOG_LABELS: Readonly<Record<string, string>> = {
  GPlayersList: 'Gestionnaire de couches',
  GPlayerInfoPanel: 'Informations sur la couche',
  GPlayerStylePanel: 'Style de la couche',
};
