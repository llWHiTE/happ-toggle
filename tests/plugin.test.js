'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const harness = require('./helpers/plugin.cjs');
const SPEED = 'com.llwhite.happtoggle.speed';
const result = { pingMs: 20, downMbps: 91.5, upMbps: 83.2 };
async function press(h, id, ms = 0) { await h.event('keyDown', id); if (ms) await h.advance(ms); await h.event('keyUp', id); }
async function appear(h, id = 'vpn', settings = {}, action, controller = 'Keypad', device) {
  await h.event('willAppear', id, { action, device, payload: { controller, settings } });
}

test('four custom status icons survive changes; reset restores the built-in icon', async () => {
  const h = await harness();
  const icons = Object.fromEntries(['on', 'off', 'pending', 'unknown'].map((key) => [key, 'data:image/png;base64,' + Buffer.from(key).toString('base64')]));
  await appear(h, 'vpn', { icons, animateIdle: false });
  assert.equal(h.images.get('vpn'), icons.off);
  await h.event('keyDown', 'vpn');
  assert.equal(h.images.get('vpn'), icons.off);
  await h.event('keyUp', 'vpn');
  assert.equal(h.images.get('vpn'), icons.pending);
  h.env.HAPP_TEST_PROBE = JSON.stringify(h.ON);
  await h.advance(700);
  assert.equal(h.images.get('vpn'), icons.on);
  h.env.HAPP_TEST_PROBE = '{';
  await h.advance(3000);
  assert.equal(h.images.get('vpn'), icons.unknown);
  await h.event('didReceiveSettings', 'vpn', { payload: { settings: { icons: {}, animateIdle: false } } });
  assert.match(h.image('vpn'), /#f87171/);
  assert.equal(h.calls.filter((c) => c.event === 'deeplink').length, 1);
});

test('long VPN press tests once; release does not toggle; short press toggles', async () => {
  const h = await harness();
  await appear(h, 'vpn', { displaySec: 1 });
  await press(h, 'vpn', 600);
  assert.equal(h.runs.length, 1);
  assert.equal(h.calls.filter((c) => c.event === 'deeplink').length, 0);
  h.runs[0].onPhase('download');
  h.runs[0].onProgress({ downMbps: 42 });
  await h.advance(500);
  assert.match(h.image('vpn'), />42.0</);
  await h.complete();
  assert.match(h.image('vpn'), />91.5</);
  await h.advance(1000);
  assert.doesNotMatch(h.image('vpn'), />91.5</);
  await press(h, 'vpn');
  assert.equal(h.calls.filter((c) => c.event === 'deeplink').length, 1);
});

test('speed key cycles only test services and persists migrated settings', async () => {
  const h = await harness();
  await appear(h, 'speed', { speedProvider: 'openspeedtest', language: 'ru', icons: { on: 'saved' } }, SPEED);
  assert.match(h.image('speed'), /Yandex/);
  await press(h, 'speed', 600);
  const saved = h.calls.filter((c) => c.event === 'setSettings').at(-1).payload;
  assert.equal(saved.speedProvider, 'cloudflare');
  assert.equal(saved.language, undefined);
  assert.equal(saved.icons.on, 'saved');
  assert.equal(h.runs.length, 0);
  assert.equal(h.calls.filter((c) => c.event === 'deeplink').length, 0);
  await press(h, 'speed');
  assert.equal(h.runs[0].opts.provider, 'cloudflare');
});

test('phase layout and MB/s conversion render genuine values without status labels', async () => {
  const h = await harness();
  await appear(h, 'speed', { speedDisplayMode: 'phase', speedUnit: 'mbytes', hideTestServer: true }, SPEED);
  await press(h, 'speed');
  h.runs[0].onPhase('download'); h.runs[0].onProgress({ downMbps: 80 });
  await h.advance(500);
  assert.match(h.image('speed'), />10.0</);
  assert.match(h.image('speed'), /MB\/s/);
  assert.doesNotMatch(h.image('speed'), /VPN ON|VPN OFF|SPEED|ТЕСТ/);
  await h.complete({ pingMs: 15, downMbps: 80, upMbps: 40 });
  assert.match(h.image('speed'), />10.0</);
  assert.match(h.image('speed'), />5.00</);
});

test('auto-test waits for connection and delay; manual start cancels the timer', async () => {
  const h = await harness();
  await appear(h, 'vpn', { speedAuto: true, speedDelaySec: 2 });
  await press(h, 'vpn');
  await h.advance(700);
  assert.equal(h.runs.length, 0);
  h.env.HAPP_TEST_PROBE = JSON.stringify(h.ON);
  await h.advance(700);
  await h.advance(1999);
  assert.equal(h.runs.length, 0);
  await h.advance(1);
  assert.equal(h.runs.length, 1);
  await h.complete();
  h.env.HAPP_TEST_PROBE = JSON.stringify(h.OFF);
  await h.advance(3000);
  await press(h, 'vpn'); h.env.HAPP_TEST_PROBE = JSON.stringify(h.ON); await h.advance(700);
  await press(h, 'vpn', 600);
  assert.equal(h.runs.length, 2);
  await h.complete();
  await h.advance(3000);
  assert.equal(h.runs.length, 2);
});

for (const reason of ['removed', 'disabled', 'disconnected']) {
  test(`auto-test is cancelled when ${reason}`, async () => {
    const h = await harness();
    await appear(h, 'vpn', { speedAuto: true, speedDelaySec: 5 });
    await press(h, 'vpn'); h.env.HAPP_TEST_PROBE = JSON.stringify(h.ON); await h.advance(700);
    if (reason === 'removed') await h.event('willDisappear', 'vpn');
    else if (reason === 'disabled') await h.event('didReceiveSettings', 'vpn', { payload: { settings: { speedAuto: false } } });
    else { h.env.HAPP_TEST_PROBE = JSON.stringify(h.OFF); }
    await h.advance(6000);
    assert.equal(h.runs.length, 0);
  });
}

for (const reason of ['repeat', 'provider', 'removed', 'disconnected']) {
  test(`cancel and ignore late results on ${reason}`, async () => {
    const h = await harness({ connected: true });
    await appear(h, 'speed', {}, SPEED);
    await press(h, 'speed');
    if (reason === 'repeat') await press(h, 'speed');
    else if (reason === 'provider') await press(h, 'speed', 600);
    else if (reason === 'removed') await h.event('willDisappear', 'speed');
    else { h.env.HAPP_TEST_PROBE = JSON.stringify(h.OFF); await h.advance(3000); }
    assert.equal(h.runs[0].opts.signal.aborted, true);
    await h.complete(result, 0);
    assert.doesNotMatch(h.image('speed'), />91.5</);
    assert.equal(h.calls.filter((c) => c.event === 'showAlert').length, 0);
  });
}

test('failed test can be followed by a successful test', async () => {
  const h = await harness();
  await appear(h, 'speed', {}, SPEED); await press(h, 'speed'); await h.fail();
  assert.match(h.image('speed'), /Speed test failed/);
  assert.equal(h.calls.filter((c) => c.event === 'showAlert').length, 1);
  await press(h, 'speed'); await h.complete();
  assert.match(h.image('speed'), />91.5</);
});

test('dial selects providers; short press tests, long press and touch toggle once', async () => {
  const h = await harness();
  await appear(h, 'dial', { speedProvider: 'yandex' }, SPEED, 'Encoder');
  await h.event('dialRotate', 'dial', { payload: { ticks: -1 } });
  assert.equal(h.calls.filter((c) => c.event === 'setSettings').at(-1).payload.speedProvider, 'speedtest');
  await h.event('dialDown', 'dial'); await h.event('dialUp', 'dial');
  assert.equal(h.runs[0].opts.provider, 'speedtest');
  await h.complete();
  await h.event('dialDown', 'dial'); await h.advance(600); await h.event('dialUp', 'dial');
  assert.equal(h.runs.length, 1);
  assert.equal(h.calls.filter((c) => c.event === 'deeplink').length, 1);
  h.env.HAPP_TEST_PROBE = JSON.stringify(h.ON); await h.advance(700);
  await h.event('touchTap', 'dial', { payload: { hold: false } });
  assert.equal(h.calls.filter((c) => c.event === 'deeplink').length, 2);
});

test('Neo follows only its device and is cleared on disconnect', async () => {
  const h = await harness();
  await appear(h, 'neo', {}, SPEED, 'Neo');
  await appear(h, 'other', {}, SPEED, 'Keypad', 'other-device'); await press(h, 'other'); await h.complete();
  assert.doesNotMatch(h.image('neo'), />91.5</);
  await appear(h, 'speed', { displaySec: 0 }, SPEED); await press(h, 'speed'); await h.complete();
  assert.match(h.image('neo'), />91.5</);
  await h.advance(20000);
  assert.match(h.image('neo'), />91.5</);
  await h.event('deviceDidDisconnect', null);
  assert.doesNotMatch(h.image('neo'), />91.5</);
});
