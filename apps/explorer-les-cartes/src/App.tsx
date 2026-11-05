import { fr } from '@codegouvfr/react-dsfr';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import SiteFooter from './components/layout/SiteFooter';
import SiteHeader from './components/layout/SiteHeader';

const MAIN_CONTENT_ID = 'contenu';

export default function App() {
  return (
    <>
      <SkipLinks
        links={[
          { label: 'Contenu', anchor: `#${MAIN_CONTENT_ID}` },
          { label: 'Pied de page', anchor: '#footer' },
        ]}
      />
      <SiteHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={fr.cx('fr-container', 'fr-py-6w')}>
        <h1>Explorer les cartes</h1>
        <p className={fr.cx('fr-text--lead')}>
          Consultez les cartes de référence de la Géoplateforme et les données sols du GIS Sol.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
