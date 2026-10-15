'use strict';
/*
 * Happ Toggle — плагин Stream Deck на официальном Node SDK Elgato.
 *  - по нажатию вызывает happ://toggle_without_ui
 *  - опрашивает состояние (системный прокси / TUN-адаптер / процессы) и рисует иконку (своя или встроенная)
 *  - замер скорости после подключения (авто / долгое нажатие / отдельная кнопка), результат показывается N секунд
 *
 * Диагностика:  node plugin.js --diag
 */
const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const createSDKAdapter = require('./lib/sdk.js');
const { runSpeedTest } = require('./lib/speedtest.js');
const makeWindowToggle = require('./lib/happ-window.js');

const DIR = __dirname;
const DATA_DIR = path.join(process.env.APPDATA || os.homedir(), 'HappToggle', 'com.llwhite.happtoggle');
const LOG = path.join(DATA_DIR, 'plugin.log');

function log(...a) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const line = `[${new Date().toISOString()}] ${a.join(' ')}\n`;
    if (fs.existsSync(LOG) && fs.statSync(LOG).size > 200 * 1024) fs.writeFileSync(LOG, '');
    fs.appendFileSync(LOG, line);
  } catch (_) { /* ignore */ }
}
const toggleKeepingTray = makeWindowToggle(log);

// ---------------------------------------------------------------- config
const DEFAULTS = {
  deeplink: 'happ://toggle_without_ui',
  pollMs: 3000,
  fastPollMs: 700,
  fastPollMaxMs: 12000,
  detect: { proxy: true, adapter: true, process: false },
  proxyMatch: '127\\.0\\.0\\.1|localhost',
  adapterRegex: 'happ|wintun|sing-?box|xray',
  processNames: ['xray', 'sing-box'],
  speedServer: 'https://speed.cloudflare.com',
  speedProxy: 'auto',      // 'auto' — взять системный прокси Windows, '' — без прокси, либо URL (http://127.0.0.1:10808, socks5h://127.0.0.1:10808)
  speedStreams: 4,
  longPressMs: 600,
};

function loadConfig() {
  let config = { ...DEFAULTS, detect: { ...DEFAULTS.detect } };
  for (const file of [path.join(DIR, 'config.json'), path.join(DATA_DIR, 'user-config.json')]) {
    const name = path.basename(file);
    if (!fs.existsSync(file)) continue;
    try {
      const user = JSON.parse(fs.readFileSync(file, 'utf8'));
      config = { ...config, ...user, detect: { ...config.detect, ...(user.detect || {}) } };
    } catch (_) {
      log('config error: cannot read or parse', name, '; using previous defaults');
    }
  }
  return config;
}
let cfg = loadConfig();

// ---------------------------------------------------------------- status probe
const PS_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$k = Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
$ad = @(Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object { $_.Name + '|' + $_.InterfaceDescription })
$pr = @(Get-Process | ForEach-Object { $_.ProcessName } | Sort-Object -Unique)
[pscustomobject]@{ proxyEnable = [int]$k.ProxyEnable; proxyServer = [string]$k.ProxyServer; adapters = $ad; processes = $pr } | ConvertTo-Json -Compress
`;

function probe() {
  if (process.env.HAPP_TEST_PROBE) return Promise.resolve(JSON.parse(process.env.HAPP_TEST_PROBE));
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', PS_SCRIPT],
      { windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        try {
          const j = JSON.parse(stdout.trim());
          j.adapters = [].concat(j.adapters || []);
          j.processes = [].concat(j.processes || []);
          resolve(j);
        } catch (e) {
          reject(new Error('bad probe output'));
        }
      }
    );
  });
}

function evaluate(p) {
  const s = { proxy: false, adapter: false, process: false };
  if (cfg.detect.proxy && p.proxyEnable === 1) {
    s.proxy = !cfg.proxyMatch || new RegExp(cfg.proxyMatch, 'i').test(p.proxyServer || '');
  }
  if (cfg.detect.adapter && cfg.adapterRegex) {
    const re = new RegExp(cfg.adapterRegex, 'i');
    s.adapter = p.adapters.some((a) => re.test(a));
  }
  if (cfg.detect.process) {
    const names = cfg.processNames.map((n) => n.toLowerCase());
    s.process = p.processes.some((n) => names.includes(String(n).toLowerCase()));
  }
  return { signals: s, connected: s.proxy || s.adapter || s.process };
}

function proxyUrlFromSystem(p) {
  if (!p || p.proxyEnable !== 1 || !p.proxyServer) return '';
  let srv = String(p.proxyServer);
  let scheme = 'http';
  if (srv.includes('=')) {
    const parts = Object.fromEntries(srv.split(';').map((x) => x.split('=')));
    if (parts.https) srv = parts.https;
    else if (parts.http) srv = parts.http;
    else if (parts.socks) { srv = parts.socks; scheme = 'socks5h'; }
    else return '';
  }
  if (!/^\w+:\/\//.test(srv)) srv = `${scheme}://${srv}`;
  return srv;
}

