import { afterEach, describe, expect, it, vi } from 'vitest';
import { readCatalogView, restoreCatalogView, type CatalogView } from './catalogView';

/** Widget markup as geopf builds it, before its entries (inserted later, after a `setTimeout`). */
function widget(uid: number, { pressed = false, tab = 'sols' } = {}): HTMLElement {
  const root = document.createElement('div');
  root.id = `GPcatalog-${uid}`;
  root.innerHTML = `<button type="button" id="GPshowCatalogPicto-${uid}" aria-pressed="${pressed}">Catalogue</button>
    <dialog id="GPcatalogPanel-${uid}" open>
      <div class="gpf-panel__header"><button type="button" class="GPpanelClose">Fermer le panneau</button></div>
      <div class="gpf-panel__body">
        <input id="catalog-input-search-global" type="text" />
        <button type="button" id="catalog-button-search-global">Rechercher</button>
        <ul role="tablist">
          <li><button type="button" id="tabbutton-0_sols" class="fr-tabs__tab" role="tab" aria-selected="${tab === 'sols'}">Données sols</button></li>
          <li><button type="button" id="tabbutton-1_fonds" class="fr-tabs__tab" role="tab" aria-selected="${tab === 'fonds'}">Fonds de cartes</button></li>
        </ul>
        <div class="entries"></div>
      </div>
    </dialog>`;
  // geopf switches the tab itself on click.
  root.querySelectorAll<HTMLElement>('[role="tab"]').forEach((button) =>
    button.addEventListener('click', () => {
      root
        .querySelectorAll('[role="tab"]')
        .forEach((other) => other.setAttribute('aria-selected', String(other === button)));
    }),
  );
  document.body.append(root);
  return root;
}

/** The entries geopf renders: a fieldset per entry, its checkbox and an « En savoir plus » link without id. */
function renderEntries(root: HTMLElement, names: string[]): void {
  root.querySelector('.entries')?.insertAdjacentHTML(
    'beforeend',
    names
      .map(
        (name, i) => `<div id="fieldset-sols_${name}-WMS" data-layeritem>
          <input type="checkbox" id="checkboxes-sols-${i}_${name}-WMS" data-layer="${name}:WMS" />
          <a href="/rechercher-une-donnee/dataset/${name}">Voir la fiche détaillée</a></div>`,
      )
      .join(''),
  );
}

const allRendered = (count: number) => (root: HTMLElement) =>
  root.querySelectorAll('input[data-layer]').length >= count;

describe('readCatalogView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lit le panneau ouvert, l’onglet, la recherche, le défilement et le focus', () => {
    const root = widget(11, { pressed: true, tab: 'fonds' });
    (root.querySelector('#catalog-input-search-global') as HTMLInputElement).value = 'photo';
    (root.querySelector('.gpf-panel__body') as HTMLElement).scrollTop = 120;
    (root.querySelector('#tabbutton-1_fonds') as HTMLElement).focus();
    expect(readCatalogView(root)).toEqual({
      open: true,
      tabId: 'tabbutton-1_fonds',
      search: 'photo',
      scrollTop: 120,
      focus: { id: 'tabbutton-1_fonds', index: -1 },
    });
  });

  it('repère un élément sans id par son ancêtre identifié, l’uid du widget mis à part', () => {
    const root = widget(12);
    renderEntries(root, ['a', 'b']);
    const link = root.querySelectorAll('a')[1] as HTMLElement;
    link.focus();
    expect(readCatalogView(root).focus).toEqual({ id: 'fieldset-sols_b-WMS', index: 1 });
    (root.querySelector('.GPpanelClose') as HTMLElement).focus();
    expect(readCatalogView(root).focus).toEqual({ id: 'GPcatalogPanel-{uid}', index: 0 });
    (root.querySelector('button') as HTMLElement).focus();
    expect(readCatalogView(root).focus).toEqual({ id: 'GPshowCatalogPicto-{uid}', index: -1 });
  });

  it('ne retient pas un focus hors du widget, et un panneau fermé', () => {
    const root = widget(13);
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    expect(readCatalogView(root)).toMatchObject({
      open: false,
      tabId: 'tabbutton-0_sols',
      focus: null,
    });
  });
});

