'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const plugin = fs.readdirSync(root).find((name) => name.endsWith('.sdPlugin'));
const display = require(path.join(root, plugin, 'lib/display.js'));
const output = path.resolve(process.argv[2] || path.join(root, 'publish/1.12/media'));
fs.mkdirSync(output, { recursive: true });
const settings = display.normalizeDisplay({ language: 'en', speedProvider: 'yandex', hideTestServer: false,
  animateIdle: false, animateTest: false, transparentScreen: false });
const empty = { phase: null, result: null, partial: null, error: false };
const measured = { ...empty, result: { downMbps: 145, upMbps: 86.9, pingMs: 22 } };
const key = (state, speed = empty, action = 'toggle') => display.renderKey({ action: 'com.llwhite.happtoggle.' + action, settings, speed }, state, 0);
const screen = (controller, speed, overrides = {}) => display.renderScreen({ controller,
  settings: { ...settings, ...overrides }, speed }, 'on', controller === 'Neo' ? { speed, provider: 'yandex' } : null, 0);
function xml(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function t(x, y, value, size, color = '#152020', weight = 400) {
  return `<text x="${x}" y="${y}" font-family="Bahnschrift" font-size="${size}" font-weight="${weight}" fill="${color}">${xml(value)}</text>`;
}
function embed(uri, x, y, w, h) {
  const data = uri.includes(';base64,') ? Buffer.from(uri.split(',')[1], 'base64').toString('utf8') : decodeURIComponent(uri.split(',')[1]);
  const dims = data.match(/viewBox="([^"]+)"/)[1];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${dims}">${data.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`;
}
const logo = (x, y, size, white = false) => `<g transform="translate(${x} ${y}) scale(${size / 288})">` +
  `<rect width="288" height="288" rx="62" fill="${white ? '#ffffff' : '#152020'}"/>` +
  '<path d="M198 76 A78 78 0 1 1 90 76 M144 43 V125" fill="none" stroke="#34d399" stroke-width="16" stroke-linecap="round"/>' +
  '<path d="M114 218 H174" fill="none" stroke="#c084fc" stroke-width="8" stroke-linecap="round"/></g>';
const base = (body, w = 1920, h = 960) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f4f6f5"/>${body}</svg>`;
const footer = () => t(112, 902, 'Independent integration · Alexey Storozhilov', 22, '#60716c') +
  t(1110, 902, 'Interface preview · illustrative values', 22, '#60716c');
const gallery = (title, subtitle, content) => base(logo(112, 72, 64) + t(200, 117, 'Happ Toggle', 32, '#152020', 600) +
  t(112, 276, title, 74, '#152020', 600) + t(112, 350, subtitle, 31, '#60716c') + content + footer());
async function save(name, source) {
  fs.writeFileSync(path.join(output, name + '.svg'), source);
}
(async () => {
  await save('marketplace-icon', base(logo(0, 0, 288), 288, 288));
  await save('plugin-icon-256', base(logo(0, 0, 256), 256, 256));
  await save('plugin-icon-512', base(logo(0, 0, 512), 512, 512));
  await save('cover', base(logo(112, 90, 96) + t(236, 154, 'Independent Happ integration', 30, '#60716c') +
    t(112, 338, 'Happ Toggle', 132, '#152020', 600) + t(112, 431, 'VPN control.', 58) + t(112, 503, 'Measured speed.', 58) +
    t(112, 643, 'Keys, dials and compact screens.', 32, '#60716c') +
    t(112, 706, 'Windows 10/11 · Stream Deck 7.6+', 27, '#60716c') +
    embed(screen('Encoder', measured, { showScreenPing: true }), 1050, 264, 720, 360) + footer()));
  await save('gallery-01-control', gallery('One press. A clear state.', 'Toggle Happ without searching for its window.',
    embed(key('on'), 112, 431, 352, 352) + embed(key('off'), 530, 431, 352, 352) +
    t(1070, 498, 'Short press', 34, '#152020', 600) + t(1070, 548, 'Connect or disconnect Happ.', 28, '#60716c') +
    t(1070, 649, 'Hold the VPN key', 34, '#152020', 600) + t(1070, 699, 'Start a manual speed test.', 28, '#60716c')));
  await save('gallery-02-speed', gallery('Measure your connection.', 'Choose Yandex, Cloudflare or Speedtest.net.',
    embed(key('on', measured, 'speed'), 112, 443, 330, 330) +
    embed(screen('Encoder', measured, { showScreenPing: true }), 576, 453, 650, 325) +
    t(1310, 500, 'Download & upload', 30, '#152020', 600) + t(1310, 560, 'Optional HTTP latency', 27, '#60716c') +
    t(1310, 660, 'Press again to cancel.', 27, '#60716c') + t(1310, 712, 'Auto-test after connecting.', 27, '#60716c')));
  await save('gallery-03-dial', gallery('A dial for VPN and speed.', 'A compact control surface, with your preferred layout.',
    embed(screen('Encoder', measured, { showScreenPing: false, hideTestServer: true }), 112, 459, 600, 300) +
    t(848, 472, 'Rotate', 34, '#152020', 600) + t(1070, 472, 'Select the test service.', 29, '#60716c') +
    t(848, 564, 'Press', 34, '#152020', 600) + t(1070, 564, 'Start or cancel the test.', 29, '#60716c') +
    t(848, 656, 'Hold or tap', 34, '#152020', 600) + t(1070, 656, 'Toggle Happ VPN.', 29, '#60716c') +
    t(848, 755, 'Bahnschrift · optional units · subtle motion', 25, '#60716c')));
  await save('gallery-04-neo', gallery('Small screen. Useful feedback.', 'Stream Deck Neo Infobar follows tests from a key on the same device.',
    embed(screen('Neo', measured, { showScreenPing: true }), 112, 494, 928, 200) +
    t(1160, 510, 'Status, speed and delay', 34, '#152020', 600) + t(1160, 575, 'Display-only Infobar.', 28, '#60716c') +
    t(1160, 634, 'Start tests from a regular key.', 28, '#60716c') +
    t(112, 777, 'Russian & English · connection or power icon · independently saved settings', 26, '#60716c')));
  const cover = fs.readFileSync(path.join(output, 'cover.svg'), 'utf8');
  await save('github-social-preview', cover.replace('width="1920" height="960"', 'width="1280" height="640"'));
  execFileSync('powershell.exe', ['-NoProfile', '-File', path.join(__dirname, 'render-svg.ps1'), '-Directory', output], { stdio: 'inherit' });
  fs.writeFileSync(path.join(output, 'preview.html'), '<!doctype html><meta charset="utf-8"><title>Happ Toggle artwork</title><style>body{background:#e8eeeb;font-family:Bahnschrift;margin:24px}img{max-width:100%;display:block;margin:0 0 28px}</style>' +
    ['cover', 'gallery-01-control', 'gallery-02-speed', 'gallery-03-dial', 'gallery-04-neo'].map((name) => `<img src="${name}.png" alt="${name}">`).join(''));
  console.log('Artwork created:', output);
})().catch((error) => { console.error('Artwork generation failed:', error.message); process.exitCode = 1; });