async function resolveSpeedProxy(fresh) {
  if (cfg.speedProxy && cfg.speedProxy !== 'auto') return cfg.speedProxy;
  if (cfg.speedProxy === '') return '';
  try {
    const p = fresh || (await probe());
    if (cfg.proxyMatch && !new RegExp(cfg.proxyMatch, 'i').test(p.proxyServer || '')) return '';
    return proxyUrlFromSystem(p);
  } catch (_) { throw new Error('Cannot determine the Happ proxy. Test cancelled to avoid using a different route.'); }
}

// ---------------------------------------------------------------- diag mode
if (process.argv.includes('--speed')) {
  (async () => {
    const proxy = await resolveSpeedProxy();
    console.log('proxy:', proxy ? '(enabled)' : '(none)');
    const r = await runSpeedTest(
      { provider: process.argv.includes('--provider') ? process.argv[process.argv.indexOf('--provider') + 1] : 'yandex', server: cfg.speedServer,
        proxy, streams: cfg.speedStreams, seconds: Number(process.argv[process.argv.indexOf('--speed') + 1]) || 6 },
      (ph) => console.log('phase:', ph)
    );
    console.log(JSON.stringify(r, null, 2));
  })().catch((e) => { console.error('speed test failed:', e.message); process.exitCode = 1; });
  return;
}


if (process.argv.includes('--diag')) {
  probe()
    .then((p) => {
      const ev = evaluate(p);
      console.warn('Review adapter/process names before sharing this diagnostic output. Proxy addresses are omitted.');
      console.log(JSON.stringify({ evaluation: ev, raw: { ...p, proxyServer: p.proxyServer ? '(configured)' : '' } }, null, 2));
    })
    .catch((e) => { console.error('probe failed:', e.message); process.exitCode = 1; });
  return;
}

// ---------------------------------------------------------------- display
const { PROVIDERS, DEFAULT_DISPLAY, normalizeDisplay, animationMode, renderKey, renderScreen, setTranslator } = require('./lib/display.js');

// ---------------------------------------------------------------- main logic
const args = process.argv.slice(2);
const argv = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const PORT = Number(argv('-port'));
const UUID = argv('-pluginUUID');
const REGISTER = argv('-registerEvent');

const ACTION_TOGGLE = 'com.llwhite.happtoggle.toggle';
const ACTION_SPEED = 'com.llwhite.happtoggle.speed';

const DEFAULT_SETTINGS = { icons: {}, speedAuto: false, speedDelaySec: 3, speedSeconds: 6, displaySec: 10,
  speedProvider: 'yandex', speedDisplayMode: 'combined',
  transparentScreen: false, hideTestServer: false, ...DEFAULT_DISPLAY };

