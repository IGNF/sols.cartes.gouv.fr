import { renderHook } from '@testing-library/react';
import type OlMap from 'ol/Map';
import { describe, expect, it, vi } from 'vitest';
import { GEOPF_DIALOG_LABELS, LAYER_SWITCHER_OPTIONS } from '../config/map';
import useLayerSwitcher, { closeOnEscape } from './useLayerSwitcher';

const constructed: Array<{ options: unknown; element: HTMLElement }> = [];

vi.mock('geopf-extensions-openlayers/src/packages/Controls/LayerSwitcher/LayerSwitcher', () => ({
  default: class FakeLayerSwitcher {
    options: unknown;
    element: HTMLElement;
    constructor(options: unknown) {
      this.options = options;
      this.element = document.createElement('div');
      this.element.innerHTML =
        '<dialog id="GPlayersList-1"></dialog><dialog id="GPlayerInfoPanel-1"></dialog>';
      constructed.push(this);
    }
  },
}));

function createFakeMap() {
  const addControl = vi.fn();
  const removeControl = vi.fn();
  return { map: { addControl, removeControl } as unknown as OlMap, addControl, removeControl };
}

describe('useLayerSwitcher', () => {
  it('ne crée pas de contrôle sans carte', () => {
    constructed.length = 0;
    renderHook(() => useLayerSwitcher(null));
    expect(constructed).toHaveLength(0);
  });

  it('ajoute le gestionnaire de couches avec les options configurées puis le retire', () => {
    constructed.length = 0;
    const { map, addControl, removeControl } = createFakeMap();
    const { unmount } = renderHook(() => useLayerSwitcher(map));
    expect(constructed).toHaveLength(1);
    expect(constructed[0]?.options).toEqual({ options: LAYER_SWITCHER_OPTIONS });
    expect(addControl).toHaveBeenCalledWith(constructed[0]);
    unmount();
    expect(removeControl).toHaveBeenCalledWith(constructed[0]);
  });

  it('nomme les fenêtres du gestionnaire avant leur insertion', () => {
    constructed.length = 0;
    const { map } = createFakeMap();
    renderHook(() => useLayerSwitcher(map));
    const dialog = constructed[0]?.element.querySelector('#GPlayersList-1');
    expect(dialog).toHaveAttribute('aria-label', GEOPF_DIALOG_LABELS['GPlayersList']);
  });
});

describe('closeOnEscape', () => {
  function setup(pressed: boolean) {
    const root = document.createElement('div');
    root.innerHTML = `<button id="GPshowLayersListPicto-1" aria-pressed="${pressed}">Ma sélection de cartes</button><dialog id="GPlayersList-1"><input /></dialog>`;
    document.body.append(root);
    const toggle = root.querySelector('button') as HTMLButtonElement;
    const clicks = vi.fn();
    toggle.addEventListener('click', clicks);
    const stop = closeOnEscape(root);
    return { root, toggle, clicks, stop };
  }

  it('ferme la liste ouverte avec Échap et rend le focus au bouton', () => {
    const { root, toggle, clicks, stop } = setup(true);
    root
      .querySelector('input')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(clicks).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(toggle);
    stop();
    root.remove();
  });

  it('ignore Échap quand la liste est fermée, et les autres touches', () => {
    const { root, clicks, stop } = setup(false);
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clicks).not.toHaveBeenCalled();
    stop();
    root.remove();
  });
});
