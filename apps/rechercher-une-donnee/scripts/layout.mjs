// Builds the catalogue skip links, header and footer (v1) from the shared reference
// markup in doc/agents/edito.md (single source: the edito partials, themselves fed by
// packages/brand/brand.json), so the three bricks stay identical. The catalogue only adds
// its badge, copies the tool menus into the mobile menu and serves the images itself.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { APP_DIR } from './lib.mjs'

export const REPO_DIR = join(APP_DIR, '..', '..')
export const EDITO_DOC = join(REPO_DIR, 'doc', 'agents', 'edito.md')
export const BRAND_DIR = join(REPO_DIR, 'packages', 'brand')
export const EDITO_CSS = join(REPO_DIR, 'apps', 'accueil', 'src', 'css', 'site.css')

const BLOCKS = {
  skiplinks: "Liens d'évitement",
  header: 'En-tête',
  footer: 'Pied de page',
}

/** Shared rules of the edito stylesheet that the header and footer markup relies on. */
export const SHARED_CSS_PREFIXES = [
  '.sols-operator',
  '.sols-tool-menu',
  '.sols-partner-logo',
  '.fr-header__tools-links',
]

/** Label of the v1.1 block holding the catalogue service title with its badge (E10). */
export const BADGE_TITLE_LABEL = 'Titre du service avec badge, catalogue'

/** Extracts the html code block that follows a "<label> ... :" line. */
export function extractBlock(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `^${escaped}[^\\n]*:\\n\\n(?:<!-- prettier-ignore -->\\n)?\`\`\`html\\n([\\s\\S]*?)\\n\`\`\``,
    'm'
  )
  const match = markdown.match(pattern)
  if (!match) throw new Error(`doc/agents/edito.md: no html block after "${label} ... :"`)
  return match[1]
}

/**
 * Replaces the plain service title of the header with the catalogue title + badge block of the
 * reference (v1.1: badge colour and DSFR icon, `brand.json` `badgeStyles.catalogue`).
 */
export function addBadge(header, badgeTitle) {
  const title = '<p class="fr-header__service-title">sols.cartes.gouv.fr</p>'
  if (!header.includes(title)) throw new Error('header: service title not found')
  if (!/^<p class="fr-header__service-title">sols\.cartes\.gouv\.fr <span class="fr-badge[^"]*">[^<]+<\/span><\/p>$/.test(badgeTitle)) {
    throw new Error('badge title block: unexpected markup')
  }
  return header.replace(title, badgeTitle)
}

/**
 * In static pages the DSFR script copies the header tools into the mobile menu
 * (suffixing ids with "-mobile"); in "angular" mode it does not, so the copy is done here.
 */
export function duplicateToolLinks(header) {
  const openTag = '<div class="fr-header__tools-links">'
  const empty = '<div class="fr-header__menu-links"></div>'
  const tools = innerOfDiv(header, openTag)
  if (tools === null || !header.includes(empty)) {
    throw new Error('header: tool links or empty menu links not found')
  }
  // The DSFR script adds this modifier to the tool menus at runtime, then compares both copies
  // (console warning if they differ): set it upfront in both.
  const aligned = tools.replaceAll(
    'class="fr-nav__item"',
    'class="fr-nav__item fr-nav__item--align-right"'
  )
  const ids = [...aligned.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  let mobile = aligned
  for (const id of ids) {
    mobile = mobile
      .replaceAll(`id="${id}"`, `id="${id}-mobile"`)
      .replaceAll(`aria-controls="${id}"`, `aria-controls="${id}-mobile"`)
  }
  return header
    .replace(`${openTag}${tools}`, `${openTag}${aligned}`)
    .replace(empty, `<div class="fr-header__menu-links">${mobile}</div>`)
}

/** Content of the div opened by `openTag`, up to its matching </div> (null if absent). */
export function innerOfDiv(html, openTag) {
  const start = html.indexOf(openTag)
  if (start === -1) return null
  const tags = /<div\b|<\/div>/g
  tags.lastIndex = start + openTag.length
  let depth = 1
  for (let m = tags.exec(html); m; m = tags.exec(html)) {
    depth += m[0] === '</div>' ? -1 : 1
    if (depth === 0) return html.slice(start + openTag.length, m.index)
  }
  return null
}

/** Root-relative asset paths of the shared markup, served by the catalogue under its base href. */
export function rewriteAssetPaths(html, baseHref) {
  return html
    .replaceAll('src="/assets/brand/', `src="${baseHref}assets/brand/`)
    .replaceAll('href="/dsfr/artwork/', `href="${baseHref}assets/dsfr/artwork/`)
}

/** Rejects markup that Angular would interpret instead of rendering as is. */
export function assertStaticTemplate(name, html) {
  if (/[{}@]/.test(html)) throw new Error(`${name}: "{", "}" or "@" would be parsed by Angular`)
  return html
}

export function buildLayout(markdown, { baseHref }) {
  const blocks = Object.fromEntries(
    Object.entries(BLOCKS).map(([name, label]) => [name, extractBlock(markdown, label)])
  )
  blocks.header = duplicateToolLinks(addBadge(blocks.header, extractBlock(markdown, BADGE_TITLE_LABEL)))
  for (const [name, html] of Object.entries(blocks)) {
    blocks[name] = assertStaticTemplate(name, rewriteAssetPaths(html, baseHref))
  }
  return blocks
}

/**
 * Cross-check of the injected header with packages/brand/brand.json: badge label, colour and icon
 * (`badges.catalogue`, `badgeStyles.catalogue`) and external help links (new window, rel external).
 */
export function checkHeaderAgainstBrand(header, brand) {
  const problems = []
  const style = brand.badgeStyles?.catalogue
  const badge = `<span class="fr-badge fr-badge--sm fr-badge--${style?.color} fr-badge--icon-left ${style?.icon}">${brand.badges?.catalogue}</span>`
  if (!header.includes(badge)) problems.push(`badge: expected ${badge}`)
  for (const item of brand.header?.tools?.help?.items ?? []) {
    if (!item.external) continue
    const link = new RegExp(`<a class="[^"]*${item.icon}[^"]*" href="${item.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" target="_blank" rel="noopener external"`)
    if (!link.test(header)) problems.push(`help link: ${item.label} (${item.href}) not found as an external link`)
  }
  if (problems.length) throw new Error(`header differs from brand.json: ${problems.join('; ')}`)
  return header
}

/**
 * Cross-check of the injected footer with packages/brand/brand.json: every bottom link
 * (`footer.bottomLinks`) with its href, external ones (pages read on cartes.gouv.fr) in a new window.
 */
export function checkFooterAgainstBrand(footer, brand) {
  const problems = []
  for (const link of brand.footer?.bottomLinks ?? []) {
    const anchor = `<a class="fr-footer__bottom-link" href="${link.href}"${link.external ? ' target="_blank" rel="noopener external"' : ''}`
    if (!footer.includes(anchor)) problems.push(`bottom link: ${link.label} (${link.href}) not found`)
  }
  if (problems.length) throw new Error(`footer differs from brand.json: ${problems.join('; ')}`)
  return footer
}

export function readLayout(baseHref) {
  const layout = buildLayout(readFileSync(EDITO_DOC, 'utf8'), { baseHref })
  const brand = JSON.parse(readFileSync(join(BRAND_DIR, 'brand.json'), 'utf8'))
  checkHeaderAgainstBrand(layout.header, brand)
  checkFooterAgainstBrand(layout.footer, brand)
  return layout
}

/** Splits a stylesheet into top-level blocks ("prelude { body }"), comments dropped. */
function topLevelBlocks(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const blocks = []
  let depth = 0
  let start = 0
  let open = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) open = i
      depth++
    } else if (text[i] === '}') {
      depth--
      if (depth === 0) {
        blocks.push({ prelude: text.slice(start, open).trim(), body: text.slice(open + 1, i) })
        start = i + 1
      }
    }
  }
  return blocks
}

