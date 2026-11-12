// Dev server on upstream.devPort, under upstream.baseHref.
import { NX_ENV, UPSTREAM_DIR, log, run } from './lib.mjs'
import { prepare } from './prepare.mjs'

const upstream = prepare()
log(`http://localhost:${upstream.devPort}${upstream.baseHref}`)
// The dev server takes its serve path from the build baseHref (patch 0002).
run('npx', ['nx', 'serve', upstream.app, `--port=${upstream.devPort}`], {
  cwd: UPSTREAM_DIR,
  env: { ...process.env, ...NX_ENV },
})
