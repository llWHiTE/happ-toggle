'use strict';

const PROVIDERS = ['yandex', 'cloudflare', 'speedtest'];
const PROVIDER_NAMES = { yandex: 'Yandex', cloudflare: 'Cloudflare', speedtest: 'Speedtest.net' };
// Stream Deck's SVG renderer needs a concrete font family, not a CSS fallback list.
const FONT = 'Bahnschrift';
const FONTS = { segoe: 'Segoe UI', arial: 'Arial', consolas: 'Consolas', bahnschrift: FONT };
const STYLES = {
  regular: { weight: 400, style: 'normal' }, semibold: { weight: 600, style: 'normal' },
  bold: { weight: 700, style: 'normal' }, italic: { weight: 400, style: 'italic' },
};
let translate = (key) => key;
function setTranslator(provider) { translate = provider; }
const COLORS = { on: '#34d399', off: '#829198', pending: '#d69e2e', unknown: '#f87171',
  ping: '#d69e2e', download: '#34d399', upload: '#c084fc' };
const DEFAULT_DISPLAY = {
  speedDisplayMode: 'combined', speedUnit: 'mbps', showSpeedUnits: true, showScreenPing: false,
  numberFont: 'bahnschrift', numberStyle: 'semibold', screenStatusIcon: 'link', animateTest: true, animateIdle: true,
};

function normalizeDisplay(settings) {
  const result = { ...DEFAULT_DISPLAY, ...settings };
  delete result.speedPrecision;
  delete result.hideStatusLabels;
  for (const [key, allowed] of Object.entries({
    speedDisplayMode: ['combined', 'phase'], speedUnit: ['mbps', 'mbytes'],
    numberFont: Object.keys(FONTS), numberStyle: Object.keys(STYLES), screenStatusIcon: ['link', 'power'],
  })) {
    if (!allowed.includes(result[key])) result[key] = DEFAULT_DISPLAY[key];
  }
  for (const key of ['showSpeedUnits', 'showScreenPing', 'animateTest', 'animateIdle']) {
    if (typeof result[key] !== 'boolean') result[key] = DEFAULT_DISPLAY[key];
  }
  return result;
}

function xml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function localizedText() { return { error: translate('Speed test failed'), mbps: translate('Mbps'), mbytes: translate('MB/s') }; }

function fmtSpeed(value, settings) {
  if (!Number.isFinite(value)) return '—';
  const v = settings.speedUnit === 'mbytes' ? value / 8 : value;
  return v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2);
}

function fmtPing(value) { return Number.isFinite(value) ? String(Math.round(value)) : '—'; }

function text(x, y, value, size, color = '#e5edeb', anchor = 'middle', settings) {
  const font = settings ? FONTS[settings.numberFont] || FONT : FONT;
  const style = settings ? STYLES[settings.numberStyle] || STYLES.semibold : STYLES.regular;
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${style.weight}" font-style="${style.style}" fill="${color}" text-anchor="${anchor}">${xml(value)}</text>`;
}

function textWidth(value, settings) {
  const mono = settings && settings.numberFont === 'consolas';
  const width = [...String(value)].reduce((sum, char) => sum +
    (char === '—' ? 1.05 : mono ? 0.66 : /[.,]/.test(char) ? 0.3 : char === ' ' ? 0.35 : /[mwMW]/.test(char) ? 0.9 : 0.66), 0);
  return Math.max(0.3, width) * (settings && settings.numberStyle === 'italic' ? 1.08 : 1);
}

function fit(value, width, max, settings) {
  return Math.max(8, Math.min(max, Math.floor(width / textWidth(value, settings))));
}

function svg(width, height, body, base64 = false) {
  const image = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  return base64 ? 'data:image/svg+xml;base64,' + Buffer.from(image).toString('base64')
    : 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(image);
}

function animationMode(settings, speed) {
  if (speed.phase) return settings.animateTest ? 'test' : null;
  return !speed.error && settings.animateIdle ? 'idle' : null;
}

function wave(time, period = 6000) { return (1 + Math.cos(2 * Math.PI * (time % period) / period)) / 2; }

function breathe(settings, speed, time) {
  return animationMode(settings, speed) === 'idle' ? (0.25 + 0.75 * wave(time)).toFixed(3) : '1';
}

