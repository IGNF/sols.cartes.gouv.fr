import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CONTROL_LABELS } from '../config/map';
import { createSearchEngine } from '../hooks/useMapControls';
import { loadSearchEngine } from './geopf';
import { controlElement } from './labelControls';

/** Parts of SearchEngineAdvanced the M19 placement relies on (public fields of SearchEngineAdvanced.d.ts). */
interface SearchEngineParts {
  baseSearchEngine: { element: HTMLElement };
  advancedBtn: HTMLButtonElement;
  advancedContainer: HTMLElement;
  locationBtn: HTMLButtonElement;
}

/**
 * The real geopf-extensions SearchEngineAdvanced (pinned 1.0.0-beta.16) as configured in MAP_TOOLS_OPTIONS (M19):
 * the structure the geolocation placement relies on, to recheck on every geopf upgrade. jsdom has no
 * `innerText`, which geopf uses for the button texts: those are checked in the browser (check:map, M19).
 */
describe('moteur de recherche avancée (geopf réel)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('met la géolocalisation en tête du panneau « Avancée », plus à côté de la barre', async () => {
    const control = createSearchEngine(await loadSearchEngine());
    const parts = control as unknown as SearchEngineParts;
    const root = controlElement(control);
    // Done by setMap on a map: the base bar into its target (the widget), then the panel after it.
    root.append(parts.baseSearchEngine.element, parts.advancedContainer);
    document.body.append(root);

    expect(root.id).toMatch(/^GPsearchEngine-Advanced-/);
    expect(root.querySelector('[id^="GPshowGeolocate-"]')).toBeNull();
    expect(root.querySelector('form.GPSearchBar input')).toHaveAttribute(
      'aria-label',
      CONTROL_LABELS.searchInput,
    );

    // « Avancée » is in the bar and controls the panel, whose first entry is the geolocation button.
    const advanced = parts.advancedBtn;
    expect(root.querySelector('form.GPSearchBar .GPOptionsContainer')).toContainElement(advanced);
    // Named after its visible text « Avancée » (geopf: « Afficher les options avancées », label-content-name-mismatch).
    expect(advanced).toHaveAttribute('aria-label', CONTROL_LABELS.advancedSearch);
    expect(CONTROL_LABELS.advancedSearch.toLowerCase()).toContain('avancée');
    expect(advanced).toHaveAttribute('aria-controls', parts.advancedContainer.id);
    const first = parts.advancedContainer.firstElementChild;
    expect(first).toHaveClass('GPSearchEngine-locate');
    expect(parts.advancedContainer.querySelectorAll('section.fr-accordion')).toHaveLength(1);
    // The other geolocation button is in the suggestions header, shown while the input has the focus.
    expect(root.querySelector('.GPautoCompleteHeader')).toContainElement(parts.locationBtn);

    expect(advanced).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(advanced);
    expect(advanced).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(first);
  });
});
