import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import useDeepLink from '../../hooks/useDeepLink';

/** Outcome of the "Voir sur la carte" deep link coming from the catalogue. */
export default function DeepLinkNotice() {
  const status = useDeepLink();
  switch (status.state) {
    case 'checking':
      return (
        <p role="status" className={fr.cx('fr-mb-2w')}>
          Recherche de la couche « {status.name} »…
        </p>
      );
    case 'added':
      return (
        <p role="status" className={fr.cx('fr-sr-only')}>
          Couche « {status.title} » ajoutée à la carte.
        </p>
      );
    case 'not-found':
      return (
        <Alert
          className={fr.cx('fr-mb-2w')}
          severity="error"
          as="h2"
          small
          title="Couche introuvable"
          description={`La couche « ${status.name} » n’est pas publiée par la Géoplateforme. Les autres données sols restent disponibles dans l’onglet « Données sols ».`}
        />
      );
    case 'unsupported':
      return (
        <Alert
          className={fr.cx('fr-mb-2w')}
          severity="info"
          as="h2"
          small
          title="Format non pris en charge"
          description={`Le lien « Voir sur la carte » reçu (${status.type}) désigne un style de tuiles vectorielles, qui ne peut pas encore être affiché. Les données sols disponibles sont listées dans l’onglet « Données sols ».`}
        />
      );
    default:
      return null;
  }
}
