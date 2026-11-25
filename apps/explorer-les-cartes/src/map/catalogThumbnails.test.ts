import { afterEach, describe, expect, it, vi } from 'vitest';
import { THUMBNAIL_LOAD_TIMEOUT_MS } from '../config/map';
import { dropBrokenThumbnails } from './catalogThumbnails';

const IMG =
  '<img src="https://data.geopf.fr/annexes/ressources/metadata/thumbnail/vignette.jpg" alt="" />';

function entry(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = `<div class="catalog-thumbnail-container"><div class="catalog-thumbnail-default">${IMG}</div></div>`;
  return root;
}

/** jsdom never loads images: mark one as loaded like a browser would. */
function markLoaded(img: HTMLImageElement | null): void {
  if (!img) return;
  Object.defineProperty(img, 'complete', { value: true });
  Object.defineProperty(img, 'naturalWidth', { value: 44 });
  img.dispatchEvent(new Event('load'));
}

describe('dropBrokenThumbnails', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retire une vignette qui ne se charge pas (pas d’image cassée)', () => {
    const root = entry();
    const stop = dropBrokenThumbnails(root);
    root.querySelector('img')?.dispatchEvent(new Event('error'));
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.catalog-thumbnail-container')).not.toBeNull();
    stop();
  });

  it('retire une vignette toujours en attente après le délai (requête bloquée, pas de case vide)', () => {
    vi.useFakeTimers();
    const root = entry();
    const stop = dropBrokenThumbnails(root);
    vi.advanceTimersByTime(THUMBNAIL_LOAD_TIMEOUT_MS - 1);
    expect(root.querySelector('img')).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(root.querySelector('img')).toBeNull();
    stop();
  });

  it('surveille aussi les vignettes ajoutées plus tard par geopf', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    const stop = dropBrokenThumbnails(root, 1000);
    root.innerHTML = `<div class="catalog-thumbnail-container">${IMG}</div>`;
    await Promise.resolve(); // MutationObserver callback
    vi.advanceTimersByTime(1000);
    expect(root.querySelector('img')).toBeNull();
    stop();
  });

  it('garde les vignettes chargées, et cesse d’écouter une fois arrêté', () => {
    vi.useFakeTimers();
    const root = entry();
    const stop = dropBrokenThumbnails(root);
    markLoaded(root.querySelector('img'));
    vi.advanceTimersByTime(THUMBNAIL_LOAD_TIMEOUT_MS);
    expect(root.querySelector('img')).not.toBeNull();
    stop();
    root.querySelector('img')?.dispatchEvent(new Event('error'));
    expect(root.querySelector('img')).not.toBeNull();
  });

  it('n’agit plus après l’arrêt sur une vignette en attente', () => {
    vi.useFakeTimers();
    const root = entry();
    const stop = dropBrokenThumbnails(root);
    stop();
    vi.advanceTimersByTime(THUMBNAIL_LOAD_TIMEOUT_MS);
    expect(root.querySelector('img')).not.toBeNull();
  });
});
