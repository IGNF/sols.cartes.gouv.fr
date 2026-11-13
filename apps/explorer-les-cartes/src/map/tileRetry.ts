import type { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import type Tile from 'ol/Tile';
import type { TileSourceEvent } from 'ol/source/Tile';
import type TileSource from 'ol/source/Tile';

/**
 * Retries a tile once, after `delayMs`, when it fails to load.
 * Works around intermittent GPF answers on valid tiles (400, 502, 503; doc/agents/QUESTIONS.md M-2).
 * Retries are counted per tile key (its URL): OpenLayers may create a new Tile object for the same
 * coordinates, so a tile that fails again stays in error and is never retried twice.
 *
 * The retried tile is loaded outside the map tile queue, so nothing redraws the map when it arrives:
 * `requestRender` (the map's `render`) is called once, when that load ends. Never `source.changed()`:
 * since OpenLayers 10 the canvas tile renderer clears its whole tile cache when the source revision
 * changes; the tiles were then created again (same URL, served from the browser cache), the retried one
 * loaded again, called `changed()` again... an endless loop that kept the layer blank until the zoom
 * changed (M20, doc/agents/geopf-ext.md §14). Returns a cleanup function.
 */
export default function attachTileRetry(
  source: Pick<TileSource, 'on'>,
  delayMs: number,
  requestRender: () => void,
): () => void {
  const retried = new Set<string>();
  /** Tile objects reloaded by this helper whose load has not ended yet. */
  const reloading = new Set<Tile>();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const errorKey: EventsKey = source.on('tileloaderror', (event: TileSourceEvent) => {
    const { tile } = event;
    if (reloading.delete(tile)) return;
    const key = tile.getKey();
    if (retried.has(key)) return;
    retried.add(key);
    const timer = setTimeout(() => {
      timers.delete(timer);
      reloading.add(tile);
      tile.load();
    }, delayMs);
    timers.add(timer);
  });

  const endKey: EventsKey = source.on('tileloadend', (event: TileSourceEvent) => {
    if (reloading.delete(event.tile)) requestRender();
  });

  return () => {
    unByKey([errorKey, endKey]);
    timers.forEach(clearTimeout);
    timers.clear();
    reloading.clear();
  };
}
