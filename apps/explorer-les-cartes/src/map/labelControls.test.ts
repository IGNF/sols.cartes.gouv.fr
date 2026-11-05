import { screen } from '@testing-library/react';
import Attribution from 'ol/control/Attribution';
import Rotate from 'ol/control/Rotate';
import { afterEach, describe, expect, it } from 'vitest';
import { CONTROL_LABELS, MAP_TOOLS_OPTIONS } from '../config/map';
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

  it('nomme le bouton des attributions et celui de la rotation au lieu de leur glyphe', () => {
    const attribution = new Attribution({ ...MAP_TOOLS_OPTIONS.attribution });
    const rotate = new Rotate({ autoHide: false });
    labelControlButtons(attribution, CONTROL_LABELS.attribution);
    labelControlButtons(rotate, CONTROL_LABELS.rotate);
    document.body.append(controlElement(attribution), controlElement(rotate));
    expect(screen.getByRole('button', { name: 'Sources des données' })).toBe(
      controlElement(attribution).querySelector('button'),
    );
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
