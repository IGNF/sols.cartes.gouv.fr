import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { APP_DIR, CONFIG_FILE, NX_ENV, PATCHES_DIR, listPatches, nodeMajor, patchedFiles, readUpstream } from '../scripts/lib.mjs'
import {
  EXTERNAL_VIEWER_TEMPLATE,
  checkBaseHrefPatch,
  checkConfig,
  checkNodeMajor,
  checkPatchesDocumented,
  quotesBalanced,
} from '../scripts/checks.mjs'

const valid = {
  repository: 'https://github.com/IGNF/geonetwork-ui.git',
  ref: 'v1.6.2',
  commit: '72b9eb4e81b813330a3323503afebc0d1c622a4d',
  app: 'datahub',
  baseHref: '/rechercher-une-donnee/',
  devPort: 4200,
}

test('upstream.json pins a full commit and serves under /rechercher-une-donnee/', () => {
  const upstream = readUpstream()
  assert.match(upstream.commit, /^[0-9a-f]{40}$/)
  assert.equal(upstream.baseHref, '/rechercher-une-donnee/')
  assert.equal(upstream.devPort, 4200)
})

test('readUpstream rejects a short SHA, a missing key and a bad base href', () => {
  assert.throws(() => readUpstream(JSON.stringify({ ...valid, commit: '72b9eb4' })), /40-character/)
  assert.throws(() => readUpstream(JSON.stringify({ ...valid, ref: '' })), /missing "ref"/)
  assert.throws(() => readUpstream(JSON.stringify({ ...valid, baseHref: 'x' })), /baseHref/)
})

test('our config passes the checks', () => {
  assert.deepEqual(checkConfig(readFileSync(CONFIG_FILE, 'utf8'), valid), [])
})

test('the config keeps the sols scope on the gissol-osf_g group', () => {
  assert.match(readFileSync(CONFIG_FILE, 'utf8'), /^config_filters\.groupPublished = \['gissol-osf_g'\]$/m)
})

test('checkConfig reports a missing scope and a wrong datahub_url', () => {
  const problems = checkConfig('[global]\ngeonetwork4_api_url = "https://x"\ndatahub_url = "/other"\n', valid)
  assert.equal(problems.length, 4)
  assert.match(problems.join('\n'), /datahub_url/)
  assert.match(problems.join('\n'), /config_filters/)
})

test('patches are ordered, documented and only touch the expected upstream files', () => {
  const names = listPatches()
  assert.deepEqual(names, [...names].sort())
  const doc = readFileSync(join(APP_DIR, '..', '..', 'doc', 'catalogue-patches.md'), 'utf8')
  assert.deepEqual(checkPatchesDocumented(names, doc), [])
  const files = patchedFiles(readFileSync(join(PATCHES_DIR, '0001-search-config-filters.patch'), 'utf8'))
  assert.deepEqual(files.sort(), [
    'apps/datahub/src/app/app.component.ts',
    'libs/util/app-config/src/lib/app-config.ts',
    'libs/util/app-config/src/lib/model.ts',
  ])
  const baseHref = readFileSync(join(PATCHES_DIR, '0002-datahub-base-href.patch'), 'utf8')
  assert.deepEqual(patchedFiles(baseHref), ['apps/datahub/project.json'])
})

test('patch 0002 base href matches upstream.json', () => {
  const patch = readFileSync(join(PATCHES_DIR, '0002-datahub-base-href.patch'), 'utf8')
  assert.deepEqual(checkBaseHrefPatch(patch, readUpstream()), [])
  assert.equal(checkBaseHrefPatch(patch, { ...valid, baseHref: '/autre/' }).length, 1)
})

test('checkPatchesDocumented flags an undocumented patch', () => {
  assert.equal(checkPatchesDocumented(['0009-x.patch'], 'nothing').length, 1)
})

test('nodeMajor parses a version string', () => {
  assert.equal(nodeMajor('26.5.0'), 26)
})

test('quotesBalanced ignores # inside strings and catches open strings', () => {
  assert.equal(quotesBalanced('primary_color = "#000091" # comment'), true)
  assert.equal(quotesBalanced("x = \"l'accès\""), true)
  assert.equal(quotesBalanced('x = "open'), false)
})

test('checkNodeMajor compares the running major with .nvmrc', () => {
  assert.deepEqual(checkNodeMajor('24\n', '24.18.0'), [])
  assert.deepEqual(checkNodeMajor('v24', '24.1.0'), [])
  assert.match(checkNodeMajor('24', '26.5.0')[0], /differs from .nvmrc \(24\)/)
})

test('the "Voir sur la carte" template is the cartes.gouv.fr format (C6), same tab', () => {
  const toml = readFileSync(CONFIG_FILE, 'utf8')
  assert.equal(
    toml.match(/^external_viewer_url_template = '(.*)'$/m)?.[1],
    '/explorer-les-cartes/?l=${layer_name}$GEOPORTAIL:${geop_type}:${service_type}(1;1;1;0${tms_style})&permalink=no'
  )
  assert.equal(EXTERNAL_VIEWER_TEMPLATE, toml.match(/^external_viewer_url_template = '(.*)'$/m)?.[1])
  assert.match(toml, /^external_viewer_open_new_tab = false$/m)
})

test('checkConfig reports a wrong viewer template', () => {
  const toml = readFileSync(CONFIG_FILE, 'utf8').replace('&permalink=no', '')
  assert.match(checkConfig(toml, valid).join('\n'), /external_viewer_url_template/)
})

test('search filters and keyword presets stay within the sols scope (C9)', () => {
  const toml = readFileSync(CONFIG_FILE, 'utf8')
  assert.match(toml, /^advanced_filters = \['topic', 'keyword'\]$/m)
  assert.match(toml, /^do_not_use_default_search_preset = true$/m)
  const presets = [...toml.matchAll(/^\[\[search_preset\]\]\n(?:\s+#.*\n)*\s+name = '([^']+)'\n\s+filters\.keyword = \['([^']+)'\]$/gm)]
  assert.ok(presets.length >= 3)
  for (const [, name, keyword] of presets) assert.equal(name, keyword)
})

test('nx runs without daemon, Nx Cloud or the Nx Console install prompt', () => {
  assert.deepEqual(NX_ENV, {
    NX_DAEMON: 'false',
    NX_NO_CLOUD: 'true',
    NX_SKIP_VSCODE_EXTENSION_INSTALL: 'true',
  })
  for (const script of ['build.mjs', 'dev.mjs']) {
    const source = readFileSync(join(APP_DIR, 'scripts', script), 'utf8')
    assert.match(source, /env: \{ \.\.\.process\.env, \.\.\.NX_ENV \}/, `${script} must pass NX_ENV to nx`)
  }
})
