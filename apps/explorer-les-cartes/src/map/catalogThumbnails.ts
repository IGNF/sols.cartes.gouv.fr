/**
 * Drops the thumbnails of the catalogue widget (`root`) that fail to load, so the entry shows no image
 * rather than a broken one (its empty container is then hidden, MapView.css). geopf builds the `<img>`
 * with `innerHTML`: `error` does not bubble, it is caught on the way down. Returns a function to stop.
 */
export function dropBrokenThumbnails(root: HTMLElement): () => void {
  const onError = (event: Event) => {
    if (event.target instanceof HTMLImageElement && root.contains(event.target))
      event.target.remove();
  };
  root.addEventListener('error', onError, true);
  return () => root.removeEventListener('error', onError, true);
}
