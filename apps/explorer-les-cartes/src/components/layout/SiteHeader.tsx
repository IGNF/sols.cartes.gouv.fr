import { fr } from '@codegouvfr/react-dsfr';
// The `Display` of `@codegouvfr/react-dsfr/Display` is a deprecated no-op; react-dsfr's Header mounts this one.
import { Display } from '@codegouvfr/react-dsfr/Display/Display';
import type { CSSProperties } from 'react';
import { BRAND, BRAND_IMAGES, SERVICE_BADGE, SERVICE_BADGE_CLASSES } from '../../config/site';
import { HEADER_ID } from '../../config/landmarks';
import BrandTop from './BrandTop';
import HeaderMenu from './HeaderMenu';
import './SiteHeader.css';

const { service, header } = BRAND;

/**
 * Compact header of the map brick (issue #5), built like the compact header of cartes.gouv.fr map bricks
 * (IGNF/cartes.gouv.fr-guichet-collaboratif, `src/components/Layout/AppHeader.tsx` and `src/css/app-header.css`,
 * commit f3427f82 « Passage du header en mode compact »): DSFR header markup written by hand (react-dsfr's
 * `Header` always adds the mobile « Menu » modal), one 3.5rem row at every width, « Aide » and « Services »
 * always visible, no tagline. Content comes from `@sols/brand`: brand block linking to the Observatoire home
 * (never cartes.gouv.fr), Marianne, GIS Sol logo, decorative Observatoire mark (CSS background), title with the
 * « Explorer » badge. No navigation bar, no « Se connecter » (`header.tools.login` is false).
 */
export default function SiteHeader() {
  return (
    <>
      {/* « Paramètres d'affichage » modal (opened from the footer), mounted by react-dsfr's Header otherwise. */}
      <Display />
      <header
        role="banner"
        id={HEADER_ID}
        className={`${fr.cx('fr-header')} fr-header--compact site-header`}
        style={{ '--osf-mark': `url(${BRAND_IMAGES.osfMark})` } as CSSProperties}
      >
        <div className={fr.cx('fr-header__body')}>
          <div className={fr.cx('fr-container--fluid')}>
            <div className={fr.cx('fr-header__body-row')}>
              <div className={fr.cx('fr-header__brand', 'fr-enlarge-link')}>
                <div className={fr.cx('fr-header__brand-top')}>
                  <div className={fr.cx('fr-header__logo')}>
                    <p className={fr.cx('fr-logo')}>
                      <BrandTop />
                    </p>
                  </div>
                  <div className={fr.cx('fr-header__operator')}>
                    <img
                      className={fr.cx('fr-responsive-img')}
                      src={BRAND_IMAGES.gissolLogo}
                      alt={header.operator.logoAlt}
                    />
                  </div>
                </div>
                <div className={fr.cx('fr-header__service')}>
                  <p className={fr.cx('fr-header__service-title')}>
                    <a href={header.brandLink} title={service.homeLinkTitle}>
                      {service.title}
                    </a>
                    {SERVICE_BADGE ? (
                      // Plain DSFR markup: react-dsfr's Badge adds fr-badge--no-icon without a severity.
                      <span
                        className={fr.cx(
                          'fr-badge',
                          'fr-badge--sm',
                          SERVICE_BADGE_CLASSES.color,
                          'fr-badge--icon-left',
                          SERVICE_BADGE_CLASSES.icon,
                        )}
                      >
                        {SERVICE_BADGE}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className={fr.cx('fr-header__tools')}>
                <div className={fr.cx('fr-header__tools-links')}>
                  <HeaderMenu menu={header.tools.help} />
                  <HeaderMenu menu={header.tools.services} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/*
          The DSFR header script (HeaderLinks, on `.fr-header__tools-links`) reads `.fr-header__menu-links` and
          throws without it: kept empty and hidden, as in guichet-collaboratif. No `fr-header__menu fr-modal`
          around it: there is no mobile menu (the tools stay in the row), and an unnamed DSFR modal logs a warning.
        */}
        <div className={fr.cx('fr-header__menu-links')} hidden />
      </header>
    </>
  );
}
