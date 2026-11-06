/**
 * Map configuration: base layers, initial view and control options.
 * Layer names are checked against the GPF WMTS GetCapabilities at runtime (src/map/createWmtsLayer.ts)
 * and were validated on 2026-11-05 (doc/agents/gpf-sols-data.md).
 */
import type { DefaultsOptions } from 'ol/control/defaults';
import type { Options as AttributionOptions } from 'ol/control/Attribution';
import type { Options as FullScreenOptions } from 'ol/control/FullScreen';
import type { Options as OverviewMapOptions } from 'ol/control/OverviewMap';
import type { Options as ScaleLineOptions } from 'ol/control/ScaleLine';
import type { Options as ZoomOptions } from 'ol/control/Zoom';
import type {
  CatalogOptions,
  ControlListOptions,
  DrawingOptions,
  ElevationPathOptions,
  GetFeatureInfoOptions,
  IsocurveOptions,
  LayerImportOptions,
  LayerSwitcherOptions,
  LegendsOptions,
  MeasureAreaOptions,
  MeasureAzimuthOptions,
  MeasureLengthOptions,
  MousePositionOptions,
  ReverseGeocodeOptions,
  RouteOptions,
  SearchEngineOptions,
  TerritoriesOptions,
} from '../map/geopf';
import { EXTERNAL_LINKS, GPF_ENDPOINTS } from './urls';

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

/**
 * zIndex given to the base layer before it is added, so the geopf LayerSwitcher sorts the layers by
 * zIndex (list and drawing order) instead of putting the newest layer, possibly the base, on top.
 * It must be the smallest positive integer: the switcher treats 0 as "no zIndex" and iterates its
 * zIndex buckets with for...in, where a negative key comes after the positive ones (on top).
 * Ties keep the map collection order, where the base layer is first.
 */
export const BASE_LAYER_Z_INDEX = 1;

/** Attribution shown for every GPF base layer (the WMTS capabilities carry no attribution). */
export const GPF_ATTRIBUTION = `<a href="${EXTERNAL_LINKS.cartesGouv}" target="_blank" rel="noopener noreferrer">IGN – Géoplateforme</a>`;

/**
 * Delay before the single retry of a tile that failed to load: the GPF intermittently answers 400/404
 * on valid tiles (doc/agents/QUESTIONS.md M-2).
 */
export const TILE_RETRY_DELAY_MS = 500;

/**
 * GPF capabilities requests: per-attempt timeout, then retries. The GPF intermittently accepts a request
 * and never answers (D-carto-1: about 1 in 5 GetCapabilities in curl, 2026-11-05). The timeout only covers
 * the wait for the response headers (normally under 0.5 s), not the body download, so a slow network is
 * not penalised. Worst case: 5 attempts × 3 s + 4 × 0.3 s ≈ 16 s.
 */
export const GPF_REQUEST_TIMEOUT_MS = 3_000;
export const GPF_REQUEST_RETRIES = 4;
export const GPF_REQUEST_RETRY_DELAY_MS = 300;

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
  // No counter: its visible number is not part of the button name "Ma sélection de cartes"
  // (axe label-content-name-mismatch, RGAA 6.1/WCAG 2.5.3).
  counter: false,
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
  rotateOptions: { tipLabel: 'Réinitialiser l’orientation' }, // same text as CONTROL_LABELS.rotate
};

/** Position of a geopf-extensions control (values listed in Controls/Control.js). */
export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Options every geopf-extensions control reads (`Controls/Control.js` constructor, `setMap`) but which the
 * `.d.ts` of most controls omit (upstream gap, doc/agents/geopf-ext.md §10): position container, button
 * glued to the previous one (`gutter: false`), entry in the ControlList ("Mes outils").
 */
export interface ControlPlacement {
  position?: ControlPosition;
  gutter?: boolean;
  listable?: boolean;
}

