/**
 * Header tool menus (Aide, Services, language), desktop and mobile: Escape while focus is in an
 * open menu (on its button or a link inside) closes that menu and gives focus back to its button.
 * DSFR 1.14.2 does this itself only at the LG breakpoint (and closes the whole mobile modal
 * otherwise); this handler makes it explicit everywhere. It listens in the capture phase on
 * `document`, before DSFR's root listener (capture on <html>), so a second Escape still closes the
 * mobile modal.
 */
document.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'Escape') return;
    const item = event.target.closest?.('.fr-header .fr-nav__item');
    const button = item?.querySelector('button[aria-expanded="true"]');
    if (!button) return;
    event.stopPropagation();
    event.preventDefault();
    button.click();
    button.focus();
  },
  { capture: true },
);
