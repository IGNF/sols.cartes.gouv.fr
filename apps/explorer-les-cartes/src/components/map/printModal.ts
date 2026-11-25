import { createModal } from '@codegouvfr/react-dsfr/Modal';

/** The « Imprimer la carte » DSFR modal (rendered by PrintModal, opened from the map print button). */
export const printModal = createModal({ id: 'imprimer-la-carte', isOpenedByDefault: false });

/** Opens the print dialog (src/map/printControl.ts). */
export function openPrintModal(): void {
  printModal.open();
}
