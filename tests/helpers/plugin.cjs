'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../com.llwhite.happtoggle.sdPlugin');
const createAdapter = require(path.join(root, 'lib/sdk.js'));
const display = require(path.join(root, 'lib/display.js'));
const english = require(path.join(root, 'en.json')).Localization;
const OFF = { proxyEnable: 0, proxyServer: '', adapters: [], processes: [] };
const ON = { proxyEnable: 1, proxyServer: '127.0.0.1:1234', adapters: [], processes: [] };

module.exports = async function harness(options = {}) {
  let now = 0, nextId = 0, disconnect;
  const timers = new Map(), images = new Map(), feedback = new Map(), placements = new Map();
  const calls = [], runs = [], registered = [];
  const env = { HAPP_TEST_PROBE: JSON.stringify(options.connected ? ON : OFF) };
  const sdk = {
    SingletonAction: class {}, action: () => (Base) => Base,
    default: { actions: { registerAction: (action) => registered.push(action) }, devices: { onDeviceDidDisconnect: (fn) => { disconnect = fn; } },
      i18n: { translate: (key) => english[key] || key }, connect: async () => {} },
  };
  const fakeFS = { existsSync: (file) => path.basename(file) === 'config.json',
    readFileSync: () => JSON.stringify(options.config || {}), mkdirSync() {}, appendFileSync() {}, writeFileSync() {}, statSync: () => ({ size: 0 }) };
  const source = fs.readFileSync(path.join(root, 'plugin.js'), 'utf8');
  assert.equal(source.split("import('@elgato/streamdeck')").length, 2, 'SDK import site changed; update the fixture');
  const sandbox = { loadSDK: async () => sdk,
    require(name) {
      if (name === 'net' || name === 'crypto') return {};
      if (name === 'fs') return fakeFS;
      if (name === 'path') return path;
      if (name === 'os') return { homedir: () => 'fixture-home' };
      if (name === 'child_process') return { execFile() { assert.fail('No real Windows process probes in unit tests'); } };
      if (name === './lib/sdk.js') return createAdapter;
      if (name === './lib/display.js') return display;
      if (name === './lib/happ-window.js') return () => async () => { calls.push({ event: 'deeplink' }); };
      if (name === './lib/speedtest.js') return { runSpeedTest(opts, onPhase, onProgress) {
        return new Promise((resolve, reject) => { runs.push({ opts, onPhase, onProgress, resolve, reject }); });
      } };
      throw new Error('Unexpected dependency: ' + name);
    },
    __dirname: root, Buffer, AbortController,
    process: { argv: ['node', 'plugin.js', '-port', '9000', '-pluginUUID', 'fixture', '-registerEvent', 'registerPlugin'], env, exit() { assert.fail('Unexpected process exit'); } },
    Date: class extends Date { static now() { return now; } },
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { due: now + delay, fn }); return id; },
    clearTimeout(id) { timers.delete(id); }, console,
  };
  vm.runInNewContext(`(function(){\n${source.replace("import('@elgato/streamdeck')", 'loadSDK()')}\n})()`, sandbox, { filename: 'plugin.js' });
  async function flush() { for (let i = 0; i < 24; i++) await Promise.resolve(); }
  await flush();
  assert.equal(registered.length, 2);
  async function event(name, id, props = {}) {
    if (name === 'deviceDidDisconnect') { disconnect({ device: { id: props.device || 'device-1' } }); await flush(); return; }
    if (name === 'willAppear') {
      const controller = props.payload?.controller || 'Keypad';
      const action = { id, device: { id: props.device || 'device-1' },
        isKey: () => controller === 'Keypad', isDial: () => controller === 'Encoder', isNeoInfobar: () => controller === 'Neo',
        async setImage(image) { images.set(id, image); calls.push({ event: 'setImage', context: id, image }); },
        async setFeedback(value) { feedback.set(id, value); calls.push({ event: 'setFeedback', context: id, value }); },
        async setFeedbackLayout(layout) { calls.push({ event: 'setFeedbackLayout', context: id, layout }); },
        async setSettings(settings) { calls.push({ event: 'setSettings', context: id, payload: JSON.parse(JSON.stringify(settings)) }); },
        async showAlert() { calls.push({ event: 'showAlert', context: id }); } };
      placements.set(id, { action, kind: props.action || 'com.llwhite.happtoggle.toggle' });
    }
    const placement = placements.get(id);
    assert.ok(placement, 'Unknown placement: ' + id);
    const handler = registered.find((entry) => entry.actionId === placement.kind);
    handler['on' + name[0].toUpperCase() + name.slice(1)]({ action: placement.action, payload: props.payload || {} });
    await flush();
    if (name === 'willDisappear') placements.delete(id);
  }
  async function advance(ms) {
    const end = now + ms;
    let count = 0;
    while (true) {
      const next = [...timers.entries()].filter(([, t]) => t.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      assert.ok(++count < 2000, 'Unexpected timer loop');
      const [id, timer] = next; timers.delete(id); now = timer.due; timer.fn(); await flush();
    }
    now = end; await flush();
  }
  function image(id) {
    const uri = images.get(id) || feedback.get(id)?.screen || '';
    return uri.includes(';base64,') ? Buffer.from(uri.split(',')[1], 'base64').toString() : uri.startsWith('data:image/svg') ? decodeURIComponent(uri.split(',')[1]) : uri;
  }
  return { env, calls, runs, timers, images, feedback, event, advance, image, flush, ON, OFF,
    async complete(result = { pingMs: 20, downMbps: 91.5, upMbps: 83.2 }, index = runs.length - 1) { runs[index].resolve(result); await flush(); },
    async fail(error = new Error('fixture failure')) { runs.at(-1).reject(error); await flush(); },
  };
};
