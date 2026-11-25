import BaseEvent from 'ol/events/Event';
import Observable from 'ol/Observable';
import type TileSource from 'ol/source/Tile';
import { describe, expect, it, vi } from 'vitest';
import watchTileHealth from './tileHealth';

function setup() {
  const source = new Observable();
  const onUnavailable = vi.fn();
  const stop = watchTileHealth(source as unknown as TileSource, 3, onUnavailable);
  const emit = (type: string) => source.dispatchEvent(new BaseEvent(type));
  return { onUnavailable, stop, emit };
}

describe('watchTileHealth', () => {
  it('signale une seule fois une couche dont aucune tuile ne se charge', () => {
    const { onUnavailable, emit } = setup();
    emit('tileloaderror');
    emit('tileloaderror');
    expect(onUnavailable).not.toHaveBeenCalled();
    emit('tileloaderror');
    emit('tileloaderror');
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('ne signale rien dès qu’une tuile s’est chargée', () => {
    const { onUnavailable, emit } = setup();
    emit('tileloadend');
    for (let i = 0; i < 5; i++) emit('tileloaderror');
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('cesse d’écouter au nettoyage', () => {
    const { onUnavailable, emit, stop } = setup();
    stop();
    for (let i = 0; i < 5; i++) emit('tileloaderror');
    expect(onUnavailable).not.toHaveBeenCalled();
  });
});
