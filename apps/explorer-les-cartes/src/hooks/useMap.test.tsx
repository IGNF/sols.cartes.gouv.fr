import { render } from '@testing-library/react';
import { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTROL_LABELS, INITIAL_VIEW } from '../config/map';
import { initialMapState, useMapStore } from '../store/useMapStore';
import useMap, { initialView } from './useMap';

const created: Array<{
  options: Record<string, unknown>;
  setTarget: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}> = [];

vi.mock('ol/Map', () => ({
  default: class FakeMap {
    options: Record<string, unknown>;
    setTarget = vi.fn();
    dispose = vi.fn();
    constructor(options: Record<string, unknown>) {
      this.options = options;
      created.push(this);
    }
  },
}));

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  const map = useMap(ref);
  return <div ref={ref} data-testid="target" data-ready={map ? 'oui' : 'non'} />;
}

describe('useMap', () => {
  beforeEach(() => {
    created.length = 0;
    useMapStore.setState(initialMapState);
  });

  it('crée une seule carte sur l’élément cible et la publie dans le store', () => {
    const { getByTestId } = render(<Harness />);
    expect(created).toHaveLength(1);
    const instance = created[0];
    expect(instance?.options['target']).toBe(getByTestId('target'));
    expect(useMapStore.getState().map).toBe(instance);
    expect(getByTestId('target')).toHaveAttribute('data-ready', 'oui');
  });

  it('centre la vue initiale avec le zoom configuré', () => {
    render(<Harness />);
    const view = created[0]?.options['view'] as { getZoom: () => number };
    expect(view.getZoom()).toBe(INITIAL_VIEW.zoom);
  });

  it('part de la vue d’un permalien (c, z) quand il y en a un, sinon de la vue configurée', () => {
    expect(initialView('')).toEqual({
      centerLonLat: [...INITIAL_VIEW.centerLonLat],
      zoom: INITIAL_VIEW.zoom,
    });
    expect(initialView('?c=-61.5,16.2&z=10&l=x&permalink=yes')).toEqual({
      centerLonLat: [-61.5, 16.2],
      zoom: 10,
    });
    expect(initialView('?c=oui&z=non')).toMatchObject({ zoom: INITIAL_VIEW.zoom });
  });

  it('nomme le bouton de rotation', () => {
    render(<Harness />);
    const controls = created[0]?.options['controls'] as {
      getArray: () => Array<{ element: HTMLElement }>;
    };
    const buttons = controls
      .getArray()
      .flatMap((c) => Array.from(c.element.querySelectorAll('button')));
    expect(buttons.some((b) => b.getAttribute('aria-label') === CONTROL_LABELS.rotate)).toBe(true);
  });

  it('détache et libère la carte au démontage', () => {
    const { unmount } = render(<Harness />);
    const instance = created[0];
    unmount();
    expect(instance?.setTarget).toHaveBeenCalledWith(undefined);
    expect(instance?.dispose).toHaveBeenCalledTimes(1);
    expect(useMapStore.getState().map).toBeNull();
  });
});
