import { fr } from '@codegouvfr/react-dsfr';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import { lazy, Suspense } from 'react';
import SiteFooter from './components/layout/SiteFooter';
import SiteHeader from './components/layout/SiteHeader';
import { FOOTER_ID, MAIN_CONTENT_ID } from './config/landmarks';

/** OpenLayers and geopf-extensions are loaded in their own chunk. */
const MapView = lazy(() => import('./components/map/MapView'));

export default function App() {
  return (
    <>
      <SkipLinks
        links={[
          { label: 'Contenu', anchor: `#${MAIN_CONTENT_ID}` },
          { label: 'Pied de page', anchor: `#${FOOTER_ID}` },
        ]}
      />
      <SiteHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={fr.cx('fr-container', 'fr-py-6w')}>
        <h1>Explorer les cartes</h1>
        <p className={fr.cx('fr-text--lead')}>
          Consultez les cartes de référence de la Géoplateforme et les données sols du GIS Sol.
        </p>
        <Suspense fallback={<p role="status">Chargement de la carte…</p>}>
          <MapView />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
