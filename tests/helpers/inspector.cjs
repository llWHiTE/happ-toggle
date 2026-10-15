'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../com.llwhite.happtoggle.sdPlugin');

module.exports = async function inspector(options = {}) {
  const plugin = options.plugin || root;
  const html = fs.readFileSync(path.join(plugin, 'ui/pi.html'), 'utf8');
  const resource = JSON.parse(fs.readFileSync(path.join(plugin, 'en.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(plugin, 'manifest.json'), 'utf8'));
  const ids = new Map(), sent = [], alerts = [], fetches = [], sockets = [];
  const element = () => ({ style: {}, value: '', checked: false, disabled: false, textContent: '', innerHTML: '', dataset: {},
    classList: { classes: new Set(), toggle(name, value) { value ? this.classes.add(name) : this.classes.delete(name); } },
    click() { this.clicked = true; }, appendChild() {} });
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.set(m[1], element());
  ids.get('iconRows').appendChild = (row) => {
    const key = row.innerHTML.match(/id="pv_(\w+)"/)[1];
    for (const prefix of ['pv', 'fi', 'pick', 'reset']) ids.set(prefix + '_' + key, element());
    row.querySelector = (selector) => ids.get((selector === '[data-pick]' ? 'pick_' : 'reset_') + key);
  };
  const labels = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => ({ ...element(), dataset: { i18n: m[1] } }));
  const document = { body: { inert: true }, documentElement: {}, querySelectorAll: () => labels,
    getElementById(id) { assert.ok(ids.has(id), 'Unknown DOM id: ' + id); return ids.get(id); },
    createElement(tag) {
      if (tag === 'canvas') return { getContext: () => ({ drawImage() {} }), toDataURL() {
        if (options.canvasError) throw new Error('Canvas failed'); return 'data:image/png;base64,Q1VTVE9N';
      } };
      assert.equal(tag, 'div'); return element();
    } };
  let releaseResource;
  const ready = options.deferResource ? new Promise((resolve) => { releaseResource = resolve; }) : Promise.resolve();
  const window = {};
  const sandbox = { window, document, console, setTimeout, alert: (text) => alerts.push(text),
    fetch: async (url) => { fetches.push(url); await ready; return { ok: !options.resourceFailure, json: async () => resource }; },
    WebSocket: class { constructor() { this.readyState = 1; sockets.push(this); } send(text) { sent.push(JSON.parse(text)); } },
    FileReader: class { readAsDataURL() { if (options.fileError) this.onerror(); else { this.result = 'image'; this.onload(); } } },
    Image: class { naturalWidth = 200; naturalHeight = 100; set src(_value) { if (options.imageError) this.onerror(); else this.onload(); } },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(plugin, 'ui/i18n.js'), 'utf8'), sandbox);
  sandbox.StreamDeckLocalization = window.StreamDeckLocalization;
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], sandbox);
  window.connectElgatoStreamDeckSocket('1234', 'key-1', 'registerPropertyInspector',
    JSON.stringify({ application: { language: options.locale || 'en' } }),
    JSON.stringify({ action: options.action || manifest.UUID + '.toggle', payload: { controller: options.controller || 'Keypad', settings: options.settings || {} } }));
  sockets[0].onopen();
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  if (!options.deferResource) await flush();
  return { ids, sent, alerts, fetches, labels, document, html, resource,
    async release() { releaseResource(); await flush(); },
    async receive(settings) { sockets[0].onmessage({ data: JSON.stringify({ event: 'didReceiveSettings', payload: { settings } }) }); await flush(); },
    change(id, value) { const node = ids.get(id); if (typeof value === 'boolean') node.checked = value; else node.value = value; node.onchange(); },
    settings() { return sent.filter((message) => message.event === 'setSettings').at(-1)?.payload; },
  };
};
