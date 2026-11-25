import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type OlMap from 'ol/Map';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useInitialMapFocus, { shouldFocusMapOnLoad } from './useInitialMapFocus';

/** Stands for the OpenLayers map: the hook only waits for it to exist. */
const MAP = {} as OlMap;

interface HarnessProps {
  map: OlMap | null;
}

function Harness({ map }: HarnessProps) {
  const ref = useRef<HTMLDivElement>(null);
  useInitialMapFocus(ref, map);
  return (
    <>
      <a href="#contenu">Contenu</a>
      <div id="ailleurs">Ailleurs</div>
      <main id="contenu">
        <div ref={ref} role="region" aria-label="Carte" tabIndex={0} />
      </main>
    </>
  );
}

describe('useInitialMapFocus', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('donne le focus à la carte une fois créée, sans faire défiler la page', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const { rerender } = render(<Harness map={null} />);
    expect(document.body).toHaveFocus();
    rerender(<Harness map={MAP} />);
    expect(screen.getByRole('region', { name: 'Carte' })).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    focus.mockRestore();
  });

  it('transmet les touches à la carte focalisée (flèches et zoom d’OpenLayers)', async () => {
    const keys: string[] = [];
    render(<Harness map={MAP} />);
    // OpenLayers listens to `keydown` on its target (the map's `keyboardEventTarget` default).
    screen
      .getByRole('region', { name: 'Carte' })
      .addEventListener('keydown', (event) => keys.push(event.key));
    await userEvent.keyboard('{ArrowRight}{ArrowUp}+-');
    expect(keys).toEqual(['ArrowRight', 'ArrowUp', '+', '-']);
  });

  it('ne prend pas le focus d’un élément que l’utilisateur a déjà atteint', () => {
    const { rerender } = render(<Harness map={null} />);
    const link = screen.getByRole('link', { name: 'Contenu' });
    link.focus();
    rerender(<Harness map={MAP} />);
    expect(link).toHaveFocus();
  });

  it('ne reprend pas le focus aux rendus suivants ni à la recréation de la carte', () => {
    const { rerender } = render(<Harness map={MAP} />);
    const link = screen.getByRole('link', { name: 'Contenu' });
    link.focus();
    rerender(<Harness map={MAP} />);
    rerender(<Harness map={{} as OlMap} />);
    expect(link).toHaveFocus();
  });

  it('laisse le fragment d’URL viser un autre élément que la carte', () => {
    window.history.replaceState(null, '', '/#ailleurs');
    render(<Harness map={MAP} />);
    expect(document.body).toHaveFocus();
  });

  it('focalise la carte quand le fragment vise le contenu qui la contient', () => {
    window.history.replaceState(null, '', '/#contenu');
    render(<Harness map={MAP} />);
    expect(screen.getByRole('region', { name: 'Carte' })).toHaveFocus();
  });
});

describe('shouldFocusMapOnLoad', () => {
  function setup() {
    document.body.innerHTML = '<div id="autre"></div><div id="hote"><div id="carte"></div></div>';
    return document.getElementById('carte') as HTMLElement;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('accepte une URL sans fragment ou dont le fragment ne vise aucun élément', () => {
    const target = setup();
    expect(shouldFocusMapOnLoad(document, '', target)).toBe(true);
    expect(shouldFocusMapOnLoad(document, '#', target)).toBe(true);
    expect(shouldFocusMapOnLoad(document, '#inconnu', target)).toBe(true);
    expect(shouldFocusMapOnLoad(document, '#%E0%A4%A', target)).toBe(true);
  });

  it('accepte un fragment qui vise la carte ou un de ses ancêtres, refuse les autres', () => {
    const target = setup();
    expect(shouldFocusMapOnLoad(document, '#carte', target)).toBe(true);
    expect(shouldFocusMapOnLoad(document, '#hote', target)).toBe(true);
    expect(shouldFocusMapOnLoad(document, '#autre', target)).toBe(false);
  });
});
