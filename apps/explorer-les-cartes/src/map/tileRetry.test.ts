import BaseEvent from 'ol/events/Event';
import Observable from 'ol/Observable';
import { get as getProjection } from 'ol/proj';
import { TileSourceEvent } from 'ol/source/Tile';
import XYZ from 'ol/source/XYZ';
import type TileSource from 'ol/source/Tile';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import attachTileRetry from './tileRetry';

interface FakeTile {
  load: () => void;
  getKey: () => string;
}

const fakeTile = (key = 'https://data.geopf.fr/wmts?tile=1'): FakeTile => ({
  load: vi.fn(),
  getKey: () => key,
});

class FakeSource extends Observable {
  emit(type: 'tileloaderror' | 'tileloadend', tile: FakeTile) {
    this.dispatchEvent(Object.assign(new BaseEvent(type), { tile }));
  }
}

function setup() {
  const source = new FakeSource();
  const changed = vi.spyOn(source, 'changed');
  const render = vi.fn();
  const cleanup = attachTileRetry(source as unknown as TileSource, 500, render);
  return { source, changed, render, cleanup };
}

describe('attachTileRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('recharge une tuile en erreur une seule fois, après le délai', () => {
    const { source } = setup();
    const tile = fakeTile();
    source.emit('tileloaderror', tile);
    expect(tile.load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(tile.load).toHaveBeenCalledTimes(1);
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(5000);
    expect(tile.load).toHaveBeenCalledTimes(1);
  });

  it('redemande un rendu de la carte quand la tuile rechargée arrive, sans toucher à la source', () => {
    const { source, changed, render } = setup();
    const tile = fakeTile();
    source.emit('tileloadend', tile);
    expect(render).not.toHaveBeenCalled();
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(500);
    source.emit('tileloadend', tile);
    expect(render).toHaveBeenCalledTimes(1);
    expect(changed).not.toHaveBeenCalled();
  });

  it('ne redemande pas de rendu aux chargements suivants de la même tuile (pas de boucle, M20)', () => {
    const { source, render } = setup();
    const tile = fakeTile();
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(500);
    source.emit('tileloadend', tile);
    // The same URL loaded again (new Tile object after a cache clear, or the same object): no new render.
    source.emit('tileloadend', fakeTile());
    source.emit('tileloadend', tile);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('abandonne une tuile dont le nouvel essai échoue aussi, sans rendu', () => {
    const { source, render } = setup();
    const tile = fakeTile();
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(500);
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(5000);
    expect(tile.load).toHaveBeenCalledTimes(1);
    source.emit('tileloadend', tile);
    expect(render).not.toHaveBeenCalled();
  });

  it('ne réessaie pas une nouvelle instance de la même tuile', () => {
    const { source } = setup();
    const first = fakeTile();
    const second = fakeTile();
    source.emit('tileloaderror', first);
    vi.advanceTimersByTime(500);
    source.emit('tileloaderror', second);
    vi.advanceTimersByTime(500);
    expect(first.load).toHaveBeenCalledTimes(1);
    expect(second.load).not.toHaveBeenCalled();
  });

  it('annule les nouveaux essais en attente au nettoyage', () => {
    const { source, cleanup } = setup();
    const tile = fakeTile();
    source.emit('tileloaderror', tile);
    cleanup();
    vi.advanceTimersByTime(500);
    expect(tile.load).not.toHaveBeenCalled();
  });

  it('garde la révision d’une vraie source OpenLayers (le rendu de tuiles ne vide pas son cache, M20)', () => {
    const source = new XYZ({ url: 'https://data.geopf.fr/tile/{z}/{x}/{y}.png' });
    const projection = getProjection('EPSG:3857');
    if (!projection) throw new Error('EPSG:3857 manquante');
    const tile = source.getTile(11, 1036, 705, 1, projection);
    if (!tile) throw new Error('tuile non créée');
    const load = vi.spyOn(tile, 'load').mockImplementation(() => undefined);
    const render = vi.fn();
    const revision = source.getRevision();
    attachTileRetry(source, 500, render);
    source.dispatchEvent(new TileSourceEvent('tileloaderror', tile));
    vi.advanceTimersByTime(500);
    expect(load).toHaveBeenCalledTimes(1);
    source.dispatchEvent(new TileSourceEvent('tileloadend', tile));
    expect(render).toHaveBeenCalledTimes(1);
    expect(source.getRevision()).toBe(revision);
  });
});
