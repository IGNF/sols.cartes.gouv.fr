import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { APP_DIR, CONFIG_FILE, PATCHES_DIR, patchedFiles, readUpstream } from '../scripts/lib.mjs'
import {
  addBadge,
  assertStaticTemplate,
  buildLayout,
  duplicateToolLinks,
  extractBlock,
  extractSharedCss,
  innerOfDiv,
  readLayout,
  readSharedCss,
  rewriteAssetPaths,
} from '../scripts/layout.mjs'

const header = [
  '<header><div class="fr-header__service"><p class="fr-header__service-title">sols.cartes.gouv.fr</p></div>',
  '<div class="fr-header__tools-links"><div class="fr-nav"><div class="fr-nav__item">',
  '<button aria-controls="menu-help">Aide</button><div class="fr-collapse" id="menu-help"></div>',
  '</div></div></div>',
  '<div class="fr-header__menu-links"></div>',
  '<img src="/assets/brand/logo.png"></header>',
].join('')

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
  header,
  '```',
  '',
  "Pied de page et modale « Paramètres d'affichage » :",
  '',
  '```html',
  '<footer id="pied-de-page"></footer><dialog id="fr-theme-modal"><use href="/dsfr/artwork/x.svg#a"></use></dialog>',
  '```',
].join('\n')

test('extractBlock reads the html block after its label', () => {
  assert.match(extractBlock(doc, 'Pied de page'), /^<footer id="pied-de-page">/)
  assert.throws(() => extractBlock(doc, 'Absent'), /no html block/)
})

test('addBadge puts the brick badge in the service title', () => {
  assert.match(
    addBadge(header, 'Rechercher'),
    /sols.cartes.gouv.fr<span class="fr-badge fr-badge--sm fr-badge--green-menthe">Rechercher<\/span><\/p>/
  )
  assert.equal(addBadge(header, null), header)
  assert.throws(() => addBadge('<header></header>', 'x'), /service title/)
})

test('duplicateToolLinks copies the tool menus into the mobile menu with -mobile ids', () => {
  const out = duplicateToolLinks(header)
  const mobile = innerOfDiv(out, '<div class="fr-header__menu-links">')
  assert.match(mobile, /id="menu-help-mobile"/)
  assert.match(mobile, /aria-controls="menu-help-mobile"/)
  assert.match(out, /<div class="fr-header__tools-links">.*id="menu-help"/)
  assert.equal((out.match(/fr-nav__item--align-right/g) ?? []).length, 2)
})

test('rewriteAssetPaths serves brand images and DSFR artwork under the base href', () => {
  const out = rewriteAssetPaths('<img src="/assets/brand/a.png"><use href="/dsfr/artwork/b.svg#c">', '/r/')
  assert.equal(out, '<img src="/r/assets/brand/a.png"><use href="/r/assets/dsfr/artwork/b.svg#c">')
})

test('assertStaticTemplate rejects Angular syntax', () => {
  assert.throws(() => assertStaticTemplate('x', '<p>{{ a }}</p>'), /Angular/)
  assert.throws(() => assertStaticTemplate('x', '@if (a) {}'), /Angular/)
})

test('buildLayout returns the three blocks', () => {
  const layout = buildLayout(doc, { baseHref: '/r/', badge: 'Rechercher' })
  assert.deepEqual(Object.keys(layout), ['skiplinks', 'header', 'footer'])
  assert.match(layout.footer, /href="\/r\/assets\/dsfr\/artwork\/x.svg#a"/)
})

test('extractSharedCss keeps only the shared header/footer rules', () => {
  const css = '.hero { color: red; }\n.sols-operator { gap: 1rem; }\n@media (min-width: 62em) { .hero { x: y; } .sols-tool-menu { position: relative; } }\n.sols-tool-menu__btn::after { mask-image: url(../dsfr/icons/a.svg); }'
  const out = extractSharedCss(css, '/r/')
  assert.doesNotMatch(out, /hero/)
  assert.match(out, /@media \(min-width: 62em\) \{\n {2}\.sols-tool-menu \{/)
  assert.match(out, /url\(\/r\/assets\/dsfr\/icons\/a.svg\)/)
})

test('the real edito reference produces the v1 catalogue header and footer', () => {
  const layout = readLayout(readUpstream().baseHref)
  assert.match(layout.header, /<p class="fr-header__service-title">sols.cartes.gouv.fr<span class="fr-badge[^"]*">Rechercher<\/span><\/p>/)
  assert.match(layout.header, /Observatoire des sols de France/)
  assert.match(layout.header, /id="menu-services-mobile"/)
  assert.match(layout.header, /src="\/rechercher-une-donnee\/assets\/brand\/logo-gissol.png"/)
  assert.match(layout.footer, /id="pied-de-page"/)
  assert.match(layout.footer, /<dialog id="fr-theme-modal"/)
  assert.match(layout.skiplinks, /href="#contenu"/)
  assert.match(readSharedCss('/rechercher-une-donnee/'), /\.sols-partner-logo/)
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
  assert.match(patch, /^\+\s*"apps\/datahub\/src\/sols-overrides.css",?$/m)
  assert.match(patch, /^\+\s*"apps\/datahub\/src\/sols-shared.css",?$/m)
})

test('patch 0006 adds record-level map links on the expected files (C10)', () => {
  const patch = readFileSync(join(PATCHES_DIR, '0006-record-map-links.patch'), 'utf8')
  assert.deepEqual(patchedFiles(patch).sort(), [
    'apps/datahub/src/app/record/record-apis/record-apis.component.html',
    'apps/datahub/src/app/record/record-apis/record-apis.component.ts',
    'libs/feature/record/src/lib/external-viewer-button/external-viewer-button.component.html',
    'libs/feature/record/src/lib/external-viewer-button/external-viewer-button.component.ts',
  ])
  assert.match(patch, /\['wms', 'wmts'\]/)
})