/**
 * Rules of the edito stylesheet whose selector uses one of the shared prefixes (top level or
 * inside @media), with url(../dsfr/...) rewritten to the catalogue assets.
 */
export function extractSharedCss(css, baseHref, prefixes = SHARED_CSS_PREFIXES) {
  const matches = (selector) => prefixes.some((prefix) => selector.includes(prefix))
  const out = []
  for (const { prelude, body } of topLevelBlocks(css)) {
    if (prelude.startsWith('@media')) {
      const inner = topLevelBlocks(body).filter((rule) => matches(rule.prelude))
      if (inner.length) {
        out.push(`${prelude} {\n${inner.map((r) => `  ${r.prelude} {${r.body}}`).join('\n')}\n}`)
      }
    } else if (matches(prelude)) {
      out.push(`${prelude} {${body}}`)
    }
  }
  if (!out.length) throw new Error('site.css: no shared header/footer rule found')
  return out.join('\n\n').replaceAll('url(../dsfr/', `url(${baseHref}assets/dsfr/`) + '\n'
}

export function readSharedCss(baseHref) {
  return (
    '/* Generated by scripts/prepare.mjs from apps/accueil/src/css/site.css (shared header/footer rules). */\n' +
    extractSharedCss(readFileSync(EDITO_CSS, 'utf8'), baseHref)
  )
}

/**
 * Mobile header script (E9): the js block that follows the "Échap dans le menu mobile" paragraph of
 * doc/agents/edito.md, mirrored there from apps/accueil/src/js/header.js. Fails if it is missing.
 */
export function extractHeaderScript(markdown) {
  const start = markdown.indexOf('**Échap dans le menu mobile')
  const match = start === -1 ? null : markdown.slice(start).match(/```js\n([\s\S]*?)\n```/)
  if (!match) throw new Error('doc/agents/edito.md: no js block after "Échap dans le menu mobile"')
  if (!/addEventListener\(/.test(match[1])) throw new Error('doc/agents/edito.md: header script looks wrong')
  return match[1]
}

export function readHeaderScript() {
  return (
    '// Generated by scripts/prepare.mjs from doc/agents/edito.md (mirror of apps/accueil/src/js/header.js, E9).\n' +
    extractHeaderScript(readFileSync(EDITO_DOC, 'utf8')) +
    '\n'
  )
}

/** DSFR icon files referenced by the shared CSS (`url(<baseHref>assets/dsfr/icons/<path>)`). */
export function referencedDsfrIcons(css, baseHref) {
  const prefix = `${baseHref}assets/dsfr/icons/`
  return [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]).filter((u) => u.startsWith(prefix)))].map(
    (u) => u.slice(prefix.length)
  )
}
