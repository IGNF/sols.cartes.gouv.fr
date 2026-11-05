/**
 * Shared site identity, read from `@sols/brand` (packages/brand/brand.json, single source for the three
 * bricks): header and footer content must not be written here.
 */
import brand from '@sols/brand/brand.json';
import gissolLogoUrl from '@sols/brand/assets/logo-gissol.png';
import osfMarkUrl from '@sols/brand/assets/osf-carotte.png';

export const BRAND = brand;

/** « République Française » block of the Marianne logo (DSFR, not part of the brand file). */
export const BRAND_TOP = ['République', 'Française'] as const;

/** Header images, published by Vite. */
export const BRAND_IMAGES = { gissolLogo: gissolLogoUrl, osfMark: osfMarkUrl } as const;

/** Badge locating the user in the portal ("Explorer" on the carto brick). */
export const SERVICE_BADGE = brand.badges.carto;

export type HeaderMenuSpec = (typeof brand.header.tools)['help' | 'services'];

/**
 * Icons of the brand menus (`header.tools.*.icon` in brand.json). Listed here so `react-dsfr update-icons`
 * (which only scans the app sources) keeps them in the CSS, and so an unknown icon is caught: a menu whose
 * icon is not in this list renders without icon.
 */
export const HEADER_MENU_ICONS = ['fr-icon-question-fill', 'fr-icon-grid-fill'] as const;

export type HeaderMenuIcon = (typeof HEADER_MENU_ICONS)[number];

export const isMenuIcon = (icon: string): icon is HeaderMenuIcon =>
  (HEADER_MENU_ICONS as readonly string[]).includes(icon);
