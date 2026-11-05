import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { catalogueRecordPath, SECTION_PATHS } from '../../config/urls';
import { SOLS_DATASETS } from '../../data/solsLayers';
import { serviceEndpointUrl } from '../../map/serviceLinks';
import DatasetsList, { LIST_VIEW_TITLE } from './DatasetsList';

describe('DatasetsList (alternative sans carte)', () => {
  it('a un titre de niveau 1, un lien de retour vers la carte et met à jour le titre du document', () => {
    document.title = 'Explorer les cartes - Observatoire des sols';
    const { unmount } = render(<DatasetsList />);
    expect(screen.getByRole('heading', { level: 1, name: LIST_VIEW_TITLE })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à la carte' })).toHaveAttribute(
      'href',
      SECTION_PATHS.carto,
    );
    expect(document.title).toBe(`${LIST_VIEW_TITLE} - Explorer les cartes - Observatoire des sols`);
    unmount();
    expect(document.title).toBe('Explorer les cartes - Observatoire des sols');
  });

  it('présente chaque donnée dans un article nommé par son titre', () => {
    render(<DatasetsList />);
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(SOLS_DATASETS.length);
    for (const dataset of SOLS_DATASETS) {
      const article = screen.getByRole('article', { name: dataset.title });
      expect(within(article).getByText(`Producteur : ${dataset.organisation}`)).toBeInTheDocument();
      expect(
        within(article).getByRole('link', {
          name: `Fiche de la donnée dans le catalogue : ${dataset.title}`,
        }),
      ).toHaveAttribute('href', catalogueRecordPath(dataset.id));
    }
  });

  it('donne un lien direct vers le point d’accès de chaque service et vers la carte quand la couche s’affiche', () => {
    render(<DatasetsList />);
    const dataset = SOLS_DATASETS.find((d) => d.layers.some((l) => l.service === 'wms-vector'));
    if (!dataset) throw new Error('aucune couche WMS vecteur');
    const article = screen.getByRole('article', { name: dataset.title });
    for (const layer of dataset.layers) {
      expect(
        within(article).getByRole('link', { name: new RegExp(`^point d’accès .* ${layer.name}$`) }),
      ).toHaveAttribute('href', serviceEndpointUrl(layer));
    }
    const mapLink = within(article).getAllByRole('link', { name: /^voir sur la carte/ })[0];
    expect(mapLink?.getAttribute('href')).toMatch(/^\/explorer-les-cartes\/\?layer=/);
  });
});