/** Titles of the vector layers the tools draw (listed by the LayerSwitcher). */
const TOOL_LAYERS = {
  measureLength: { title: 'Mesure de distance', description: 'Tracé de la mesure de distance' },
  measureArea: { title: 'Mesure de surface', description: 'Tracé de la mesure de surface' },
  measureAzimuth: { title: 'Mesure d’azimut', description: 'Tracé de la mesure d’azimut' },
  elevationPath: { title: 'Profil altimétrique', description: 'Tracé du profil altimétrique' },
  route: { title: 'Itinéraire', description: 'Itinéraire calculé par la Géoplateforme' },
  isocurve: { title: 'Zone selon le temps de trajet', description: 'Isochrone ou isodistance' },
  reverseGeocode: {
    title: 'Adresses trouvées',
    description: 'Résultats de la recherche d’adresse',
  },
  drawing: { title: 'Mes annotations', description: 'Croquis dessiné sur la carte' },
} as const;

/**
 * Road2 resource used for routes and isochrones: lists `car`/`pedestrian` profiles and `fastest`/`shortest`
 * (`/navigation/getcapabilities`, 2026-11-05). geoportal-access-lib 3.4.7 defaults to `bdtopo-osrm`, which
 * the service no longer knows (HTTP 400 "Parameter 'resource' is invalid").
 */
export const NAVIGATION_RESOURCE = 'bdtopo-pgr';

/** Built-in territories of the Territories control left out, as in cartes.gouv.fr (TAAF, Paris petite couronne). */
/**
 * Tools whose button is on the map from the start (v1.1, as on cartes.gouv.fr); the other listable tools
 * get their button once chosen in « Afficher tous les outils » (src/hooks/useMapTools.ts).
 */
export const DEFAULT_TOOLS: readonly string[] = [
  'MeasureLength',
  'MeasureArea',
  'Drawing',
  'Route',
];

export const EXCLUDED_TERRITORY_IDS: readonly string[] = ['ATF', 'IDF'];

/**
 * Coordinate systems of the MousePosition control (entrée carto, `Controls.vue`): the two OpenLayers
 * built-ins and Lambert 93, whose definition the geopf CRS module registers before the tools are created
 * (the control resolves every system with `ol/proj.get` when it initialises).
 */
export const MOUSE_POSITION_SYSTEMS = [
  { label: 'Géographiques', crs: 'EPSG:4326', type: 'Geographical' },
  { label: 'Web Mercator', crs: 'EPSG:3857', type: 'Metric' },
  { label: 'Lambert 93', crs: 'EPSG:2154', type: 'Metric' },
] as const;

/**
 * Projections registered through the geopf CRS module before the tools are created: MousePosition
 * always resolves Lambert 93 and Lambert II étendu for its default list (`_initProjectionSystems`,
 * even with explicit `systems`; upstream gap) and throws when one is unknown to OpenLayers.
 */
export const TOOL_PROJECTIONS: readonly string[] = ['EPSG:2154', 'EPSG:27572'];

/**
 * Options of the map tools; geopf-ext Zoom/FullScreen/Attribution take OL options plus `position`.
 * Names and values checked in the `.d.ts` of 1.0.0-beta.16 and in IGNF/cartes.gouv.fr-entree-carto
 * (`src/components/carte/Controls.vue`); the GPF service URLs come from GPF_ENDPOINTS.
 * `altitude` (MousePosition), `noDataMessage` (GetFeatureInfo) and `export` payloads are documented in the
 * JSDoc of the controls but missing from their `.d.ts` (upstream gap).
 */
