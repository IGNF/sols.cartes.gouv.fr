import { renderHook } from '@testing-library/react';
import type OlMap from 'ol/Map';
import { describe, expect, it, vi } from 'vitest';
import { LAYER_SWITCHER_DIALOG_LABELS, LAYER_SWITCHER_OPTIONS } from '../config/map';
import useLayerSwitcher, { labelSwitcherDialogs } from './useLayerSwitcher';

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
    expect(dialog).toHaveAttribute('aria-label', LAYER_SWITCHER_DIALOG_LABELS['GPlayersList']);
  });
});

describe('labelSwitcherDialogs', () => {
  it('conserve un nom existant et ignore les fenêtres inconnues', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<dialog id="GPlayerStylePanel-2" aria-label="Déjà nommée"></dialog><dialog id="Autre-2"></dialog>';
    labelSwitcherDialogs(root);
    expect(root.querySelector('#GPlayerStylePanel-2')).toHaveAttribute('aria-label', 'Déjà nommée');
    expect(root.querySelector('#Autre-2')).not.toHaveAttribute('aria-label');
  });
});
