import { screen } from '@testing-library/react';
import Rotate from 'ol/control/Rotate';
import Zoom from 'ol/control/Zoom';
import { afterEach, describe, expect, it } from 'vitest';
import { CONTROL_LABELS } from '../config/map';
import {
  controlElement,
  fixLayerMoveArrows,
  labelControlButtons,
  labelSearchInput,
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

  it('donne un nom accessible au champ de recherche geopf', () => {
    const root = document.createElement('div');
    root.innerHTML = '<form><input id="GPsearchInputText-7" type="text" /></form>';
    labelSearchInput(root);
    document.body.append(root);
    expect(screen.getByRole('textbox', { name: CONTROL_LABELS.searchInput })).toBeInTheDocument();
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
