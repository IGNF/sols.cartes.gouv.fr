import { THUMBNAIL_LOAD_TIMEOUT_MS } from '../config/map';

function loaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/**
 * Drops the thumbnails of the catalogue widget (`root`) that fail to load, or are still not loaded after
 * `stallMs` (a stalled request), so the entry shows no image rather than a broken one or an empty slot (its
 * empty container is then hidden, MapView.css). geopf builds the `<img>` with `innerHTML`, after a delay:
 * new images are watched as they appear; `error` does not bubble, it is caught on the way down. The images
 * load even while the panel is closed, so the wait starts when they are inserted. Returns a function to stop.
 */
export function dropBrokenThumbnails(
  root: HTMLElement,
  stallMs: number = THUMBNAIL_LOAD_TIMEOUT_MS,
): () => void {
  const timers = new Map<HTMLImageElement, ReturnType<typeof setTimeout>>();
  const forget = (img: HTMLImageElement) => {
    clearTimeout(timers.get(img));
    timers.delete(img);
  };
  const drop = (img: HTMLImageElement) => {
    forget(img);
    img.remove();
  };
  const watch = (img: HTMLImageElement) => {
    if (timers.has(img) || loaded(img)) return;
    timers.set(
      img,
      setTimeout(() => {
        if (loaded(img)) forget(img);
        else drop(img);
      }, stallMs),
    );
  };
  const onError = (event: Event) => {
    if (event.target instanceof HTMLImageElement && root.contains(event.target)) drop(event.target);
  };
  const onLoad = (event: Event) => {
    if (event.target instanceof HTMLImageElement) forget(event.target);
  };
  const scan = () => root.querySelectorAll('img').forEach(watch);
  root.addEventListener('error', onError, true);
  root.addEventListener('load', onLoad, true);
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(root, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    root.removeEventListener('error', onError, true);
    root.removeEventListener('load', onLoad, true);
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  };
}
