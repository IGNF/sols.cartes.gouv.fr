import type Control from 'ol/control/Control';
import type OlMap from 'ol/Map';
import { useEffect } from 'react';
import {
  CONTROL_LABELS,
  DEFAULT_TOOLS,
  EXCLUDED_TERRITORY_IDS,
  MAP_TOOLS_OPTIONS,
  TOOL_PROJECTIONS,
} from '../config/map';
import { loadCrs, loadMapTools, type MapToolsModule } from '../map/geopf';
import { controlElement, labelPanelTitle, labelToggleButton } from '../map/labelControls';
import labelGeopfDialogs from '../map/labelGeopfDialogs';
import { fixToolButtons, labelDialogsOnInit, watchToolButtons } from '../map/labelToolButtons';

/** OpenLayers types `on` with its own event names: the controls' custom events need a looser view. */
interface CustomEventSource {
  on(type: string, listener: (event: unknown) => void): unknown;
}

/** CSS hooks on the tool widgets (layout rules in MapView.css). */
export const TOOL_CLASS = 'map-tool';
export const LISTABLE_TOOL_CLASS = 'map-tool--listable';
/** Listable tool that is not in DEFAULT_TOOLS: its button is hidden until the tool is chosen in the list. */
export const ON_DEMAND_TOOL_CLASS = 'map-tool--on-demand';
/** On-demand tool chosen once in « Afficher tous les outils »: its button stays on the map. */
export const SHOWN_TOOL_CLASS = 'map-tool--shown';

/**
 * An on-demand tool shows its button once it is opened (the list entry clicks the tool's own button,
 * which turns `aria-pressed` on). Returns a function to stop observing.
 */
export function revealOnOpen(element: HTMLElement): () => void {
  const button = element.querySelector('button');
  if (!button) return () => undefined;
  const reveal = () => {
    if (button.getAttribute('aria-pressed') === 'true') element.classList.add(SHOWN_TOOL_CLASS);
  };
  reveal();
  const observer = new MutationObserver(reveal);
  observer.observe(button, { attributes: true, attributeFilter: ['aria-pressed'] });
  return () => observer.disconnect();
}

/** Entries of the « Tous les outils » list (upstream `li[role=button]`, made `menuitem` by fixToolButtons). */
const MENU_ITEMS =
  '[id^="GPcontrolListPanel-"] li[role="menuitem"], [id^="GPcontrolListPanel-"] li[role="button"]';

/**
 * Choosing an entry of « Tous les outils » empties the list (the focused `<li>` disappears, focus lands
 * on the body): give it back to the « Afficher tous les outils » button.
 * The focus moves in a later task: the entry is activated on `keydown`, and Enter would otherwise
 * activate the newly focused button in the same event and reopen the list.
 */
export function returnFocusOnCollapse(controlList: object, element: HTMLElement): void {
  const toggle = element.querySelector('button');
  (controlList as CustomEventSource).on('change:collapsed', () => {
    if (toggle?.getAttribute('aria-pressed') !== 'false') return;
    window.setTimeout(() => {
      if (document.activeElement === document.body) toggle.focus();
    }, 0);
  });
}

/**
 * Keyboard of the « Tous les outils » menu (WAI-ARIA menu button pattern on the upstream list): one tab stop
 * (roving `tabindex`, first entry focused when the list opens), ArrowUp/ArrowDown (wrapping), Home/End,
 * Escape closes the list (focus back to the button through returnFocusOnCollapse). Enter/Space are
 * handled by the control; their default action is prevented so nothing else is activated or scrolled.
 */
export function menuKeyboard(controlList: object, element: HTMLElement): void {
  const toggle = element.querySelector('button');
  const items = () => Array.from(element.querySelectorAll<HTMLElement>(MENU_ITEMS));
  (controlList as CustomEventSource).on('change:collapsed', () => {
    if (toggle?.getAttribute('aria-pressed') !== 'true') return;
    items().forEach((item, index) => item.setAttribute('tabindex', index === 0 ? '0' : '-1'));
    items()[0]?.focus();
  });
  // Capture phase: the control's own keydown handler (Enter/Space) empties the list before bubbling.
  element.addEventListener(
    'keydown',
    (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const list = items();
      const index = target ? list.indexOf(target) : -1;
      if (index < 0) return;
      const moveTo = (next: number) => {
        const item = list[(next + list.length) % list.length];
        if (!item) return;
        list.forEach((entry) => entry.setAttribute('tabindex', entry === item ? '0' : '-1'));
        item.focus();
      };
      switch (event.key) {
        case 'ArrowDown':
          moveTo(index + 1);
          break;
        case 'ArrowUp':
          moveTo(index - 1);
          break;
        case 'Home':
          moveTo(0);
          break;
        case 'End':
          moveTo(list.length - 1);
          break;
        case 'Escape':
          toggle?.click();
          break;
        case 'Enter':
        case ' ':
          break;
        default:
          return;
      }
      event.preventDefault();
    },
    true,
  );
}

