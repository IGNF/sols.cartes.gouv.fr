import { Header } from '@codegouvfr/react-dsfr/Header';
import { HEADER_HOME_TITLE, SITE } from '../../config/site';
import { EXTERNAL_LINKS, SECTION_PATHS } from '../../config/urls';
import BrandTop from './BrandTop';

export default function SiteHeader() {
  return (
    <Header
      brandTop={<BrandTop />}
      homeLinkProps={{ href: SECTION_PATHS.home, title: HEADER_HOME_TITLE }}
      serviceTitle={SITE.serviceTitle}
      serviceTagline={SITE.serviceTagline}
      quickAccessItems={[
        {
          iconId: 'fr-icon-earth-line',
          text: 'Site du GIS Sol',
          linkProps: {
            href: EXTERNAL_LINKS.gisSol,
            target: '_blank',
            rel: 'noopener noreferrer',
            title: 'Site du GIS Sol - nouvelle fenêtre',
          },
        },
      ]}
      navigation={[
        { text: 'Accueil', linkProps: { href: SECTION_PATHS.home } },
        { text: 'Rechercher une donnée', linkProps: { href: SECTION_PATHS.catalogue } },
        { text: 'Explorer les cartes', linkProps: { href: SECTION_PATHS.carto }, isActive: true },
      ]}
    />
  );
}
