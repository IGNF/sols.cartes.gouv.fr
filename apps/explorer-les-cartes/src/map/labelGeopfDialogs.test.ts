import { describe, expect, it } from 'vitest';
import { GEOPF_DIALOG_LABELS } from '../config/map';
import labelGeopfDialogs from './labelGeopfDialogs';

describe('labelGeopfDialogs', () => {
  it('nomme les fenêtres connues du gestionnaire de couches et de la recherche', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<dialog id="GPlayersList-1"></dialog><dialog id="GPautoCompleteList-1"></dialog>';
    labelGeopfDialogs(root);
    expect(root.querySelector('#GPlayersList-1')).toHaveAttribute(
      'aria-label',
      GEOPF_DIALOG_LABELS['GPlayersList'],
    );
    expect(root.querySelector('#GPautoCompleteList-1')).toHaveAttribute(
      'aria-label',
      GEOPF_DIALOG_LABELS['GPautoCompleteList'],
    );
  });

  it('nomme aussi une fenêtre DSFR qui n’est pas un élément dialog', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div id="GPautoCompleteList-3" class="fr-modal"></div>';
    labelGeopfDialogs(root);
    const list = root.querySelector('#GPautoCompleteList-3');
    expect(list).toHaveAttribute('role', 'group');
    expect(list).toHaveAttribute('aria-label', GEOPF_DIALOG_LABELS['GPautoCompleteList']);
  });

  it('conserve un nom existant et ignore les fenêtres inconnues', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<dialog id="GPlayerStylePanel-2" aria-label="Déjà nommée"></dialog><dialog id="Autre-2"></dialog>';
    labelGeopfDialogs(root);
    expect(root.querySelector('#GPlayerStylePanel-2')).toHaveAttribute('aria-label', 'Déjà nommée');
    expect(root.querySelector('#Autre-2')).not.toHaveAttribute('aria-label');
  });
});
