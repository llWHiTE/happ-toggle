'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const inspector = require('./helpers/inspector.cjs');

test('all four icons can be selected; resetting one preserves the other settings', async () => {
  const h = await inspector({ settings: { speedDelaySec: 7 } });
  h.change('speedAuto', true);
  assert.equal(h.settings().speedAuto, true);
  assert.equal(h.ids.get('speedDelaySec').disabled, false);
  for (const state of ['on', 'off', 'pending', 'unknown']) {
    h.ids.get('pick_' + state).onclick();
    assert.equal(h.ids.get('fi_' + state).clicked, true);
    h.ids.get('fi_' + state).onchange({ target: { files: [{ size: 1024 }], value: 'file' } });
    assert.equal(h.settings().icons[state], 'data:image/png;base64,Q1VTVE9N');
    assert.match(h.ids.get('pv_' + state).style.backgroundImage, /Q1VTVE9N/);
  }
  h.ids.get('reset_on').onclick();
  assert.equal(h.settings().icons.on, undefined);
  assert.equal(Object.keys(h.settings().icons).length, 3);
  assert.equal(h.settings().speedDelaySec, 7);
  h.change('speedAuto', false);
  assert.equal(h.ids.get('speedDelaySec').disabled, true);
});

test('limits, hold-result and speed action layout are enforced', async () => {
  const h = await inspector({ action: 'com.llwhite.happtoggle.speed' });
  assert.ok(h.ids.get('secIcons').classList.classes.has('hide'));
  assert.ok(h.ids.get('rowAuto').classList.classes.has('hide'));
  assert.match(h.ids.get('hintManual').textContent, /Short press/);
  for (const [id, value, expected] of [['speedSeconds', '999', 20], ['speedSeconds', '-1', 3], ['speedDelaySec', '999', 60], ['displaySec', '-1', 1], ['displaySec', 'bad', 10]]) {
    h.change(id, value); assert.equal(h.settings()[id], expected);
  }
  h.change('displaySec', '13');
  h.change('holdResult', true);
  assert.equal(h.settings().displaySec, 0);
  assert.equal(h.ids.get('displaySec').disabled, true);
  h.change('holdResult', false);
  assert.equal(h.settings().displaySec, 13);
});

for (const locale of ['en', 'ru', 'ru_RU', 'de', '../../invalid']) {
  test(`English UI and saved provider survive application locale ${locale}`, async () => {
    const h = await inspector({ locale, settings: { language: 'ru', speedProvider: 'cloudflare', icons: { on: 'saved-icon' } } });
    assert.equal(h.document.documentElement.lang, 'en');
    assert.equal(h.document.body.inert, false);
    assert.deepEqual(h.fetches, ['../en.json']);
    for (const label of h.labels) assert.equal(label.textContent, h.resource.Localization.inspector[label.dataset.i18n]);
    assert.equal(h.ids.get('speedProvider').value, 'cloudflare');
    assert.equal(h.sent.filter((m) => m.event === 'setSettings').length, 0);
    h.change('speedProvider', 'yandex');
    assert.equal(h.settings().icons.on, 'saved-icon');
    assert.equal(h.settings().language, undefined);
    assert.ok(!h.html.includes('id="language"'));
  });
}

test('settings arriving during resource loading are preserved', async () => {
  const h = await inspector({ deferResource: true, settings: { speedProvider: 'yandex' } });
  assert.equal(h.document.body.inert, true);
  await h.receive({ speedProvider: 'speedtest', speedDelaySec: 9, icons: { off: 'saved' } });
  await h.release();
  assert.equal(h.document.body.inert, false);
  assert.equal(h.ids.get('speedProvider').value, 'speedtest');
  h.change('speedDisplayMode', 'phase');
  assert.equal(h.settings().speedDelaySec, 9);
  assert.equal(h.settings().icons.off, 'saved');
  assert.equal(h.settings().speedDisplayMode, 'phase');
});

test('retired options migrate without restoring removed controls', async () => {
  const h = await inspector({ settings: { speedProvider: 'openspeedtest', language: 'ru', hideStatusLabels: true, speedPrecision: 4 } });
  assert.equal(h.ids.get('speedProvider').value, 'yandex');
  h.change('showSpeedUnits', false);
  assert.equal(h.settings().showSpeedUnits, false);
  for (const key of ['language', 'hideStatusLabels', 'speedPrecision']) assert.equal(h.settings()[key], undefined);
  assert.match(h.html, /--surface:\s*#2d2d2d/);
  assert.doesNotMatch(h.html, /<option value="openspeedtest">/);
});

for (const controller of ['Encoder', 'Neo']) {
  test(`${controller} exposes the current screen controls`, async () => {
    const h = await inspector({ action: 'com.llwhite.happtoggle.speed', controller });
    assert.ok(h.ids.get('secIcons').classList.classes.has('hide'));
    assert.equal(h.ids.get('rowScreenPing').classList.classes.has('hide'), false);
    assert.equal(h.ids.get('rowProvider').classList.classes.has('hide'), controller === 'Neo');
    h.change('showScreenPing', true);
    h.change('transparentScreen', true);
    assert.equal(h.settings().showScreenPing, true);
    assert.equal(h.settings().transparentScreen, true);
  });
}

test('oversized icons are rejected without changing settings', async () => {
  const h = await inspector();
  h.ids.get('fi_off').onchange({ target: { files: [{ size: 11 * 1024 * 1024 }], value: 'file' } });
  assert.equal(h.settings(), undefined);
  assert.match(h.alerts[0], /max 10 MB/);
});
for (const failure of ['canvasError', 'fileError', 'imageError']) {
  test(`icon ${failure} reports an English error without saving`, async () => {
    const h = await inspector({ [failure]: true });
    h.ids.get('fi_off').onchange({ target: { files: [{ size: 1024 }], value: 'file' } });
    assert.equal(h.settings(), undefined);
    assert.equal(h.alerts.length, 1);
    assert.doesNotMatch(h.alerts[0], /[А-Яа-яЁё]/);
  });
}
