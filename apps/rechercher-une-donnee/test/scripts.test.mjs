import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { APP_DIR, CONFIG_FILE, PATCHES_DIR, listPatches, nodeMajor, patchedFiles, readUpstream } from '../scripts/lib.mjs'
import {
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
  assert.equal(problems.length, 2)
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
