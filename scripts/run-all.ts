/**
 * Runs one package script (lint, test, build...) in every brick that defines it.
 * Usage: bun scripts/run-all.ts <script>
 * Missing apps or scripts are reported and skipped; any failure makes the process exit 1.
 */
import { join } from 'node:path';
import { APPS, ROOT, appExists, hasScript, runCommand } from './apps';

const script = process.argv[2];
if (!script) {
  console.error('Usage: bun scripts/run-all.ts <script>');
  process.exit(2);
}

let failed = false;
for (const app of APPS) {
  if (!appExists(app)) {
    console.log(`[${app.id}] skipped: ${app.dir} has no package.json yet`);
    continue;
  }
  if (!(await hasScript(app, script))) {
    console.log(`[${app.id}] skipped: no "${script}" script`);
    continue;
  }
  console.log(`[${app.id}] ${runCommand(app, script).join(' ')} (in ${app.dir})`);
  const proc = Bun.spawn(runCommand(app, script), {
    cwd: join(ROOT, app.dir),
    stdout: 'inherit',
    stderr: 'inherit',
    env: process.env,
  });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`[${app.id}] "${script}" failed with exit code ${code}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
