import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import 'geopf-extensions-openlayers/css/Dsfr.css';
import 'ol/ol.css';
import { useRef } from 'react';
import { MAP_LABEL } from '../../config/map';
import useBaseLayer from '../../hooks/useBaseLayer';
import useLayerSwitcher from '../../hooks/useLayerSwitcher';
import useMap from '../../hooks/useMap';
import useWmtsCapabilities from '../../hooks/useWmtsCapabilities';
import { useMapStore } from '../../store/useMapStore';
import './MapView.css';

export default function MapView() {
  const targetRef = useRef<HTMLDivElement>(null);
  const map = useMap(targetRef);
  const capabilities = useWmtsCapabilities();
  const activeBaseLayerId = useMapStore((state) => state.activeBaseLayerId);
  const { isMissing } = useBaseLayer(map, capabilities.data, activeBaseLayerId);
  useLayerSwitcher(map);

  return (
    <>
      {capabilities.isError && (
        <Alert
          className={fr.cx('fr-mb-2w')}
          severity="error"
          small
          description="Le fond de carte de la Géoplateforme n’a pas pu être chargé. Réessayez plus tard."
        />
      )}
      {isMissing && (
        <Alert
          className={fr.cx('fr-mb-2w')}
          severity="warning"
          small
          description="Le fond de carte demandé n’est plus publié par la Géoplateforme."
        />
      )}
      <p className={fr.cx('fr-sr-only')} role="status">
        {capabilities.isPending ? 'Chargement du fond de carte…' : ''}
      </p>
      <div
        ref={targetRef}
        className="map-view"
        role="region"
        aria-label={MAP_LABEL}
        aria-busy={capabilities.isPending}
        tabIndex={0}
      />
    </>
  );
}
