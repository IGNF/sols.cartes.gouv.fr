import { screen } from '@testing-library/react';
import Rotate from 'ol/control/Rotate';
import Zoom from 'ol/control/Zoom';
import { afterEach, describe, expect, it } from 'vitest';
import { CONTROL_LABELS } from '../config/map';
import {
  controlElement,
  fixLayerMoveArrows,
  labelControlButtons,
  labelPanelTitle,
  watchLayerMoveArrows,
} from './labelControls';

describe('labelControls', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('nomme tous les boutons d’un contrôle (zoom) et celui de la rotation au lieu de leur glyphe', () => {
    const zoom = new Zoom({ zoomInTipLabel: '+', zoomOutTipLabel: '-' });
    const rotate = new Rotate({ autoHide: false });
    labelControlButtons(zoom, 'Zoom');
    labelControlButtons(rotate, CONTROL_LABELS.rotate);
    document.body.append(controlElement(zoom), controlElement(rotate));
    expect(screen.getAllByRole('button', { name: 'Zoom' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Réinitialiser l’orientation' })).toBe(
      controlElement(rotate).querySelector('button'),
    );
  });

  it('remplace le titre visible d’un panneau geopf, sans toucher à ses boutons', () => {
    const root = document.createElement('div');
    root.innerHTML = `<button type="button" aria-label="Afficher tous les outils"></button>
      <dialog><div class="gpf-panel__header"><span class="gpf-panel__title">Mes outils</span>
      <button type="button">Fermer le panneau</button></div></dialog>`;
    labelPanelTitle(root, CONTROL_LABELS.controlListTitle);
    expect(root.querySelector('.gpf-panel__title')).toHaveTextContent(/^Tous les outils$/);
    expect(root.querySelector('dialog button')).toHaveTextContent('Fermer le panneau');
    const empty = document.createElement('div');
    expect(() => labelPanelTitle(empty, 'Titre')).not.toThrow();
  });

  it('donne le rôle bouton aux flèches de déplacement des couches, y compris celles ajoutées ensuite', async () => {
    const arrows = (direction: string) =>
      `<div class="keyboard-navigation"><span tabindex="0" data-direction="${direction}" aria-label="Déplacer la couche vers le ${direction === 'up' ? 'haut' : 'bas'}"></span></div>`;
    const root = document.createElement('div');
    root.innerHTML = arrows('up');
    document.body.append(root);
    expect(fixLayerMoveArrows(root)).toBe(1);
    expect(fixLayerMoveArrows(root)).toBe(0);
    const stop = watchLayerMoveArrows(root);
    root.insertAdjacentHTML('beforeend', arrows('down'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(
      screen.getByRole('button', { name: 'Déplacer la couche vers le bas' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Déplacer la couche vers le haut' }),
    ).toBeInTheDocument();
    stop();
  });
});
