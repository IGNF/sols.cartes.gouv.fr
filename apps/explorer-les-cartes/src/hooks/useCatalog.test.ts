import { renderHook, waitFor } from '@testing-library/react';
import type OlMap from 'ol/Map';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_OPTIONS, CONTROL_LABELS, GEOPF_DIALOG_LABELS, MAP_NOTICES } from '../config/map';
import { initialMapState, useMapStore } from '../store/useMapStore';
import type { AvailableBaseLayer } from '../map/baseLayerCatalogue';
import useCatalog, { CATALOG_CLASS, createCatalog, patchProducerLinks } from './useCatalog';

const geopf = vi.hoisted(() => {
  const created: FakeCatalog[] = [];
  let failNext = false;
  let uid = 1000;
  /**
   * Fake geopf Catalog: ids carry the control's uid, `collapsed: false` opens the panel (as `setMap`
   * does), the header, search and tabs exist at once (tabs switched on click); the entries are put by
   * the tests in `.entries`, as geopf inserts them later.
   */
  class FakeCatalog {
    options: Record<string, unknown>;
    element: HTMLElement;
    listeners = new Map<string, (event: unknown) => void>();
    constructor(options: Record<string, unknown>) {
      this.options = options;
      uid += 1;
      this.element = document.createElement('div');
      this.element.id = `GPcatalog-${uid}`;
      const pressed = options['collapsed'] === false;
      this.element.innerHTML = `<button type="button" id="GPshowCatalogPicto-${uid}" aria-label="Catalogue de cartes" aria-pressed="${pressed}">C</button>
        <dialog id="GPcatalogPanel-${uid}" open><div class="gpf-panel__body">
        <input id="catalog-input-search-global" type="text" /><button type="button" id="catalog-button-search-global">R</button>
        <button type="button" id="tabbutton-0_sols" class="fr-tabs__tab" aria-selected="true">Données sols</button>
        <button type="button" id="tabbutton-1_fonds" class="fr-tabs__tab" aria-selected="false">Fonds de cartes</button>
        <div class="entries"></div></div></dialog>`;
      const tabs = this.element.querySelectorAll('.fr-tabs__tab');
      tabs.forEach((tab) =>
        tab.addEventListener('click', () =>
          tabs.forEach((other) => other.setAttribute('aria-selected', String(other === tab))),
        ),
      );
      this.element.querySelector('#catalog-button-search-global')?.addEventListener('click', () => {
        const input = this.element.querySelector<HTMLInputElement>('#catalog-input-search-global');
        this.element.dataset['filter'] = input?.value ?? '';
      });
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
  // OpenLayers detaches the control's element (and the focus it had goes to the body).
  const removeControl = vi.fn((control: { element: HTMLElement }) => {
    control.element.remove();
  });
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

const BASE_LAYERS: AvailableBaseLayer[] = [
  { id: 'plan-ign', layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', title: 'Plan IGN' },
];

const layersOf = (catalog: (typeof geopf.created)[number] | undefined) =>
  Object.keys((catalog?.options['configuration'] as { data: { layers: object } }).data.layers);

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

  it('crée le catalogue aussitôt et le reconstruit fermé à l’arrivée des fonds', async () => {
    const { map, addControl, removeControl } = createFakeMap();
    const { rerender } = renderHook(({ layers }) => useCatalog(map, layers), {
      initialProps: { layers: [] as AvailableBaseLayer[] },
    });
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const first = geopf.created[0];
    expect(layersOf(first)).toHaveLength(7);
    rerender({ layers: BASE_LAYERS });
    await waitFor(() => expect(geopf.created).toHaveLength(2));
    expect(removeControl).toHaveBeenCalledWith(first);
    expect(layersOf(geopf.created[1])).toHaveLength(8);
    expect(geopf.created[1]?.options['collapsed']).toBe(true);
  });

  it('reconstruit aussitôt le catalogue ouvert à l’arrivée des fonds, sur le même onglet, avec la même recherche (D-carto-8)', async () => {
    const { map, addControl, removeControl, container } = createFakeMap();
    document.body.append(container);
    const { rerender } = renderHook(({ layers }) => useCatalog(map, layers), {
      initialProps: { layers: [] as AvailableBaseLayer[] },
    });
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const first = geopf.created[0];
    if (!first) throw new Error('fixture');
    // The user opened the panel, typed a search, chose « Fonds de cartes » (still empty) and kept the focus on it.
    first.element.querySelector('button')?.setAttribute('aria-pressed', 'true');
    const firstSearch = first.element.querySelector<HTMLInputElement>(
      '#catalog-input-search-global',
    );
    if (firstSearch) firstSearch.value = 'photo';
    const firstTab = first.element.querySelector<HTMLElement>('#tabbutton-1_fonds');
    firstTab?.click();
    firstTab?.focus();
    rerender({ layers: BASE_LAYERS });
    await waitFor(() => expect(geopf.created).toHaveLength(2));
    expect(removeControl).toHaveBeenCalledWith(first);
    const second = geopf.created[1];
    if (!second) throw new Error('fixture');
    // Built open, without closing in between: the panel stays on screen.
    expect(second.options['collapsed']).toBe(false);
    expect(second.element.querySelector('button')).toHaveAttribute('aria-pressed', 'true');
    const tab = second.element.querySelector('#tabbutton-1_fonds');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tab);
    // The search is applied once the entries (7 records + 1 base layer) are rendered.
    expect(second.element.dataset['filter']).toBeUndefined();
    second.element
      .querySelector('.entries')
      ?.insertAdjacentHTML(
        'beforeend',
        Array.from(
          { length: 8 },
          (_, i) => `<input type="checkbox" data-layer="e${i}:WMS" />`,
        ).join(''),
      );
    await waitFor(() => expect(second.element.dataset['filter']).toBe('photo'));
    expect(second.element.querySelector('#catalog-input-search-global')).toHaveValue('photo');
    container.remove();
  });

  it('rend le focus à l’entrée qui l’avait une fois les entrées du nouveau catalogue rendues', async () => {
    const { map, addControl, container } = createFakeMap();
    document.body.append(container);
    const { rerender } = renderHook(({ layers }) => useCatalog(map, layers), {
      initialProps: { layers: [] as AvailableBaseLayer[] },
    });
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const entries = (count: number) =>
      Array.from(
        { length: count },
        (_, i) =>
          `<input type="checkbox" id="checkboxes-sols-${i}_e${i}-WMS" data-layer="e${i}:WMS" />`,
      ).join('');
    const first = geopf.created[0];
    first?.element.querySelector('button')?.setAttribute('aria-pressed', 'true');
    first?.element.querySelector('.entries')?.insertAdjacentHTML('beforeend', entries(7));
    first?.element.querySelector<HTMLElement>('#checkboxes-sols-3_e3-WMS')?.focus();
    rerender({ layers: BASE_LAYERS });
    await waitFor(() => expect(geopf.created).toHaveLength(2));
    expect(document.activeElement).toBe(document.body);
    const second = geopf.created[1];
    second?.element.querySelector('.entries')?.insertAdjacentHTML('beforeend', entries(8));
    await waitFor(() =>
      expect(document.activeElement).toBe(
        second?.element.querySelector('#checkboxes-sols-3_e3-WMS'),
      ),
    );
    container.remove();
  });

  it('rend le focus au nouveau bouton quand le catalogue est reconstruit depuis son bouton', async () => {
    const { map, addControl, container } = createFakeMap();
    document.body.append(container);
    const { rerender } = renderHook(({ layers }) => useCatalog(map, layers), {
      initialProps: { layers: [] as AvailableBaseLayer[] },
    });
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const firstButton = geopf.created[0]?.element.querySelector('button');
    firstButton?.focus();
    expect(document.activeElement).toBe(firstButton);
    rerender({
      layers: [
        { id: 'plan-ign', layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', title: 'Plan IGN' },
      ],
    });
    await waitFor(() => expect(geopf.created).toHaveLength(2));
    const secondButton = geopf.created[1]?.element.querySelector('button');
    expect(secondButton).not.toBe(firstButton);
    expect(document.activeElement).toBe(secondButton);
    container.remove();
  });

  it('laisse le focus là où il est quand le catalogue est reconstruit sans l’avoir', async () => {
    const { map, addControl, container } = createFakeMap();
    document.body.append(container);
    const outside = document.createElement('button');
    document.body.append(outside);
    const { rerender } = renderHook(({ layers }) => useCatalog(map, layers), {
      initialProps: { layers: [] as AvailableBaseLayer[] },
    });
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    outside.focus();
    rerender({
      layers: [
        { id: 'plan-ign', layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', title: 'Plan IGN' },
      ],
    });
    await waitFor(() => expect(geopf.created).toHaveLength(2));
    expect(document.activeElement).toBe(outside);
    outside.remove();
    container.remove();
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

  /** geopf builds the category panels after the control (once its configuration is loaded). */
  function addFondsPanel(catalog: { element: HTMLElement } | undefined): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'tabpanel-1-panel_fonds';
    panel.setAttribute('role', 'tabpanel');
    panel.innerHTML = '<div class="tabcontent" data-category="fonds"></div>';
    catalog?.element.querySelector('.gpf-panel__body')?.append(panel);
    return panel;
  }

  it('affiche dans l’onglet « Fonds de cartes » le chargement puis l’échec des capacités (M15)', async () => {
    const { map, addControl } = createFakeMap();
    // Stable list, as `useBaseLayerCatalogue` memoizes it: a new list would rebuild the catalogue.
    const none: AvailableBaseLayer[] = [];
    const { rerender } = renderHook(({ status }) => useCatalog(map, none, status), {
      initialProps: { status: 'loading' as 'loading' | 'error' },
    });
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const panel = addFondsPanel(geopf.created[0]);
    await waitFor(() => expect(panel).toHaveTextContent(MAP_NOTICES.baseLayersLoading));
    expect(panel.querySelector('[role="status"]')).not.toBeNull();
    rerender({ status: 'error' });
    expect(panel).toHaveTextContent(MAP_NOTICES.baseLayersError);
    expect(panel.querySelector('button')).toHaveTextContent(MAP_NOTICES.baseLayersReload);
    // Same widget: a failure does not rebuild the catalogue.
    expect(geopf.created).toHaveLength(1);
  });

  it('remplace l’avis de chargement par les entrées quand les fonds arrivent', async () => {
    const { map, addControl } = createFakeMap();
    const { rerender } = renderHook(({ layers, status }) => useCatalog(map, layers, status), {
      initialProps: {
        layers: [] as AvailableBaseLayer[],
        status: 'loading' as 'loading' | 'ready',
      },
    });
    await waitFor(() => expect(addControl).toHaveBeenCalledTimes(1));
    const before = addFondsPanel(geopf.created[0]);
    await waitFor(() => expect(before).toHaveTextContent(MAP_NOTICES.baseLayersLoading));
    rerender({ layers: BASE_LAYERS, status: 'ready' });
    await waitFor(() => expect(geopf.created).toHaveLength(2));
    const after = addFondsPanel(geopf.created[1]);
    after.querySelector('.tabcontent')?.append(document.createElement('input'));
    await Promise.resolve();
    expect(after.querySelector('[role="status"]')).toBeNull();
    expect(after).not.toHaveTextContent(MAP_NOTICES.baseLayersLoading);
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
