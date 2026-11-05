import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SHARE_LABELS } from '../../config/map';
import { SharePanel } from './ShareModal';

const LINK =
  'https://sols.cartes.gouv.fr/explorer-les-cartes/?c=2.5,46.6&z=6&l=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(0;1;1;0)&permalink=yes';

describe('SharePanel', () => {
  it('affiche le lien permanent en lecture seule, un bouton de copie et un envoi par courriel', () => {
    render(<SharePanel link={LINK} copy={() => Promise.resolve(true)} />);
    // The DSFR hint is part of the label, hence of the accessible name.
    const input = screen.getByRole('textbox', { name: new RegExp(`^${SHARE_LABELS.linkLabel}`) });
    expect(input).toHaveValue(LINK);
    expect(input).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: SHARE_LABELS.copy })).toBeEnabled();
    expect(screen.getByRole('link', { name: SHARE_LABELS.mail })).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:\?subject=/),
    );
    expect(screen.getByText(SHARE_LABELS.limits)).toBeInTheDocument();
  });

  it('annonce la copie réussie, puis l’échec de la copie', async () => {
    const user = userEvent.setup();
    const copy = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    render(<SharePanel link={LINK} copy={copy} />);
    await user.click(screen.getByRole('button', { name: SHARE_LABELS.copy }));
    expect(copy).toHaveBeenCalledWith(LINK);
    expect(screen.getByRole('status')).toHaveTextContent(SHARE_LABELS.copied);
    await user.click(screen.getByRole('button', { name: SHARE_LABELS.copy }));
    expect(screen.getByRole('status')).toHaveTextContent(SHARE_LABELS.copyFailed);
  });

  it('oublie l’état de la copie quand le lien change et désactive la copie sans lien', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SharePanel link={LINK} copy={() => Promise.resolve(true)} />);
    await user.click(screen.getByRole('button', { name: SHARE_LABELS.copy }));
    expect(screen.getByRole('status')).toHaveTextContent(SHARE_LABELS.copied);
    rerender(<SharePanel link={`${LINK}&z=7`} copy={() => Promise.resolve(true)} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    rerender(<SharePanel link="" copy={() => Promise.resolve(true)} />);
    expect(screen.getByRole('button', { name: SHARE_LABELS.copy })).toBeDisabled();
  });
});
