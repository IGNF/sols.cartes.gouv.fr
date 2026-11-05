import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { useState } from 'react';
import { MAP_NOTICES } from '../../config/map';
import type { OverlayRef } from '../../map/overlays';
import { useMapStore } from '../../store/useMapStore';
import ListViewLink from '../list/ListViewLink';

/**
 * One warning per layer on the map whose service returns no image (`unavailableOverlays`), whatever
 * put it there: the catalogue, a « Voir sur la carte » link or a permalink. Each one can be dismissed
 * (the notice sits above the map and shifts it); it comes back if the layer is removed and added again.
 */
export function UnavailableOverlaysNotice() {
  const overlays = useMapStore((state) => state.overlays);
  const unavailable = useMapStore((state) => state.unavailableOverlays);
  // Dismissals are tied to the overlay object: the store creates a new one when a layer is added
  // again after a removal, so its notice comes back. Pruned on each dismissal to stay bounded.
  const [dismissed, setDismissed] = useState<readonly OverlayRef[]>([]);
  const failing = overlays.filter((overlay) => unavailable.includes(overlay.key));
  const dismiss = (overlay: OverlayRef) =>
    setDismissed((items) => [...items.filter((item) => overlays.includes(item)), overlay]);
  return (
    <>
      {failing
        .filter((overlay) => !dismissed.includes(overlay))
        .map((overlay) => (
          <Alert
            key={overlay.key}
            className={fr.cx('fr-mb-2w')}
            severity="warning"
            small
            as="h2"
            closable
            onClose={() => dismiss(overlay)}
            title={MAP_NOTICES.unavailableTitle}
            description={MAP_NOTICES.unavailable(overlay.title)}
          />
        ))}
    </>
  );
}

/** Shown when the catalogue widget could not be loaded: the list view keeps every dataset. */
export function CatalogueUnavailableNotice() {
  const unavailable = useMapStore((state) => state.catalogueUnavailable);
  if (!unavailable) return null;
  return (
    <Alert
      className={fr.cx('fr-mb-2w')}
      severity="warning"
      small
      as="h2"
      title={MAP_NOTICES.catalogueUnavailableTitle}
      description={
        <>
          {MAP_NOTICES.catalogueUnavailable} <ListViewLink />
        </>
      }
    />
  );
}

/** Notices of the map page that do not depend on the query string (DeepLinkNotice covers the links). */
export default function MapNotices() {
  return (
    <>
      <CatalogueUnavailableNotice />
      <UnavailableOverlaysNotice />
    </>
  );
}