describe('restoreCatalogView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const view = (overrides: Partial<CatalogView> = {}): CatalogView => ({
    open: true,
    tabId: 'tabbutton-1_fonds',
    search: '',
    scrollTop: 0,
    focus: null,
    ...overrides,
  });

  it('sélectionne l’onglet et rend aussitôt le focus à un élément déjà construit (uid du nouveau widget)', () => {
    const root = widget(21, { pressed: true });
    const stop = restoreCatalogView(
      root,
      view({ focus: { id: 'tabbutton-1_fonds', index: -1 } }),
      allRendered(2),
    );
    expect(root.querySelector('#tabbutton-1_fonds')).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(root.querySelector('#tabbutton-1_fonds'));
    stop();
    restoreCatalogView(
      root,
      view({ tabId: null, focus: { id: 'GPshowCatalogPicto-{uid}', index: -1 } }),
      allRendered(0),
    );
    // The focus is not lost (on the tab): nothing is taken from it.
    expect(document.activeElement).toBe(root.querySelector('#tabbutton-1_fonds'));
    (document.activeElement as HTMLElement).blur();
    restoreCatalogView(
      root,
      view({ tabId: null, focus: { id: 'GPshowCatalogPicto-{uid}', index: -1 } }),
      allRendered(0),
    );
    expect(document.activeElement).toBe(root.querySelector('#GPshowCatalogPicto-21'));
  });

  it('attend les entrées pour la recherche, le défilement et le focus d’une entrée', async () => {
    const root = widget(22, { pressed: true });
    const search = vi.fn();
    root.querySelector('#catalog-button-search-global')?.addEventListener('click', search);
    restoreCatalogView(
      root,
      view({
        search: 'photo',
        scrollTop: 80,
        focus: { id: 'fieldset-sols_b-WMS', index: 1 },
      }),
      allRendered(2),
    );
    expect(search).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
    renderEntries(root, ['a']);
    await Promise.resolve();
    expect(search).not.toHaveBeenCalled();
    renderEntries(root, ['b']);
    await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));
    expect(root.querySelector('#catalog-input-search-global')).toHaveValue('photo');
    expect((root.querySelector('.gpf-panel__body') as HTMLElement).scrollTop).toBe(80);
    expect(document.activeElement).toBe(root.querySelectorAll('a')[1]);
  });

  it('ne filtre pas sous trois caractères (comme le champ geopf) et se rabat sur le bouton', () => {
    const root = widget(23);
    renderEntries(root, ['a']);
    const search = vi.fn();
    root.querySelector('#catalog-button-search-global')?.addEventListener('click', search);
    restoreCatalogView(
      root,
      view({ open: false, search: 'ph', focus: { id: 'fieldset-sols_disparue-WMS', index: 0 } }),
      allRendered(1),
    );
    expect(root.querySelector('#catalog-input-search-global')).toHaveValue('ph');
    expect(search).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(root.querySelector('button'));
  });

  it('cesse d’attendre une fois arrêté, et ne vole pas le focus mis ailleurs entre-temps', async () => {
    const root = widget(24);
    const search = vi.fn();
    root.querySelector('#catalog-button-search-global')?.addEventListener('click', search);
    const stop = restoreCatalogView(root, view({ search: 'photo' }), allRendered(1));
    stop();
    renderEntries(root, ['a']);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(search).not.toHaveBeenCalled();

    const other = widget(25);
    const outside = document.createElement('button');
    document.body.append(outside);
    restoreCatalogView(
      other,
      view({ focus: { id: 'fieldset-sols_a-WMS', index: 0 } }),
      allRendered(1),
    );
    outside.focus();
    renderEntries(other, ['a']);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(outside);
  });
});
