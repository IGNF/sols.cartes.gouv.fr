// Production build of the datahub, served under upstream.baseHref, copied to dist/.
import { cpSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { DIST_DIR, NX_ENV, UPSTREAM_DIR, log, run, servedBaseHref } from './lib.mjs'
import { prepare } from './prepare.mjs'

const upstream = prepare()
// The base href comes from project.json (patch 0002, value checked against upstream.json by lint),
// shared with the dev server; only a build under another SITE_BASE overrides it.
const baseHref = servedBaseHref(upstream)
const baseHrefArgs = baseHref === upstream.baseHref ? [] : [`--base-href=${baseHref}`]
const nxArgs = ['nx', 'build', upstream.app, '--configuration=production', '--skip-nx-cache']
run('npx', [...nxArgs, ...baseHrefArgs], {
  cwd: UPSTREAM_DIR,
  env: { ...process.env, ...NX_ENV },
})
const output = join(UPSTREAM_DIR, 'dist', 'apps', upstream.app)
// An interrupted earlier build can leave this folder empty; never publish an empty catalogue.
if (!existsSync(join(output, 'index.html'))) {
  throw new Error(`no index.html in ${output}: the Nx build produced no page`)
}
rmSync(DIST_DIR, { recursive: true, force: true })
cpSync(output, DIST_DIR, { recursive: true })
log(`build copied to ${DIST_DIR}`)
