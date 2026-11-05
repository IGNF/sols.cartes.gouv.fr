import { describe, expect, it, vi } from 'vitest';
import { TOOL_BUTTON_LABELS } from '../config/map';
import { fixToolButtons, labelDialogsOnInit, watchToolButtons } from './labelToolButtons';

const LEGEND_ENTRY = `<div class="legend-entry-container" id="x">
  <label class="legend-entry-title">Plan IGN</label>
  <button id="GPcollapseLegend_ID_x" type="button" title=""></button></div>`;
const TERRITORY_ENTRY = `<div class="gpf-panel__views_territories-listview-entry">
  <div><label class="gpf-label">La Réunion</label></div>
  <button id="gpf-territories-view-entry-button-id-REU" type="button"></button></div>`;

describe('fixToolButtons', () => {
  it('nomme le bouton de dépliage d’une légende et le bouton de retrait d’un territoire', () => {
    const root = document.createElement('div');
    root.innerHTML = LEGEND_ENTRY + TERRITORY_ENTRY;
    expect(fixToolButtons(root)).toBe(2);
    expect(root.querySelector('#GPcollapseLegend_ID_x')).toHaveAttribute(
      'aria-label',
      `${TOOL_BUTTON_LABELS.showLegend} : Plan IGN`,
    );
    expect(root.querySelector('#gpf-territories-view-entry-button-id-REU')).toHaveAttribute(
      'aria-label',
      `${TOOL_BUTTON_LABELS.removeTerritory} : La Réunion`,
    );
    // Already named buttons are left alone.
    expect(fixToolButtons(root)).toBe(0);
  });

  it('se passe du titre quand l’entrée n’en a pas', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button id="GPcollapseLegend_ID_y" type="button"></button>';
    fixToolButtons(root);
    expect(root.querySelector('button')).toHaveAttribute(
      'aria-label',
      TOOL_BUTTON_LABELS.showLegend,
    );
  });
});

describe('watchToolButtons', () => {
  it('nomme aussi les entrées ajoutées plus tard, jusqu’à l’arrêt de l’observation', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const stop = watchToolButtons(root);
    root.innerHTML = LEGEND_ENTRY;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.querySelector('button')).toHaveAttribute('aria-label');
    stop();
    root.innerHTML = TERRITORY_ENTRY;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.querySelector('button')).not.toHaveAttribute('aria-label');
    root.remove();
  });
});

describe('labelDialogsOnInit', () => {
  it('nomme les fenêtres dès que le contrôle construit son conteneur (Route, Isocurve)', () => {
    const container = document.createElement('div');
    container.innerHTML = '<dialog id="GProutePanel-1"></dialog>';
    const control = { _initContainer: vi.fn(() => container) };
    const label = vi.fn();
    labelDialogsOnInit(control, label);
    expect(control._initContainer()).toBe(container);
    expect(label).toHaveBeenCalledWith(container);
  });

  it('ignore un contrôle sans _initContainer', () => {
    const control = {};
    labelDialogsOnInit(control, vi.fn());
    expect(control).toEqual({});
  });
});
