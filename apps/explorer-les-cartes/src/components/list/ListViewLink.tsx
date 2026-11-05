import { fr } from '@codegouvfr/react-dsfr';
import { LIST_VIEW_PATH } from '../../config/urls';

/** Link to the non-map alternative, shown on the map page and in the sols panel. */
export default function ListViewLink() {
  return (
    <a
      className={fr.cx('fr-link', 'fr-icon-list-unordered', 'fr-link--icon-left')}
      href={LIST_VIEW_PATH}
    >
      Version accessible de la liste des données
    </a>
  );
}
