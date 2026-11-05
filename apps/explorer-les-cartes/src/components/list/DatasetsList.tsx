import { fr } from '@codegouvfr/react-dsfr';
import { useEffect } from 'react';
import { SECTION_PATHS, catalogueRecordPath } from '../../config/urls';
import { SOLS_DATASETS } from '../../data/solsLayers';
import { mapLinkFor, SERVICE_LABELS, serviceEndpointUrl } from '../../map/serviceLinks';
import { excerpt } from '../../text/excerpt';

/** Title of the list view, also used for document.title. */
export const LIST_VIEW_TITLE = 'Liste des données sols';

/**
 * Non-map alternative (RGAA): every sols dataset with its producer, abstract excerpt, services with
 * direct links to their endpoints, a link to the map and to the catalogue record. No map code is loaded.
 */
export default function DatasetsList() {
  useEffect(() => {
    const previous = document.title;
    document.title = `${LIST_VIEW_TITLE} - ${previous}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <>
      <h1>{LIST_VIEW_TITLE}</h1>
      <p className={fr.cx('fr-text--lead')}>
        Les données sols du GIS Sol publiées par la Géoplateforme, avec leurs services
        cartographiques, sans passer par la carte.
      </p>
      <p>
        <a
          className={fr.cx('fr-link', 'fr-icon-arrow-left-line', 'fr-link--icon-left')}
          href={SECTION_PATHS.carto}
        >
          Retour à la carte
        </a>
      </p>
      <p className={fr.cx('fr-text--sm')}>{SOLS_DATASETS.length} données.</p>
      <ul className={fr.cx('fr-raw-list')}>
        {SOLS_DATASETS.map((dataset) => {
          const titleId = `donnee-${dataset.id}`;
          return (
            <li key={dataset.id} className={fr.cx('fr-mb-6w')}>
              <article aria-labelledby={titleId}>
                <h2 id={titleId} className={fr.cx('fr-h4')}>
                  {dataset.title}
                </h2>
                <p>{excerpt(dataset.abstract)}</p>
                <p className={fr.cx('fr-text--sm')}>Producteur : {dataset.organisation}</p>
                <h3 className={fr.cx('fr-text--lg', 'fr-mb-1w')}>Services</h3>
                {dataset.layers.length === 0 ? (
                  <p>Aucun service publié pour le moment.</p>
                ) : (
                  <ul>
                    {dataset.layers.map((layer) => {
                      const mapLink = mapLinkFor(layer);
                      return (
                        <li key={`${layer.service}:${layer.name}`}>
                          {SERVICE_LABELS[layer.service]} : <code>{layer.name}</code> –{' '}
                          <a href={serviceEndpointUrl(layer)}>
                            point d’accès
                            <span className={fr.cx('fr-sr-only')}>
                              {' '}
                              {SERVICE_LABELS[layer.service]} {layer.name}
                            </span>
                          </a>
                          {mapLink && (
                            <>
                              {' '}
                              –{' '}
                              <a href={mapLink}>
                                voir sur la carte
                                <span className={fr.cx('fr-sr-only')}> : {layer.title}</span>
                              </a>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className={fr.cx('fr-mt-2w')}>
                  <a className={fr.cx('fr-link')} href={catalogueRecordPath(dataset.id)}>
                    Fiche de la donnée dans le catalogue
                    <span className={fr.cx('fr-sr-only')}> : {dataset.title}</span>
                  </a>
                </p>
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );
}
