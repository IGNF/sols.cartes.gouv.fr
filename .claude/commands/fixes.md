Well done, you now have a strong base. We are now going through some minor changes in order to have our final v1.1 that can be moved to production.

## Header (all pages)
- Help & contact should redirect to main `cartes.gouv.fr` with an external link: 
    `https://cartes.gouv.fr/aide/fr/` (or /en, just report the current chosen language)
    and `https://cartes.gouv.fr/aide/fr/nous-ecrire/`. Keep both the before-icon and after external link icon as recommended by DSFR and implemented in 
    `https://cartes.gouv.fr/explorer-les-cartes/` for example.

## Landing Page
- In the header without hover, we can see a patch of PNG in dark mode -> background color should not be inverted.
- Language choice is misaligned.

## Catalogue
Seems perfect, no changes; just the header is missing a before-icon in the badge `explorer`.

## Carto 

Most of the requested changes are going to be here:
- In the footer, the link with class `Haut de page` should open an extended footer that displays the same info as the landing page footer, for example.
    You can check what is done on this repo: https://github.com/IGNF/cartes.gouv.fr-guichet-collaboratif. The trick is that the page becomes scrollable in this case.
- Remove this but keep functionalities: `map-explorer__toolbar`
    - Print modal button should be on the map as well.
    - Side panel function with base layer is good, but can be moved to the catalog button. Rename from `Catalogue des données sols` to `Catalogue de cartes`, and implement next to `Données sols` (tabbutton-0_sols) a new `fond de cartes` subsection.
    - `GPsearchInputText` should be centered and review CSS for `GPsearchInputReset`.
- Remove share button functionality.
- `explorer-les-cartes/?vue=liste` is a good idea for later; keep functionality but hide it for now (should already be done with `map-explorer__toolbar` being deleted).
- Remove the `Sources des données` button; scale bar should move from the left to the right and take its place. And scale bar text/line should be DSFR text color, not grey, so `(--text-action-high-blue-france);`.
- Header: the whole `fr-header__brand` should be clickable and redirect to the home page; currently, only `sols.cartes.gouv` has the href.
- Put `Mes outils` at the end and rename it `Afficher tous les outils`. Same behavior as `cartes.gouv.fr/explorer-les-cartes/`. 
    Keep measurelength, measureArea, draw, route by default. Other tools that you have should be added only when the user goes through `Afficher tous les outils` and clicks to add a new one on the map.
- Fullscreen should be placed at the bottom right (to the right of the scale bar).

## General
You should delegate a bit more to sub-agents:
    - To implement v0 you consumed 20% of table limit (so orchestrator work)
    - It was 60% for v1