/**
 * Mobile header menu: Escape inside an open sub-menu (Aide, Services, language) closes that
 * sub-menu and gives focus back to its button, instead of closing the whole menu modal.
 * DSFR 1.14.2 only handles Escape for navigation menus at the LG breakpoint and otherwise lets the
 * modal close; no DSFR option changes that. Listening in the capture phase on `document` runs
 * before DSFR's root listener (capture on <html>), so the second Escape still closes the modal.
 */
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'Escape') return;
    const item = event.target.closest?.('.fr-header__menu-links .fr-nav__item');
    const button = item?.querySelector('button[aria-expanded="true"]');
    if (!button) return;
    event.stopPropagation();
    event.preventDefault();
    button.click();
    button.focus();
  },
  { capture: true },
);
