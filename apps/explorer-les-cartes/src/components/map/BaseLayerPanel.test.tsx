import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialMapState, useMapStore } from '../../store/useMapStore';
import capabilitiesXml from '../../test/fixtures/wmts-capabilities.xml?raw';
import { createQueryWrapper } from '../../test/queryWrapper';
import BaseLayerPanel from './BaseLayerPanel';

function renderPanel() {
  return render(<BaseLayerPanel />, { wrapper: createQueryWrapper() });
}

describe('BaseLayerPanel', () => {
  beforeEach(() => {
    useMapStore.setState(initialMapState);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('présente les fonds publiés sous forme de boutons radio, Plan IGN coché', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(capabilitiesXml)));
    renderPanel();
    expect(screen.getByRole('heading', { level: 2, name: 'Fonds de carte' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des fonds de carte');
    const group = await screen.findByRole('group', { name: /choisir le fond de carte/i });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
      'plan-ign',
      'orthophotos',
      'relief',
    ]);
    expect(screen.getByRole('radio', { name: 'Plan IGN' })).toBeChecked();
  });

  it('change le fond actif au clic', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(capabilitiesXml)));
    renderPanel();
    await userEvent.click(await screen.findByRole('radio', { name: 'Photographies aériennes' }));
    expect(useMapStore.getState().activeBaseLayerId).toBe('orthophotos');
    expect(screen.getByRole('radio', { name: 'Photographies aériennes' })).toBeChecked();
  });

  it('change le fond actif avec les flèches du clavier', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(capabilitiesXml)));
    renderPanel();
    const user = userEvent.setup();
    const planIgn = await screen.findByRole('radio', { name: 'Plan IGN' });
    planIgn.focus();
    await user.keyboard('{ArrowDown}');
    expect(useMapStore.getState().activeBaseLayerId).toBe('orthophotos');
  });

  it('signale l’échec du chargement', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    renderPanel();
    expect(await screen.findByText(/n’ont pas pu être chargés/)).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('signale l’absence de fond disponible', async () => {
    const empty = capabilitiesXml.replace(/<Layer>[\s\S]*<\/Layer>/, '');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(empty)));
    renderPanel();
    expect(await screen.findByText(/Aucun fond de carte/)).toBeInTheDocument();
  });
});
