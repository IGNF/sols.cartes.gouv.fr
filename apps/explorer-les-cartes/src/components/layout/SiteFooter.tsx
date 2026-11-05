import { Footer } from '@codegouvfr/react-dsfr/Footer';
import { SITE } from '../../config/site';
import { SECTION_PATHS } from '../../config/urls';

export default function SiteFooter() {
  return (
    <Footer
      id="footer"
      accessibility="non compliant"
      accessibilityLinkProps={{ href: SECTION_PATHS.accessibility }}
      termsLinkProps={{ href: SECTION_PATHS.legalNotice }}
      bottomItems={[
        { text: 'Données personnelles', linkProps: { href: SECTION_PATHS.personalData } },
        { text: 'Plan du site', linkProps: { href: SECTION_PATHS.siteMap } },
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
