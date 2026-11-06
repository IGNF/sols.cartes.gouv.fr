/**
 * Shared site identity, read from `@sols/brand` (packages/brand/brand.json, single source for the three
 * bricks): header and footer content must not be written here.
 */
import brand from '@sols/brand/brand.json';
import gissolLogoUrl from '@sols/brand/assets/logo-gissol.png';
import ignLogoUrl from '@sols/brand/assets/logo-ign.png';
import inraeLogoUrl from '@sols/brand/assets/logo-inrae.svg';
import osfMarkUrl from '@sols/brand/assets/osf-carotte.png';

export const BRAND = brand;

/** « République Française » block of the Marianne logo (DSFR, not part of the brand file). */
export const BRAND_TOP = ['République', 'Française'] as const;

/** Header images, published by Vite. */
export const BRAND_IMAGES = { gissolLogo: gissolLogoUrl, osfMark: osfMarkUrl } as const;

/** Brand asset paths (relative to @sols/brand, as written in brand.json) → URLs published by Vite. */
const BRAND_ASSET_URLS: Readonly<Record<string, string>> = {
  'assets/logo-gissol.png': gissolLogoUrl,
  'assets/logo-ign.png': ignLogoUrl,
  'assets/logo-inrae.svg': inraeLogoUrl,
};

/** Footer partners (`footer.partners`) with their logo URL; a partner whose logo is not imported is skipped. */
export const FOOTER_PARTNERS = brand.footer.partners.flatMap((partner) => {
  const logo = BRAND_ASSET_URLS[partner.logo];
  return logo ? [{ ...partner, logo }] : [];
});

/** Footer strings that are not brand content (edito wording, `apps/accueil/src/_data/i18n/fr.js`). */
export const FOOTER_LABELS = {
  partnersTitle: 'Nos partenaires',
  /** Toggle of the expandable footer, collapsed (cartes.gouv.fr wording). */
  expand: 'Haut de page',
  /** Toggle of the expandable footer, expanded. */
  collapse: 'Fermer',
} as const;

/** `title` of a link opening a new window: « <libellé> - nouvelle fenêtre » (DSFR, RGAA 13.2). */
export const newWindowTitle = (label: string) => `${label} - nouvelle fenêtre`;

/** Badge locating the user in the portal ("Explorer" on the carto brick). */
export const SERVICE_BADGE = brand.badges.carto;

/** `badgeStyles` of brand.json (E10; absent from older brand files, hence optional). */
interface BadgeStyle {
  color?: string;
  icon?: string;
}

/**
 * DSFR classes of the service badge, from `badgeStyles.carto`. Color and icon are mapped to literal class
 * names (allow list) so `react-dsfr update-icons` keeps the icon and `fr.cx` stays typed; an unknown or
 * missing value falls back to the v1 badge (purple glycine, map pin).
 */
const BADGE_COLOR_CLASSES = {
  'purple-glycine': 'fr-badge--purple-glycine',
  'green-menthe': 'fr-badge--green-menthe',
} as const;

const BADGE_ICON_CLASSES = ['fr-icon-map-pin-2-fill', 'fr-icon-search-line'] as const;

const badgeStyle = (brand as { badgeStyles?: Record<string, BadgeStyle | undefined> }).badgeStyles
  ?.carto;

const pick = <T extends string>(
  allowed: readonly T[],
  value: string | undefined,
  fallback: T,
): T => ((allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback);

export const SERVICE_BADGE_CLASSES = {
  color:
    BADGE_COLOR_CLASSES[
      pick(
        Object.keys(BADGE_COLOR_CLASSES) as (keyof typeof BADGE_COLOR_CLASSES)[],
        badgeStyle?.color,
        'purple-glycine',
      )
    ],
  icon: pick(BADGE_ICON_CLASSES, badgeStyle?.icon, 'fr-icon-map-pin-2-fill'),
} as const;

/** Language of the brick (no language switch): resolves the `{lang}` of brand `hrefTemplate`s. */
export const SITE_LANG = 'fr';

/**
 * Item of a header tool menu (brand.json `header.tools.*.items`; the optional fields come with E10 and are
 * absent from older brand files). `external` (or an absolute `http(s)` href) opens a new window and gets the
 * DSFR external-link icon after the label; `icon`, a DSFR icon listed in HEADER_MENU_ICONS, is drawn before.
 */
export interface HeaderMenuItem {
  label: string;
  href: string;
  /** E10: localised href, `{lang}` replaced by SITE_LANG (this brick has no language switch). */
  hrefTemplate?: string;
  description?: string;
  external?: boolean;
  icon?: string;
}

/** A header tool menu (`header.tools.help`, `header.tools.services`). */
export interface HeaderMenuSpec {
  label: string;
  icon: string;
  items: readonly HeaderMenuItem[];
}

/** Href of a menu item: its `hrefTemplate` resolved for SITE_LANG, else its `href`. */
export const itemHref = (item: HeaderMenuItem) =>
  item.hrefTemplate ? item.hrefTemplate.replaceAll('{lang}', SITE_LANG) : item.href;

/** True when a menu item leaves the portal (new window). */
export const isExternalItem = (item: HeaderMenuItem) =>
  item.external === true || /^https?:\/\//.test(itemHref(item));

/**
 * Icons of the brand menus (`header.tools.*.icon` and `header.tools.*.items[].icon` in brand.json). Listed
 * here so `react-dsfr update-icons` (which only scans the app sources) keeps them in the CSS, and so an
 * unknown icon is caught: a menu or an item whose icon is not in this list renders without icon. The item
 * icons are those of the cartes.gouv.fr « Aide » menu (`headerParams.js` of cartes.gouv.fr-entree-carto)
 * plus `fr-icon-question-line` (E10).
 */
export const HEADER_MENU_ICONS = [
  'fr-icon-question-fill',
  'fr-icon-grid-fill',
  'fr-icon-question-line',
  'fr-icon-question-mark',
  'fr-icon-book-2-line',
  'fr-icon-rfid-line',
  'fr-icon-mail-line',
] as const;

export type HeaderMenuIcon = (typeof HEADER_MENU_ICONS)[number];

export const isMenuIcon = (icon: string | undefined): icon is HeaderMenuIcon =>
  icon !== undefined && (HEADER_MENU_ICONS as readonly string[]).includes(icon);

/** Label of the compact footer link back to the header. */
export const BACK_TO_TOP_LABEL = 'Haut de page';
