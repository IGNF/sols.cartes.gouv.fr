import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FOOTER_ID, MAIN_CONTENT_ID } from './config/landmarks';
import { BRAND } from './config/site';
import App from './App';

vi.mock('./components/map/MapExplorer', () => ({
  default: function MapExplorerStub() {
    return <div data-testid="map-view" />;
  },
}));

describe('App', () => {
  it('expose un contenu principal avec le titre de la page', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', MAIN_CONTENT_ID);
    const title = screen.getByRole('heading', { level: 1, name: 'Explorer les cartes' });
    // cartes.gouv.fr layout: the map fills the page, the title is for screen readers only.
    expect(title).toHaveClass('fr-sr-only');
  });

  it('charge la carte dans le contenu principal', async () => {
    render(<App />);
    const map = await screen.findByTestId('map-view');
    expect(screen.getByRole('main')).toContainElement(map);
  });

  it('affiche le pied de page compact avec les liens de la marque', () => {
    render(<App search="" />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveAttribute('id', FOOTER_ID);
    for (const link of BRAND.footer.bottomLinks) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
  });

  it('propose les paramètres d’affichage dans le pied de page', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /paramètres d’affichage|paramètres d'affichage/i }),
    ).toBeInTheDocument();
  });

  it('relie les liens d’évitement aux repères de la page', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Contenu' })).toHaveAttribute(
      'href',
      `#${MAIN_CONTENT_ID}`,
    );
    expect(screen.getByRole('link', { name: 'Pied de page' })).toHaveAttribute(
      'href',
      `#${FOOTER_ID}`,
    );
  });

  it('charge la carte en vue carte, sans la liste', async () => {
    render(<App search="" />);
    expect(await screen.findByTestId('map-view')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: 'Liste des données sols' })).toBeNull();
  });

  it('affiche la liste sans carte avec ?vue=liste', () => {
    render(<App search="?vue=liste" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Liste des données sols' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('map-view')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', MAIN_CONTENT_ID);
  });
});
