import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import 'ol/ol.css';
import { useRef } from 'react';
import { MAP_LABEL } from '../../config/map';
import useBaseLayer from '../../hooks/useBaseLayer';
import useBaseLayerCatalogue from '../../hooks/useBaseLayerCatalogue';
import useLayerSwitcher from '../../hooks/useLayerSwitcher';
import useMap from '../../hooks/useMap';
import useMapControls from '../../hooks/useMapControls';
import useWmtsCapabilities from '../../hooks/useWmtsCapabilities';
import './MapView.css';

export default function MapView() {
  const targetRef = useRef<HTMLDivElement>(null);
  const map = useMap(targetRef);
  const capabilities = useWmtsCapabilities();
  const { layers, activeLayer } = useBaseLayerCatalogue();
  useBaseLayer(map, capabilities.data, activeLayer?.layerName);
  useMapControls(map);
  useLayerSwitcher(map);

  const isEmpty = capabilities.isSuccess && layers.length === 0;

  return (
    <>
      {capabilities.isError && (
        <Alert
          className={fr.cx('fr-mb-2w')}
          severity="error"
          small
          description="Les fonds de carte de la Géoplateforme n’ont pas pu être chargés. Réessayez plus tard."
        />
      )}
      {isEmpty && (
        <Alert
          className={fr.cx('fr-mb-2w')}
          severity="warning"
          small
          description="Aucun fond de carte prévu n’est publié par la Géoplateforme."
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
