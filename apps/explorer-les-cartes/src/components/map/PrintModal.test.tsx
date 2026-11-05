import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type OlMap from 'ol/Map';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRINT_LABELS } from '../../config/map';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import PrintModal, { PrintButton, PrintSheet } from './PrintModal';

const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

function fakeMap(): OlMap {
  return {
    getAllLayers: () => [],
  } as unknown as OlMap;
}

/** The DSFR modal is a closed `<dialog>` (hidden for the accessibility tree): open it as the DSFR script would. */
function renderOpen(ui: React.ReactElement) {
  const result = render(ui);
  document.getElementById('imprimer-la-carte')?.setAttribute('open', '');
  return result;
}

describe('PrintSheet', () => {
  it('imprime le titre, l’image de la carte, les sources et la date', () => {
    render(
      <PrintSheet
        title="Carte des sols"
        image={IMAGE}
        sources={['IGN – Géoplateforme', 'GIS Sol – INRAE']}
        date="05/11/2026"
      />,
    );
    const sheet = document.querySelector('.map-print-sheet');
    expect(sheet).toHaveTextContent('Carte des sols');
    expect(sheet?.querySelector('img')).toHaveAttribute('src', IMAGE);
    expect(sheet).toHaveTextContent('Sources : IGN – Géoplateforme ; GIS Sol – INRAE.');
    expect(sheet).toHaveTextContent('Imprimé le 05/11/2026');
  });
});

describe('PrintModal', () => {
  beforeEach(() => {
    useMapStore.setState({ ...initialMapState, map: fakeMap() });
  });
  afterEach(() => {
    useMapStore.setState(initialMapState);
  });

  it('propose un titre modifiable et deux actions', () => {
    renderOpen(
      <>
        <PrintButton />
        <PrintModal renderImage={() => Promise.resolve(IMAGE)} print={() => {}} />
      </>,
    );
    expect(screen.getByRole('button', { name: PRINT_LABELS.button })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: PRINT_LABELS.titleLabel })).toHaveValue(
      PRINT_LABELS.defaultTitle,
    );
    expect(screen.getByRole('button', { name: PRINT_LABELS.download })).toBeEnabled();
    expect(screen.getByRole('button', { name: PRINT_LABELS.print })).toBeEnabled();
  });

  it('rend l’image puis ouvre l’impression sur la feuille d’impression, retirée après', async () => {
    const user = userEvent.setup();
    const print = vi.fn();
    const renderImage = vi.fn().mockResolvedValue(IMAGE);
    renderOpen(<PrintModal renderImage={renderImage} print={print} />);
    const title = screen.getByRole('textbox', { name: PRINT_LABELS.titleLabel });
    await user.clear(title);
    await user.type(title, 'Loiret');
    await user.click(screen.getByRole('button', { name: PRINT_LABELS.print }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(renderImage).toHaveBeenCalledWith(useMapStore.getState().map);
    const sheet = document.body.querySelector('.map-print-sheet');
    expect(sheet).toHaveTextContent('Loiret');
    window.dispatchEvent(new Event('afterprint'));
    await waitFor(() => expect(document.body.querySelector('.map-print-sheet')).toBeNull());
  });

  it('télécharge l’image en PNG sous le nom du titre', async () => {
    const user = userEvent.setup();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const downloads: string[] = [];
    click.mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    renderOpen(<PrintModal renderImage={() => Promise.resolve(IMAGE)} print={() => {}} />);
    await user.click(screen.getByRole('button', { name: PRINT_LABELS.download }));
    await waitFor(() => expect(downloads).toEqual(['carte-des-sols.png']));
    click.mockRestore();
  });

  it('signale l’échec du rendu de l’image', async () => {
    const user = userEvent.setup();
    renderOpen(
      <PrintModal renderImage={() => Promise.reject(new Error('tainted'))} print={() => {}} />,
    );
    await user.click(screen.getByRole('button', { name: PRINT_LABELS.print }));
    expect(await screen.findByText(PRINT_LABELS.exportFailed)).toBeInTheDocument();
    expect(document.body.querySelector('.map-print-sheet')).toBeNull();
  });

  it('désactive les actions sans carte', () => {
    useMapStore.setState({ ...initialMapState, map: null });
    renderOpen(<PrintModal renderImage={() => Promise.resolve(IMAGE)} print={() => {}} />);
    expect(screen.getByRole('button', { name: PRINT_LABELS.print })).toBeDisabled();
  });
});
