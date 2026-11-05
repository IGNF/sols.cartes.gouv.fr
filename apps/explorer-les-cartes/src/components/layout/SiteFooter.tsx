import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';
import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { FOOTER_ID } from '../../config/landmarks';
import { FOOTER_HOME_TITLE, SITE } from '../../config/site';
import { EXTERNAL_LINKS, FOOTER_DOMAINS, SECTION_PATHS } from '../../config/urls';
import BrandTop from './BrandTop';

export default function SiteFooter() {
  return (
    <Footer
      id={FOOTER_ID}
      accessibility="non compliant"
      accessibilityLinkProps={{ href: SECTION_PATHS.accessibility }}
      termsLinkProps={{ href: SECTION_PATHS.legalNotice }}
      bottomItems={[
        { text: 'Données personnelles', linkProps: { href: SECTION_PATHS.personalData } },
        { text: 'Plan du site', linkProps: { href: SECTION_PATHS.siteMap } },
        headerFooterDisplayItem,
      ]}
      contentDescription={SITE.footerDescription}
      domains={FOOTER_DOMAINS}
      license={
        <>
          {SITE.licenceText}{' '}
          <a
            href={EXTERNAL_LINKS.licenceEtalab}
            target="_blank"
            rel="noopener noreferrer"
            title={`${SITE.licenceLabel} - nouvelle fenêtre`}
          >
            {SITE.licenceLabel}
          </a>
        </>
      }
      brandTop={<BrandTop />}
      homeLinkProps={{ href: SECTION_PATHS.home, title: FOOTER_HOME_TITLE }}
    />
  );
}
