import { renderHook, waitFor } from '@testing-library/react';
import ScaleLine from 'ol/control/ScaleLine';
import type OlMap from 'ol/Map';
import { describe, expect, it, vi } from 'vitest';
import { GEOPF_DIALOG_LABELS, MAP_TOOLS_OPTIONS } from '../config/map';
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
        if (withDialog) this.element.innerHTML = '<dialog id="GPautoCompleteList-1"></dialog>';
        created.push({ kind, options, element: this.element });
      }
    };
  return {
    created,
    search: make('search', true),
    zoom: make('zoom'),
    fullScreen: make('fullScreen'),
    attribution: make('attribution'),
  };
});

vi.mock('../map/geopf', () => ({
  GeoportalZoom: geopf.zoom,
  GeoportalFullScreen: geopf.fullScreen,
  GeoportalAttribution: geopf.attribution,
  loadSearchEngine: () => Promise.resolve(geopf.search),
}));

function createFakeMap() {
  const addControl = vi.fn();
  const removeControl = vi.fn();
  return { map: { addControl, removeControl } as unknown as OlMap, addControl, removeControl };
}

describe('useMapControls', () => {
  it('ajoute zoom, plein écran, échelle et attributions, puis la recherche chargée à la demande', async () => {
    geopf.created.length = 0;
    const { map, addControl } = createFakeMap();
    renderHook(() => useMapControls(map));
    expect(geopf.created.map((c) => c.kind)).toEqual(['zoom', 'fullScreen', 'attribution']);
    expect(addControl.mock.calls.some(([c]) => c instanceof ScaleLine)).toBe(true);
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(5));
    const search = geopf.created.find((c) => c.kind === 'search');
    expect(search?.options).toEqual(MAP_TOOLS_OPTIONS.search);
    expect(search?.element.querySelector('dialog')).toHaveAttribute(
      'aria-label',
      GEOPF_DIALOG_LABELS['GPautoCompleteList'],
    );
  });

  it('retire tous les outils au démontage', async () => {
    const { map, addControl, removeControl } = createFakeMap();
    const { unmount } = renderHook(() => useMapControls(map));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(5));
    unmount();
    expect(removeControl).toHaveBeenCalledTimes(5);
  });

  it('n’ajoute pas la recherche si la carte a été démontée avant son chargement', async () => {
    const { map, addControl } = createFakeMap();
    const { unmount } = renderHook(() => useMapControls(map));
    unmount();
    await Promise.resolve();
    await Promise.resolve();
    expect(addControl).toHaveBeenCalledTimes(4);
  });

  it('ne fait rien sans carte', () => {
    geopf.created.length = 0;
    renderHook(() => useMapControls(null));
    expect(geopf.created).toHaveLength(0);
  });
});
