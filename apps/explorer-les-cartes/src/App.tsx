import { fr } from '@codegouvfr/react-dsfr';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import { lazy, Suspense } from 'react';
import SiteFooter from './components/layout/SiteFooter';
import SiteHeader from './components/layout/SiteHeader';
import DatasetsList from './components/list/DatasetsList';
import ListViewLink from './components/list/ListViewLink';
import { FOOTER_ID, MAIN_CONTENT_ID } from './config/landmarks';
import { isListView } from './config/urls';

/** OpenLayers and geopf-extensions are loaded in their own chunk. */
const MapExplorer = lazy(() => import('./components/map/MapExplorer'));

interface AppProps {
  /** Query string; defaults to the current location. */
  search?: string;
}

export default function App({ search = window.location.search }: AppProps) {
  const listView = isListView(search);
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
        {listView ? (
          <DatasetsList />
        ) : (
          <>
            <h1>Explorer les cartes</h1>
            <p className={fr.cx('fr-text--lead')}>
              Consultez les cartes de référence de la Géoplateforme et les données sols du GIS Sol.
            </p>
            <p>
              <ListViewLink />
            </p>
            <Suspense fallback={<p role="status">Chargement de la carte…</p>}>
              <MapExplorer />
            </Suspense>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
