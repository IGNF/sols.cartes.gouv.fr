// Production build of the datahub, served under upstream.baseHref, copied to dist/.
import { cpSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { DIST_DIR, UPSTREAM_DIR, log, run } from './lib.mjs'
import { prepare } from './prepare.mjs'

const upstream = prepare()
run('npx', ['nx', 'build', upstream.app, '--configuration=production',
  `--base-href=${upstream.baseHref}`, '--skip-nx-cache'], {
  cwd: UPSTREAM_DIR,
  env: { ...process.env, NX_DAEMON: 'false', NX_NO_CLOUD: 'true' },
})
rmSync(DIST_DIR, { recursive: true, force: true })
cpSync(join(UPSTREAM_DIR, 'dist', 'apps', upstream.app), DIST_DIR, { recursive: true })
log(`build copied to ${DIST_DIR}`)
