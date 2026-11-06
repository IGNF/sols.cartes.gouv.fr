import { describe, expect, it, vi } from 'vitest';
import { MAP_NOTICES } from '../config/map';
import { BASE_LAYERS_NOTICE_CLASS, showBaseLayersNotice } from './catalogNotice';

/** Catalogue widget as geopf builds it: one tab panel per category, entries in `.tabcontent`. */
function widget(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = `<dialog id="GPcatalogPanel-1" open>
    <div id="tabpanel-0-panel_sols" role="tabpanel"><div class="tabcontent" data-category="sols"></div></div>
    <div id="tabpanel-1-panel_fonds" role="tabpanel"><div class="tabcontent" data-category="fonds"></div></div>
  </dialog>`;
  return root;
}

const fonds = (root: HTMLElement) => root.querySelector<HTMLElement>('#tabpanel-1-panel_fonds');
const notices = (root: HTMLElement) => root.querySelectorAll(`.${BASE_LAYERS_NOTICE_CLASS}`);

describe('showBaseLayersNotice', () => {
  it('annonce le chargement en tête de l’onglet « Fonds de cartes », pas ailleurs', () => {
    const root = widget();
    expect(showBaseLayersNotice(root, 'loading', vi.fn())).toBe(true);
    const notice = fonds(root)?.firstElementChild;
    expect(notice).toHaveClass(BASE_LAYERS_NOTICE_CLASS);
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice?.querySelector('.fr-alert')).toHaveClass('fr-alert--info', 'fr-alert--sm');
    expect(notice).toHaveTextContent(MAP_NOTICES.baseLayersLoading);
    expect(root.querySelector('#tabpanel-0-panel_sols .' + BASE_LAYERS_NOTICE_CLASS)).toBeNull();
    // The entries container stays where geopf put it.
    expect(fonds(root)?.querySelector('.tabcontent')).not.toBeNull();
  });

  it('ne touche plus au DOM pour le même état (appelé à chaque mutation du widget)', () => {
    const root = widget();
    showBaseLayersNotice(root, 'loading', vi.fn());
    expect(showBaseLayersNotice(root, 'loading', vi.fn())).toBe(false);
    expect(notices(root)).toHaveLength(1);
  });

  it('passe à l’erreur dans la même zone d’annonce, avec un bouton qui recharge la page', () => {
    const root = widget();
    const onReload = vi.fn();
    showBaseLayersNotice(root, 'loading', onReload);
    const region = notices(root)[0];
    showBaseLayersNotice(root, 'error', onReload);
    expect(notices(root)).toHaveLength(1);
    expect(notices(root)[0]).toBe(region);
    expect(region?.querySelector('.fr-alert')).toHaveClass('fr-alert--error');
    expect(region).toHaveTextContent(MAP_NOTICES.baseLayersError);
    const button = region?.querySelector('button');
    expect(button).toHaveTextContent(MAP_NOTICES.baseLayersReload);
    expect(button).toHaveAttribute('type', 'button');
    button?.click();
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('signale qu’aucun fond prévu n’est publié', () => {
    const root = widget();
    showBaseLayersNotice(root, 'empty', vi.fn());
    expect(notices(root)[0]?.querySelector('.fr-alert')).toHaveClass('fr-alert--warning');
    expect(notices(root)[0]).toHaveTextContent(MAP_NOTICES.baseLayersEmpty);
  });

  it('retire l’avis quand les entrées sont là', () => {
    const root = widget();
    showBaseLayersNotice(root, 'loading', vi.fn());
    expect(showBaseLayersNotice(root, 'ready', vi.fn())).toBe(true);
    expect(notices(root)).toHaveLength(0);
    expect(showBaseLayersNotice(root, 'ready', vi.fn())).toBe(false);
  });

  it('attend que geopf ait construit le panneau', () => {
    const root = document.createElement('div');
    expect(showBaseLayersNotice(root, 'loading', vi.fn())).toBe(false);
    expect(notices(root)).toHaveLength(0);
  });
});
