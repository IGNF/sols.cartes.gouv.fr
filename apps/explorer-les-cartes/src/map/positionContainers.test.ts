import type OlMap from 'ol/Map';
import { describe, expect, it } from 'vitest';
import { ensurePositionContainers } from './positionContainers';

const mapWith = (parent: HTMLElement) =>
  ({ getOverlayContainerStopEvent: () => parent }) as unknown as OlMap;
const ids = (parent: HTMLElement) => Array.from(parent.children).map((child) => child.id);

describe('ensurePositionContainers', () => {
  it('crée les quatre conteneurs geopf dans l’ordre de lecture (ordre du clavier)', () => {
    const parent = document.createElement('div');
    ensurePositionContainers(mapWith(parent));
    expect(ids(parent)).toEqual([
      'position-container-top-left',
      'position-container-top-right',
      'position-container-bottom-left',
      'position-container-bottom-right',
    ]);
    expect(parent.firstElementChild).toHaveClass('position', 'position-container-top-left');
  });

  it('remet dans cet ordre des conteneurs déjà créés, sans les recréer ni perdre leurs widgets', () => {
    const parent = document.createElement('div');
    parent.innerHTML = `<div id="position-container-bottom-right" class="position position-container-bottom-right">
      <div id="GPzoom-1"></div></div>`;
    const bottomRight = parent.firstElementChild;
    ensurePositionContainers(mapWith(parent));
    expect(ids(parent).at(-1)).toBe('position-container-bottom-right');
    expect(parent.lastElementChild).toBe(bottomRight);
    expect(parent.querySelector('#GPzoom-1')).not.toBeNull();
    expect(ids(parent)).toHaveLength(4);
  });
});