function power(state, x, y, size, opacity = '1') {
  const mark = state === 'unknown'
    ? '<circle cx="12" cy="12" r="9"/><path d="M12 6 V13 M12 17 V17.2"/>'
    : `<path d="M18.6 5.4 A9 9 0 1 1 5.4 5.4"${state === 'pending' ? ' stroke-dasharray="3 2"' : ''}/><path d="M12 2 V11"/>`;
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${COLORS[state]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">${mark}</g>`;
}

function screenStatus(state, x, y, size, settings, opacity) {
  if (settings.screenStatusIcon === 'power') return power(state, x, y, size, opacity);
  const joined = state === 'on';
  const mark = `<rect x="2" y="7" width="${joined ? 9 : 7}" height="10" rx="4"/>` +
    `<rect x="${joined ? 13 : 15}" y="7" width="${joined ? 9 : 7}" height="10" rx="4"/>` +
    (joined ? '<path d="M8 12 H16"/>' : state === 'pending' ? '<path d="M11 12 H13" stroke-dasharray=".5 1.5"/>'
      : state === 'unknown' ? '<path d="M9 5 L15 19"/>' : '');
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${COLORS[state]}" stroke-width="2.2" stroke-linecap="round" opacity="${opacity}">${mark}</g>`;
}

function metricIcon(type, x, y, size, settings, speed, time) {
  const mode = animationMode(settings, speed);
  const offset = mode === 'test' && type !== 'ping' ? (1.5 * Math.sin(2 * Math.PI * (time % 2400) / 2400)).toFixed(2) : 0;
  const opacity = mode === 'idle' ? (0.55 + 0.45 * wave(time)).toFixed(3) : '1';
  const angle = mode === 'test' && type === 'ping' ? (time % 3000 / 3000 * 360).toFixed(1) : 0;
  const mark = type === 'ping'
    ? `<circle cx="12" cy="12" r="8"/><path d="M12 12 V6" transform="rotate(${angle} 12 12)"/><path d="M12 12 L16 14"/>`
    : type === 'download' ? '<path d="M12 3 V20 M6 14 L12 20 L18 14"/>' : '<path d="M12 21 V4 M6 10 L12 4 L18 10"/>';
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${COLORS[type]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"><g transform="translate(0 ${offset})">${mark}</g></g>`;
}

function speedIdleImage(settings, speed, time) {
  const hidden = settings.hideTestServer;
  const angle = animationMode(settings, speed) === 'idle' ? (7 * Math.sin(2 * Math.PI * (time % 6000) / 6000)).toFixed(2) : 0;
  return `<g${hidden ? ' transform="translate(72 72) scale(1.4) translate(-72 -72)"' : ''}>` +
    '<path d="M32 91 A40 40 0 0 1 112 91" fill="none" stroke="#829198" stroke-width="5" stroke-linecap="round"/>' +
    `<path d="M72 91 L93 59" transform="rotate(${angle} 72 91)" stroke="#34d399" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="72" cy="91" r="5" fill="#34d399" opacity="${breathe(settings, speed, time)}"/></g>` +
    (hidden ? '' : text(72, 129, PROVIDER_NAMES[settings.speedProvider] || 'Yandex', 17));
}

function customImage(uri, opacity = 1) {
  return `<image href="${xml(uri)}" x="0" y="0" width="144" height="144" opacity="${opacity}" preserveAspectRatio="xMidYMid slice"/>`;
}

function speedResultImage(values, settings, speed, time) {
  const down = fmtSpeed(values.downMbps, settings), up = fmtSpeed(values.upMbps, settings);
  const units = settings.showSpeedUnits;
  const size = (v) => fit(v, 100, units ? 40 : 47, settings);
  const downY = units ? 44 : 51, upY = units ? 87 : 103;
  return metricIcon('download', 15, downY - 13, 24, settings, speed, time) +
    text(134, downY, down, size(down), COLORS.download, 'end', settings) +
    metricIcon('upload', 15, upY - 13, 24, settings, speed, time) +
    text(134, upY, up, size(up), COLORS.upload, 'end', settings) +
    (units ? text(72, 111, localizedText()[settings.speedUnit], 18) : '') +
    metricIcon('ping', 26, 129, 17, settings, speed, time) +
    text(85, 137, `${fmtPing(values.pingMs)} ms`, fit(`${fmtPing(values.pingMs)} ms`, 94, 20, settings), '#e5edeb', 'middle', settings);
}

function phaseValue(phase, values, settings) {
  return phase === 'ping' ? fmtPing(values.pingMs) : fmtSpeed(phase === 'download' ? values.downMbps : values.upMbps, settings);
}

function speedPhaseImage(speed, values, settings, time) {
  const phase = speed.phase, value = phaseValue(phase, values, settings);
  const unit = phase === 'ping' ? 'ms' : settings.showSpeedUnits ? localizedText()[settings.speedUnit] : '';
  return metricIcon(phase, 72, unit ? 28 : 23, 28, settings, speed, time) +
    text(72, unit ? 101 : 115, value, fit(value, 126, unit ? 64 : 74, settings), COLORS[phase], 'middle', settings) +
    (unit ? text(72, 132, unit, 18) : '');
}

function renderKey(info, state, time) {
  const settings = info.settings, speed = info.speed;
  const custom = info.action === 'com.llwhite.happtoggle.toggle' && settings.icons && settings.icons[state];
  if (!speed.phase && !speed.result && !speed.error) {
    if (custom && !animationMode(settings, speed)) return custom;
    return svg(144, 144, custom ? customImage(custom, breathe(settings, speed, time)) : info.action === 'com.llwhite.happtoggle.speed'
      ? speedIdleImage(settings, speed, time) : power(state, 72, 72, 108, breathe(settings, speed, time)));
  }
  const values = speed.phase ? speed.partial || {} : speed.result || {};
  const body = speed.error ? text(72, 76, localizedText().error, fit(localizedText().error, 128, 20), '#f87171')
    : speed.phase && settings.speedDisplayMode === 'phase' ? speedPhaseImage(speed, values, settings, time)
    : speedResultImage(values, settings, speed, time);
  return svg(144, 144, (custom ? customImage(custom, 0.25) : '') + body);
}

function metric(type, value, x, y, width, max, settings, speed, time) {
  const gap = ['arial', 'segoe'].includes(settings.numberFont) ? 12 : 8;
  const iconSize = Math.max(12, Math.min(24, max * 0.65));
  const size = fit(value, width - iconSize - gap, max, settings);
  const span = textWidth(value, settings) * size;
  const left = x - (span + iconSize + gap) / 2;
  return metricIcon(type, left + iconSize / 2, y - size * 0.35, iconSize, settings, speed, time) +
    text(left + iconSize + gap + span / 2, y, value, size, COLORS[type], 'middle', settings);
}

function renderScreen(info, state, snapshot, time) {
  const settings = info.settings, neo = info.controller === 'Neo';
  const speed = snapshot ? snapshot.speed : info.speed;
  const values = speed.phase ? speed.partial || {} : speed.result || {};
  const provider = snapshot ? snapshot.provider : neo ? null : settings.speedProvider;
  const label = speed.result && speed.result.server && provider === 'speedtest' ? speed.result.server : PROVIDER_NAMES[provider] || '';
  const clean = String(label).replace(/[\x00-\x1f\x7f]/g, '');
  const limit = neo ? 25 : 23;
  const short = clean.length > limit ? clean.slice(0, limit - 1) + '…' : clean;
  const serverVisible = !settings.hideTestServer && !!short;
  const t = localizedText(), width = neo ? 232 : 200, height = neo ? 50 : 100;
  const phaseMode = speed.phase && settings.speedDisplayMode === 'phase';
  const inPingPhase = phaseMode && speed.phase === 'ping';
  const pingVisible = settings.showScreenPing && !inPingPhase;
  const unit = inPingPhase ? 'ms' : settings.showSpeedUnits ? t[settings.speedUnit] : '';
  const opacity = breathe(settings, speed, time);
  let labels, numbers = '';
  if (neo) {
    labels = screenStatus(state, serverVisible ? 16 : width / 2, 11, serverVisible ? 20 : 24, settings, opacity);
    if (serverVisible) labels += text(132, 16, short, fit(short, 192, 14));
  } else {
    labels = screenStatus(state, serverVisible ? 18 : width / 2, serverVisible ? 15 : 16, serverVisible ? 26 : 32, settings, opacity);
    if (serverVisible) labels += text(116, 20, short, fit(short, 156, 16));
  }
  if (speed.error) {
    numbers = text(width / 2, neo ? 38 : 65, t.error, fit(t.error, width - 16, neo ? 15 : 20), '#f87171');
  } else {
    const top = neo ? 22 : serverVisible ? 33 : 28;
    const bottom = neo ? (unit ? 36 : 48) : pingVisible ? (unit ? 65 : 71) : unit ? 79 : 95;
    const max = Math.min(neo ? (pingVisible ? 17 : 25) : pingVisible ? 32 : 48, bottom - top + 1);
    const y = (top + bottom) / 2 + max * 0.32;
    if (phaseMode) {
      numbers = metric(speed.phase, phaseValue(speed.phase, values, settings), width / 2, y, width - 16, max, settings, speed, time);
    } else if (neo && pingVisible) {
      const cell = width / 3;
      numbers = metric('download', fmtSpeed(values.downMbps, settings), cell / 2, y, cell - 4, max, settings, speed, time) +
        metric('upload', fmtSpeed(values.upMbps, settings), cell * 1.5, y, cell - 4, max, settings, speed, time) +
        metric('ping', `${fmtPing(values.pingMs)} ms`, cell * 2.5, y, cell - 4, max, settings, speed, time);
    } else {
      numbers = metric('download', fmtSpeed(values.downMbps, settings), width / 4, y, width / 2 - 8, max, settings, speed, time) +
        metric('upload', fmtSpeed(values.upMbps, settings), width * 3 / 4, y, width / 2 - 8, max, settings, speed, time);
    }
    if (!neo && pingVisible) {
      const ping = `${fmtPing(values.pingMs)} ms`;
      numbers += metric('ping', ping, width / 2, unit ? 82 : 95, width - 32, unit ? 18 : 20, settings, speed, time);
    } else if (neo && pingVisible && phaseMode) {
      // Keep a small latency readout alongside the active download/upload value.
      numbers = metric(speed.phase, phaseValue(speed.phase, values, settings), 79, y, 148, max, settings, speed, time) +
        metric('ping', `${fmtPing(values.pingMs)} ms`, 195, y, 66, max, settings, speed, time);
    }
    if (unit) numbers += text(width / 2, height - 2, unit, neo ? 9 : 12, '#a9b8bc');
  }
  return svg(width, height, (settings.transparentScreen ? '' : `<rect width="${width}" height="${height}" fill="#171b1e"/>`) + labels + numbers, true);
}

module.exports = { PROVIDERS, DEFAULT_DISPLAY, normalizeDisplay, animationMode, renderKey, renderScreen, setTranslator };
