import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display';
import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { SITE } from '../../config/site';
import { FOOTER_ID } from '../../config/landmarks';
import { SECTION_PATHS } from '../../config/urls';

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
      brandTop={
        <>
          République
          <br />
          Française
        </>
      }
      homeLinkProps={{ href: SECTION_PATHS.home, title: `Accueil - ${SITE.serviceTitle}` }}
    />
  );
}
