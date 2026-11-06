import { fr } from '@codegouvfr/react-dsfr';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { SIDE_PANEL_ID } from '../../config/map';
import { useMapStore } from '../../store/useMapStore';
import ListViewLink from '../list/ListViewLink';
import BaseLayerPanel from './BaseLayerPanel';
import DeepLinkNotice from './DeepLinkNotice';
import MapNotices from './MapNotices';
import MapView from './MapView';
import PrintModal, { PrintButton } from './PrintModal';
import ShareModal, { ShareButton } from './ShareModal';
import './MapExplorer.css';

/**
 * Map page body: a slim toolbar (panel toggle, share and print dialogs, link to the list view), the
 * notices (deep links, unavailable layers, catalogue), then the side panel (base layers) docked left of the map. The sols datasets are added from the
 * catalogue widget on the map (M9) and listed in full in the list view. The panel width is bounded so
 * the map keeps most of the width on desktop; on small screens the map comes first and the panel below it.
 */
export default function MapExplorer() {
  const isPanelOpen = useMapStore((state) => state.isPanelOpen);
  const togglePanel = useMapStore((state) => state.togglePanel);

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
        <ShareButton />
        <PrintButton />
        <span className={fr.cx('fr-text--sm', 'fr-mb-0')}>
          <ListViewLink />
        </span>
      </div>
      <ShareModal />
      <PrintModal />
      <DeepLinkNotice />
      <MapNotices />
      <div className="map-explorer__body">
        <div id={SIDE_PANEL_ID} hidden={!isPanelOpen} className="map-explorer__panel">
          <BaseLayerPanel />
        </div>
        <div className="map-explorer__map">
          <MapView />
        </div>
      </div>
    </div>
  );
}
