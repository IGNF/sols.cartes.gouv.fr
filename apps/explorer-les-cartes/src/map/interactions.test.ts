import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type OlMap from 'ol/Map';
import DragPan from 'ol/interaction/DragPan';
import KeyboardPan from 'ol/interaction/KeyboardPan';
import KeyboardZoom from 'ol/interaction/KeyboardZoom';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import { afterEach, describe, expect, it } from 'vitest';
import { createMapInteractions, isMapKeyTarget } from './interactions';

/** A page with a header, a search field and a listbox outside the map, a control button inside it. */
function setup() {
  document.body.innerHTML = `
    <header><button id="menu">Menu</button><ul role="listbox"><li id="option" tabindex="-1">A</li></ul></header>
    <input id="recherche" />
    <div id="carte" tabindex="0"><canvas id="canevas"></canvas><button id="zoom">+</button></div>
    <div id="edition" contenteditable="true"></div>`;
  return document.getElementById('carte') as HTMLElement;
}

const byId = (id: string) => document.getElementById(id) as HTMLElement;

/** The event OpenLayers hands to a keyboard interaction for a keydown on `target`. */
function keyEvent(target: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  const originalEvent = new KeyboardEvent('keydown', { key, bubbles: true, ...init });
  Object.defineProperty(originalEvent, 'target', { value: target });
  return { type: 'keydown', originalEvent, map: {} as OlMap } as unknown as MapBrowserEvent;
}

/** Condition passed to an interaction (private field of the OpenLayers interaction). */
function conditionOf(interaction: KeyboardPan | KeyboardZoom | MouseWheelZoom) {
  // `condition_` is private in the typings; read here to test the condition we built.
  return (interaction as unknown as { condition_: (event: MapBrowserEvent) => boolean }).condition_;
}

describe('isMapKeyTarget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('retient les touches tapées sans focus (page) ou sur la carte', () => {
    const map = setup();
    expect(isMapKeyTarget(document.body, map)).toBe(true);
    expect(isMapKeyTarget(document.documentElement, map)).toBe(true);
    expect(isMapKeyTarget(map, map)).toBe(true);
    expect(isMapKeyTarget(byId('canevas'), map)).toBe(true);
  });

  it('laisse leurs touches aux éléments hors de la carte', () => {
    const map = setup();
    expect(isMapKeyTarget(byId('menu'), map)).toBe(false);
    expect(isMapKeyTarget(byId('option'), map)).toBe(false);
    expect(isMapKeyTarget(byId('recherche'), map)).toBe(false);
    expect(isMapKeyTarget(null, map)).toBe(false);
  });
});

describe('createMapInteractions', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('garde les interactions par défaut, avec une seule interaction clavier de chaque sorte', () => {
    const interactions = createMapInteractions(setup()).getArray();
    expect(interactions.filter((i) => i instanceof KeyboardPan)).toHaveLength(1);
    expect(interactions.filter((i) => i instanceof KeyboardZoom)).toHaveLength(1);
    expect(interactions.some((i) => i instanceof MouseWheelZoom)).toBe(true);
    expect(interactions.some((i) => i instanceof DragPan)).toBe(true);
  });

  it('zoome à la molette sans que la carte ait le focus', () => {
    const map = setup();
    const interactions = createMapInteractions(map).getArray();
    const wheel = conditionOf(
      interactions.find((i) => i instanceof MouseWheelZoom) as MouseWheelZoom,
    );
    // With `onFocusOnly`, OpenLayers would check the focus of `map.getTargetElement()` (a tabindex element).
    const target = {
      getTargetElement: () => map,
      getOwnerDocument: () => document,
    } as unknown as OlMap;
    const event = { type: 'wheel', originalEvent: new WheelEvent('wheel'), map: target };
    expect(map).not.toHaveFocus();
    expect(wheel(event as unknown as MapBrowserEvent)).toBe(true);
  });

  it('déplace et zoome au clavier sans focus ou sur la carte', () => {
    const map = setup();
    const interactions = createMapInteractions(map).getArray();
    const pan = conditionOf(interactions.find((i) => i instanceof KeyboardPan) as KeyboardPan);
    const zoom = conditionOf(interactions.find((i) => i instanceof KeyboardZoom) as KeyboardZoom);
    expect(pan(keyEvent(document.body, 'ArrowRight'))).toBe(true);
    expect(pan(keyEvent(map, 'ArrowUp'))).toBe(true);
    expect(zoom(keyEvent(document.body, '+'))).toBe(true);
    expect(zoom(keyEvent(map, '-'))).toBe(true);
  });

  it('ne prend pas les touches des champs, menus et listes, ni les raccourcis du navigateur', () => {
    const map = setup();
    const interactions = createMapInteractions(map).getArray();
    const pan = conditionOf(interactions.find((i) => i instanceof KeyboardPan) as KeyboardPan);
    const zoom = conditionOf(interactions.find((i) => i instanceof KeyboardZoom) as KeyboardZoom);
    expect(zoom(keyEvent(byId('recherche'), '+'))).toBe(false);
    expect(pan(keyEvent(byId('recherche'), 'ArrowLeft'))).toBe(false);
    expect(pan(keyEvent(byId('option'), 'ArrowDown'))).toBe(false);
    expect(pan(keyEvent(byId('menu'), 'ArrowDown'))).toBe(false);
    expect(zoom(keyEvent(byId('menu'), '+'))).toBe(false);
    expect(zoom(keyEvent(byId('edition'), '+'))).toBe(false);
    expect(pan(keyEvent(document.body, 'ArrowRight', { shiftKey: true }))).toBe(false);
    expect(zoom(keyEvent(document.body, '+', { ctrlKey: true }))).toBe(false);
  });
});
