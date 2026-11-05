import { renderHook, waitFor } from '@testing-library/react';
import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTROL_LABELS,
  EXCLUDED_TERRITORY_IDS,
  GEOPF_DIALOG_LABELS,
  MAP_TOOLS_OPTIONS,
} from '../config/map';
import useMapTools, {
  createMapTools,
  LISTABLE_TOOL_CLASS,
  returnFocusOnCollapse,
  TOOL_CLASS,
} from './useMapTools';

interface Created {
  kind: string;
  options: Record<string, unknown>;
  element: HTMLElement;
}

const geopf = vi.hoisted(() => {
  const created: Created[] = [];
  /** Fake geopf control: keeps its options, renders a toggle button and the dialog of the real widget. */
  const make = (kind: string, dialogPrefix?: string) =>
    class {
      options: Record<string, unknown>;
      element: HTMLElement;
      listable: boolean;
      listeners = new Map<string, (event: unknown) => void>();
      constructor(options: Record<string, unknown>) {
        this.options = options;
        this.listable = options['listable'] === true;
        this.element = document.createElement('div');
        this.element.innerHTML = `<button type="button" aria-label="Afficher plus" aria-pressed="false">+</button>${
          dialogPrefix
            ? `<dialog id="${dialogPrefix}-1">${kind === 'controlList' ? '<ul class="fr-m-0"></ul>' : ''}</dialog>`
            : ''
        }`;
        created.push({ kind, options, element: this.element });
      }
      on(type: string, listener: (event: unknown) => void) {
        this.listeners.set(type, listener);
      }
    };
  const territories = [
    { id: 'FXX', title: 'France métropolitaine', bbox: [-9.86, 41.15, 10.38, 51.56] },
    { id: 'IDF', title: 'Paris petite couronne', bbox: [2.18, 48.77, 2.52, 48.95] },
    { id: 'ATF', title: 'TAAF', bbox: [] },
    { id: 'REU', title: 'La Réunion', bbox: [55.07, -21.46, 55.86, -20.79] },
  ];
  return {
    created,
    tools: {
      Legends: make('legends', 'GPlegendsPanel'),
      Territories: make('territories', 'GPterritoriesPanel'),
      GeoportalOverviewMap: make('overviewMap'),
      MousePosition: make('mousePosition', 'GPmousePositionPanel'),
      MeasureLength: make('measureLength'),
      MeasureArea: make('measureArea'),
      MeasureAzimuth: make('measureAzimuth'),
      ElevationPath: make('elevationPath', 'GPelevationPathPanel'),
      Isocurve: make('isocurve', 'GPisochronPanel'),
      Route: make('route', 'GProutePanel'),
      ReverseGeocode: make('reverseGeocode', 'GPreverseGeocodingPanel'),
      Drawing: make('drawing', 'GPdrawingPanel'),
      LayerImport: make('layerImport', 'GPimportPanel'),
      GetFeatureInfo: make('getFeatureInfo', 'GPgetFeatureInfoPanel'),
      ControlList: make('controlList', 'GPcontrolListPanel'),
      TERRITORIES: territories,
    },
  };
});

const loadCrs = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../map/geopf', () => ({
  loadMapTools: () => Promise.resolve(geopf.tools),
  loadCrs,
}));

type Tools = Parameters<typeof createMapTools>[0];

function createFakeMap() {
  const addControl = vi.fn();
  const removeControl = vi.fn();
  const overlays = document.createElement('div');
  return {
    map: {
      addControl,
      removeControl,
      getOverlayContainerStopEvent: () => overlays,
    } as unknown as OlMap,
    addControl,
    removeControl,
  };
}

