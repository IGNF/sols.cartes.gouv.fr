import BaseEvent from 'ol/events/Event';
import Observable from 'ol/Observable';
import Tile from 'ol/Tile';
import TileQueue from 'ol/TileQueue';
import TileState from 'ol/TileState';
import { get as getProjection } from 'ol/proj';
import { TileSourceEvent } from 'ol/source/Tile';
import XYZ from 'ol/source/XYZ';
import type TileSource from 'ol/source/Tile';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import attachTileRetry from './tileRetry';

interface FakeTile {
  load: () => void;
  getKey: () => string;
  getState: () => number;
}

const fakeTile = (
  key = 'https://data.geopf.fr/wmts?SERVICE=WMTS&/11,1037,704',
  state: number = TileState.ERROR,
): FakeTile => ({
  load: vi.fn(),
  getKey: () => key,
  getState: () => state,
});

class FakeSource extends Observable {
  emit(type: 'tileloaderror' | 'tileloadend', tile: FakeTile) {
    this.dispatchEvent(Object.assign(new BaseEvent(type), { tile }));
  }
}

/** A tile whose load succeeds on the next call (the GPF answering the retry). */
class RecoveringTile extends Tile {
  load() {
    this.setState(TileState.LOADING);
    this.setState(TileState.LOADED);
  }

  fail() {
    this.setState(TileState.LOADING);
    this.setState(TileState.ERROR);
  }
}

function setup() {
  const source = new FakeSource();
  const changed = vi.spyOn(source, 'changed');
  const cleanup = attachTileRetry(source as unknown as TileSource, 500);
  return { source, changed, cleanup };
}

describe('attachTileRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('recharge une tuile en erreur une seule fois, après le délai', () => {
    const { source, changed } = setup();
    const tile = fakeTile();
    source.emit('tileloaderror', tile);
    expect(tile.load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(tile.load).toHaveBeenCalledTimes(1);
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(5000);
    expect(tile.load).toHaveBeenCalledTimes(1);
    source.emit('tileloadend', tile);
    expect(changed).not.toHaveBeenCalled();
  });

  it('ne recharge pas une tuile libérée avant la fin du délai (état EMPTY)', () => {
    const { source } = setup();
    let state: number = TileState.ERROR;
    const tile = { ...fakeTile(), getState: () => state };
    source.emit('tileloaderror', tile);
    state = TileState.EMPTY;
    vi.advanceTimersByTime(500);
    expect(tile.load).not.toHaveBeenCalled();
  });

  it('ne réessaie pas une nouvelle instance de la même tuile (même clé : source et coordonnées)', () => {
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

  it('laisse la file de tuiles d’OpenLayers redessiner la carte quand la tuile réessayée arrive', () => {
    const render = vi.fn();
    const queue = new TileQueue(() => 1, render);
    const tile = new RecoveringTile([11, 1037, 704], TileState.IDLE);
    queue.enqueue([tile, 'gpf', [0, 0], 1]);
    tile.fail();
    expect(render).toHaveBeenCalledTimes(1);
    const source = new FakeSource();
    attachTileRetry(source as unknown as TileSource, 500);
    source.dispatchEvent(Object.assign(new BaseEvent('tileloaderror'), { tile }));
    vi.advanceTimersByTime(500);
    expect(tile.getState()).toBe(TileState.LOADED);
    // ol/TileQueue keeps its change listener on ERROR tiles: the map is asked for a render.
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('garde la révision d’une vraie source OpenLayers (le rendu de tuiles ne vide pas son cache, M20)', () => {
    const source = new XYZ({ url: 'https://data.geopf.fr/tile/{z}/{x}/{y}.png' });
    const projection = getProjection('EPSG:3857');
    if (!projection) throw new Error('EPSG:3857 manquante');
    const tile = source.getTile(11, 1036, 705, 1, projection);
    if (!tile) throw new Error('tuile non créée');
    vi.spyOn(tile, 'getState').mockReturnValue(TileState.ERROR);
    const load = vi.spyOn(tile, 'load').mockImplementation(() => undefined);
    const revision = source.getRevision();
    attachTileRetry(source, 500);
    source.dispatchEvent(new TileSourceEvent('tileloaderror', tile));
    vi.advanceTimersByTime(500);
    expect(load).toHaveBeenCalledTimes(1);
    source.dispatchEvent(new TileSourceEvent('tileloadend', tile));
    expect(source.getRevision()).toBe(revision);
  });
});
