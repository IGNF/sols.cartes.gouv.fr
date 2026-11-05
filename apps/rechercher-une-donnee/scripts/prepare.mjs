// Prepares .upstream/: pinned shallow clone of IGNF/geonetwork-ui, npm ci,
// our patches and our configuration on top. Idempotent.
import { createHash } from 'node:crypto'
import {
  constants,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  APP_DIR,
  CONFIG_FILE,
  MIN_NODE_MAJOR,
  PATCHES_DIR,
  UPSTREAM_DIR,
  capture,
  listPatches,
  log,
  nodeMajor,
  readUpstream,
  run,
} from './lib.mjs'
import { BRAND_DIR, readLayout, readSharedCss } from './layout.mjs'

const INSTALL_STAMP = join(UPSTREAM_DIR, 'node_modules', '.sols-install-stamp')

function ensureClone(upstream) {
  const head = existsSync(join(UPSTREAM_DIR, '.git'))
    ? capture('git', ['-C', UPSTREAM_DIR, 'rev-parse', 'HEAD'])
    : null
  if (head === upstream.commit) return
  if (head) log(`upstream at ${head}, expected ${upstream.commit}: recloning`)
  rmSync(UPSTREAM_DIR, { recursive: true, force: true })
  log(`cloning ${upstream.repository} at ${upstream.ref}`)
  run('git', ['-c', 'advice.detachedHead=false', 'clone', '--quiet', '--depth', '1',
    '--branch', upstream.ref, upstream.repository, UPSTREAM_DIR])
  const cloned = capture('git', ['-C', UPSTREAM_DIR, 'rev-parse', 'HEAD'])
  if (cloned !== upstream.commit) {
    throw new Error(`ref ${upstream.ref} resolves to ${cloned}, upstream.json pins ${upstream.commit}`)
  }
}

function resetWorkingTree() {
  // Index and tracked files back to the pinned commit; ignored files (node_modules, dist) are kept.
  run('git', ['-C', UPSTREAM_DIR, 'reset', '--quiet', '--hard', 'HEAD'])
  run('git', ['-C', UPSTREAM_DIR, 'clean', '--quiet', '-fd'])
}

function ensureInstall() {
  const lock = readFileSync(join(UPSTREAM_DIR, 'package-lock.json'))
  const digest = createHash('sha256').update(lock).digest('hex')
  if (existsSync(INSTALL_STAMP) && readFileSync(INSTALL_STAMP, 'utf8') === digest) return
  log('npm ci in .upstream (about 2 GB)')
  // --allow-remote=all: npm >= 12 refuses remote tarballs by default, and the
  // upstream lockfile pulls xlsx from cdn.sheetjs.com.
  run('npm', ['ci', '--no-audit', '--no-fund', '--allow-remote=all'], { cwd: UPSTREAM_DIR })
  writeFileSync(INSTALL_STAMP, digest)
}

function applyPatches() {
  for (const name of listPatches()) {
    const file = join(PATCHES_DIR, name)
    run('git', ['-C', UPSTREAM_DIR, 'apply', '--check', file])
    run('git', ['-C', UPSTREAM_DIR, 'apply', file])
    log(`patch applied: ${name}`)
  }
}

/** All files under dir, recursively. */
export function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

function applyOverlay(upstream) {
  copyFileSync(CONFIG_FILE, join(UPSTREAM_DIR, 'conf', 'default.toml'))
  log('config/default.toml copied to .upstream/conf/default.toml')
  // New files of ours, copied one by one; COPYFILE_EXCL fails if an upstream file
  // already exists at that path (modifying upstream files is the job of patches).
  const overlayDir = join(APP_DIR, 'overlay')
  for (const file of listFiles(overlayDir)) {
    const target = join(UPSTREAM_DIR, relative(overlayDir, file))
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(file, target, constants.COPYFILE_EXCL)
  }
  const layoutDir = join(UPSTREAM_DIR, 'apps', upstream.app, 'src', 'app', 'sols-layout')
  for (const [name, html] of Object.entries(readLayout(upstream.baseHref))) {
    writeFileSync(join(layoutDir, `sols-${name}.component.html`), `${html}\n`)
  }
  const appSrc = join(UPSTREAM_DIR, 'apps', upstream.app, 'src')
  writeFileSync(join(appSrc, 'sols-shared.css'), readSharedCss(upstream.baseHref))
  // Brand images of @sols/brand (logos), served under <baseHref>assets/brand/
  const brandAssets = join(BRAND_DIR, 'assets')
  for (const file of readdirSync(brandAssets, { withFileTypes: true }).filter((e) => e.isFile())) {
    const target = join(appSrc, 'assets', 'brand', file.name)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(brandAssets, file.name), target, constants.COPYFILE_EXCL)
  }
  log('overlay/ copied, header/footer and shared CSS generated from the edito reference, brand images copied')
}

export function prepare({ install = true } = {}) {
  if (nodeMajor() < MIN_NODE_MAJOR) {
    throw new Error(`Node >= ${MIN_NODE_MAJOR} required, found ${process.versions.node}`)
  }
  const upstream = readUpstream()
  ensureClone(upstream)
  resetWorkingTree()
  if (install) ensureInstall()
  applyPatches()
  applyOverlay(upstream)
  return upstream
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  prepare({ install: !process.argv.includes('--no-install') })
}
