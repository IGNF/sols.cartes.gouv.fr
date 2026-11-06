import { fr } from '@codegouvfr/react-dsfr';
import { Header } from '@codegouvfr/react-dsfr/Header';
import type { CSSProperties } from 'react';
import { BRAND, BRAND_IMAGES, SERVICE_BADGE, SERVICE_BADGE_CLASSES } from '../../config/site';
import { HEADER_ID } from '../../config/landmarks';
import BrandTop from './BrandTop';
import HeaderMenu from './HeaderMenu';
import './SiteHeader.css';

const { service, header } = BRAND;

/**
 * Header v1 (packages/brand/README.md): brand link to the Observatoire home (never cartes.gouv.fr),
 * Marianne, GIS Sol logo as operator, the decorative Observatoire mark before the service block (CSS,
 * react-dsfr has a single operator image), title with the « Explorer » badge, tagline, « Aide » and
 * « Services » menus. No navigation bar, no « Se connecter » (`header.tools.login` is false).
 */
export default function SiteHeader() {
  return (
    <Header
      id={HEADER_ID}
      className="site-header"
      style={{ '--osf-mark': `url(${BRAND_IMAGES.osfMark})` } as CSSProperties}
      brandTop={<BrandTop />}
      homeLinkProps={{ href: header.brandLink, title: service.homeLinkTitle }}
      operatorLogo={{
        orientation: 'horizontal',
        imgUrl: BRAND_IMAGES.gissolLogo,
        alt: header.operator.logoAlt,
      }}
      serviceTitle={
        <>
          {service.title}{' '}
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
        </>
      }
      serviceTagline={service.tagline}
      quickAccessItems={[
        <HeaderMenu key="help" menu={header.tools.help} />,
        <HeaderMenu key="services" menu={header.tools.services} />,
      ]}
    />
  );
}
