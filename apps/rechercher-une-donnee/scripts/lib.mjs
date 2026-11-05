// Shared helpers for the catalogue brick scripts (no dependencies, Node >= 24).
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
export const UPSTREAM_DIR = join(APP_DIR, '.upstream')
export const PATCHES_DIR = join(APP_DIR, 'patches')
export const CONFIG_FILE = join(APP_DIR, 'config', 'default.toml')
export const DIST_DIR = join(APP_DIR, 'dist')
export const MIN_NODE_MAJOR = 24

/** Reads and validates upstream.json, the single place where the pinned ref lives. */
export function readUpstream(text = readFileSync(join(APP_DIR, 'upstream.json'), 'utf8')) {
  const upstream = JSON.parse(text)
  for (const key of ['repository', 'ref', 'commit', 'app', 'baseHref', 'devPort']) {
    if (upstream[key] === undefined || upstream[key] === '') {
      throw new Error(`upstream.json: missing "${key}"`)
    }
  }
  if (!/^[0-9a-f]{40}$/.test(upstream.commit)) {
    throw new Error('upstream.json: "commit" must be a full 40-character SHA')
  }
  if (!/^\/.*\/$/.test(upstream.baseHref)) {
    throw new Error('upstream.json: "baseHref" must start and end with "/"')
  }
  return upstream
}

/** Patch files, applied in lexical order (0001-..., 0002-...). */
export function listPatches(dir = PATCHES_DIR) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.patch'))
    .sort()
}

/** Upstream files touched by a unified diff. */
export function patchedFiles(patchText) {
  return [...patchText.matchAll(/^diff --git a\/(\S+) b\/\S+$/gm)].map((m) => m[1])
}

export function nodeMajor(version = process.versions.node) {
  return Number(version.split('.')[0])
}

/** Runs a command, inheriting stdio; exits the process on failure. */
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    process.stderr.write(`\n[catalogue] failed: ${command} ${args.join(' ')}\n`)
    process.exit(result.status ?? 1)
  }
  return result
}

/** Runs a command and returns its trimmed stdout, or null on failure. */
export function capture(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options })
  return result.status === 0 ? result.stdout.trim() : null
}

export function log(message) {
  process.stdout.write(`[catalogue] ${message}\n`)
}
