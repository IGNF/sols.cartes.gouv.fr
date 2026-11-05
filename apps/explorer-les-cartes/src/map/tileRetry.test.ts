import BaseEvent from 'ol/events/Event';
import Observable from 'ol/Observable';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type TileSource from 'ol/source/Tile';
import attachTileRetry from './tileRetry';

class FakeSource extends Observable {
  emit(type: 'tileloaderror' | 'tileloadend', tile: { load: () => void }) {
    this.dispatchEvent(Object.assign(new BaseEvent(type), { tile }));
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
    const { source } = setup();
    const tile = { load: vi.fn() };
    source.emit('tileloaderror', tile);
    expect(tile.load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(tile.load).toHaveBeenCalledTimes(1);
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(5000);
    expect(tile.load).toHaveBeenCalledTimes(1);
  });

  it('redemande un rendu quand la tuile rechargée arrive', () => {
    const { source, changed } = setup();
    const tile = { load: vi.fn() };
    source.emit('tileloadend', tile);
    expect(changed).not.toHaveBeenCalled();
    source.emit('tileloaderror', tile);
    vi.advanceTimersByTime(500);
    source.emit('tileloadend', tile);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('annule les nouveaux essais en attente au nettoyage', () => {
    const { source, cleanup } = setup();
    const tile = { load: vi.fn() };
    source.emit('tileloaderror', tile);
    cleanup();
    vi.advanceTimersByTime(500);
    expect(tile.load).not.toHaveBeenCalled();
  });
});
