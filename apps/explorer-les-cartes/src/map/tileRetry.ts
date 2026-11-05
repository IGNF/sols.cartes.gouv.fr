import type { EventsKey } from 'ol/events';
import type Tile from 'ol/Tile';
import { unByKey } from 'ol/Observable';
import type { TileSourceEvent } from 'ol/source/Tile';
import type TileSource from 'ol/source/Tile';

/**
 * Retries a tile once, after `delayMs`, when it fails to load.
 * Works around intermittent GPF WMTS 400 answers on valid tiles (doc/agents/QUESTIONS.md M-2).
 * A tile that fails again stays in error: no loop. Returns a cleanup function.
 */
export default function attachTileRetry(
  source: Pick<TileSource, 'on' | 'changed'>,
  delayMs: number,
): () => void {
  const retried = new WeakSet<Tile>();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const errorKey: EventsKey = source.on('tileloaderror', (event: TileSourceEvent) => {
    const { tile } = event;
    if (retried.has(tile)) return;
    retried.add(tile);
    const timer = setTimeout(() => {
      timers.delete(timer);
      tile.load();
    }, delayMs);
    timers.add(timer);
  });

  const endKey: EventsKey = source.on('tileloadend', (event: TileSourceEvent) => {
    // A retried tile is loaded outside the map tile queue: ask for a new render.
    if (retried.has(event.tile)) source.changed();
  });

  return () => {
    unByKey([errorKey, endKey]);
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
