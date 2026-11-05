import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EXTERNAL_LINKS, SECTION_PATHS } from '../../config/urls';
import SiteHeader from './SiteHeader';

describe('SiteHeader', () => {
  it('affiche les trois liens de navigation vers les rubriques', () => {
    render(<SiteHeader />);
    const nav = screen.getByRole('navigation', { name: /menu principal/i });

    expect(within(nav).getByRole('link', { name: 'Accueil' })).toHaveAttribute(
      'href',
      SECTION_PATHS.home,
    );
    expect(within(nav).getByRole('link', { name: 'Rechercher une donnée' })).toHaveAttribute(
      'href',
      SECTION_PATHS.catalogue,
    );
    const carto = within(nav).getByRole('link', { name: 'Explorer les cartes' });
    expect(carto).toHaveAttribute('href', SECTION_PATHS.carto);
    expect(carto).toHaveAttribute('aria-current', 'page');
  });

  it('affiche le nom du service et le lien vers le GIS Sol', () => {
    render(<SiteHeader />);
    expect(screen.getAllByText('Observatoire des sols').length).toBeGreaterThan(0);
    const gisSolLinks = screen.getAllByRole('link', { name: /site du gis sol/i });
    expect(gisSolLinks[0]).toHaveAttribute('href', EXTERNAL_LINKS.gisSol);
  });
});
