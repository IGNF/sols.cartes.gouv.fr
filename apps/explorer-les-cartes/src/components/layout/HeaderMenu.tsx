import { fr } from '@codegouvfr/react-dsfr';
import { useEffect, useId, useRef, useState } from 'react';
import { isMenuIcon, type HeaderMenuSpec } from '../../config/site';

interface HeaderMenuProps {
  menu: HeaderMenuSpec;
}

/**
 * Drop-down menu of the header tools ("Aide", "Services"), cartes.gouv.fr pattern: a DSFR button with
 * `aria-expanded`/`aria-controls` and a list of links. DSFR has no menu in `fr-header__tools`, and react-dsfr
 * 1.36 `quickAccessItems` only take links/buttons, so this component is passed as a JSX quick access item.
 * State is React-controlled (no `fr-collapse`, whose DSFR script would fight React). Escape or a click
 * outside closes it; Escape returns focus to the button.
 */
export default function HeaderMenu({ menu }: HeaderMenuProps) {
  const menuId = `menu-${useId().replace(/:/g, '')}`;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const isInside = (target: EventTarget | null) =>
      target instanceof Node && Boolean(root.current?.contains(target));
    const onPointerDown = (event: PointerEvent) => {
      if (!isInside(event.target)) setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!isInside(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !isInside(document.activeElement)) return;
      // Capture phase: close this menu only, not the DSFR mobile menu modal around it.
      event.stopPropagation();
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={root} className="header-menu">
      <button
        ref={button}
        type="button"
        className={
          isMenuIcon(menu.icon) ? fr.cx('fr-btn', menu.icon, 'fr-btn--icon-left') : fr.cx('fr-btn')
        }
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {menu.label}
        <span
          className={`${fr.cx('fr-icon-arrow-down-s-line', 'fr-icon--sm')} header-menu__chevron`}
          aria-hidden="true"
        />
      </button>
      <div id={menuId} className="header-menu__panel" hidden={!open}>
        <ul className={fr.cx('fr-menu__list')}>
          {menu.items.map((item) => (
            <li key={item.href}>
              <a className={fr.cx('fr-nav__link')} href={item.href}>
                {item.label}
                {'description' in item && item.description ? (
                  <span className={fr.cx('fr-hint-text')}>{item.description}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
