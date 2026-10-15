'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const makeToggle = require('../com.llwhite.happtoggle.sdPlugin/lib/happ-window.js');

function harness(state, options = {}) {
  const calls = [], logs = [];
  const toggle = makeToggle((...args) => logs.push(args), {
    execFile(file, args, settings, cb) {
      const index = calls.filter((c) => c.type === 'powershell').length;
      calls.push({ type: 'powershell', file, script: args.at(-1), settings });
      if (index === 0) cb(options.snapshotError || null, options.snapshot ?? `7936|66392|638960000000000000|${state}`);
      else cb(options.restoreError || null, options.result || 'requested');
    },
    exec(uri, settings, cb) {
      calls.push({ type: 'deeplink', uri, settings });
      cb(options.launchError || null);
    },
  });
  return { toggle, calls, logs };
}

for (const [state, message, parameter] of [['tray', '0x0010', '0'], ['minimized', '0x0112', '0xF020']]) {
  test(`Happ ${state}: восстанавливается штатным событием ровно один раз`, async () => {
    const { toggle, calls } = harness(state);
    await toggle('happ://toggle_without_ui');
    assert.deepEqual(calls.map((c) => c.type), ['powershell', 'deeplink', 'powershell']);
    assert.equal(calls[1].uri, 'start "" "happ://toggle_without_ui"');
    const script = calls[2].script;
    assert.ok(script.includes(`::PostMessage($h, ${message}, [IntPtr]${parameter}, [IntPtr]::Zero)`));
    assert.match(script, /Write-Output 'requested'\s+exit/);
    assert.match(script, /Get-Process -Id 7936/);
    assert.match(script, /638960000000000000/);
    assert.match(script, /IsMainWindow\(\$h, 7936\)/);
    assert.match(script, /ElapsedMilliseconds -lt 1800/);
    assert.doesNotMatch(script, /ShowWindow|SetForegroundWindow|Stop-Process|TerminateProcess/);
  });
}

test('открытое окно не получает Close или Minimize', async () => {
  const { toggle, calls } = harness('visible');
  await toggle('happ://toggle_without_ui');
  assert.deepEqual(calls.map((c) => c.type), ['powershell', 'deeplink']);
});

test('скрытое окно ищется через EnumWindows, не через MainWindowHandle', async () => {
  const { toggle, calls } = harness('tray');
  await toggle('happ://toggle_without_ui');
  const script = calls[0].script;
  assert.match(script, /::EnumWindows/);
  assert.match(script, /\$apps.Count -ne 1/);
  assert.match(script, /\$matches.Count -ne 1/);
  assert.match(script, /GetWindowThreadProcessId/);
  assert.match(script, /QWindowIcon/);
  assert.match(script, /\$p.ProcessName -eq 'Happ'/);
  assert.doesNotMatch(script, /MainWindowHandle/);
});

for (const snapshot of ['unavailable', '', '7936|66392|638960000000000000|unknown', '7936;bad|66392|638960000000000000|tray']) {
  test(`неизвестный snapshot ${JSON.stringify(snapshot)} не приводит к управлению окном`, async () => {
    const { toggle, calls, logs } = harness('tray', { snapshot });
    await toggle('happ://toggle_without_ui');
    assert.deepEqual(calls.map((c) => c.type), ['powershell', 'deeplink']);
    assert.equal(logs.length, 1);
  });
}

test('ошибка snapshot не блокирует deeplink и не запускает восстановление', async () => {
  const { toggle, calls } = harness('tray', { snapshotError: new Error('snapshot failed') });
  await toggle('happ://toggle_without_ui');
  assert.deepEqual(calls.map((c) => c.type), ['powershell', 'deeplink']);
});

test('ошибка запуска deeplink не приводит к закрытию окна или повторному переключению', async () => {
  const { toggle, calls, logs } = harness('tray', { launchError: new Error('launch failed') });
  await toggle('happ://toggle_without_ui');
  assert.deepEqual(calls.map((c) => c.type), ['powershell', 'deeplink']);
  assert.deepEqual(logs, [['deeplink error:', 'launch failed']]);
});

for (const options of [{ restoreError: new Error('timeout') }, { result: 'stale' }, { result: 'unchanged' }]) {
  test(`завершение восстановления (${options.result || 'error'}) не повторяет переключение`, async () => {
    const { toggle, calls } = harness('tray', options);
    await toggle('happ://toggle_without_ui');
    assert.equal(calls.filter((c) => c.type === 'deeplink').length, 1);
    assert.equal(calls.filter((c) => c.type === 'powershell').length, 2);
  });
}

test('toggle ожидает восстановления и не оставляет фонового вызова helper', async () => {
  let finish;
  let completed = false;
  let count = 0;
  const toggle = makeToggle(() => {}, {
    execFile(_file, _args, _options, cb) {
      count++;
      if (count === 1) cb(null, '7936|66392|638960000000000000|tray');
      else finish = cb;
    },
    exec(_uri, _options, cb) { cb(null); },
  });
  const pending = toggle('happ://toggle_without_ui').then(() => { completed = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, false);
  finish(null, 'requested');
  await pending;
  assert.equal(completed, true);
  assert.equal(count, 2);
});

test('быстрые переключения не запускают пересекающиеся восстановления', async () => {
  let restores = 0, snapshots = 0, launches = 0, finishFirst;
  const toggle = makeToggle(() => {}, {
    execFile(_file, args, _options, cb) {
      if (args.at(-1).includes('$apps =')) {
        snapshots++;
        cb(null, '7936|66392|638960000000000000|tray');
      } else {
        restores++;
        if (restores === 1) finishFirst = cb;
        else cb(null, 'requested');
      }
    },
    exec(_uri, _options, cb) { launches++; cb(null); },
  });
  const first = toggle('happ://toggle_without_ui');
  const second = toggle('happ://toggle_without_ui');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(snapshots, 1);
  assert.equal(launches, 1);
  finishFirst(null, 'requested');
  await Promise.all([first, second]);
  assert.equal(snapshots, 2);
  assert.equal(launches, 2);
  assert.equal(restores, 2);
});

test('произвольный deeplink не передаётся ни в PowerShell, ни в shell', async () => {
  const toggle = makeToggle(() => {}, {
    exec() { assert.fail('Unsupported deeplink must not execute'); },
    execFile() { assert.fail('No snapshot for unsupported deeplink'); },
  });
  await assert.rejects(toggle('happ://other'), /Unsupported Happ deeplink/);
});
