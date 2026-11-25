import type OlMap from 'ol/Map';

/** geopf position anchors, in reading order (top left first): the keyboard order of the widgets. */
export const POSITION_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

/**
 * geopf-extensions puts each widget in a `position-container-<anchor>` div of the map's overlay container,
 * created by the first widget that needs it (`GeoportalZoom` and `GeoportalFullScreen` create only their
 * own, geopf's PositionFactory the four), so their DOM order, hence the Tab order, follows the order the
 * controls are added in: with the zoom and the full screen bottom right (M16) the bottom-right buttons came
 * first. Creates the four containers (same id and classes as geopf, which reuses them) in reading order,
 * or puts the existing ones back in that order.
 */
export function ensurePositionContainers(map: OlMap): void {
  const parent = map.getOverlayContainerStopEvent();
  if (!parent) return;
  for (const anchor of POSITION_ANCHORS) {
    const id = `position-container-${anchor}`;
    const existing = Array.from(parent.children).find((child) => child.id === id);
    const container = existing ?? document.createElement('div');
    if (!existing) {
      container.id = id;
      container.className = `position ${id}`;
    }
    parent.append(container);
  }
}
