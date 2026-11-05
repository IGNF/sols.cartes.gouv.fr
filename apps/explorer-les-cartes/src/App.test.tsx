import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SECTION_PATHS } from './config/urls';
import App from './App';

describe('App', () => {
  it('expose un contenu principal avec le titre de la page', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'contenu');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Explorer les cartes' }),
    ).toBeInTheDocument();
  });

  it('affiche les liens obligatoires du pied de page', () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
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
});