const contexts = new Map();  // context -> { action, controller, device, settings, speed, hold, autoTimer }
const deviceScreens = new Map(); // device -> { owner, provider, speed } for Neo Infobar
let ws;
let state = 'pending';       // on / off / pending / unknown
let pending = null;          // { prevConnected, until, ctx }
let timer = null;
let polling = false;
let speedRunning = false;
let activeSpeedRun = null; // { controller, context, info, display }
let animationTimer = null;
let animationFrame = Date.now();

function mergeSettings(s) {
  const m = normalizeDisplay({ ...DEFAULT_SETTINGS, ...(s || {}) });
  m.icons = { ...(s && s.icons ? s.icons : {}) };
  delete m.language;
  if (!PROVIDERS.includes(m.speedProvider)) m.speedProvider = 'yandex';
  return m;
}

function screenSnapshot(info) {
  return info.controller === 'Neo' ? deviceScreens.get(info.device) : null;
}

function animates(info) {
  const snapshot = screenSnapshot(info);
  return animationMode(info.settings, snapshot ? snapshot.speed : info.speed);
}

function renderCtx(context) {
  const info = contexts.get(context);
  if (!info || !ws) return;
  const screen = info.controller === 'Encoder' || info.controller === 'Neo';
  const image = screen ? renderScreen(info, state, screenSnapshot(info), animationFrame) : renderKey(info, state, animationFrame);
  if (image !== info.lastImage) {
    info.lastImage = image;
    ws.sendJSON(screen ? { event: 'setFeedback', context, payload: { screen: image } }
      : { event: 'setImage', context, payload: { image, target: 0 } });
  }
  scheduleAnimation();
}

function scheduleAnimation() {
  const running = [...contexts.values()].some(animates);
  if (!running) { clearTimeout(animationTimer); animationTimer = null; return; }
  if (animationTimer) return;
  animationTimer = setTimeout(() => {
    animationTimer = null;
    animationFrame = Date.now();
    for (const [context, info] of contexts) {
      if (animates(info)) renderCtx(context);
    }
    scheduleAnimation();
  }, 100);
}

function render() {
  for (const c of contexts.keys()) renderCtx(c);
}

function renderNeo(device) {
  for (const [context, info] of contexts) {
    if (info.controller === 'Neo' && info.device === device) renderCtx(context);
  }
}

function renderSpeed(context) {
  const info = contexts.get(context);
  if (!info) return;
  deviceScreens.set(info.device, { owner: context, provider: info.settings.speedProvider,
    speed: { ...info.speed, timer: null } });
  renderCtx(context);
  renderNeo(info.device);
}

function clearDeviceSpeed(context) {
  const info = contexts.get(context);
  if (!info || deviceScreens.get(info.device)?.owner !== context) return;
  deviceScreens.delete(info.device);
  renderNeo(info.device);
}

function cancelAutoSpeed(info) {
  clearTimeout(info.autoTimer);
  info.autoTimer = null;
}

function setState(s) {
  if (s !== state) {
    cancelActiveSpeedTest();
    deviceScreens.clear();
    for (const [context, info] of contexts) {
      if (info.controller === 'Encoder' || info.controller === 'Neo') clearSpeedDisplay(context);
    }
  }
  if (s === 'off' || s === 'unknown') {
    cancelActiveSpeedTest();
    for (const [context, info] of contexts) {
      cancelAutoSpeed(info);
      if (info.action === ACTION_TOGGLE) clearSpeedDisplay(context);
    }
  }
  state = s;
  render();
}

function clearSpeedDisplay(context) {
  const info = contexts.get(context);
  if (!info) return;
  clearTimeout(info.speed.timer);
  info.speed = { phase: null, partial: null, result: null, error: false, timer: null };
}

function scheduleResultExpiry(context) {
  const info = contexts.get(context);
  if (!info) return;
  const display = info.speed;
  clearTimeout(display.timer);
  display.timer = null;
  const sec = Number(info.settings.displaySec);
  if (info.controller !== 'Keypad' || display.phase || !display.result && !display.error || !(sec > 0)) return;
  display.timer = setTimeout(() => {
    if (contexts.get(context) === info && info.speed === display) {
      clearSpeedDisplay(context);
      renderCtx(context);
    }
  }, Math.min(3600, sec) * 1000);
}

