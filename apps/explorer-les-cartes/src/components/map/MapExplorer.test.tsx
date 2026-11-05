import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SIDE_PANEL_ID } from '../../config/map';
import { LIST_VIEW_PATH } from '../../config/urls';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import MapExplorer from './MapExplorer';

vi.mock('./MapView', () => ({ default: () => <div data-testid="map-view" /> }));
vi.mock('./DeepLinkNotice', () => ({ default: () => null }));
// The dialogs need the map and the GPF capabilities (TanStack Query): tested on their own.
vi.mock('./ShareModal', () => ({
  default: () => <div data-testid="share-modal" />,
  ShareButton: () => <button type="button">Partager</button>,
}));
vi.mock('./PrintModal', () => ({
  default: () => <div data-testid="print-modal" />,
  PrintButton: () => <button type="button">Imprimer</button>,
}));
vi.mock('./BaseLayerPanel', () => ({ default: () => <p>Contenu fonds de carte</p> }));

describe('MapExplorer', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('affiche le panneau des fonds de carte à côté de la carte, sans onglets (les données viennent du catalogue)', () => {
    render(<MapExplorer />);
    const button = screen.getByRole('button', { name: 'Masquer le panneau' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', SIDE_PANEL_ID);
    expect(document.getElementById(SIDE_PANEL_ID)).toBeVisible();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.getByText('Contenu fonds de carte')).toBeInTheDocument();
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('masque et réaffiche le panneau au clavier', async () => {
    const user = userEvent.setup();
    render(<MapExplorer />);
    screen.getByRole('button', { name: 'Masquer le panneau' }).focus();
    await user.keyboard('{Enter}');
    const button = screen.getByRole('button', { name: 'Afficher le panneau' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(SIDE_PANEL_ID)).not.toBeVisible();
    await user.keyboard(' ');
    expect(useMapStore.getState().isPanelOpen).toBe(true);
    expect(screen.getByText('Contenu fonds de carte')).toBeVisible();
  });

  it('signale une couche de la carte qui ne renvoie pas d’image, quel que soit son mode d’ajout', () => {
    useMapStore.setState({
      overlays: [
        {
          key: 'wms-vector:rrp',
          service: 'wms-vector',
          name: 'rrp',
          title: 'RRP du Loiret',
          endpoint: 'https://data.geopf.fr/wms-v/ows',
        },
      ],
      unavailableOverlays: ['wms-vector:rrp'],
    });
    render(<MapExplorer />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Couche indisponible');
    expect(alert).toHaveTextContent('« RRP du Loiret »');
  });

  it('propose la version accessible de la liste des données dans la barre d’outils', () => {
    render(<MapExplorer />);
    expect(
      screen.getByRole('link', { name: 'Version accessible de la liste des données' }),
    ).toHaveAttribute('href', LIST_VIEW_PATH);
  });

  it('place les boutons « Partager » et « Imprimer » dans la barre d’outils, avec leurs dialogues', () => {
    render(<MapExplorer />);
    const toolbar = screen.getByRole('button', { name: 'Masquer le panneau' }).parentElement;
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Partager' }));
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Imprimer' }));
    expect(screen.getByTestId('share-modal')).toBeInTheDocument();
    expect(screen.getByTestId('print-modal')).toBeInTheDocument();
  });
});
