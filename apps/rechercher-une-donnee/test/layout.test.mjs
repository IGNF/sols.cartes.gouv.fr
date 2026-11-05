import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { PATCHES_DIR, patchedFiles, readUpstream } from '../scripts/lib.mjs'
import {
  assertStaticTemplate,
  buildLayout,
  duplicateToolLinks,
  extractBlock,
  readLayout,
  setCurrentSection,
} from '../scripts/layout.mjs'

const doc = [
  "Liens d'évitement (premier enfant de `body`) :",
  '',
  '<!-- prettier-ignore -->',
  '```html',
  '<div class="fr-skiplinks"></div>',
  '```',
  '',
  'En-tête :',
  '',
  '```html',
  '<header><div class="fr-header__tools-links">',
  '<ul class="fr-btns-group"><li>GIS</li></ul>',
  '</div><div class="fr-header__menu-links"></div>',
  '<a class="fr-nav__link" href="/" target="_self" aria-current="page">Accueil</a>',
  '<a class="fr-nav__link" href="/rechercher-une-donnee/" target="_self">Rechercher</a></header>',
  '```',
  '',
  'Pied de page :',
  '',
  '```html',
  '<footer id="pied-de-page"></footer>',
  '```',
].join('\n')

test('extractBlock reads the html block after its label', () => {
  assert.equal(extractBlock(doc, 'Pied de page'), '<footer id="pied-de-page"></footer>')
  assert.throws(() => extractBlock(doc, 'Absent'), /no html block/)
})

test('setCurrentSection moves aria-current to the catalogue entry', () => {
  const header = setCurrentSection(extractBlock(doc, 'En-tête'), '/rechercher-une-donnee/')
  assert.equal((header.match(/aria-current="page"/g) ?? []).length, 1)
  assert.match(header, /href="\/rechercher-une-donnee\/" target="_self" aria-current="page">/)
  assert.throws(() => setCurrentSection(header, '/absent/'), /no nav link/)
})

test('duplicateToolLinks fills the mobile menu links', () => {
  const header = duplicateToolLinks(extractBlock(doc, 'En-tête'))
  assert.match(header, /<div class="fr-header__menu-links"><ul class="fr-btns-group"><li>GIS<\/li><\/ul><\/div>/)
})

test('assertStaticTemplate rejects Angular syntax', () => {
  assert.throws(() => assertStaticTemplate('x', '<p>{{ a }}</p>'), /Angular/)
  assert.throws(() => assertStaticTemplate('x', '@if (a) {}'), /Angular/)
})

test('buildLayout returns the three blocks', () => {
  assert.deepEqual(Object.keys(buildLayout(doc, '/rechercher-une-donnee/')), ['skiplinks', 'header', 'footer'])
})

test('the real edito reference produces the catalogue header and footer', () => {
  const layout = readLayout(readUpstream().baseHref)
  assert.match(layout.header, /<p class="fr-header__service-title">sols.cartes.gouv.fr<\/p>/)
  assert.match(layout.header, /Observatoire des sols de France/)
  assert.match(layout.header, /href="\/rechercher-une-donnee\/" target="_self" aria-current="page"/)
  assert.match(layout.header, /<div class="fr-header__menu-links"><ul class="fr-btns-group">/)
  assert.match(layout.footer, /id="pied-de-page"/)
  assert.match(layout.skiplinks, /href="#contenu"/)
})

test('patch 0003 only touches the expected upstream files', () => {
  const files = patchedFiles(readFileSync(join(PATCHES_DIR, '0003-sols-layout.patch'), 'utf8'))
  assert.deepEqual(files.sort(), [
    'apps/datahub/project.json',
    'apps/datahub/src/app/app.component.html',
    'apps/datahub/src/app/app.component.ts',
    'apps/datahub/src/app/home/home-header/home-header.component.html',
    'apps/datahub/src/app/record/record-metadata/record-metadata.component.ts',
    'apps/datahub/src/app/router/datahub-page-title-strategy.service.ts',
    'apps/datahub/src/app/router/datahub-router.service.ts',
    'apps/datahub/src/index.html',
  ])
})