function cancelActiveSpeedTest() {
  const run = activeSpeedRun;
  if (!run) return false;
  run.controller.abort();
  clearDeviceSpeed(run.context);
  if (contexts.get(run.context) === run.info && run.info.speed === run.display) {
    clearSpeedDisplay(run.context);
    renderCtx(run.context);
  }
  return true;
}

function scheduleAutoSpeed(context) {
  const info = contexts.get(context);
  if (!info || !info.settings.speedAuto) return;
  cancelAutoSpeed(info);
  const delay = Math.max(0, Math.min(60, Number(info.settings.speedDelaySec) || 0)) * 1000;
  log('auto speed test in', delay, 'ms');
  info.autoTimer = setTimeout(() => {
    info.autoTimer = null;
    if (contexts.get(context) === info && state === 'on' && info.settings.speedAuto) startSpeedTest(context);
  }, delay);
}

function cycleProvider(context, ticks) {
  const info = contexts.get(context);
  if (!info || !Number.isSafeInteger(ticks) || ticks === 0) return;
  const index = (PROVIDERS.indexOf(info.settings.speedProvider) + ticks % PROVIDERS.length + PROVIDERS.length) % PROVIDERS.length;
  const provider = PROVIDERS[index];
  if (provider === info.settings.speedProvider) return;
  if (activeSpeedRun && activeSpeedRun.context === context) cancelActiveSpeedTest();
  cancelAutoSpeed(info);
  clearDeviceSpeed(context);
  clearSpeedDisplay(context);
  info.settings.speedProvider = provider;
  ws.sendJSON({ event: 'setSettings', context, payload: info.settings });
  renderCtx(context);
}

// ---- замер скорости
async function startSpeedTest(context) {
  if (activeSpeedRun) { cancelActiveSpeedTest(); return; }
  const info = contexts.get(context);
  if (!info || info.controller === 'Neo' || speedRunning) return;
  for (const entry of contexts.values()) cancelAutoSpeed(entry);
  speedRunning = true;
  cfg = loadConfig();
  clearSpeedDisplay(context);
  const display = info.speed;
  const controller = new AbortController();
  const run = { controller, context, info, display };
  activeSpeedRun = run;
  const active = () => !controller.signal.aborted && activeSpeedRun === run && contexts.get(context) === info && info.speed === display;
  display.phase = 'ping';
  renderSpeed(context);
  try {
    const proxy = await resolveSpeedProxy();
    if (controller.signal.aborted) return;
    log('speed test start, provider=', info.settings.speedProvider, 'proxy=', proxy ? 'enabled' : 'none');
    let lastUpdate = -Infinity;
    const res = await runSpeedTest(
      { provider: info.settings.speedProvider, server: cfg.speedServer, proxy, streams: cfg.speedStreams,
        seconds: Math.max(3, Math.min(20, Number(info.settings.speedSeconds) || 6)), signal: controller.signal },
      (ph) => { if (active()) { display.phase = ph; lastUpdate = -Infinity; renderSpeed(context); } },
      (partial) => {
        if (!active()) return;
        display.partial = { ...(display.partial || {}), ...partial };
        if (Date.now() - lastUpdate >= 500 || partial.pingMs != null && lastUpdate === -Infinity) {
          lastUpdate = Date.now();
          renderSpeed(context);
        }
      }
    );
    log('speed result:', JSON.stringify(res));
    if (active()) { display.phase = null; display.result = res; }
  } catch (e) {
    if (controller.signal.aborted || e.name === 'AbortError') log('speed test cancelled');
    else {
      log('speed test error:', e.message);
      if (active()) {
        display.phase = null;
        display.error = true;
        ws.sendJSON({ event: 'showAlert', context });
      }
    }
  } finally {
    const stillCurrent = contexts.get(context) === info && info.speed === display;
    const ownsRun = activeSpeedRun === run;
    if (ownsRun && stillCurrent && !controller.signal.aborted) {
      renderSpeed(context);
      scheduleResultExpiry(context);
    }
    if (ownsRun) activeSpeedRun = null;
    speedRunning = false;
  }
}

