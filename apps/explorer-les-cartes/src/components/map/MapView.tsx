import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import 'ol/ol.css';
import { useId, useRef } from 'react';
import { MAP_KEYBOARD_HINT, MAP_LABEL } from '../../config/map';
import useBaseLayer from '../../hooks/useBaseLayer';
import useBaseLayerCatalogue from '../../hooks/useBaseLayerCatalogue';
import useCatalog from '../../hooks/useCatalog';
import useInitialMapFocus from '../../hooks/useInitialMapFocus';
import useLayerSwitcher from '../../hooks/useLayerSwitcher';
import useMap from '../../hooks/useMap';
import useMapControls from '../../hooks/useMapControls';
import useMapTools from '../../hooks/useMapTools';
import useOverlays from '../../hooks/useOverlays';
import usePrintControl from '../../hooks/usePrintControl';
import useWmtsCapabilities from '../../hooks/useWmtsCapabilities';
import { openPrintModal } from './printModal';
import './MapView.css';

export default function MapView() {
  const targetRef = useRef<HTMLDivElement>(null);
  const map = useMap(targetRef);
  const hintId = useId();
  useInitialMapFocus(targetRef, map);
  const capabilities = useWmtsCapabilities();
  const { layers, activeLayer, status } = useBaseLayerCatalogue();
  useBaseLayer(map, capabilities.data, activeLayer?.layerName);
  useMapControls(map);
  useLayerSwitcher(map);
  useCatalog(map, layers, status);
  useMapTools(map);
  usePrintControl(map, openPrintModal);
  useOverlays(map);

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
      <p id={hintId} hidden>
        {MAP_KEYBOARD_HINT}
      </p>
      <div
        ref={targetRef}
        className="map-view"
        role="region"
        aria-label={MAP_LABEL}
        aria-describedby={hintId}
        aria-busy={capabilities.isPending}
        tabIndex={0}
      />
    </>
  );
}