/**
 * Instantiates the tool set of the cartes.gouv.fr map viewer (doc/agents/geopf-ext.md §10 and §12), in
 * the order the position containers show them: top-left after the zoom (import, feature info); top-right
 * after the layer switcher (the default tools, the on-demand ones hidden until chosen, then « Afficher
 * tous les outils » last); bottom-left (legends, territories, overview map; geopf prepends bottom
 * widgets, so the last one added is on top). Dialogs and the list button are named before the controls
 * reach the map.
 */
export function createMapTools(tools: MapToolsModule): Control[] {
  const options = MAP_TOOLS_OPTIONS;
  const controlList = new tools.ControlList({ ...options.controlList });
  labelToggleButton(controlElement(controlList), CONTROL_LABELS.controlList);
  labelPanelTitle(controlElement(controlList), CONTROL_LABELS.controlListTitle);
  fixToolButtons(controlElement(controlList));
  returnFocusOnCollapse(controlList, controlElement(controlList));
  menuKeyboard(controlList, controlElement(controlList));
  const territories = tools.TERRITORIES.filter(
    (territory) => !EXCLUDED_TERRITORY_IDS.includes(territory.id),
  );
  const controls: Control[] = [
    new tools.LayerImport({ ...options.layerImport }),
    new tools.GetFeatureInfo({ ...options.getFeatureInfo }),
    new tools.MeasureLength({ ...options.measureLength }),
    new tools.MeasureArea({ ...options.measureArea }),
    new tools.MeasureAzimuth({ ...options.measureAzimuth }),
    new tools.MousePosition({ ...options.mousePosition }),
    new tools.ElevationPath({ ...options.elevationPath }),
    new tools.Route({ ...options.route }),
    new tools.Isocurve({ ...options.isocurve }),
    new tools.ReverseGeocode({ ...options.reverseGeocode }),
    new tools.Drawing({ ...options.drawing }),
    controlList,
    new tools.GeoportalOverviewMap({ ...options.overviewMap }),
    new tools.Territories({ ...options.territories, territories }),
    new tools.Legends({ ...options.legends }),
  ];
  for (const control of controls) {
    const element = controlElement(control);
    labelGeopfDialogs(element);
    labelDialogsOnInit(control, labelGeopfDialogs);
    element.classList.add(TOOL_CLASS);
    const { listable, CLASSNAME } = control as { listable?: boolean; CLASSNAME?: string };
    if (listable) element.classList.add(LISTABLE_TOOL_CLASS);
    if (listable && !DEFAULT_TOOLS.includes(CLASSNAME ?? '')) {
      element.classList.add(ON_DEMAND_TOOL_CLASS);
    }
  }
  return controls;
}

/**
 * Adds the tool set once the map exists: the controls are loaded in their own chunk (after the map is
 * displayed) together with the projections they resolve at construction (Lambert 93 for MousePosition),
 * added if the map is still mounted, and removed on cleanup.
 */
export default function useMapTools(map: OlMap | null): void {
  useEffect(() => {
    if (!map) return undefined;
    let active = true;
    let controls: Control[] = [];
    let stopWatching: (() => void) | undefined;
    let stopRevealing: Array<() => void> = [];
    Promise.all([loadMapTools(), ...TOOL_PROJECTIONS.map((name) => loadCrs(name))])
      .then(([tools]) => {
        if (!active) return;
        controls = createMapTools(tools);
        controls.forEach((control) => map.addControl(control));
        stopRevealing = controls
          .map((control) => controlElement(control))
          .filter((element) => element.classList.contains(ON_DEMAND_TOOL_CLASS))
          .map((element) => revealOnOpen(element));
        // Legend entries follow the map layers; territory entries appear when their view opens.
        const overlays = map.getOverlayContainerStopEvent();
        if (overlays) stopWatching = watchToolButtons(overlays);
      })
      .catch(() => {
        // The map stays usable without the tool set; nothing to report beyond the missing buttons.
      });
    return () => {
      active = false;
      stopWatching?.();
      stopRevealing.forEach((stop) => stop());
      controls.forEach((control) => map.removeControl(control));
    };
  }, [map]);
}
