import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FOOTER_ID, MAIN_CONTENT_ID } from './config/landmarks';
import { SECTION_PATHS } from './config/urls';
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
    expect(
      screen.getByRole('heading', { level: 1, name: 'Explorer les cartes' }),
    ).toBeInTheDocument();
  });

  it('charge la carte dans le contenu principal', async () => {
    render(<App />);
    const map = await screen.findByTestId('map-view');
    expect(screen.getByRole('main')).toContainElement(map);
  });

  it('affiche les liens obligatoires du pied de page', () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveAttribute('id', FOOTER_ID);
    expect(screen.getByRole('link', { name: /accessibilité : non conforme/i })).toHaveAttribute(
      'href',
      SECTION_PATHS.accessibility,
    );
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute(
      'href',
      SECTION_PATHS.legalNotice,
    );
    expect(screen.getByRole('link', { name: 'Données personnelles' })).toHaveAttribute(
      'href',
      SECTION_PATHS.personalData,
    );
    expect(screen.getByRole('link', { name: 'Plan du site' })).toHaveAttribute(
      'href',
      SECTION_PATHS.siteMap,
    );
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
});
