import { fr } from '@codegouvfr/react-dsfr';
import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks';
import { lazy, Suspense } from 'react';
import DatasetsList from './components/list/DatasetsList';
import SiteFooter from './components/layout/SiteFooter';
import SiteHeader from './components/layout/SiteHeader';
import { FOOTER_ID, MAIN_CONTENT_ID } from './config/landmarks';
import { isListView } from './config/urls';
import './App.css';

/** OpenLayers and geopf-extensions are loaded in their own chunk. */
const MapExplorer = lazy(() => import('./components/map/MapExplorer'));

interface AppProps {
  /** Query string; defaults to the current location. */
  search?: string;
}

/**
 * Map view: cartes.gouv.fr layout, the map fills the viewport between the header and the compact footer
 * (the page title is for screen readers only). List view (`?vue=liste`): a regular scrolling page.
 */
export default function App({ search = window.location.search }: AppProps) {
  const listView = isListView(search);
  return (
    <div className={listView ? 'app-layout' : 'app-layout app-layout--map'}>
      <SkipLinks
        links={[
          { label: 'Contenu', anchor: `#${MAIN_CONTENT_ID}` },
          { label: 'Pied de page', anchor: `#${FOOTER_ID}` },
        ]}
      />
      <SiteHeader />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className={listView ? fr.cx('fr-container', 'fr-py-6w') : 'app-main'}
      >
        {listView ? (
          <DatasetsList />
        ) : (
          <>
            <h1 className={fr.cx('fr-sr-only')}>Explorer les cartes</h1>
            <Suspense fallback={<p role="status">Chargement de la carte…</p>}>
              <MapExplorer />
            </Suspense>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