export const MAP_TOOLS_OPTIONS = {
  zoom: { position: 'top-left' } satisfies ZoomOptions & { position: ControlPosition },
  fullScreen: {
    position: 'top-left',
    tipLabel: 'Plein écran',
  } satisfies FullScreenOptions & { position: ControlPosition },
  attribution: {
    collapsible: true,
    collapsed: false,
    tipLabel: 'Sources des données', // same text as CONTROL_LABELS.attribution
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
  layerImport: {
    position: 'top-left',
    gutter: false,
    title: 'Importer des données',
  } satisfies LayerImportOptions & ControlPlacement,
  getFeatureInfo: {
    position: 'top-left',
    gutter: false,
    button: true,
    active: false,
    noDataMessage:
      '<p class="fr-text--sm fr-mb-0">Aucune information disponible ici : aucune couche interrogeable à cet endroit.</p>',
  } satisfies GetFeatureInfoOptions & ControlPlacement & { noDataMessage: string },
  controlList: {
    position: 'top-right',
    gutter: false,
    collapsed: true,
    header: true,
    // Required: the control only creates its state map when sortable (else opening the list throws).
    sortable: true,
  } satisfies ControlListOptions & ControlPlacement,
  measureLength: {
    position: 'top-right',
    gutter: false,
    listable: true,
    layerDescription: TOOL_LAYERS.measureLength,
  } satisfies MeasureLengthOptions & ControlPlacement,
  measureArea: {
    position: 'top-right',
    gutter: false,
    listable: true,
    layerDescription: TOOL_LAYERS.measureArea,
  } satisfies MeasureAreaOptions & ControlPlacement,
  measureAzimuth: {
    position: 'top-right',
    gutter: false,
    listable: true,
    geodesic: true,
    layerDescription: TOOL_LAYERS.measureAzimuth,
  } satisfies MeasureAzimuthOptions & ControlPlacement,
  mousePosition: {
    position: 'top-right',
    gutter: false,
    listable: true,
    collapsed: true,
    editCoordinates: true,
    displayAltitude: true,
    systems: [...MOUSE_POSITION_SYSTEMS],
    altitude: { serviceOptions: { serverUrl: GPF_ENDPOINTS.elevation } },
  } satisfies MousePositionOptions &
    ControlPlacement & { altitude: { serviceOptions: { serverUrl: string } } },
  elevationPath: {
    position: 'top-right',
    gutter: false,
    listable: true,
    elevationPathOptions: { serverUrl: GPF_ENDPOINTS.elevationLine },
    layerDescription: TOOL_LAYERS.elevationPath,
    // Boolean only: the default is `false` and geopf merges options into it (an object would throw).
    export: true,
  } satisfies ElevationPathOptions & ControlPlacement,
  route: {
    position: 'top-right',
    gutter: false,
    listable: true,
    prettifyCompute: true,
    routeOptions: { serverUrl: GPF_ENDPOINTS.route, resource: NAVIGATION_RESOURCE },
    autocompleteOptions: { serverUrl: GPF_ENDPOINTS.geocodeCompletion },
    layerDescription: TOOL_LAYERS.route,
    // Boolean only: the default is `false` and geopf merges options into it (an object would throw).
    export: true,
  } satisfies RouteOptions & ControlPlacement,
  isocurve: {
    position: 'top-right',
    gutter: false,
    listable: true,
    isocurveOptions: { serverUrl: GPF_ENDPOINTS.isochrone, resource: NAVIGATION_RESOURCE },
    autocompleteOptions: { serverUrl: GPF_ENDPOINTS.geocodeCompletion },
    layerDescription: TOOL_LAYERS.isocurve,
    // Boolean only: the default is `false` and geopf merges options into it (an object would throw).
    export: true,
  } satisfies IsocurveOptions & ControlPlacement,
  reverseGeocode: {
    position: 'top-right',
    gutter: false,
    listable: true,
    reverseGeocodeOptions: { serverUrl: GPF_ENDPOINTS.geocodeReverse },
    layerDescription: TOOL_LAYERS.reverseGeocode,
  } satisfies ReverseGeocodeOptions & ControlPlacement,
  drawing: {
    position: 'top-right',
    gutter: false,
    listable: true,
    layerDescription: TOOL_LAYERS.drawing,
    tools: { export: true },
  } satisfies DrawingOptions & ControlPlacement,
  legends: {
    position: 'bottom-left',
    gutter: false,
    panel: true,
    auto: true,
    draggable: false,
    collapsed: true,
  } satisfies LegendsOptions & ControlPlacement,
  territories: {
    position: 'bottom-left',
    gutter: false,
    panel: true,
    auto: false, // our own list: the built-in one minus EXCLUDED_TERRITORY_IDS
    thumbnail: false,
    reduce: false,
    tiles: 3,
    title: 'Sélectionner un territoire',
    collapsed: true,
  } satisfies TerritoriesOptions & ControlPlacement,
  overviewMap: {
    position: 'bottom-left',
    gutter: false,
    collapsed: true,
  } satisfies OverviewMapOptions & ControlPlacement,
};

/**
 * Catalogue of the GIS Sol datasets (geopf Catalog control, M9): names checked in Catalog.d.ts. The
 * `Categories` type declares `field`, `value` and `clusterOptions` as required although a category with
 * `filter: null` needs none of them (upstream typing gap): the list is cast.
 */
/** Field of the catalogue entries that tells the category they belong to (src/map/catalogConfig.ts). */
export const CATALOG_KIND_FIELD = 'kind';
export const CATALOG_KINDS = { sols: 'sols', baseLayer: 'fond' } as const;
export type CatalogKind = (typeof CATALOG_KINDS)[keyof typeof CATALOG_KINDS];

export const CATALOG_CATEGORIES = [
  {
    title: 'Données sols',
    id: 'sols',
    producer: true,
    order: true,
    filter: { field: CATALOG_KIND_FIELD, value: CATALOG_KINDS.sols },
  },
  {
    title: 'Fonds de cartes',
    id: 'fonds',
    producer: false,
    order: false,
    filter: { field: CATALOG_KIND_FIELD, value: CATALOG_KINDS.baseLayer },
  },
] as unknown as NonNullable<CatalogOptions['categories']>;

export const CATALOG_OPTIONS = {
  position: 'top-right',
  gutter: true,
  collapsed: true,
  titlePrimary: 'Catalogue de cartes',
  layerLabel: 'title',
  layerThumbnail: true,
  size: 'lg',
  tabHeightAuto: false,
  addToMap: false, // the store adds the layers (legend, retry, availability as for every sols layer)
  auto: false, // tick state kept by the app per dataset (src/map/catalogConfig.ts, syncCatalogTicks)
  optimisation: 'none',
  search: {
    display: true,
    label: 'Rechercher une donnée',
    // Raw title, abstract and producer (`search` in catalogConfig.ts), then the layer name.
    criteria: ['search', 'name'],
  },
  categories: CATALOG_CATEGORIES,
} satisfies CatalogOptions & ControlPlacement;

/** Query parameters of the cartes.gouv.fr permalink (src/map/permalink.ts, src/map/deepLink.ts). */
export const PERMALINK_PARAMS = {
  center: 'c',
  zoom: 'z',
  layers: 'l',
  permalink: 'permalink',
} as const;

/** Value of `permalink` in the links this map emits (`no` in the catalogue's links, both ignored on reading). */
export const PERMALINK_FLAG = 'yes';

/** Notices of the map page about its layers and the catalogue. */
export const MAP_NOTICES = {
  unavailableTitle: 'Couche indisponible',
  unavailable: (title: string) =>
    `La Géoplateforme ne renvoie pas d’image pour la couche « ${title} » pour le moment : retirez-la depuis le catalogue de la carte ou réessayez plus tard.`,
  catalogueUnavailableTitle: 'Catalogue indisponible',
  catalogueUnavailable:
    'Le catalogue des données sols n’a pas pu être chargé sur la carte. Toutes les données restent consultables ici :',
} as const;

/** Strings of the "Imprimer la carte" dialog and print sheet. */
export const PRINT_LABELS = {
  button: 'Imprimer',
  title: 'Imprimer la carte',
  titleLabel: 'Titre de la carte',
  defaultTitle: 'Carte des sols',
  hint: 'La vue actuelle de la carte est imprimée avec son titre, les sources des données et la date.',
  download: 'Télécharger en PNG',
  print: 'Lancer l’impression',
  busy: 'Préparation de l’image de la carte…',
  exportFailed:
    'L’image de la carte n’a pas pu être produite. Une donnée importée depuis un autre serveur peut l’empêcher : retirez-la puis réessayez.',
  sources: 'Sources',
  printedOn: 'Imprimé le',
} as const;

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
  // Tools (M8)
  GPlegendsPanel: 'Légendes',
  GPterritoriesPanel: 'Sélectionner un territoire',
  GPcontrolListPanel: 'Tous les outils',
  GPmousePositionPanel: 'Coordonnées du curseur',
  GPelevationPathPanel: 'Profil altimétrique',
  GProutePanel: 'Itinéraire',
  GProuteResultsPanel: 'Résultats de l’itinéraire',
  GPisochronPanel: 'Zone selon le temps de trajet ou la distance',
  GPisoResultsPanel: 'Résultats de l’isochrone',
  GPreverseGeocodingPanel: 'Trouver une adresse',
  GPreverseGeocodingResultsPanel: 'Adresses trouvées',
  GPreverseGeocodingResultsList: 'Adresses trouvées',
  GPdrawingPanel: 'Annoter la carte',
  GPimportPanel: 'Importer des données',
  GPimportGetCapPanel: 'Couches du service',
  GPimportMapBoxPanel: 'Style de la couche importée',
  GPgetFeatureInfoPanel: 'Informations sur les couches',
  GPlocationAutoCompleteList: 'Suggestions de lieux',
  GPcatalogPanel: 'Catalogue de cartes',
  // Sub-dialog of the Territories panel (fixed id, no uid).
  'gpf-territories-views-container-id': 'Vues des territoires',
};

