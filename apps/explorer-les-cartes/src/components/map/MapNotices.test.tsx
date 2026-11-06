import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LIST_VIEW_PATH } from '../../config/urls';
import type { OverlayRef } from '../../map/overlays';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import MapNotices from './MapNotices';

const overlay = (key: string, title: string): OverlayRef => ({
  key,
  service: 'wms-vector',
  name: key.split(':')[1] ?? key,
  title,
  endpoint: 'https://data.geopf.fr/wms-v/ows',
});

describe('MapNotices', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('n’affiche rien quand toutes les couches répondent et que le catalogue est chargé', () => {
    useMapStore.setState({ overlays: [overlay('wms-vector:a', 'Couche A')] });
    const { container } = render(<MapNotices />);
    expect(container).toBeEmptyDOMElement();
  });

  it('signale chaque couche de la carte qui ne renvoie pas d’image, quel que soit son mode d’ajout', () => {
    useMapStore.setState({
      overlays: [overlay('wms-vector:rrp', 'RRP du Loiret'), overlay('wms-vector:a', 'Couche A')],
      unavailableOverlays: ['wms-vector:rrp', 'wms-vector:retiree'],
    });
    render(<MapNotices />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent('Couche indisponible');
    expect(alerts[0]).toHaveTextContent('« RRP du Loiret »');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Couche indisponible' }),
    ).toBeInTheDocument();
  });

  it('disparaît quand la couche est retirée de la carte', () => {
    useMapStore.setState({
      overlays: [overlay('wms-vector:rrp', 'RRP du Loiret')],
      unavailableOverlays: ['wms-vector:rrp'],
    });
    const { container } = render(<MapNotices />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    act(() => useMapStore.getState().removeOverlay('wms-vector:rrp'));
    expect(container).toBeEmptyDOMElement();
  });

  it('peut être masqué, et revient si la couche est retirée puis remise', async () => {
    const user = userEvent.setup();
    const rrp = overlay('wms-vector:rrp', 'RRP du Loiret');
    useMapStore.setState({ overlays: [rrp], unavailableOverlays: ['wms-vector:rrp'] });
    const { container } = render(<MapNotices />);
    await user.click(screen.getByRole('button', { name: /Masquer le message/ }));
    expect(container).toBeEmptyDOMElement();
    act(() => useMapStore.getState().removeOverlay('wms-vector:rrp'));
    // Added again: the store gets a new overlay object (toOverlayRef), as from the catalogue or a link.
    act(() => useMapStore.getState().addOverlay(overlay('wms-vector:rrp', 'RRP du Loiret')));
    act(() => useMapStore.getState().markOverlayUnavailable('wms-vector:rrp'));
    expect(screen.getByRole('alert')).toHaveTextContent('Couche indisponible');
  });

  it('renvoie vers la version accessible de la liste quand le catalogue n’a pas pu être chargé', () => {
    useMapStore.setState({ catalogueUnavailable: true });
    render(<MapNotices />);
    expect(screen.getByRole('alert')).toHaveTextContent('Catalogue indisponible');
    expect(
      screen.getByRole('link', { name: 'Version accessible de la liste des données' }),
    ).toHaveAttribute('href', LIST_VIEW_PATH);
  });
});
