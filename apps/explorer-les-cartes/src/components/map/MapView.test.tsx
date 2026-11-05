import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAP_LABEL } from '../../config/map';
import MapView from './MapView';

const state = vi.hoisted(() => ({
  capabilities: { data: undefined, isPending: true, isError: false } as Record<string, unknown>,
  isMissing: false,
  useLayerSwitcher: vi.fn(),
}));

vi.mock('../../hooks/useMap', () => ({ default: () => null }));
vi.mock('../../hooks/useWmtsCapabilities', () => ({ default: () => state.capabilities }));
vi.mock('../../hooks/useBaseLayer', () => ({ default: () => ({ isMissing: state.isMissing }) }));
vi.mock('../../hooks/useLayerSwitcher', () => ({ default: state.useLayerSwitcher }));

describe('MapView', () => {
  beforeEach(() => {
    state.capabilities = { data: undefined, isPending: true, isError: false };
    state.isMissing = false;
  });

  it('expose une zone cartographique nommée et atteignable au clavier', () => {
    render(<MapView />);
    const region = screen.getByRole('region', { name: MAP_LABEL });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(state.useLayerSwitcher).toHaveBeenCalled();
  });

  it('annonce le chargement du fond de carte', () => {
    render(<MapView />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du fond de carte');
    expect(screen.getByRole('region', { name: MAP_LABEL })).toHaveAttribute('aria-busy', 'true');
  });

  it('affiche une alerte quand les capacités ne sont pas disponibles', () => {
    state.capabilities = { data: undefined, isPending: false, isError: true };
    render(<MapView />);
    expect(screen.getByText(/n’a pas pu être chargé/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('affiche une alerte quand le fond n’est plus publié', () => {
    state.capabilities = { data: {}, isPending: false, isError: false };
    state.isMissing = true;
    render(<MapView />);
    expect(screen.getByText(/n’est plus publié/)).toBeInTheDocument();
  });
});
