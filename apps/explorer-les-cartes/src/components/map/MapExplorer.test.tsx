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
vi.mock('./SolsDatasetsPanel', () => ({ default: () => <p>Contenu données sols</p> }));

describe('MapExplorer', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('affiche le panneau latéral à côté de la carte, onglet des fonds sélectionné', () => {
    render(<MapExplorer />);
    const button = screen.getByRole('button', { name: 'Masquer le panneau' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', SIDE_PANEL_ID);
    expect(document.getElementById(SIDE_PANEL_ID)).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Fonds de carte' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Contenu fonds de carte')).toBeInTheDocument();
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('passe à l’onglet « Données sols »', async () => {
    const user = userEvent.setup();
    render(<MapExplorer />);
    await user.click(screen.getByRole('tab', { name: 'Données sols' }));
    expect(useMapStore.getState().activeTab).toBe('sols');
    expect(screen.getByRole('tab', { name: 'Données sols' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Contenu données sols')).toBeInTheDocument();
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
