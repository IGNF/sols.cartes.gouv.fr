import { renderHook, waitFor } from '@testing-library/react';
import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_OPTIONS, CONTROL_LABELS, GEOPF_DIALOG_LABELS } from '../config/map';
import { initialMapState, useMapStore } from '../store/useMapStore';
import useCatalog, { CATALOG_CLASS, createCatalog, patchProducerLinks } from './useCatalog';

const geopf = vi.hoisted(() => {
  const created: FakeCatalog[] = [];
  let failNext = false;
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
  return {
    created,
    FakeCatalog,
    original: FakeCatalog.prototype.createCatalogProducerLinks,
    failNext: () => {
      failNext = true;
    },
    loadCatalog: () => {
      if (!failNext) return Promise.resolve(FakeCatalog);
      failNext = false;
      return Promise.reject(new Error('chunk'));
    },
  };
});

vi.mock('../map/geopf', () => ({ loadCatalog: () => geopf.loadCatalog() }));

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

  it('relie les étiquettes de producteur à notre catalogue, URL construite sur le nom brut', () => {
    const control = createCatalog(geopf.FakeCatalog as unknown as CatalogClass, vi.fn(), vi.fn());
    const producerLinks = (
      control as unknown as {
        createCatalogProducerLinks: (
          p: string[] | null,
        ) => Array<{ name: string; url: string }> | null;
      }
    ).createCatalogProducerLinks;
    // The control hands over the escaped producer of the configuration (it goes into innerHTML).
    expect(producerLinks(['INRAE - Info&amp;Sols'])).toEqual([
      {
        name: 'INRAE - Info&amp;Sols',
        url: '/rechercher-une-donnee/search?organization=INRAE%20-%20Info%26Sols',
      },
    ]);
    expect(producerLinks(['INRAE - Info&Sols'])?.[0]?.url).toBe(
      '/rechercher-une-donnee/search?organization=INRAE%20-%20Info%26Sols',
    );
    expect(producerLinks(null)).toBeNull();
  });

  it('ne patche le prototype qu’une fois', () => {
    const Catalog = geopf.FakeCatalog as unknown as CatalogClass;
    const prototype = Catalog.prototype as unknown as { createCatalogProducerLinks: unknown };
    patchProducerLinks(Catalog);
    const patched = prototype.createCatalogProducerLinks;
    expect(patched).not.toBe(geopf.original);
    createCatalog(Catalog, vi.fn(), vi.fn());
    patchProducerLinks(Catalog);
    expect(prototype.createCatalogProducerLinks).toBe(patched);
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

  it('n’ajoute pas deux fois une fiche dont un lien a déjà posé une autre couche, et retire toutes ses couches', async () => {
    const { map, addControl } = createFakeMap();
    renderHook(() => useCatalog(map));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const catalog = geopf.created[0];
    // The Loiret record publishes two WMS layers: the link adds the second one, the entry is the first.
    useMapStore.getState().addOverlay({
      key: 'wms-vector:rrp_loiret_gpkg_11-09-2026_wmsv',
      service: 'wms-vector',
      name: 'rrp_loiret_gpkg_11-09-2026_wmsv',
      title: 'RRP du Loiret',
      endpoint: 'https://data.geopf.fr/wms-v/ows',
    });
    catalog?.listeners.get('catalog:layer:add')?.({
      name: 'rrp_dept_loiret_gpkg_11-09-2026_wmsv',
      service: 'WMS',
    });
    expect(useMapStore.getState().overlays.map((o) => o.key)).toEqual([
      'wms-vector:rrp_loiret_gpkg_11-09-2026_wmsv',
    ]);
    catalog?.listeners.get('catalog:layer:remove')?.({
      name: 'rrp_dept_loiret_gpkg_11-09-2026_wmsv',
      service: 'WMS',
    });
    expect(useMapStore.getState().overlays).toEqual([]);
  });

  it('coche l’entrée d’une fiche dont une couche est sur la carte et la décoche quand elle en sort', async () => {
    const { map, addControl } = createFakeMap();
    renderHook(() => useCatalog(map));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const dialog = geopf.created[0]?.element.querySelector('dialog');
    if (!dialog) throw new Error('fixture');
    dialog.innerHTML = `<div data-layeritem><input type="checkbox" data-layer="rrp_dept_loiret_gpkg_11-09-2026_wmsv:WMS" />
      <label class="catalog-layer-title">RRP du Loiret</label></div>
      <div data-layeritem><input type="checkbox" data-layer="stock_carbone_fao_fr_wmsv:WMS" />
      <label class="catalog-layer-title">Carbone</label></div>`;
    const inputs = () =>
      Array.from(dialog.querySelectorAll<HTMLInputElement>('input')).map((i) => i.checked);
    useMapStore.getState().addOverlay({
      key: 'wms-vector:rrp_loiret_gpkg_11-09-2026_wmsv',
      service: 'wms-vector',
      name: 'rrp_loiret_gpkg_11-09-2026_wmsv',
      title: 'RRP du Loiret',
      endpoint: 'https://data.geopf.fr/wms-v/ows',
    });
    await waitFor(() => expect(inputs()).toEqual([true, false]));
    useMapStore.getState().removeOverlay('wms-vector:rrp_loiret_gpkg_11-09-2026_wmsv');
    await waitFor(() => expect(inputs()).toEqual([false, false]));
  });

  it('bascule le fond de carte depuis l’onglet « Fonds de cartes », qui reste coché', async () => {
    const baseLayers = [
      {
        id: 'plan-ign' as const,
        layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
        title: 'Plan IGN',
      },
      { id: 'orthophotos' as const, layerName: 'ORTHOIMAGERY.ORTHOPHOTOS', title: 'Photos' },
    ];
    const { map, addControl } = createFakeMap();
    renderHook(() => useCatalog(map, baseLayers));
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const catalog = geopf.created[0];
    const data = (catalog?.options['configuration'] as { data: { layers: object } }).data;
    expect(Object.keys(data.layers)).toHaveLength(9);
    const dialog = catalog?.element.querySelector('dialog');
    if (!dialog) throw new Error('fixture');
    dialog.innerHTML = `<div data-layeritem><input type="checkbox" name="checkboxes-fonds" data-layer="GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2:WMTS" />
      <label class="catalog-layer-title">Plan IGN</label></div>
      <div data-layeritem><input type="checkbox" name="checkboxes-fonds" data-layer="ORTHOIMAGERY.ORTHOPHOTOS:WMTS" />
      <label class="catalog-layer-title">Photos</label></div>`;
    const inputs = () =>
      Array.from(dialog.querySelectorAll<HTMLInputElement>('input')).map((i) => i.checked);
    await waitFor(() => expect(inputs()).toEqual([true, false]));
    expect(dialog.querySelector('input')).toHaveAttribute(
      'aria-label',
      'Afficher le fond de carte : Plan IGN',
    );
    catalog?.listeners.get('catalog:layer:add')?.({
      name: 'ORTHOIMAGERY.ORTHOPHOTOS',
      service: 'WMTS',
    });
    expect(useMapStore.getState().activeBaseLayerId).toBe('orthophotos');
    await waitFor(() => expect(inputs()).toEqual([false, true]));
    expect(useMapStore.getState().overlays).toEqual([]);
    // Unticking the active base layer changes nothing: it is ticked again.
    const ortho = dialog.querySelectorAll<HTMLInputElement>('input')[1];
    if (ortho) ortho.checked = false;
    catalog?.listeners.get('catalog:layer:remove')?.({
      name: 'ORTHOIMAGERY.ORTHOPHOTOS',
      service: 'WMTS',
    });
    expect(useMapStore.getState().activeBaseLayerId).toBe('orthophotos');
    expect(inputs()).toEqual([false, true]);
  });

  it('signale au magasin un catalogue qui n’a pas pu être chargé', async () => {
    geopf.failNext();
    const { map, addControl } = createFakeMap();
    renderHook(() => useCatalog(map));
    await waitFor(() => expect(useMapStore.getState().catalogueUnavailable).toBe(true));
    expect(addControl).not.toHaveBeenCalled();
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
