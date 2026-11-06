import { renderHook, waitFor } from '@testing-library/react';
import ScaleLine from 'ol/control/ScaleLine';
import type OlMap from 'ol/Map';
import { describe, expect, it, vi } from 'vitest';
import { CONTROL_LABELS, GEOPF_DIALOG_LABELS, MAP_TOOLS_OPTIONS } from '../config/map';
import useMapControls from './useMapControls';

const geopf = vi.hoisted(() => {
  const created: Array<{ kind: string; options: unknown; element: HTMLElement }> = [];
  const make = (kind: string, withDialog = false) =>
    class {
      options: unknown;
      element: HTMLElement;
      constructor(options: unknown) {
        this.options = options;
        this.element = document.createElement('div');
        if (withDialog)
          this.element.innerHTML =
            '<dialog id="GPautoCompleteList-1"></dialog><input id="GPsearchInputText-1" />';
        created.push({ kind, options, element: this.element });
      }
    };
  return {
    created,
    search: make('search', true),
    zoom: make('zoom'),
    fullScreen: make('fullScreen'),
  };
});

vi.mock('../map/geopf', () => ({
  GeoportalZoom: geopf.zoom,
  GeoportalFullScreen: geopf.fullScreen,
  loadSearchEngine: () => Promise.resolve(geopf.search),
}));

function createFakeMap() {
  const addControl = vi.fn();
  const removeControl = vi.fn();
  return { map: { addControl, removeControl } as unknown as OlMap, addControl, removeControl };
}

describe('useMapControls', () => {
  it('ajoute zoom, plein écran (en bas à droite) et échelle, sans attributions, puis la recherche chargée à la demande', async () => {
    geopf.created.length = 0;
    const { map, addControl } = createFakeMap();
    renderHook(() => useMapControls(map));
    expect(geopf.created.map((c) => c.kind).sort()).toEqual(['fullScreen', 'zoom']);
    expect(geopf.created.find((c) => c.kind === 'fullScreen')?.options).toMatchObject({
      position: 'bottom-right',
    });
    expect(addControl.mock.calls.some(([c]) => c instanceof ScaleLine)).toBe(true);
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(4));
    const search = geopf.created.find((c) => c.kind === 'search');
    expect(search?.options).toEqual(MAP_TOOLS_OPTIONS.search);
    expect(search?.element.querySelector('input')).toHaveAttribute(
      'aria-label',
      CONTROL_LABELS.searchInput,
    );
    expect(search?.element.querySelector('dialog')).toHaveAttribute(
      'aria-label',
      GEOPF_DIALOG_LABELS['GPautoCompleteList'],
    );
  });

  it('retire tous les outils au démontage', async () => {
    const { map, addControl, removeControl } = createFakeMap();
    const { unmount } = renderHook(() => useMapControls(map));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(4));
    unmount();
    expect(removeControl).toHaveBeenCalledTimes(4);
  });

  it('n’ajoute pas la recherche si la carte a été démontée avant son chargement', async () => {
    const { map, addControl } = createFakeMap();
    const { unmount } = renderHook(() => useMapControls(map));
    unmount();
    await Promise.resolve();
    await Promise.resolve();
    expect(addControl).toHaveBeenCalledTimes(3);
  });

  it('ne fait rien sans carte', () => {
    geopf.created.length = 0;
    renderHook(() => useMapControls(null));
    expect(geopf.created).toHaveLength(0);
  });
});