describe('createMapTools', () => {
  beforeEach(() => {
    geopf.created.length = 0;
  });

  it('instancie le jeu d’outils de l’entrée carto avec les options configurées', () => {
    const controls = createMapTools(geopf.tools as unknown as Tools);
    expect(controls).toHaveLength(15);
    const byKind = Object.fromEntries(geopf.created.map((c) => [c.kind, c.options]));
    expect(Object.keys(byKind).sort()).toEqual(
      [
        'controlList',
        'drawing',
        'elevationPath',
        'getFeatureInfo',
        'isocurve',
        'layerImport',
        'legends',
        'measureArea',
        'measureAzimuth',
        'measureLength',
        'mousePosition',
        'overviewMap',
        'reverseGeocode',
        'route',
        'territories',
      ].sort(),
    );
    expect(byKind['measureLength']).toEqual(MAP_TOOLS_OPTIONS.measureLength);
    expect(byKind['route']).toEqual(MAP_TOOLS_OPTIONS.route);
    expect(byKind['legends']).toEqual(MAP_TOOLS_OPTIONS.legends);
    expect(byKind['getFeatureInfo']).toEqual(MAP_TOOLS_OPTIONS.getFeatureInfo);
  });

  it('passe à Territories la liste intégrée sans les territoires exclus', () => {
    createMapTools(geopf.tools as unknown as Tools);
    const territories = geopf.created.find((c) => c.kind === 'territories')?.options[
      'territories'
    ] as Array<{ id: string }>;
    expect(territories.map((t) => t.id)).toEqual(['FXX', 'REU']);
    expect(EXCLUDED_TERRITORY_IDS).toEqual(['ATF', 'IDF']);
  });

  it('nomme les fenêtres et le bouton « Mes outils », et marque les outils listables', () => {
    createMapTools(geopf.tools as unknown as Tools);
    const controlList = geopf.created.find((c) => c.kind === 'controlList');
    expect(controlList?.element.querySelector('button')).toHaveAttribute(
      'aria-label',
      CONTROL_LABELS.controlList,
    );
    expect(controlList?.element.querySelector('dialog')).toHaveAttribute(
      'aria-label',
      GEOPF_DIALOG_LABELS['GPcontrolListPanel'],
    );
    const route = geopf.created.find((c) => c.kind === 'route');
    expect(route?.element.querySelector('dialog')).toHaveAttribute(
      'aria-label',
      GEOPF_DIALOG_LABELS['GProutePanel'],
    );
    expect(route?.element).toHaveClass(TOOL_CLASS, LISTABLE_TOOL_CLASS);
    const legends = geopf.created.find((c) => c.kind === 'legends');
    expect(legends?.element).toHaveClass(TOOL_CLASS);
    expect(legends?.element).not.toHaveClass(LISTABLE_TOOL_CLASS);
    // The list of « Mes outils » is a menu (its items are rendered as role="button" li upstream).
    expect(controlList?.element.querySelector('ul')).toHaveAttribute('role', 'menu');
  });
});

describe('returnFocusOnCollapse', () => {
  it('rend le focus au bouton « Mes outils » quand la liste se replie après un choix', () => {
    const element = document.createElement('div');
    element.innerHTML = '<button type="button" aria-pressed="false">Mes outils</button>';
    document.body.append(element);
    const listeners = new Map<string, (event: unknown) => void>();
    returnFocusOnCollapse(
      { on: (type: string, l: (e: unknown) => void) => listeners.set(type, l) },
      element,
    );
    (document.activeElement as HTMLElement | null)?.blur();
    listeners.get('change:collapsed')?.({});
    expect(document.activeElement).toBe(element.querySelector('button'));
    // Open list (aria-pressed true): nothing to do.
    element.querySelector('button')?.setAttribute('aria-pressed', 'true');
    (document.activeElement as HTMLElement | null)?.blur();
    listeners.get('change:collapsed')?.({});
    expect(document.activeElement).toBe(document.body);
    element.remove();
  });
});

describe('useMapTools', () => {
  beforeEach(() => {
    geopf.created.length = 0;
  });

  it('charge les outils et la projection Lambert 93 à la demande, les ajoute puis les retire au démontage', async () => {
    const { map, addControl, removeControl } = createFakeMap();
    const { unmount } = renderHook(() => useMapTools(map));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(15));
    expect(loadCrs.mock.calls.map(([name]) => name)).toEqual(['EPSG:2154', 'EPSG:27572']);
    unmount();
    expect(removeControl).toHaveBeenCalledTimes(15);
  });

  it('n’ajoute rien si la carte a été démontée avant le chargement', async () => {
    const { map, addControl } = createFakeMap();
    const { unmount } = renderHook(() => useMapTools(map));
    unmount();
    await Promise.resolve();
    await Promise.resolve();
    expect(addControl).not.toHaveBeenCalled();
  });

  it('ne fait rien sans carte', () => {
    renderHook(() => useMapTools(null));
    expect(geopf.created).toHaveLength(0);
  });
});
