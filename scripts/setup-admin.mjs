import { randomBytes, scryptSync } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { spawnSync } from 'node:child_process';

if (!process.stdin.isTTY) throw new Error('Run this helper in an interactive terminal. Passwords are read without echo.');
const remote = process.argv.includes('--remote');
if (process.argv.slice(2).some(arg => !['--remote', '--local'].includes(arg))) throw new Error('Usage: node scripts/setup-admin.mjs [--local|--remote]');
let muted = false;
const output = new Writable({ write(chunk, _encoding, done) { if (!muted) process.stdout.write(chunk); done(); } });
const input = createInterface({ input: process.stdin, output, terminal: true });
try {
  const username = (await input.question('Manager username: ')).trim();
  if (!/^[A-Za-z0-9_.@-]{3,100}$/.test(username)) throw new Error('Use 3–100 letters, numbers, periods, underscores, @ or hyphens.');
  process.stdout.write('Manager password (at least 14 characters): ');
  muted = true;
  const password = await input.question('');
  muted = false;
  process.stdout.write('\nConfirm password: ');
  muted = true;
  const confirmation = await input.question('');
  muted = false;
  process.stdout.write('\n');
  if (password.length < 14 || password.length > 256 || password !== confirmation) throw new Error('Passwords must match and contain 14–256 characters.');
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }).toString('hex');
  const verifier = `scrypt$32768$8$3$${salt}$${digest}`;
  if (remote) {
    const answer = await input.question(`Set manager credentials for the Cloudflare Worker in wrangler.jsonc as ${username}? Type yes: `);
    if (answer !== 'yes') throw new Error('No remote credentials changed.');
    for (const [key, value] of [['ADMIN_USERNAME', username], ['ADMIN_PASSWORD_HASH', verifier]]) {
      const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'secret', 'put', key], { input: `${value}\n`, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] });
      if (result.status !== 0) throw new Error(`Could not provision ${key}. Rerun to complete setup.`);
    }
    console.log('Manager credentials configured. Existing sessions will no longer authenticate.');
  } else {
    await writeFile('.dev.vars', `ADMIN_USERNAME=${JSON.stringify(username)}\nADMIN_PASSWORD_HASH=${JSON.stringify(verifier)}\nLOCAL_ADMIN_DEV="true"\n`, { mode: 0o600, flag: 'wx' });
    console.log('Local credentials saved in the ignored .dev.vars file. Restart the local Worker.');
  }
} catch (error) {
  muted = false;
  if (error.code === 'EEXIST') console.error('A .dev.vars file already exists. Preserve its other settings and move it aside before running this helper; never commit that file.');
  else console.error(error.message);
  process.exitCode = 1;
} finally { input.close(); }
