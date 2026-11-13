import { fr } from '@codegouvfr/react-dsfr';
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';
import { FooterBottomItem } from '@codegouvfr/react-dsfr/Footer';
import { useEffect, useRef, useState } from 'react';
import { BRAND, FOOTER_LABELS, FOOTER_PARTNERS, newWindowTitle } from '../../config/site';
import { FOOTER_ID } from '../../config/landmarks';
import BrandTop from './BrandTop';
import './SiteFooter.css';

const { footer, header, service } = BRAND;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** Attributes of a link opening a new window (same markup as the edito footer). */
const newWindow = (label: string) =>
  ({ target: '_blank', rel: 'noopener external', title: newWindowTitle(label) }) as const;

/**
 * Expandable footer (M13), pattern of `CgfrFooter.vue` (IGNF/cartes.gouv.fr-vue-components, used by
 * cartes.gouv.fr-entree-carto). The full DSFR footer of the other bricks (`apps/accueil/.../footer.njk`:
 * brand and description, content links, partners, bottom links with « Paramètres d'affichage », licence) is
 * rendered, collapsed by default to its bottom bar (`footer.compactOnCarto`, maquette 1:10562). The
 * « Haut de page » button expands it and scrolls the page down to it; « Fermer » collapses it and scrolls
 * back up. Plain DSFR markup rather than react-dsfr's `Footer`: the latter forces its own bottom links
 * (accessibility label and order), takes content links as bare domains, and cannot host the toggle outside
 * the bottom list.
 */
export default function SiteFooter() {
  const [expanded, setExpanded] = useState(false);
  const scrollTimer = useRef<number | undefined>(undefined);

  // A pending scroll must not fire after the footer is gone (unmount, tests).
  useEffect(() => () => window.clearTimeout(scrollTimer.current), []);

  const toggle = () => {
    const open = !expanded;
    setExpanded(open);
    // After the render: the expanded footer has made the page taller.
    window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      window.scrollTo({
        top: open ? document.body.scrollHeight : 0,
        behavior: open && !prefersReducedMotion() ? 'smooth' : 'auto',
      });
    }, 0);
  };

  return (
    <footer
      className={`${fr.cx('fr-footer')} compact-footer${expanded ? '' : ' compact-footer--collapsed'}`}
      id={FOOTER_ID}
    >
      <div className={fr.cx('fr-container')}>
        <div className={fr.cx('fr-footer__body')} hidden={!expanded}>
          <div className={fr.cx('fr-footer__brand', 'fr-enlarge-link')}>
            <a href={header.brandLink} title={service.homeLinkTitle}>
              <p className={fr.cx('fr-logo')}>
                <BrandTop />
              </p>
            </a>
          </div>
          <div className={fr.cx('fr-footer__content')}>
            <p className={fr.cx('fr-footer__content-desc')}>{footer.description}</p>
            <ul className={fr.cx('fr-footer__content-list')}>
              {footer.contentLinks.map((link) => (
                // DSFR markup class without CSS (absent from react-dsfr's class list), kept as on the edito.
                <li key={link.href} className="fr-footer__content-item">
                  <a
                    className={fr.cx('fr-footer__content-link')}
                    href={link.href}
                    {...newWindow(link.label)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={fr.cx('fr-footer__partners')} hidden={!expanded}>
          <h2 className={fr.cx('fr-footer__partners-title')}>{FOOTER_LABELS.partnersTitle}</h2>
          <div className={fr.cx('fr-footer__partners-logos')}>
            <div className={fr.cx('fr-footer__partners-sub')}>
              <ul>
                {FOOTER_PARTNERS.map((partner) => (
                  <li key={partner.href}>
                    <a
                      className={fr.cx('fr-footer__partners-link')}
                      href={partner.href}
                      {...newWindow(partner.name)}
                    >
                      <img
                        className={`${fr.cx('fr-footer__logo')} compact-footer__partner-logo`}
                        src={partner.logo}
                        alt={partner.name}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className={fr.cx('fr-footer__bottom')}>
          <ul className={fr.cx('fr-footer__bottom-list')}>
            {footer.bottomLinks.map((link) => (
              <li key={link.href} className={fr.cx('fr-footer__bottom-item')}>
                <a
                  className={fr.cx('fr-footer__bottom-link')}
                  href={link.href}
                  {...('external' in link && link.external ? newWindow(link.label) : {})}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className={fr.cx('fr-footer__bottom-item')}>
              <FooterBottomItem bottomItem={headerFooterDisplayItem} />
            </li>
          </ul>
          <button
            type="button"
            className={`${
              expanded
                ? fr.cx(
                    'fr-btn',
                    'fr-btn--tertiary',
                    'fr-btn--sm',
                    'fr-icon-close-line',
                    'fr-btn--icon-left',
                  )
                : fr.cx(
                    'fr-btn',
                    'fr-btn--tertiary',
                    'fr-btn--sm',
                    'fr-icon-arrow-up-line',
                    'fr-btn--icon-left',
                  )
            } compact-footer__toggle`}
            aria-expanded={expanded}
            aria-controls={FOOTER_ID}
            onClick={toggle}
          >
            {expanded ? FOOTER_LABELS.collapse : FOOTER_LABELS.expand}
          </button>
          <div className={fr.cx('fr-footer__bottom-copy')} hidden={!expanded}>
            <p>
              {footer.licence.text}{' '}
              <a href={footer.licence.href} {...newWindow(footer.licence.label)}>
                {footer.licence.label}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
