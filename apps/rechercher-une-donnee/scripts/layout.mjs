// Builds the catalogue skip links, header and footer from the shared reference
// markup in doc/agents/edito.md (single source: the edito partials), so the
// three bricks stay identical. Only the current section changes.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { APP_DIR } from './lib.mjs'

export const EDITO_DOC = join(APP_DIR, '..', '..', 'doc', 'agents', 'edito.md')

const BLOCKS = {
  skiplinks: "Liens d'évitement",
  header: 'En-tête',
  footer: 'Pied de page',
}

/** Extracts the html code block that follows a "<label> ... :" line. */
export function extractBlock(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^${escaped}[^\\n]*:\\n\\n(?:<!-- prettier-ignore -->\\n)?\`\`\`html\\n([\\s\\S]*?)\\n\`\`\``, 'm')
  const match = markdown.match(pattern)
  if (!match) throw new Error(`doc/agents/edito.md: no html block after "${label} ... :"`)
  return match[1]
}

/** Moves aria-current="page" from the edito entry to the nav link whose href is currentPath. */
export function setCurrentSection(header, currentPath) {
  const withoutCurrent = header.replace(/ aria-current="page"/g, '')
  const link = new RegExp(`(<a class="fr-nav__link" href="${currentPath}"[^>]*?)>`)
  if (!link.test(withoutCurrent)) throw new Error(`header: no nav link to ${currentPath}`)
  return withoutCurrent.replace(link, '$1 aria-current="page">')
}

/** Rejects markup that Angular would interpret instead of rendering as is. */
export function assertStaticTemplate(name, html) {
  if (/[{}@]/.test(html)) throw new Error(`${name}: "{", "}" or "@" would be parsed by Angular`)
  return html
}

/**
 * In static pages the DSFR script copies the header tool links into the mobile
 * menu; in "angular" mode it does not (console warning), so the copy is done here.
 */
export function duplicateToolLinks(header) {
  const tools = header.match(/<div class="fr-header__tools-links">\s*(<ul class="fr-btns-group">[\s\S]*?<\/ul>)/)
  const empty = '<div class="fr-header__menu-links"></div>'
  if (!tools || !header.includes(empty)) throw new Error('header: tool links or empty menu links not found')
  return header.replace(empty, `<div class="fr-header__menu-links">${tools[1]}</div>`)
}

export function buildLayout(markdown, currentPath) {
  const blocks = Object.fromEntries(
    Object.entries(BLOCKS).map(([name, label]) => [name, extractBlock(markdown, label)])
  )
  blocks.header = duplicateToolLinks(setCurrentSection(blocks.header, currentPath))
  for (const [name, html] of Object.entries(blocks)) assertStaticTemplate(name, html)
  return blocks
}

export function readLayout(currentPath) {
  return buildLayout(readFileSync(EDITO_DOC, 'utf8'), currentPath)
}
