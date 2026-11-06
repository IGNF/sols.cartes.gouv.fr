import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Input } from '@codegouvfr/react-dsfr/Input';
import type OlMap from 'ol/Map';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRINT_LABELS } from '../../config/map';
import { downloadDataUrl, exportMapImage, fileSlug, mapSources } from '../../map/exportMap';
import { useMapStore } from '../../store/useMapStore';

import { printModal } from './printModal';

export interface PrintSheetContent {
  title: string;
  /** PNG data URL of the map. */
  image: string;
  sources: string[];
  /** Printed date (defaults to today). */
  date?: string;
}

/**
 * The only thing the browser prints (MapExplorer.css hides the rest of the page in print): title, map
 * image, sources and date. Rendered in a portal at the end of the body while the print dialog is open.
 */
export function PrintSheet({ title, image, sources, date }: PrintSheetContent) {
  return (
    <section className="map-print-sheet" aria-hidden="true">
      <h1 className={fr.cx('fr-h3')}>{title}</h1>
      <img src={image} alt="" />
      <p className={fr.cx('fr-text--xs')}>
        {sources.length > 0 ? `${PRINT_LABELS.sources} : ${sources.join(' ; ')}. ` : ''}
        {PRINT_LABELS.printedOn} {date ?? new Date().toLocaleDateString('fr-FR')}.
      </p>
    </section>
  );
}

interface PrintModalProps {
  /** Map renderer, replaceable in tests (canvas is unavailable in jsdom). */
  renderImage?: (map: OlMap) => Promise<string>;
  /** Opens the browser's print dialog. */
  print?: () => void;
}

/**
 * "Imprimer la carte" dialog (DSFR modal): a title, then either a PNG download of the current view or the
 * browser's print dialog on a print-only sheet (title, map, sources, date).
 */
export default function PrintModal({
  renderImage = exportMapImage,
  print = () => window.print(),
}: PrintModalProps) {
  const map = useMapStore((state) => state.map);
  const [title, setTitle] = useState<string>(PRINT_LABELS.defaultTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState<PrintSheetContent | null>(null);

  const capture = async (): Promise<string | null> => {
    if (!map) return null;
    setBusy(true);
    setError('');
    try {
      return await renderImage(map);
    } catch {
      setError(PRINT_LABELS.exportFailed);
      return null;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!sheet) return undefined;
    const done = () => setSheet(null);
    window.addEventListener('afterprint', done);
    print();
    return () => window.removeEventListener('afterprint', done);
  }, [sheet, print]);

  return (
    <>
      <printModal.Component
        title={PRINT_LABELS.title}
        iconId="fr-icon-printer-line"
        buttons={[
          {
            children: PRINT_LABELS.download,
            priority: 'secondary',
            iconId: 'fr-icon-download-line',
            doClosesModal: false,
            disabled: busy || !map,
            onClick: () => {
              void capture().then((image) => {
                if (image) downloadDataUrl(image, `${fileSlug(title)}.png`);
              });
            },
          },
          {
            children: PRINT_LABELS.print,
            iconId: 'fr-icon-printer-line',
            doClosesModal: false,
            disabled: busy || !map,
            onClick: () => {
              void capture().then((image) => {
                if (image && map) setSheet({ title, image, sources: mapSources(map) });
              });
            },
          },
        ]}
      >
        <Input
          label={PRINT_LABELS.titleLabel}
          nativeInputProps={{ value: title, onChange: (event) => setTitle(event.target.value) }}
        />
        <p className={fr.cx('fr-hint-text')}>{PRINT_LABELS.hint}</p>
        {error && <Alert severity="error" small description={error} />}
        <p role="status" className={fr.cx('fr-sr-only')}>
          {busy ? PRINT_LABELS.busy : ''}
        </p>
      </printModal.Component>
      {sheet && createPortal(<PrintSheet {...sheet} />, document.body)}
    </>
  );
}
