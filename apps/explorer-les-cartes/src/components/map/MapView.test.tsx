import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAP_LABEL } from '../../config/map';
import MapView from './MapView';

const state = vi.hoisted(() => ({
  capabilities: {} as Record<string, unknown>,
  catalogue: { layers: [] as unknown[], activeLayer: undefined as unknown },
  useBaseLayer: vi.fn(),
  useMapControls: vi.fn(),
  useLayerSwitcher: vi.fn(),
  useOverlays: vi.fn(),
}));

vi.mock('../../hooks/useMap', () => ({ default: () => null }));
vi.mock('../../hooks/useWmtsCapabilities', () => ({ default: () => state.capabilities }));
vi.mock('../../hooks/useBaseLayerCatalogue', () => ({ default: () => state.catalogue }));
vi.mock('../../hooks/useBaseLayer', () => ({ default: state.useBaseLayer }));
vi.mock('../../hooks/useMapControls', () => ({ default: state.useMapControls }));
vi.mock('../../hooks/useLayerSwitcher', () => ({ default: state.useLayerSwitcher }));
vi.mock('../../hooks/useOverlays', () => ({ default: state.useOverlays }));

const PLAN_IGN = {
  id: 'plan-ign',
  layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
  title: 'Plan IGN',
};

describe('MapView', () => {
  beforeEach(() => {
    state.capabilities = { data: undefined, isPending: true, isError: false, isSuccess: false };
    state.catalogue = { layers: [], activeLayer: undefined };
    vi.clearAllMocks();
  });

  it('expose une zone cartographique nommée et atteignable au clavier, avec ses outils', () => {
    render(<MapView />);
    const region = screen.getByRole('region', { name: MAP_LABEL });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(state.useMapControls).toHaveBeenCalled();
    expect(state.useLayerSwitcher).toHaveBeenCalled();
    expect(state.useOverlays).toHaveBeenCalled();
  });

  it('annonce le chargement du fond de carte', () => {
    render(<MapView />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du fond de carte');
    expect(screen.getByRole('region', { name: MAP_LABEL })).toHaveAttribute('aria-busy', 'true');
  });

  it('affiche le fond actif du catalogue', () => {
    const data = {};
    state.capabilities = { data, isPending: false, isError: false, isSuccess: true };
    state.catalogue = { layers: [PLAN_IGN], activeLayer: PLAN_IGN };
    render(<MapView />);
    expect(state.useBaseLayer).toHaveBeenCalledWith(null, data, PLAN_IGN.layerName);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('affiche une alerte quand les capacités ne sont pas disponibles', () => {
    state.capabilities = { data: undefined, isPending: false, isError: true, isSuccess: false };
    render(<MapView />);
    expect(screen.getByText(/n’ont pas pu être chargés/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('affiche une alerte quand aucun fond prévu n’est publié', () => {
    state.capabilities = { data: {}, isPending: false, isError: false, isSuccess: true };
    render(<MapView />);
    expect(screen.getByText(/Aucun fond de carte prévu/)).toBeInTheDocument();
  });
});
