import { fr } from '@codegouvfr/react-dsfr';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Tabs } from '@codegouvfr/react-dsfr/Tabs';
import { SIDE_PANEL_ID, SIDE_PANEL_TABS, type SidePanelTab } from '../../config/map';
import { useMapStore } from '../../store/useMapStore';
import ListViewLink from '../list/ListViewLink';
import BaseLayerPanel from './BaseLayerPanel';
import DeepLinkNotice from './DeepLinkNotice';
import MapView from './MapView';
import SolsDatasetsPanel from './SolsDatasetsPanel';
import './MapExplorer.css';

/**
 * Map page body: a slim toolbar (panel toggle, link to the list view), deep-link notices, then the side
 * panel docked left of the map. The panel width is bounded so the map keeps most of the width on
 * desktop; on small screens the map comes first and the panel below it.
 */
export default function MapExplorer() {
  const isPanelOpen = useMapStore((state) => state.isPanelOpen);
  const togglePanel = useMapStore((state) => state.togglePanel);
  const activeTab = useMapStore((state) => state.activeTab);
  const setActiveTab = useMapStore((state) => state.setActiveTab);

  return (
    <div className="map-explorer">
      <div className="map-explorer__toolbar">
        <Button
          priority="tertiary"
          size="small"
          iconId="ri-layout-left-line"
          aria-expanded={isPanelOpen}
          aria-controls={SIDE_PANEL_ID}
          onClick={togglePanel}
        >
          {isPanelOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
        </Button>
        <span className={fr.cx('fr-text--sm', 'fr-mb-0')}>
          <ListViewLink />
        </span>
      </div>
      <DeepLinkNotice />
      <div className="map-explorer__body">
        <div id={SIDE_PANEL_ID} hidden={!isPanelOpen} className="map-explorer__panel">
          <Tabs
            className="side-panel-tabs"
            label="Panneau de la carte"
            tabs={SIDE_PANEL_TABS.map(({ tabId, label, iconId }) => ({ tabId, label, iconId }))}
            selectedTabId={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as SidePanelTab)}
          >
            {activeTab === 'fonds' ? <BaseLayerPanel /> : <SolsDatasetsPanel />}
          </Tabs>
        </div>
        <div className="map-explorer__map">
          <MapView />
        </div>
      </div>
    </div>
  );
}
