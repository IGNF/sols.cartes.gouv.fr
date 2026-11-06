import DeepLinkNotice from './DeepLinkNotice';
import MapNotices from './MapNotices';
import MapView from './MapView';
import PrintModal from './PrintModal';
import './MapExplorer.css';

/**
 * Map page body (v1.1): the notices (deep links, unavailable layers, catalogue), then the map alone.
 * The base layers are chosen in the catalogue widget (« Fonds de cartes » tab) and the print dialog
 * opens from a button on the map; the list view (`?vue=liste`) stays reachable but is no longer linked.
 */
export default function MapExplorer() {
  return (
    <div className="map-explorer">
      <PrintModal />
      <DeepLinkNotice />
      <MapNotices />
      <div className="map-explorer__map">
        <MapView />
      </div>
    </div>
  );
}
