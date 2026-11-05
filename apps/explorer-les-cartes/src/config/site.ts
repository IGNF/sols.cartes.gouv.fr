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
