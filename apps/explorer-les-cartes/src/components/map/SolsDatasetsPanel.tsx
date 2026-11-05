import { fr } from '@codegouvfr/react-dsfr';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { SOLS_DATASETS } from '../../data/solsLayers';
import { solsLayerKey, type SolsDataset, type SolsService } from '../../data/solsLayersSchema';
import { preferredLayer, toOverlayRef } from '../../map/overlays';
import { useMapStore } from '../../store/useMapStore';
import ListViewLink from '../list/ListViewLink';
import { excerpt } from '../../text/excerpt';

const TITLE_ID = 'titre-donnees-sols';

const SERVICE_BADGES: Record<SolsService, string> = {
  wmts: 'WMTS',
  'wms-raster': 'WMS',
  'wms-vector': 'WMS',
  wfs: 'WFS',
  tms: 'TMS',
};

function serviceBadges(dataset: SolsDataset): string[] {
  return [...new Set(dataset.layers.map((layer) => SERVICE_BADGES[layer.service]))];
}

/** DSFR panel listing the GIS Sol datasets, with add/remove buttons for their preferred layer. */
export default function SolsDatasetsPanel() {
  const overlays = useMapStore((state) => state.overlays);
  const addOverlay = useMapStore((state) => state.addOverlay);
  const removeOverlay = useMapStore((state) => state.removeOverlay);
  const unavailable = useMapStore((state) => state.unavailableOverlays);
  const [announcement, setAnnouncement] = useState('');

  return (
    <section aria-labelledby={TITLE_ID} className={fr.cx('fr-p-2w')}>
      <h2 id={TITLE_ID} className={fr.cx('fr-h6')}>
        Données sols
      </h2>
      <p className={fr.cx('fr-text--sm')}>
        <ListViewLink />
      </p>
      <p className={fr.cx('fr-sr-only')} role="status">
        {announcement}
      </p>
      <ul className={fr.cx('fr-raw-list')}>
        {SOLS_DATASETS.map((dataset) => {
          const layer = preferredLayer(dataset);
          const overlay = layer ? toOverlayRef(layer, dataset.title) : null;
          // A deep link may have added another layer of the dataset than the preferred one.
          const datasetKeys = dataset.layers.map(solsLayerKey);
          const onMapKeys = overlays.map((o) => o.key).filter((key) => datasetKeys.includes(key));
          const isOnMap = onMapKeys.length > 0;
          return (
            <li key={dataset.id} className={`${fr.cx('fr-pb-3w', 'fr-mb-3w')} sols-dataset`}>
              <h3 className={fr.cx('fr-text--md', 'fr-text--bold', 'fr-mb-1w')}>{dataset.title}</h3>
              <p className={fr.cx('fr-text--sm', 'fr-mb-1w')}>{excerpt(dataset.abstract)}</p>
              <p className={fr.cx('fr-text--xs', 'fr-mb-1w')}>
                Producteur : {dataset.organisation}
              </p>
              <ul
                className={fr.cx('fr-badges-group', 'fr-mb-1w')}
                aria-label="Services disponibles"
              >
                {serviceBadges(dataset).map((label) => (
                  <li key={label}>
                    <Badge small noIcon severity="info">
                      {label}
                    </Badge>
                  </li>
                ))}
              </ul>
              {overlay ? (
                <Button
                  size="small"
                  priority={isOnMap ? 'secondary' : 'primary'}
                  iconId={isOnMap ? 'fr-icon-delete-line' : 'fr-icon-add-line'}
                  iconPosition="left"
                  onClick={() => {
                    if (isOnMap) {
                      onMapKeys.forEach(removeOverlay);
                      setAnnouncement(`« ${dataset.title} » retirée de la carte.`);
                    } else {
                      addOverlay(overlay);
                      setAnnouncement(`« ${dataset.title} » ajoutée à la carte.`);
                    }
                  }}
                >
                  {isOnMap ? 'Retirer de la carte' : 'Ajouter à la carte'}{' '}
                  <span className={fr.cx('fr-sr-only')}>: {dataset.title}</span>
                </Button>
              ) : (
                <p className={fr.cx('fr-text--xs', 'fr-mb-0')}>
                  Aucune couche affichable sur la carte.
                </p>
              )}
              {onMapKeys.some((key) => unavailable.includes(key)) && (
                <p className={fr.cx('fr-error-text', 'fr-mt-1w')} role="status">
                  La Géoplateforme ne renvoie pas d’image pour cette couche pour le moment.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
