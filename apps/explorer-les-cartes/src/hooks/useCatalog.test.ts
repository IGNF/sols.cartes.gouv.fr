import { renderHook, waitFor } from '@testing-library/react';
import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_OPTIONS, CONTROL_LABELS, GEOPF_DIALOG_LABELS } from '../config/map';
import { initialMapState, useMapStore } from '../store/useMapStore';
import useCatalog, { CATALOG_CLASS, createCatalog } from './useCatalog';

const geopf = vi.hoisted(() => {
  const created: FakeCatalog[] = [];
  class FakeCatalog {
    options: Record<string, unknown>;
    element: HTMLElement;
    listeners = new Map<string, (event: unknown) => void>();
    constructor(options: Record<string, unknown>) {
      this.options = options;
      this.element = document.createElement('div');
      this.element.innerHTML =
        '<button type="button" aria-label="Catalogue de cartes">C</button><dialog id="GPcatalogPanel-1"></dialog>';
      created.push(this);
    }
    on(type: string, listener: (event: unknown) => void) {
      this.listeners.set(type, listener);
    }
    createCatalogProducerLinks(): null {
      return null;
    }
  }
  return { created, FakeCatalog };
});

vi.mock('../map/geopf', () => ({ loadCatalog: () => Promise.resolve(geopf.FakeCatalog) }));

type CatalogClass = Parameters<typeof createCatalog>[0];

function createFakeMap() {
  const container = document.createElement('div');
  container.innerHTML = '<div id="GPlayerSwitcher-1"></div>';
  const addControl = vi.fn((control: { element: HTMLElement }) => {
    container.append(control.element);
  });
  const removeControl = vi.fn();
  return {
    map: { addControl, removeControl } as unknown as OlMap,
    addControl,
    removeControl,
    container,
  };
}

describe('createCatalog', () => {
  beforeEach(() => {
    geopf.created.length = 0;
  });

  it('configure le contrôle avec les options et les sept fiches, nomme le bouton et la fenêtre', () => {
    createCatalog(geopf.FakeCatalog as unknown as CatalogClass, vi.fn(), vi.fn());
    const catalog = geopf.created[0];
    expect(catalog?.options).toMatchObject({ ...CATALOG_OPTIONS, configuration: { type: 'json' } });
    const data = (catalog?.options['configuration'] as { data: { layers: object } }).data;
    expect(Object.keys(data.layers)).toHaveLength(7);
    expect(catalog?.element.querySelector('button')).toHaveAttribute(
      'aria-label',
      CONTROL_LABELS.catalog,
    );
    expect(catalog?.element.querySelector('dialog')).toHaveAttribute(
      'aria-label',
      GEOPF_DIALOG_LABELS['GPcatalogPanel'],
    );
    expect(catalog?.element).toHaveClass(CATALOG_CLASS);
  });

  it('relie les étiquettes de producteur à notre catalogue', () => {
    const control = createCatalog(geopf.FakeCatalog as unknown as CatalogClass, vi.fn(), vi.fn());
    const links = (
      control as unknown as {
        createCatalogProducerLinks: (
          p: string[] | null,
        ) => Array<{ name: string; url: string }> | null;
      }
    ).createCatalogProducerLinks(['INRAE - Info&Sols']);
    expect(links).toEqual([
      {
        name: 'INRAE - Info&Sols',
        url: '/rechercher-une-donnee/search?organization=INRAE%20-%20Info%26Sols',
      },
    ]);
  });

  it('transmet les évènements d’ajout et de retrait avec nom et service', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    createCatalog(geopf.FakeCatalog as unknown as CatalogClass, onAdd, onRemove);
    const catalog = geopf.created[0];
    catalog?.listeners.get('catalog:layer:add')?.({ name: 'a', service: 'WMS', layer: {} });
    catalog?.listeners.get('catalog:layer:remove')?.({ name: 'a', service: 'WMS' });
    expect(onAdd).toHaveBeenCalledWith({ name: 'a', service: 'WMS' });
    expect(onRemove).toHaveBeenCalledWith({ name: 'a', service: 'WMS' });
  });
});

describe('useCatalog', () => {
  beforeEach(() => {
    geopf.created.length = 0;
    useMapStore.setState(initialMapState);
  });

  it('ajoute le catalogue en tête de la colonne, ajoute et retire les couches du magasin, puis se retire', async () => {
    const { map, addControl, removeControl, container } = createFakeMap();
    const { unmount } = renderHook(() => useCatalog(map));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const catalog = geopf.created[0];
    expect(container.firstElementChild).toBe(catalog?.element);
    catalog?.listeners.get('catalog:layer:add')?.({
      name: 'stock_carbone_fao_fr_wmsv',
      service: 'WMS',
    });
    expect(useMapStore.getState().overlays.map((o) => o.key)).toEqual([
      'wms-vector:stock_carbone_fao_fr_wmsv',
    ]);
    catalog?.listeners.get('catalog:layer:add')?.({ name: 'inconnue', service: 'WMS' });
    expect(useMapStore.getState().overlays).toHaveLength(1);
    catalog?.listeners.get('catalog:layer:remove')?.({
      name: 'stock_carbone_fao_fr_wmsv',
      service: 'WMS',
    });
    expect(useMapStore.getState().overlays).toEqual([]);
    unmount();
    expect(removeControl).toHaveBeenCalledWith(catalog);
  });

  it('nomme les cases à cocher des entrées rendues après le chargement', async () => {
    const { map, addControl } = createFakeMap();
    renderHook(() => useCatalog(map));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const catalog = geopf.created[0];
    const dialog = catalog?.element.querySelector('dialog');
    if (!dialog) throw new Error('fixture');
    dialog.innerHTML = `<div data-layeritem><input type="checkbox" data-layer="a:WMS" />
      <label class="catalog-layer-title">Carte des sols</label></div>`;
    await waitFor(() =>
      expect(dialog.querySelector('input')).toHaveAttribute(
        'aria-label',
        'Ajouter à la carte : Carte des sols',
      ),
    );
  });

  it('ne fait rien sans carte et n’ajoute rien après un démontage précoce', async () => {
    renderHook(() => useCatalog(null));
    expect(geopf.created).toHaveLength(0);
    const { map, addControl } = createFakeMap();
    const { unmount } = renderHook(() => useCatalog(map));
    unmount();
    await Promise.resolve();
    await Promise.resolve();
    expect(addControl).not.toHaveBeenCalled();
  });
});
