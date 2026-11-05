import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { APP_DIR, CONFIG_FILE, PATCHES_DIR, patchedFiles, readUpstream } from '../scripts/lib.mjs'
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
    'apps/datahub/src/app/home/home-page/home-page.component.html',
    'apps/datahub/src/app/router/datahub-page-title-strategy.service.ts',
    'apps/datahub/src/app/router/datahub-router.service.ts',
    'apps/datahub/src/index.html',
    'apps/datahub/src/styles.css',
  ])
})

test('patches 0004 and 0005 stay small and on the expected files', () => {
  const a11y = readFileSync(join(PATCHES_DIR, '0004-upstream-a11y.patch'), 'utf8')
  assert.deepEqual(patchedFiles(a11y).sort(), [
    'apps/datahub/src/app/home/search/search-filters/search-filters.component.html',
    'apps/datahub/src/app/record/record-data-preview/record-data-preview.component.html',
    'apps/datahub/src/app/record/record-header/navigation-bar/navigation-bar.component.html',
    'libs/feature/notify-reuse/src/lib/notify-reuse-form/notify-reuse-form.component.html',
    'libs/feature/record/src/lib/map-view/map-view.component.html',
    'libs/ui/elements/src/lib/api-card/api-card.component.html',
    'libs/ui/elements/src/lib/image-overlay-preview/image-overlay-preview.component.html',
    'libs/ui/elements/src/lib/record-api-form/record-api-form.component.html',
    'libs/ui/inputs/src/lib/autocomplete/autocomplete.component.html',
    'libs/ui/inputs/src/lib/button/button.component.html',
    'libs/ui/inputs/src/lib/button/button.component.ts',
    'libs/ui/inputs/src/lib/copy-text-button/copy-text-button.component.html',
    'libs/ui/inputs/src/lib/dropdown-multiselect/dropdown-multiselect.component.html',
    'libs/ui/inputs/src/lib/dropdown-selector/dropdown-selector.component.html',
    'libs/ui/layout/src/lib/pagination-dots/pagination-dots.component.html',
    'libs/ui/layout/src/lib/previous-next-buttons/previous-next-buttons.component.html',
  ])
  const scope = readFileSync(join(PATCHES_DIR, '0005-elasticsearch-scope.patch'), 'utf8')
  assert.deepEqual(patchedFiles(scope), ['libs/api/repository/src/lib/gn4/elasticsearch/elasticsearch.service.ts'])
  assert.ok(scope.split('\n').filter((l) => /^[+-][^+-]/.test(l)).length < 30)
})

test('the thumbnail placeholder ships in overlay/ and is configured', () => {
  const svg = readFileSync(join(APP_DIR, 'overlay/apps/datahub/src/assets/img/sols-placeholder.svg'), 'utf8')
  assert.ok(svg.length < 50_000)
  assert.match(readFileSync(CONFIG_FILE, 'utf8'), /^thumbnail_placeholder = 'assets\/img\/sols-placeholder.svg'$/m)
})

test('the CSS overrides ship in overlay/ and are loaded by the build (patch 0003)', () => {
  const css = readFileSync(join(APP_DIR, 'overlay/apps/datahub/src/sols-overrides.css'), 'utf8')
  assert.match(css, /gn-ui-sticky-header/)
  const patch = readFileSync(join(PATCHES_DIR, '0003-sols-layout.patch'), 'utf8')
  assert.match(patch, /^\+\s*"apps\/datahub\/src\/sols-overrides.css",$/m)
})
