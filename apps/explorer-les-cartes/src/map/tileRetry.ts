import type { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import TileState from 'ol/TileState';
import type { TileSourceEvent } from 'ol/source/Tile';
import type TileSource from 'ol/source/Tile';

/**
 * Retries a tile once, after `delayMs`, when it fails to load.
 * Works around intermittent GPF answers on valid tiles (400, 502, 503; doc/agents/QUESTIONS.md M-2).
 * Retries are counted per tile key (`Tile.getKey()`: the source key and the tile coordinates): OpenLayers may
 * create a new Tile object for the same coordinates, so a tile that fails again stays in error and is never
 * retried twice. A tile released in the meantime (LRU expiry, layer removed: state EMPTY) is not reloaded.
 *
 * Nothing else is needed for the retried tile to be drawn: the map tile queue keeps listening to tiles in
 * ERROR (`ol/TileQueue#handleTileChange`) and asks the map for a render when one reaches LOADED. Never
 * `source.changed()`: since OpenLayers 10 the canvas tile renderer clears its whole tile cache when the
 * source revision changes; the tiles were then created again (served from the browser cache), the retried one
 * loaded again, called `changed()` again... an endless loop that kept the layer blank until the zoom changed
 * (M20, doc/agents/geopf-ext.md §15). Returns a cleanup function.
 */
export default function attachTileRetry(
  source: Pick<TileSource, 'on'>,
  delayMs: number,
): () => void {
  const retried = new Set<string>();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const errorKey: EventsKey = source.on('tileloaderror', (event: TileSourceEvent) => {
    const { tile } = event;
    const key = tile.getKey();
    if (retried.has(key)) return;
    retried.add(key);
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (tile.getState() === TileState.ERROR) tile.load();
    }, delayMs);
    timers.add(timer);
  });

  return () => {
    unByKey(errorKey);
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