/** Names of the icon-only buttons of the Legends and Territories panels (src/map/labelToolButtons.ts). */
export const TOOL_BUTTON_LABELS = {
  showLegend: 'Afficher la légende',
  removeTerritory: 'Retirer le territoire',
  /** Checkbox of a catalogue entry (its visible label is not associated with the input). */
  addToMap: 'Ajouter à la carte',
  /** Checkbox of a « Fonds de cartes » entry (one base layer at a time). */
  showBaseLayer: 'Afficher le fond de carte',
  /** Name of the catalogue's category tab list (rendered with `aria-label="presentation"`). */
  catalogCategories: 'Catégories du catalogue',
} as const;

/**
 * Accessible names of map controls whose visible content is a glyph (OL attribution "›", rotate "⇧") or
 * which have no label (geopf search input), or whose geopf label is unclear ("Afficher plus" on the
 * ControlList button). Set as aria-label before the control is added (RGAA 11.1).
 */
export const CONTROL_LABELS = {
  attribution: 'Sources des données',
  rotate: 'Réinitialiser l’orientation',
  searchInput: 'Rechercher un lieu ou une adresse',
  controlList: 'Afficher tous les outils',
  catalog: 'Catalogue de cartes',
} as const;

/**
 * Display preference for "Ajouter à la carte": WMTS first (EPSG:2154 layers are reprojected after
 * loading the geopf CRS module), then WMS raster, then WMS vector. TMS (MapLibre styles) and WFS are not drawn in v0.
 */
export const DISPLAYABLE_SOLS_SERVICES = ['wmts', 'wms-raster', 'wms-vector'] as const;

/** Attribution of the sols layers. */
export const SOLS_ATTRIBUTION = `<a href="${EXTERNAL_LINKS.gisSol}" target="_blank" rel="noopener noreferrer">GIS Sol – INRAE</a>`;

/** An overlay is reported unavailable after this many tile errors without any loaded tile. */
export const OVERLAY_UNAVAILABLE_AFTER_ERRORS = 3;

/** Length of the abstract excerpt shown in the list view (src/text/excerpt.ts). */
export const ABSTRACT_EXCERPT_LENGTH = 180;
