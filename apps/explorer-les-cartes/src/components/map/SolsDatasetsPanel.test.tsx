import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { SOLS_DATASETS } from '../../data/solsLayers';
import { preferredLayer, toOverlayRef } from '../../map/overlays';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import SolsDatasetsPanel from './SolsDatasetsPanel';

const withLayer = SOLS_DATASETS.find((d) => preferredLayer(d));
const firstLayer = withLayer ? preferredLayer(withLayer) : null;
if (!withLayer || !firstLayer) throw new Error('aucune fiche affichable dans sols-layers.json');
const expectedOverlay = toOverlayRef(firstLayer, withLayer.title);
const expectedKey = expectedOverlay.key;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buttonName = (action: string) => new RegExp(`^${action}\\s*: ${escape(withLayer.title)}$`);

describe('SolsDatasetsPanel', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('liste chaque fiche du fichier généré avec titre, producteur et services', () => {
    render(<SolsDatasetsPanel />);
    expect(screen.getByRole('heading', { level: 2, name: 'Données sols' })).toBeInTheDocument();
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(SOLS_DATASETS.map((d) => d.title));
    const item = screen
      .getByRole('heading', { level: 3, name: withLayer.title })
      .closest('li') as HTMLElement;
    expect(within(item).getByText(/^Producteur :/)).toHaveTextContent(withLayer.organisation);
    expect(within(item).getByRole('list', { name: 'Services disponibles' })).toBeInTheDocument();
  });

  it('ajoute puis retire la couche de la fiche au clavier, avec une annonce', async () => {
    const user = userEvent.setup();
    render(<SolsDatasetsPanel />);
    const add = screen.getByRole('button', { name: buttonName('Ajouter à la carte') });
    add.focus();
    await user.keyboard('{Enter}');
    expect(useMapStore.getState().overlays.map((o) => o.key)).toEqual([expectedKey]);
    expect(screen.getByRole('status')).toHaveTextContent(
      `« ${withLayer.title} » ajoutée à la carte.`,
    );
    const remove = screen.getByRole('button', { name: buttonName('Retirer de la carte') });
    expect(document.activeElement).toBe(remove);
    await user.keyboard(' ');
    expect(useMapStore.getState().overlays).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent('retirée de la carte');
    // Focus stays on the same button, now labelled for the opposite action.
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: buttonName('Ajouter à la carte') }),
    );
  });

  it('signale une couche ajoutée dont le service ne renvoie pas d’image', () => {
    render(<SolsDatasetsPanel />);
    act(() => {
      useMapStore.getState().addOverlay(expectedOverlay);
      useMapStore.getState().markOverlayUnavailable(expectedKey);
    });
    expect(screen.getByText(/ne renvoie pas d’image pour cette couche/)).toBeInTheDocument();
  });

  it('considère une fiche affichée quand une autre de ses couches a été ajoutée par un lien profond', async () => {
    const dataset = SOLS_DATASETS.find(
      (d) => d.layers.filter((l) => l.service.startsWith('wms')).length > 1,
    );
    if (!dataset) throw new Error('aucune fiche à deux couches WMS');
    const other = dataset.layers.filter((l) => l.service.startsWith('wms'))[1];
    if (!other) throw new Error('couche manquante');
    const user = userEvent.setup();
    render(<SolsDatasetsPanel />);
    act(() => useMapStore.getState().addOverlay(toOverlayRef(other, other.title)));
    const remove = screen.getByRole('button', {
      name: new RegExp(`^Retirer de la carte\\s*: ${escape(dataset.title)}$`),
    });
    await user.click(remove);
    expect(useMapStore.getState().overlays).toEqual([]);
  });

  it('renvoie vers la version accessible de la liste des données', () => {
    render(<SolsDatasetsPanel />);
    expect(
      screen.getByRole('link', { name: 'Version accessible de la liste des données' }),
    ).toHaveAttribute('href', '/explorer-les-cartes/?vue=liste');
  });
});
