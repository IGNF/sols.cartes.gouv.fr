import type { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import type TileSource from 'ol/source/Tile';

/**
 * Calls `onUnavailable` once when `threshold` tiles failed before any tile loaded: the service
 * answers with errors for this layer (e.g. a GeoServer exception returned instead of an image).
 * When a tile loads after that report (intermittent GPF errors at startup, doc/agents/QUESTIONS.md M-2),
 * `onAvailable` withdraws it. Returns a cleanup function.
 */
export default function watchTileHealth(
  source: Pick<TileSource, 'on'>,
  threshold: number,
  onUnavailable: () => void,
  onAvailable: () => void = () => undefined,
): () => void {
  let loaded = 0;
  let failed = 0;
  let reported = false;
  const keys: EventsKey[] = [
    source.on('tileloadend', () => {
      loaded += 1;
      if (reported) {
        reported = false;
        onAvailable();
      }
    }),
    source.on('tileloaderror', () => {
      failed += 1;
      if (!reported && loaded === 0 && failed >= threshold) {
        reported = true;
        onUnavailable();
      }
    }),
  ];
  return () => unByKey(keys);
}
