// Offline checks of what this brick owns: scripts, upstream.json, config, patches.
// Upstream code is not linted (it is not ours, see doc/agents/geonetwork-ui.md).
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { APP_DIR, CONFIG_FILE, PATCHES_DIR, capture, listPatches, log, readUpstream } from './lib.mjs'
import { checkBaseHrefPatch, checkConfig, checkNodeMajor, checkPatchesDocumented } from './checks.mjs'

const problems = []

for (const dir of ['scripts', 'test']) {
  for (const name of readdirSync(join(APP_DIR, dir)).filter((n) => n.endsWith('.mjs'))) {
    if (capture(process.execPath, ['--check', join(APP_DIR, dir, name)]) === null) {
      problems.push(`${dir}/${name}: syntax error`)
    }
  }
}

let upstream
try {
  upstream = readUpstream()
} catch (error) {
  problems.push(error.message)
}

if (upstream) {
  problems.push(...checkConfig(readFileSync(CONFIG_FILE, 'utf8'), upstream))
  const baseHrefPatch = join(PATCHES_DIR, '0002-datahub-base-href.patch')
  problems.push(...checkBaseHrefPatch(readFileSync(baseHrefPatch, 'utf8'), upstream))
}

const patchesDoc = readFileSync(join(APP_DIR, '..', '..', 'doc', 'catalogue-patches.md'), 'utf8')
problems.push(...checkPatchesDocumented(listPatches(PATCHES_DIR), patchesDoc))

// Warning only: a different local major may build, but CI and production use .nvmrc.
const nvmrc = readFileSync(join(APP_DIR, '..', '..', '.nvmrc'), 'utf8')
for (const warning of checkNodeMajor(nvmrc, process.versions.node)) {
  process.stderr.write(`[catalogue] lint warning: ${warning}\n`)
}

if (problems.length) {
  for (const problem of problems) process.stderr.write(`[catalogue] lint: ${problem}\n`)
  process.exit(1)
}
log('lint OK')
