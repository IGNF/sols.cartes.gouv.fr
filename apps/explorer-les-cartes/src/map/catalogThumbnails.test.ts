import { describe, expect, it } from 'vitest';
import { dropBrokenThumbnails } from './catalogThumbnails';

function entry(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = `<div class="catalog-thumbnail-container"><div class="catalog-thumbnail-default">
    <img src="https://data.geopf.fr/annexes/ressources/metadata/thumbnail/absente.jpg" alt="" /></div></div>`;
  return root;
}

describe('dropBrokenThumbnails', () => {
  it('retire une vignette qui ne se charge pas (pas d’image cassée)', () => {
    const root = entry();
    const stop = dropBrokenThumbnails(root);
    root.querySelector('img')?.dispatchEvent(new Event('error'));
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.catalog-thumbnail-container')).not.toBeNull();
    stop();
  });

  it('garde les vignettes chargées et cesse d’écouter une fois arrêté', () => {
    const root = entry();
    const stop = dropBrokenThumbnails(root);
    root.querySelector('img')?.dispatchEvent(new Event('load'));
    expect(root.querySelector('img')).not.toBeNull();
    stop();
    root.querySelector('img')?.dispatchEvent(new Event('error'));
    expect(root.querySelector('img')).not.toBeNull();
  });
});
