import { fr } from '@codegouvfr/react-dsfr';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { BASE_LAYER_PANEL_ID } from '../../config/map';
import { useMapStore } from '../../store/useMapStore';
import BaseLayerPanel from './BaseLayerPanel';
import MapView from './MapView';

/** Map page body: base layer panel (toggleable) next to the map. */
export default function MapExplorer() {
  const isPanelOpen = useMapStore((state) => state.isPanelOpen);
  const togglePanel = useMapStore((state) => state.togglePanel);

  return (
    <>
      <Button
        className={fr.cx('fr-mb-2w')}
        priority="secondary"
        size="small"
        iconId="ri-stack-line"
        aria-expanded={isPanelOpen}
        aria-controls={BASE_LAYER_PANEL_ID}
        onClick={togglePanel}
      >
        {isPanelOpen ? 'Masquer les fonds de carte' : 'Afficher les fonds de carte'}
      </Button>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        <div
          id={BASE_LAYER_PANEL_ID}
          hidden={!isPanelOpen}
          className={fr.cx('fr-col-12', 'fr-col-md-4', 'fr-col-lg-3')}
        >
          <BaseLayerPanel />
        </div>
        <div className={fr.cx('fr-col-12', 'fr-col-md')}>
          <MapView />
        </div>
      </div>
    </>
  );
}
