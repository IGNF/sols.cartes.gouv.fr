import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import useDeepLink from '../../hooks/useDeepLink';
import { solsStyleUrl } from '../../config/urls';
import { useMapStore } from '../../store/useMapStore';

/** Outcome of the "Voir sur la carte" deep link coming from the catalogue. */
export default function DeepLinkNotice() {
  const status = useDeepLink();
  const unavailable = useMapStore((state) => state.unavailableOverlays);
  switch (status.state) {
    case 'checking':
      return (
        <p role="status" className={fr.cx('fr-mb-2w')}>
          Recherche de la couche « {status.name} »…
        </p>
      );
    case 'added':
      if (unavailable.includes(status.key)) {
        return (
          <Alert
            className={fr.cx('fr-mb-2w')}
            severity="warning"
            small
            as="h2"
            title="Couche indisponible"
            description={`La couche « ${status.title} » a été ajoutée à la carte, mais la Géoplateforme ne renvoie pas d’image pour cette couche pour le moment.`}
          />
        );
      }
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
    case 'invalid':
      return (
        <Alert
          className={fr.cx('fr-mb-2w')}
          severity="error"
          small
          as="h2"
          title="Lien invalide"
          description={`Le lien « Voir sur la carte » reçu pour « ${status.name} » est mal formé ou désigne un service hors de la Géoplateforme : il n’a pas été suivi. Les données sols restent disponibles dans l’onglet « Données sols ».`}
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
          description={
            status.type === 'TMS' && status.style ? (
              <>
                Le lien désigne le style de tuiles vectorielles (TMS) «&nbsp;{status.style}&nbsp;»,
                qui ne peut pas encore être affiché sur cette carte (
                <a href={solsStyleUrl(status.style)}>fichier de style</a>). Les données sols
                disponibles sont listées dans l’onglet « Données sols ».
              </>
            ) : status.type === 'TMS' ? (
              `La couche « ${status.name} » est publiée en tuiles vectorielles (TMS), qui ne peuvent pas encore être affichées. Les données sols disponibles sont listées dans l’onglet « Données sols ».`
            ) : (
              `Le service ${status.type} de la couche « ${status.name} » ne peut pas encore être affiché. Les données sols disponibles sont listées dans l’onglet « Données sols ».`
            )
          }
        />
      );
    default:
      return null;
  }
}
