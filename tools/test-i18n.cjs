'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const inspector = require('../tests/helpers/inspector.cjs');
const plugin = path.resolve(process.argv[2] || path.join(__dirname, '../com.llwhite.happtoggle.sdPlugin'));

(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(plugin, 'manifest.json'), 'utf8'));
  const english = JSON.parse(fs.readFileSync(path.join(plugin, 'en.json'), 'utf8'));
  assert.equal(fs.existsSync(path.join(plugin, 'ru.json')), false);
  if (process.argv[3] === '--sdk') {
    const locale = process.argv[4];
    process.chdir(plugin);
    process.argv.push('-port', '1', '-pluginUUID', manifest.UUID, '-registerEvent', 'registerPlugin', '-info',
      JSON.stringify({ application: { language: locale, version: '7.6.0', platform: 'windows' } }));
    const { default: sdk } = await import(pathToFileURL(path.join(__dirname, 'node_modules/@elgato/streamdeck/dist/plugin/index.js')).href);
    for (const key of ['Speed test failed', 'Mbps', 'MB/s']) assert.equal(sdk.i18n.translate(key), english.Localization[key]);
    const display = require(path.join(plugin, 'lib/display.js'));
    display.setTranslator((key) => sdk.i18n.translate(key));
    const decode = (uri) => uri.includes(';base64,') ? Buffer.from(uri.split(',')[1], 'base64').toString() : decodeURIComponent(uri.split(',')[1]);
    for (const speedUnit of ['mbps', 'mbytes']) {
      const info = { action: manifest.UUID + '.speed', settings: { ...display.DEFAULT_DISPLAY, speedProvider: 'yandex', speedUnit }, speed: { result: { downMbps: 80, upMbps: 40, pingMs: 15 } } };
      for (const controller of ['Keypad', 'Encoder', 'Neo']) {
        info.controller = controller;
        const image = () => decode(controller === 'Keypad' ? display.renderKey(info, 'on', 0) : display.renderScreen(info, 'on', null, 0));
        assert.ok(image().includes(speedUnit === 'mbps' ? 'Mbps' : 'MB/s'));
        assert.ok(image().includes(speedUnit === 'mbps' ? '>80.0<' : '>10.0<'));
        assert.doesNotMatch(image(), /[А-Яа-яЁё]/);
        info.speed.error = true;
        assert.ok(image().includes('Speed test failed'));
        info.speed.error = false;
      }
    }
    console.log('Official SDK English resources/rendering passed:', locale);
    return;
  }
  assert.match(manifest.Version, /^\d+\.\d+\.\d+\.\d+$/);
  for (const action of manifest.Actions) assert.ok(english[action.UUID].Name && english[action.UUID].Tooltip);
  for (const locale of ['en', 'ru', 'ru_RU', 'de', 'en_US']) {
    execFileSync(process.execPath, [__filename, plugin, '--sdk', locale], { stdio: 'inherit' });
    const h = await inspector({ plugin, locale, settings: { language: 'ru', speedProvider: 'cloudflare' } });
    assert.equal(h.document.documentElement.lang, 'en');
    assert.equal(h.document.body.inert, false);
    for (const label of h.labels) assert.equal(label.textContent, english.Localization.inspector[label.dataset.i18n]);
  }
  console.log('English-only SDK, inspector, units and locale migration checks passed. No VPN/network/device tests.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
