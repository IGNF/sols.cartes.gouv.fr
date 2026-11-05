import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SIDE_PANEL_ID } from '../../config/map';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import MapExplorer from './MapExplorer';

vi.mock('./MapView', () => ({ default: () => <div data-testid="map-view" /> }));
vi.mock('./DeepLinkNotice', () => ({ default: () => null }));
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
});
