import type OlMap from 'ol/Map';
import { useEffect, useRef, type RefObject } from 'react';

/**
 * Whether the map may take the focus on load: only while nobody has it (the body), so a skip link, a
 * header link or a field the user reached before the map was ready keeps it, and only when the URL fragment
 * does not point elsewhere (an element outside the map: its target wins; `#contenu` contains the map).
 */
export function shouldFocusMapOnLoad(doc: Document, hash: string, target: HTMLElement): boolean {
  const active = doc.activeElement;
  if (active && active !== doc.body) return false;
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!id) return true;
  let fragmentTarget: HTMLElement | null;
  try {
    fragmentTarget = doc.getElementById(decodeURIComponent(id));
  } catch {
    // Malformed percent-encoding: no element can match it.
    fragmentTarget = null;
  }
  return !fragmentTarget || fragmentTarget.contains(target);
}

/**
 * M24 (owner's request): on landing, the keyboard focus goes to the map target, the element OpenLayers
 * listens to for the keyboard (KeyboardPan, KeyboardZoom: arrows, + and -), once the map is created.
 * Once per mount (not again on re-renders or when the map is recreated), without scrolling, and never
 * taken from an element the user already focused (shouldFocusMapOnLoad).
 */
export default function useInitialMapFocus(
  targetRef: RefObject<HTMLElement | null>,
  map: OlMap | null,
): void {
  const done = useRef(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!map || !target || done.current) return;
    done.current = true;
    if (shouldFocusMapOnLoad(document, window.location.hash, target)) {
      target.focus({ preventScroll: true });
    }
  }, [map, targetRef]);
}
