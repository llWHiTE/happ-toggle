'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const plugin = path.resolve(process.argv[2] || path.join(root, fs.existsSync(path.join(root, 'com.llwhite.happtoggle.sdPlugin')) ? 'com.llwhite.happtoggle.sdPlugin' : 'com.user.happtoggle.sdPlugin'));
const createAdapter = require(path.join(plugin, 'lib/sdk.js'));
const registered = [], events = [], logs = [], calls = [];
let disconnected;
const sdk = {
  SingletonAction: class {},
  action: ({ UUID }) => (Base) => class extends Base { manifestId = UUID; },
  default: {
    actions: { registerAction: (action) => registered.push(action) },
    devices: { onDeviceDidDisconnect: (fn) => { disconnected = fn; } },
    connect: async () => { assert.equal(registered.length, 2); calls.push(['connect']); },
  },
};
const ids = ['com.test.toggle', 'com.test.speed'];
const adapter = createAdapter(sdk, { actionIds: ids, onMessage: (text) => events.push(JSON.parse(text)), log: (...args) => logs.push(args) });
const flush = () => new Promise((resolve) => setImmediate(resolve));
function placement(id, controller) {
  return {
    id, device: { id: 'device-a' },
    isKey: () => controller === 'Keypad', isDial: () => controller === 'Encoder', isNeoInfobar: () => controller === 'Neo',
    setImage: async (image) => calls.push(['image', id, image]),
    setFeedback: async (feedback) => calls.push(['feedback', id, feedback]),
    setFeedbackLayout: async (layout) => calls.push(['layout', id, layout]),
    setSettings: async (settings) => calls.push(['settings', id, settings]),
    showAlert: async () => calls.push(['alert', id]),
  };
}
(async () => {
  assert.deepEqual(registered.map((action) => action.manifestId), ids);
  await adapter.connect();
  const key = placement('key-1', 'Keypad');
  const ev = { action: key, payload: { controller: 'Keypad', settings: { speedProvider: 'yandex' } } };
  registered[0].onWillAppear(ev);
  assert.deepEqual(events[0], { event: 'willAppear', context: 'key-1', action: ids[0], device: 'device-a', payload: ev.payload });
  for (const [method, name] of [['onKeyDown', 'keyDown'], ['onKeyUp', 'keyUp'], ['onDidReceiveSettings', 'didReceiveSettings']]) {
    registered[0][method](ev); assert.equal(events.at(-1).event, name);
  }
  adapter.sendJSON({ event: 'setImage', context: key.id, payload: { image: 'key-svg', target: 0 } });
  adapter.sendJSON({ event: 'setSettings', context: key.id, payload: { speedProvider: 'cloudflare' } });
  adapter.sendJSON({ event: 'showAlert', context: key.id });
  await flush();
  assert.ok(calls.some((call) => call[0] === 'image' && call[2] === 'key-svg'));
  assert.ok(calls.some((call) => call[0] === 'settings' && call[2].speedProvider === 'cloudflare'));
  assert.ok(calls.some((call) => call[0] === 'alert'));
  const dial = placement('dial-1', 'Encoder');
  const dialEv = { action: dial, payload: { controller: 'Encoder', ticks: -1, hold: false } };
  registered[1].onWillAppear(dialEv);
  for (const [method, name] of [['onDialDown', 'dialDown'], ['onDialUp', 'dialUp'], ['onDialRotate', 'dialRotate'], ['onTouchTap', 'touchTap']]) {
    registered[1][method](dialEv); assert.equal(events.at(-1).event, name); assert.equal(events.at(-1).payload.ticks, -1);
  }
  adapter.sendJSON({ event: 'setFeedback', context: dial.id, payload: { screen: 'dial-svg' } });
  await flush();
  assert.ok(calls.some((call) => call[0] === 'feedback' && call[1] === dial.id));
  const neo = placement('neo-1', 'Neo');
  let completeLayout;
  neo.setFeedbackLayout = () => new Promise((resolve) => { completeLayout = resolve; });
  const neoEv = { action: neo, payload: { controller: 'Neo', settings: {} } };
  registered[1].onWillAppear(neoEv);
  adapter.sendJSON({ event: 'setFeedbackLayout', context: neo.id, payload: { layout: 'layouts/neo.json' } });
  adapter.sendJSON({ event: 'setFeedback', context: neo.id, payload: { screen: 'neo-svg' } });
  await flush();
  assert.ok(!calls.some((call) => call[0] === 'feedback' && call[1] === neo.id));
  completeLayout(); await flush();
  assert.ok(calls.some((call) => call[0] === 'feedback' && call[1] === neo.id));
  neo.setFeedbackLayout = async () => { throw new Error('transient layout failure'); };
  adapter.sendJSON({ event: 'setFeedbackLayout', context: neo.id, payload: { layout: 'missing' } });
  await flush();
  neo.setFeedbackLayout = async (layout) => calls.push(['recovered-layout', layout]);
  adapter.sendJSON({ event: 'setFeedbackLayout', context: neo.id, payload: { layout: 'layouts/neo.json' } });
  adapter.sendJSON({ event: 'setFeedback', context: neo.id, payload: { screen: 'recovered-screen' } });
  await flush();
  assert.ok(calls.some((call) => call[0] === 'recovered-layout'));
  assert.ok(calls.some((call) => call[0] === 'feedback' && call[2].screen === 'recovered-screen'));
  const count = calls.length;
  adapter.sendJSON({ event: 'setImage', context: key.id, payload: { image: 'stale' } });
  registered[0].onWillDisappear(ev);
  await flush(); assert.equal(calls.length, count);
  dial.setSettings = async () => { throw new Error('private error details'); };
  adapter.sendJSON({ event: 'setSettings', context: dial.id, payload: {} });
  await flush();
  assert.ok(logs.some((log) => log[0] === 'Stream Deck SDK command failed:' && log[1] === 'setSettings'));
  assert.ok(!JSON.stringify(logs).includes('private error details'));
  disconnected({ device: { id: 'device-a' } });
  assert.deepEqual(events.at(-1), { event: 'deviceDidDisconnect', device: 'device-a' });
  console.log('SDK adapter smoke test passed (local stubs; no VPN, device or network tests).');
})().catch((error) => { console.error(error); process.exitCode = 1; });
