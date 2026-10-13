'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const plugin = path.resolve(process.argv[2] || path.join(__dirname, '../com.user.happtoggle.sdPlugin'));

if (process.argv[3] === '--sdk') {
  const locale = process.argv[4];
  const manifest = JSON.parse(fs.readFileSync(path.join(plugin, 'manifest.json'), 'utf8'));
  process.chdir(plugin);
  process.argv.push('-port', '1', '-pluginUUID', manifest.UUID, '-registerEvent', 'registerPlugin', '-info', JSON.stringify({ application: { language: locale, version: '7.6.0', platform: 'windows' } }));
  import(pathToFileURL(path.join(__dirname, 'node_modules/@elgato/streamdeck/dist/plugin/index.js')).href).then(({ default: streamDeck }) => {
    const expected = locale.startsWith('ru') ? JSON.parse(fs.readFileSync('ru.json', 'utf8')).Localization : JSON.parse(fs.readFileSync('en.json', 'utf8')).Localization;
    for (const key of ['Speed test failed', 'Mbps', 'MB/s']) assert.equal(streamDeck.i18n.translate(key), expected[key]);
    assert.equal(streamDeck.i18n.translate('inspector.speedTitle'), expected.inspector.speedTitle);
    assert.equal(streamDeck.i18n.translate('missing.key'), 'missing.key');
    const display = require(path.join(plugin, 'lib/display.js'));
    display.setTranslator((key) => streamDeck.i18n.translate(key));
    const settings = { ...display.DEFAULT_DISPLAY, language: locale.startsWith('ru') ? 'en' : 'ru', speedProvider: 'cloudflare' };
    const info = { action: manifest.UUID + '.speed', settings, speed: { result: { downMbps: 30, upMbps: 12, pingMs: 15 } } };
    const decode = (image) => image.includes(';base64,') ? Buffer.from(image.split(',')[1], 'base64').toString() : decodeURIComponent(image.split(',')[1]);
    assert.ok(decode(display.renderKey(info, 'on', 0)).includes(expected.Mbps));
    for (const controller of ['Encoder', 'Neo']) assert.ok(decode(display.renderScreen({ ...info, controller }, 'on', null, 0)).includes(expected.Mbps));
    info.speed = { error: true };
    assert.ok(decode(display.renderKey(info, 'on', 0)).includes(expected['Speed test failed']));
    for (const controller of ['Encoder', 'Neo']) assert.ok(decode(display.renderScreen({ ...info, controller }, 'on', null, 0)).includes(expected['Speed test failed']));
    console.log('Official SDK i18n and key/dial/Neo rendering passed:', locale);
  }).catch((error) => { console.error(error); process.exitCode = 1; });
} else {
  (async () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(plugin, 'manifest.json'), 'utf8'));
    const html = fs.readFileSync(path.join(plugin, 'ui/pi.html'), 'utf8');
    const loader = fs.readFileSync(path.join(plugin, 'ui/i18n.js'), 'utf8');
    const locales = Object.fromEntries(['en', 'ru'].map((lang) => [lang, JSON.parse(fs.readFileSync(path.join(plugin, lang + '.json'), 'utf8'))]));
    assert.equal(manifest.Version, '1.12.1.0');
    assert.ok(!html.includes('id="language"') && !html.includes('const STRINGS'));
    assert.ok(html.includes('JSON.parse(info).application.language'));
    assert.deepEqual(Object.keys(locales.en.Localization.inspector).sort(), Object.keys(locales.ru.Localization.inspector).sort());
    for (const locale of Object.values(locales)) {
      for (const action of manifest.Actions) assert.ok(locale[action.UUID].Name && locale[action.UUID].Tooltip);
      for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(locale.Localization.inspector[match[1]], 'Missing label: ' + match[1]);
      for (const key of ['fileError', 'readError', 'openError', 'sizeError', 'manualSpeed', 'manualEncoder', 'manualNeo', 'manualToggle', 'pick', 'reset', 'on', 'off', 'pending', 'unknown']) assert.ok(locale.Localization.inspector[key]);
    }
    const entry = fs.readFileSync(path.join(plugin, 'plugin.js'), 'utf8');
    assert.ok(entry.includes('setTranslator((key) => ws.translate(key))'));
    assert.ok(!fs.readFileSync(path.join(plugin, 'lib/display.js'), 'utf8').includes('settings.language'));
    for (const language of ['en', 'ru', 'ru_RU', 'de', 'en_US']) execFileSync(process.execPath, [__filename, plugin, '--sdk', language], { stdio: 'inherit' });

    const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    new vm.Script(inline);
    for (const [language, expected] of [['en', 'en'], ['ru', 'ru'], ['ru_RU', 'ru'], ['de', 'en'], ['../../invalid', 'en']]) {
      const nodes = new Map(), sent = [], sockets = [];
      function node() { return { value: '', checked: false, disabled: false, textContent: '', innerHTML: '', style: {}, classList: { toggle() {} }, appendChild() {}, querySelector: () => node() }; }
      const labels = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => ({ ...node(), dataset: { i18n: match[1] } }));
      const document = { body: { inert: true }, documentElement: {}, createElement: node,
        getElementById: (id) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); }, querySelectorAll: () => labels };
      const sandbox = { document, console, alert: () => {}, setTimeout, window: {}, fetch: async (url) => {
        await new Promise((resolve) => setImmediate(resolve));
        const lang = url.slice(3, -5);
        return { ok: !!locales[lang], status: locales[lang] ? 200 : 404, json: async () => locales[lang] };
      }, WebSocket: class { constructor() { this.readyState = 1; sockets.push(this); } send(message) { sent.push(JSON.parse(message)); } } };
      vm.createContext(sandbox);
      vm.runInContext(loader, sandbox);
      sandbox.StreamDeckLocalization = sandbox.window.StreamDeckLocalization;
      vm.runInContext(inline, sandbox);
      sandbox.window.connectElgatoStreamDeckSocket(1, 'context', 'registerPropertyInspector', JSON.stringify({ application: { language } }), JSON.stringify({ action: manifest.UUID + '.speed', payload: { controller: 'Encoder', settings: { language: 'ru', speedProvider: 'cloudflare', icons: { on: 'saved-icon' }, speedDelaySec: 7 } } }));
      sockets[0].onopen();
      // Deliver saved settings while locale requests are still pending.
      sockets[0].onmessage({ data: JSON.stringify({ event: 'didReceiveSettings', payload: { settings: { language: 'ru', speedProvider: 'speedtest', speedDelaySec: 9, icons: { on: 'saved-icon' } } } }) });
      await new Promise((resolve) => setTimeout(resolve, 40));
      assert.equal(document.documentElement.lang, expected);
      assert.equal(document.body.inert, false);
      for (const label of labels) assert.equal(label.textContent, locales[expected].Localization.inspector[label.dataset.i18n]);
      assert.equal(document.getElementById('speedProvider').value, 'speedtest');
      assert.ok(document.getElementById('hintManual').textContent.includes(expected === 'ru' ? 'Вращение' : 'Rotate'));
      assert.ok(!sent.some((message) => message.event === 'setSettings'));
      document.getElementById('speedProvider').value = 'cloudflare';
      document.getElementById('speedProvider').onchange();
      assert.equal(sent.at(-1).payload.speedDelaySec, 9);
      assert.equal(sent.at(-1).payload.icons.on, 'saved-icon');
      assert.ok(!('language' in sent.at(-1).payload));
    }
    console.log('Inspector localization, fallback, asynchronous settings and migration passed. No VPN/network/device tests.');
  })().catch((error) => { console.error(error); process.exitCode = 1; });
}