// ---- опрос статуса
async function tick() {
  if (polling) return;
  polling = true;
  try {
    const p = await probe();
    const { connected } = evaluate(p);
    if (pending) {
      if (connected !== pending.prevConnected) {
        const ctx = pending.ctx;
        pending = null;
        setState(connected ? 'on' : 'off');
        if (connected) scheduleAutoSpeed(ctx);
      } else if (Date.now() > pending.until) {
        log('toggle did not change detected state; check config / run --diag');
        pending = null;
        setState(connected ? 'on' : 'off');
      }
    } else {
      const next = connected ? 'on' : 'off';
      if (next !== state) setState(next);
    }
  } catch (e) {
    log('probe error:', e.message);
    if (!pending) setState('unknown');
  } finally {
    polling = false;
    schedule();
  }
}

function schedule() {
  clearTimeout(timer);
  timer = null;
  if (contexts.size === 0) return;
  timer = setTimeout(() => { timer = null; tick(); }, pending ? cfg.fastPollMs : cfg.pollMs);
}

function toggle(context) {
  if (pending) return;
  cancelActiveSpeedTest();
  cfg = loadConfig(); // подхватываем пользовательские переопределения без перезапуска
  for (const [c, info] of contexts) { cancelAutoSpeed(info); clearSpeedDisplay(c); }
  pending = { prevConnected: state === 'on', until: Date.now() + cfg.fastPollMaxMs, ctx: context };
  setState('pending');
  toggleKeepingTray(cfg.deeplink).catch((e) => log('toggle window error:', e.message));
  clearTimeout(timer);
  timer = setTimeout(tick, cfg.fastPollMs);
}

