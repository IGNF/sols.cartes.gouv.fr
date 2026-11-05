import type OlMap from 'ol/Map';

/**
 * Renders the map into one PNG (data URL), composing the canvas of every layer with its opacity and
 * transform, as the OpenLayers "export map" example does. Rejects when a canvas is tainted (a tile served
 * without CORS, e.g. some imported services) or the map has no size.
 */
export function exportMapImage(map: OlMap): Promise<string> {
  const viewport = map.getViewport();
  return new Promise((resolve, reject) => {
    if (!viewport) {
      reject(new Error('La carte n’est pas affichée.'));
      return;
    }
    map.once('rendercomplete', () => {
      try {
        const [width, height] = map.getSize() ?? [];
        if (!width || !height) throw new Error('La carte n’a pas de taille.');
        const target = document.createElement('canvas');
        target.width = width;
        target.height = height;
        const context = target.getContext('2d');
        if (!context) throw new Error('Le navigateur ne fournit pas de canvas 2D.');
        viewport
          .querySelectorAll<HTMLCanvasElement>('.ol-layer canvas, canvas.ol-layer')
          .forEach((canvas) => {
            if (canvas.width === 0) return;
            const parent = canvas.parentNode instanceof HTMLElement ? canvas.parentNode : null;
            const opacity = parent?.style.opacity || canvas.style.opacity;
            context.globalAlpha = opacity === '' ? 1 : Number(opacity);
            const matrix = /^matrix\(([^(]*)\)$/
              .exec(canvas.style.transform)?.[1]
              ?.split(',')
              .map(Number);
            if (matrix && matrix.length === 6) {
              const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = matrix;
              context.setTransform(a, b, c, d, e, f);
            } else {
              context.setTransform(1, 0, 0, 1, 0, 0);
            }
            const background = parent?.style.backgroundColor;
            if (background) {
              context.fillStyle = background;
              context.fillRect(0, 0, target.width, target.height);
            }
            context.drawImage(canvas, 0, 0);
          });
        context.globalAlpha = 1;
        context.setTransform(1, 0, 0, 1, 0, 0);
        resolve(target.toDataURL('image/png'));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    map.renderSync();
  });
}

/** Attributions of the visible layers, as plain text, without duplicates ("Sources" of a printed map). */
export function mapSources(map: OlMap): string[] {
  const sources = new Set<string>();
  for (const layer of map.getAllLayers()) {
    if (!layer.getVisible()) continue;
    const attributions = layer.getSource()?.getAttributions();
    // OpenLayers normalises attributions to a function of the frame state; ours ignore it.
    const value =
      typeof attributions === 'function' ? attributions(undefined as never) : attributions;
    const list = Array.isArray(value) ? value : value ? [value] : [];
    for (const html of list) {
      const text = String(html)
        .replace(/<[^>]+>/g, '')
        .trim();
      if (text) sources.add(text);
    }
  }
  return [...sources];
}

/** Triggers the download of a data URL under the given file name. */
export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

/** File-name-safe version of a title ("Carte des sols" → "carte-des-sols"). */
export function fileSlug(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'carte';
}
