import { fr } from '@codegouvfr/react-dsfr';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useEffect, useState } from 'react';
import { SHARE_LABELS } from '../../config/map';
import useBaseLayerCatalogue from '../../hooks/useBaseLayerCatalogue';
import { mailtoLink, mapPageUrl, mapPermalink } from '../../map/mapPermalink';
import { useMapStore } from '../../store/useMapStore';

const shareModal = createModal({ id: 'partager-la-carte', isOpenedByDefault: false });

/** Toolbar button opening the share dialog. */
export function ShareButton() {
  return (
    <Button
      priority="tertiary"
      size="small"
      iconId="ri-share-line"
      nativeButtonProps={shareModal.buttonProps}
    >
      {SHARE_LABELS.button}
    </Button>
  );
}

type CopyState = 'idle' | 'copied' | 'failed';

interface SharePanelProps {
  link: string;
  /** Copies the link; resolves to true on success. */
  copy: (link: string) => Promise<boolean>;
}

/** Content of the share dialog: the permalink, a copy button and a mail link. */
export function SharePanel({ link, copy }: SharePanelProps) {
  // The outcome of the last copy, forgotten as soon as the link changes (derived, no effect needed).
  const [lastCopy, setLastCopy] = useState<{ link: string; state: CopyState } | null>(null);
  const copyState: CopyState = lastCopy?.link === link ? lastCopy.state : 'idle';
  return (
    <>
      <Input
        label={SHARE_LABELS.linkLabel}
        hintText={SHARE_LABELS.linkHint}
        nativeInputProps={{
          readOnly: true,
          value: link,
          onFocus: (event) => event.currentTarget.select(),
        }}
      />
      <ul
        className={fr.cx(
          'fr-btns-group',
          'fr-btns-group--inline-sm',
          'fr-btns-group--icon-left',
          'fr-mb-1w',
        )}
      >
        <li>
          <Button
            iconId="ri-file-copy-line"
            disabled={!link}
            onClick={() => {
              void copy(link).then((ok) => setLastCopy({ link, state: ok ? 'copied' : 'failed' }));
            }}
          >
            {SHARE_LABELS.copy}
          </Button>
        </li>
        <li>
          <Button
            priority="secondary"
            iconId="fr-icon-mail-line"
            linkProps={{ href: mailtoLink(link) }}
          >
            {SHARE_LABELS.mail}
          </Button>
        </li>
      </ul>
      <p role="status" className={fr.cx('fr-text--sm', 'fr-mb-1w')}>
        {copyState === 'copied'
          ? SHARE_LABELS.copied
          : copyState === 'failed'
            ? SHARE_LABELS.copyFailed
            : ''}
      </p>
      <p className={fr.cx('fr-hint-text', 'fr-mb-0')}>{SHARE_LABELS.limits}</p>
    </>
  );
}

async function copyToClipboard(link: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    return false;
  }
}

/**
 * "Partager la carte" dialog (DSFR modal): the permalink of the current view, base layer and sols layers in
 * the cartes.gouv.fr format (src/map/permalink.ts), refreshed while the dialog is open and the map moves.
 */
export default function ShareModal() {
  const isOpen = useIsModalOpen(shareModal);
  const map = useMapStore((state) => state.map);
  const overlays = useMapStore((state) => state.overlays);
  const { activeLayer } = useBaseLayerCatalogue();
  const baseLayerName = activeLayer?.layerName;
  const [link, setLink] = useState('');

  useEffect(() => {
    if (!isOpen || !map) return undefined;
    const update = () => setLink(mapPermalink(mapPageUrl(), map, baseLayerName, overlays) ?? '');
    update();
    map.on('moveend', update);
    return () => {
      map.un('moveend', update);
    };
  }, [isOpen, map, baseLayerName, overlays]);

  return (
    <shareModal.Component title={SHARE_LABELS.title} iconId="ri-share-line" size="medium">
      <SharePanel link={link} copy={copyToClipboard} />
    </shareModal.Component>
  );
}