// ---- события Stream Deck
function onMessage(text) {
  const m = JSON.parse(text);
  switch (m.event) {
    case 'willAppear': {
      const previous = contexts.get(m.context);
      if (previous) {
        if (activeSpeedRun && activeSpeedRun.context === m.context) cancelActiveSpeedTest();
        cancelAutoSpeed(previous);
        clearSpeedDisplay(m.context);
        clearTimeout(previous.hold && previous.hold.t);
      }
      contexts.set(m.context, {
        action: m.action,
        controller: m.payload && m.payload.controller || 'Keypad',
        device: m.device || '',
        settings: mergeSettings(m.payload && m.payload.settings),
        speed: { phase: null, partial: null, result: null, error: false, timer: null },
        hold: null,
        autoTimer: null,
      });
      const controller = contexts.get(m.context).controller;
      if (controller === 'Neo') {
        ws.sendJSON({ event: 'setFeedbackLayout', context: m.context, payload: { layout: 'layouts/neo.json' } });
      }
      renderCtx(m.context);
      // A standalone speed key also needs route/status monitoring to cancel stale tests.
      if (!timer && !polling) tick(); else schedule();
      break;
    }
    case 'willDisappear': {
      if (activeSpeedRun && activeSpeedRun.context === m.context) cancelActiveSpeedTest();
      const info = contexts.get(m.context);
      if (info) {
        cancelAutoSpeed(info);
        clearSpeedDisplay(m.context);
        clearTimeout(info.hold && info.hold.t);
      }
      contexts.delete(m.context);
      scheduleAnimation();
      if (contexts.size === 0) { clearTimeout(timer); timer = null; }
      break;
    }
    case 'didReceiveSettings': {
      const info = contexts.get(m.context);
      if (info) {
        const settings = mergeSettings(m.payload && m.payload.settings);
        if (settings.speedProvider !== info.settings.speedProvider || settings.speedSeconds !== info.settings.speedSeconds) {
          if (activeSpeedRun && activeSpeedRun.context === m.context) cancelActiveSpeedTest();
          cancelAutoSpeed(info);
          clearDeviceSpeed(m.context);
          clearSpeedDisplay(m.context);
        }
        const expiryChanged = Number(settings.displaySec) !== Number(info.settings.displaySec);
        info.settings = settings;
        if (expiryChanged) scheduleResultExpiry(m.context);
        if (!info.settings.speedAuto) cancelAutoSpeed(info);
        renderCtx(m.context);
      }
      break;
    }
    case 'keyDown': {
      const info = contexts.get(m.context);
      if (!info || info.controller !== 'Keypad' || info.hold) break;
      const hold = { fired: false, t: null };
      info.hold = hold;
      if (info.action === ACTION_SPEED && activeSpeedRun) {
        hold.fired = true;
        cancelActiveSpeedTest();
        break;
      }
      // VPN: удержание — тест; кнопка скорости: удержание — выбор сервиса.
      hold.t = setTimeout(() => {
        if (contexts.get(m.context) !== info || info.hold !== hold) return;
        hold.fired = true;
        if (info.action === ACTION_SPEED) cycleProvider(m.context, 1);
        else startSpeedTest(m.context);
      }, cfg.longPressMs);
      break;
    }
    case 'keyUp': {
      const info = contexts.get(m.context);
      if (!info || info.controller !== 'Keypad' || !info.hold) break;
      clearTimeout(info.hold.t);
      const fired = info.hold.fired;
      info.hold = null;
      if (!fired) {
        if (info.action === ACTION_SPEED) startSpeedTest(m.context);
        else toggle(m.context);
      }
      break;
    }
    case 'dialRotate': {
      const info = contexts.get(m.context);
      if (!info || info.action !== ACTION_SPEED || info.controller !== 'Encoder') break;
      if (info.hold || m.payload && m.payload.pressed) {
        if (info.hold) {
          clearTimeout(info.hold.t);
          info.hold.fired = true;
        }
        break;
      }
      cycleProvider(m.context, m.payload && m.payload.ticks);
      break;
    }
    case 'dialDown':
    case 'dialUp':
    case 'dialPress': {
      const info = contexts.get(m.context);
      if (!info || info.action !== ACTION_SPEED || info.controller !== 'Encoder') break;
      const pressed = m.event === 'dialPress' ? !!(m.payload && m.payload.pressed) : m.event === 'dialDown';
      if (pressed) {
        if (info.hold) break;
        const hold = { fired: false, t: null };
        info.hold = hold;
        hold.t = setTimeout(() => {
          if (contexts.get(m.context) !== info || info.hold !== hold) return;
          hold.fired = true;
          toggle(m.context);
        }, cfg.longPressMs);
      } else if (info.hold) {
        clearTimeout(info.hold.t);
        const fired = info.hold.fired;
        info.hold = null;
        if (!fired) startSpeedTest(m.context);
      }
      break;
    }
    case 'deviceDidDisconnect':
      deviceScreens.delete(m.device);
      renderNeo(m.device);
      break;
    case 'touchTap': {
      const info = contexts.get(m.context);
      if (info && info.action === ACTION_SPEED && info.controller === 'Encoder' && m.payload && !m.payload.hold) toggle(m.context);
      break;
    }
    default:
      break;
  }
}

if (!PORT || !UUID || !REGISTER) {
  console.error('Started by Stream Deck. Diagnostics: node plugin.js --diag | node plugin.js --speed');
  process.exit(1);
}

import('@elgato/streamdeck').then((sdk) => {
  ws = createSDKAdapter(sdk, { actionIds: [ACTION_TOGGLE, ACTION_SPEED], onMessage, log });
  setTranslator((key) => ws.translate(key));
  return ws.connect();
}).catch(() => {
  log('Stream Deck SDK initialization failed');
  process.exitCode = 1;
});
