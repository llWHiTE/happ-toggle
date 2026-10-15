'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const readline = require('node:readline');
const { spawn, execFile } = require('node:child_process');
const makeToggle = require('../com.llwhite.happtoggle.sdPlugin/lib/happ-window.js');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fixture = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', path.join(__dirname, 'fixtures/happ-tray-window.ps1')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
const queued = [], waiting = [];
let errors = '';
fixture.stderr.on('data', (data) => { errors += data; });
readline.createInterface({ input: fixture.stdout }).on('line', (line) => {
  const value = JSON.parse(line);
  if (waiting.length) waiting.shift()(value); else queued.push(value);
});
function response() {
  return new Promise((resolve, reject) => {
    let deliver;
    const timer = setTimeout(() => {
      const i = waiting.indexOf(deliver);
      if (i !== -1) waiting.splice(i, 1);
      reject(new Error('Fixture response timeout: ' + errors));
    }, 8000);
    deliver = (value) => { clearTimeout(timer); resolve(value); };
    if (queued.length) deliver(queued.shift()); else waiting.push(deliver);
  });
}
async function command(text) {
  const result = response();
  fixture.stdin.write(text + '\n');
  return result;
}
function forFixture(script) {
  // The tested Win32 implementation is unchanged; only the process allowlist points at our fixture.
  const processGuard = /function Test-HappProcess\(\$p\) \{[\s\S]*?\n\}/;
  assert.match(script, processGuard);
  script = script.replace(processGuard, `function Test-HappProcess($p) { return ($p -and $p.Id -eq ${fixture.pid}) }`);
  return script.replace('Get-Process -Name Happ -ErrorAction SilentlyContinue', `Get-Process -Id ${fixture.pid} -ErrorAction SilentlyContinue`);
}
(async () => {
  try {
    assert.deepEqual(await response(), { ready: true });
    let launches = 0;
    const logs = [];
    const toggle = makeToggle((...args) => logs.push(args), {
      execFile(_file, args, options, cb) {
        const script = forFixture(args.at(-1));
        execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], options, cb);
      },
      exec(uri, _options, cb) {
        assert.equal(uri, 'start "" "happ://toggle_without_ui"');
        launches++;
        // Simulate the deeplink revealing the fixture, never dispatch a real Happ URI.
        command('show').then(() => cb(null), cb);
      },
    });
    await command('hide');
    await toggle('happ://toggle_without_ui');
    await wait(100);
    let state = await command('status');
    assert.equal(state.visible, false, JSON.stringify(logs));
    assert.equal(state.closes, 1);
    await command('show');
    await wait(2100);
    state = await command('status');
    assert.equal(state.visible, true, 'Manual reopening must not be hidden again');
    assert.equal(state.closes, 1);
    await toggle('happ://toggle_without_ui');
    state = await command('status');
    assert.equal(state.visible, true);
    assert.equal(state.closes, 1, 'Visible window must not receive Close');
    await command('minimize');
    await toggle('happ://toggle_without_ui');
    await wait(100);
    state = await command('status');
    assert.equal(state.minimized, true);
    assert.equal(state.closes, 1, 'Minimized window must not be sent to tray');
    assert.equal(launches, 3);
    assert.deepEqual(logs, []);
    console.log('Native window checks passed: tray restored by one WM_CLOSE, reopening stays visible, visible stays visible, minimized stays minimized.');
    console.log('Only the local fixture was controlled; no Happ deeplink, VPN toggle or network request was sent.');
  } finally {
    fixture.stdin.end('quit\n');
    const timer = setTimeout(() => fixture.kill(), 1500);
    timer.unref();
    fixture.once('exit', () => clearTimeout(timer));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
