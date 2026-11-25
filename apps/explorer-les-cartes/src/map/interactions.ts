import type Collection from 'ol/Collection';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import {
  noModifierKeys,
  platformModifierKey,
  targetNotEditable,
  type Condition,
} from 'ol/events/condition';
import type Interaction from 'ol/interaction/Interaction';
import KeyboardPan from 'ol/interaction/KeyboardPan';
import KeyboardZoom from 'ol/interaction/KeyboardZoom';
import { defaults as defaultInteractions } from 'ol/interaction/defaults';

/**
 * Whether a key belongs to the map (M25). With `keyboardEventTarget: document` (src/hooks/useMap.ts), OpenLayers
 * hears every key of the page: only those typed while nothing has the focus (the page itself, as on landing) or
 * while the map element has it count. Keys of the header, the footer, a modal or a side panel, and their menus,
 * listboxes and fields, stay theirs. Keys of the controls inside the map (search engine, its suggestions, tool
 * panels) never reach the interactions: OpenLayers drops events from its `.ol-overlaycontainer-stopevent`,
 * where geopf-extensions places them.
 */
export function isMapKeyTarget(target: EventTarget | null, mapTarget: HTMLElement): boolean {
  if (!(target instanceof Node)) return false;
  const doc = mapTarget.ownerDocument;
  return target === doc.body || target === doc.documentElement || mapTarget.contains(target);
}

/** Condition of a keyboard interaction: OpenLayers' default for it, and the key is the map's. */
function mapKeyCondition(mapTarget: HTMLElement, olDefault: Condition): Condition {
  return function (this: unknown, event: MapBrowserEvent) {
    return (
      olDefault.call(this, event) &&
      targetNotEditable.call(this, event) &&
      isMapKeyTarget(event.originalEvent.target, mapTarget)
    );
  };
}

/** KeyboardZoom's default: no Ctrl/Cmd (browser zoom), checked in ol/interaction/KeyboardZoom.js. */
const noPlatformModifierKey: Condition = function (this: unknown, event: MapBrowserEvent) {
  return !platformModifierKey.call(this, event);
};

/**
 * The map's interactions, as on cartes.gouv.fr (entrée carto `Map.vue`, guichet-collaboratif `MainMap.tsx`: both
 * pass `defaults()`). Passing them matters: when `interactions` is omitted, OpenLayers 10 builds them with
 * `onFocusOnly: true` (ol/Map.js), and as the map element has a `tabindex`, mouse-wheel zoom then waits for a
 * first click on the map. The keyboard interactions are rebuilt with OpenLayers' default conditions
 * (KeyboardPan: no modifier key, KeyboardZoom: no Ctrl/Cmd, both: target not editable) plus isMapKeyTarget.
 */
export function createMapInteractions(mapTarget: HTMLElement): Collection<Interaction> {
  return defaultInteractions({ keyboard: false }).extend([
    new KeyboardPan({ condition: mapKeyCondition(mapTarget, noModifierKeys) }),
    new KeyboardZoom({ condition: mapKeyCondition(mapTarget, noPlatformModifierKey) }),
  ]);
}
