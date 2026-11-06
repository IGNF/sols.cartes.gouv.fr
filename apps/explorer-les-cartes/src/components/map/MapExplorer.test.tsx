import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import MapExplorer from './MapExplorer';

vi.mock('./MapView', () => ({ default: () => <div data-testid="map-view" /> }));
vi.mock('./DeepLinkNotice', () => ({ default: () => null }));
// The print dialog needs the map (canvas): tested on its own.
vi.mock('./PrintModal', () => ({ default: () => <div data-testid="print-modal" /> }));

describe('MapExplorer', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('affiche la carte seule, sans barre d’outils ni panneau latéral (v1.1)', () => {
    render(<MapExplorer />);
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
    expect(screen.getByTestId('print-modal')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
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
});
