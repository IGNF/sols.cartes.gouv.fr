import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE_LAYER_PANEL_ID } from '../../config/map';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import MapExplorer from './MapExplorer';

vi.mock('./MapView', () => ({ default: () => <div data-testid="map-view" /> }));
vi.mock('./BaseLayerPanel', () => ({ default: () => <section aria-label="Fonds de carte" /> }));

describe('MapExplorer', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('affiche le panneau des fonds à côté de la carte', () => {
    render(<MapExplorer />);
    const button = screen.getByRole('button', { name: 'Masquer les fonds de carte' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', BASE_LAYER_PANEL_ID);
    expect(document.getElementById(BASE_LAYER_PANEL_ID)).toBeVisible();
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('masque et réaffiche le panneau au clavier', async () => {
    const user = userEvent.setup();
    render(<MapExplorer />);
    screen.getByRole('button', { name: 'Masquer les fonds de carte' }).focus();
    await user.keyboard('{Enter}');
    const button = screen.getByRole('button', { name: 'Afficher les fonds de carte' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(BASE_LAYER_PANEL_ID)).not.toBeVisible();
    expect(useMapStore.getState().isPanelOpen).toBe(false);
    await user.keyboard(' ');
    expect(useMapStore.getState().isPanelOpen).toBe(true);
  });
});
