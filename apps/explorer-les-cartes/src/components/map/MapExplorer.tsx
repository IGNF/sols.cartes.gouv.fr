import { fr } from '@codegouvfr/react-dsfr';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Tabs } from '@codegouvfr/react-dsfr/Tabs';
import { SIDE_PANEL_ID, SIDE_PANEL_TABS, type SidePanelTab } from '../../config/map';
import { useMapStore } from '../../store/useMapStore';
import BaseLayerPanel from './BaseLayerPanel';
import DeepLinkNotice from './DeepLinkNotice';
import MapView from './MapView';
import SolsDatasetsPanel from './SolsDatasetsPanel';
import './MapExplorer.css';

/** Map page body: side panel (base layers, sols datasets), toggleable, next to the map. */
export default function MapExplorer() {
  const isPanelOpen = useMapStore((state) => state.isPanelOpen);
  const togglePanel = useMapStore((state) => state.togglePanel);
  const activeTab = useMapStore((state) => state.activeTab);
  const setActiveTab = useMapStore((state) => state.setActiveTab);

  return (
    <>
      <DeepLinkNotice />
      <Button
        className={fr.cx('fr-mb-2w')}
        priority="secondary"
        size="small"
        iconId="ri-layout-left-line"
        aria-expanded={isPanelOpen}
        aria-controls={SIDE_PANEL_ID}
        onClick={togglePanel}
      >
        {isPanelOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
      </Button>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        <div
          id={SIDE_PANEL_ID}
          hidden={!isPanelOpen}
          className={fr.cx('fr-col-12', 'fr-col-md-5', 'fr-col-lg-4')}
        >
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
        <div className={fr.cx('fr-col-12', 'fr-col-md')}>
          <MapView />
        </div>
      </div>
    </>
  );
}
