'use strict';
/* Замер скорости через curl.exe: байты всех потоков / общее прошедшее время. */
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

const NULL_DEV = process.platform === 'win32' ? 'NUL' : '/dev/null';
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const DOWNLOAD_BYTES = 25_000_000;
const FALLBACK_BYTES = 5_000_000;
const UPLOAD_BYTES = 8 * 1024 * 1024;

function abortError() {
  const error = new Error('замер отменён');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal) {
  if (signal && signal.aborted) throw abortError();
}

function curl(args, timeoutMs, signal) {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    execFile(CURL, args, { windowsHide: true, timeout: timeoutMs, maxBuffer: 1024 * 1024, signal }, (err, stdout, stderr) => {
      if ((signal && signal.aborted) || (err && err.name === 'AbortError')) return reject(abortError());
      resolve({ err, out: String(stdout || '').trim(), stderr: String(stderr || '').trim() });
    });
  });
}

function baseArgs(o, headers = []) {
  const a = ['-q', '-s', '-S', '--connect-timeout', '8', '-H', 'Cache-Control: no-cache'];
  if (o.proxy) a.push('-x', o.proxy, '--noproxy', '');
  else a.push('--noproxy', '*');
  for (const h of headers) a.push('-H', h);
  return a;
}

function details(r) {
  // Сообщение execFile может содержать всю команду, включая пароль прокси.
  return String(r.stderr || (r.err && `curl code ${r.err.code || 'unknown'}`) || 'нет ответа')
    .replace(/(\w+:\/\/)[^\s/]*@/g, '$1***@').slice(0, 200);
}

function parseMetrics(r) {
  const fields = r.out.split('|');
  const [code, size, time, first, ready] = fields.map((x) => x.trim() ? Number(x.replace(',', '.')) : NaN);
  if (fields.length !== 5 || ![code, size, time, first, ready].every(Number.isFinite) ||
      !Number.isInteger(code) || !Number.isInteger(size) || size < 0 ||
      time <= 0 || first < 0 || ready < 0 || ready > time || first > time) {
    throw new Error(`неверные данные curl: ${details(r)}`);
  }
  return { code, size, time, first, ready };
}

function metrics(r) {
  const { code, size, time, first, ready } = parseMetrics(r);
  if (code !== 200) {
    const error = new Error(code === 429
      ? 'сервер ограничил частоту запросов (HTTP 429); повторите позже'
      : `сервер замера вернул HTTP ${code}: ${details(r)}`);
    error.httpCode = code;
    throw error;
  }
  if (r.err && r.err.code !== 28 && r.err.code !== '28') throw new Error(`ошибка curl: ${details(r)}`);
  if (size <= 0) throw new Error(`сервер не передал данные: ${details(r)}`);
  return { size, time, first, ready, timedOut: !!r.err };
}

async function fetchJson(o, url) {
  const r = await curl([...baseArgs(o, ['Accept: application/json']), '--max-time', '12',
    '-w', '\n__HTTP__%{http_code}', url], 15000, o.signal);
  const marker = r.out.lastIndexOf('\n__HTTP__');
  const code = marker < 0 ? 0 : Number(r.out.slice(marker + 9));
  if (r.err || code !== 200) throw new Error(`не удалось получить список серверов (HTTP ${code}): ${details(r)}`);
  try { return JSON.parse(r.out.slice(0, marker)); }
  catch (_) { throw new Error('неверный ответ сервиса со списком серверов'); }
}

async function pingUrl(o, url, headers = []) {
  const r = await curl([...baseArgs(o, headers), '-o', NULL_DEV,
    '-w', '%{http_code}|%{time_starttransfer}|%{time_pretransfer}', '--max-time', '6', url], 9000, o.signal);
  const fields = r.out.split('|');
  const [code, first, ready] = fields.map((x) => x.trim() ? Number(x.replace(',', '.')) : NaN);
  // HTTP-задержка после готовности соединения, а не ICMP ping.
  const latency = first - ready;
  return !r.err && fields.length === 3 && code === 200 && ready >= 0 &&
    Number.isFinite(latency) && latency > 0 ? Math.round(latency * 1000) : null;
}

async function stablePing(o, url, headers, first) {
  const times = [first];
  for (let i = 0; i < 2; i++) {
    const ms = await pingUrl(o, url, headers);
    if (ms != null) times.push(ms);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

async function pingCloudflare(o) {
  const times = [];
  for (let i = 0; i < 5; i++) {
    const ms = await pingUrl(o, `${o.server}/__down?bytes=0&r=${crypto.randomBytes(4).toString('hex')}`);
    if (ms != null) times.push(ms);
  }
  times.sort((a, b) => a - b);
  return times.length ? times[Math.floor(times.length / 2)] : null;
}

async function checkUpload(o, endpoint) {
  const r = await curl([...baseArgs(o, endpoint.headers), '-o', NULL_DEV,
    '-w', '%{http_code}|%{size_upload}|%{time_total}|%{time_starttransfer}|%{time_pretransfer}', '--max-time', '6',
    '-H', 'Content-Type: application/octet-stream', '-H', 'Expect:',
    '--data-binary', 'x', endpoint.uploadUrl], 9000, o.signal);
  const m = metrics(r);
  if (m.timedOut || m.size !== 1) throw new Error('сервер не принял проверочный POST');
}

function yandexUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === 'yandex.net' || u.hostname.endsWith('.yandex.net')) ? u : null;
  } catch (_) { return null; }
}

async function yandexEndpoint(o) {
  const data = await fetchJson(o, 'https://yandex.ru/internet/api/v0/get-probes');
  const latencies = data.latency && data.latency.probes || [];
  const downloads = data.download && data.download.probes || [];
  const uploads = data.upload && data.upload.probes || [];
  const headers = ['User-Agent: Mozilla/5.0', 'Referer: https://yandex.ru/internet', 'Origin: https://yandex.ru'];
  for (const candidate of latencies.slice(0, 5)) {
    const ping = yandexUrl(candidate.url);
    if (!ping) continue;
    const down = downloads.find((p) => {
      const u = yandexUrl(p.url);
      return u && u.hostname === ping.hostname && /\/50mb(?:\?|$)/i.test(u.pathname);
    });
    const up = uploads.find((p) => {
      const u = yandexUrl(p.url);
      return u && u.hostname === ping.hostname && !p.timeout;
    });
    if (!down || !up) continue;
    const ms = await pingUrl(o, ping.href, headers);
    if (ms == null) continue;
    const endpoint = { pingMs: ms, downloadUrl: () => down.url, uploadUrl: up.url,
      headers, expectedDown: null, uploadBytes: 50 * 1024 * 1024 };
    try { await checkUpload(o, endpoint); endpoint.pingMs = await stablePing(o, ping.href, headers, ms); return endpoint; }
    catch (_) { /* следующий сервер */ }
  }
  throw new Error('Яндекс Интернетометр: нет доступного сервера замера');
}

async function speedtestEndpoint(o) {
  const servers = await fetchJson(o, 'https://www.speedtest.net/api/js/servers?engine=js');
  if (!Array.isArray(servers)) throw new Error('Speedtest.net: неверный список серверов');
  const ids = [...new Set(servers.map((s) => String(s && s.id || '')))]
    .filter((id) => /^\d{1,8}$/.test(id)).slice(0, 4);
  const probes = await Promise.all(ids.map(async (id) => {
    const base = `https://server-${id}.prod.hosts.ooklaserver.net:8080`;
    const url = `${base}/latency.txt?r=${crypto.randomBytes(4).toString('hex')}`;
    const first = await pingUrl(o, url);
    if (first == null) return null;
    return { ms: await stablePing(o, url, [], first), base, id };
  }));
  const candidates = probes.filter(Boolean).sort((a, b) => a.ms - b.ms);
  for (const { ms, base, id } of candidates) {
    const endpoint = { pingMs: ms, server: `Speedtest.net #${id}`,
      downloadUrl: (size) => `${base}/download?size=${size}&r=${crypto.randomBytes(4).toString('hex')}`,
      uploadUrl: `${base}/upload`, headers: [], expectedDown: DOWNLOAD_BYTES,
      uploadBytes: 32 * 1024 * 1024 };
    try {
      const r = await curl([...baseArgs(o), '-o', NULL_DEV, '--max-time', '6',
        '-w', '%{http_code}|%{size_download}|%{time_total}|%{time_starttransfer}|%{time_pretransfer}',
        endpoint.downloadUrl(100_000)], 9000, o.signal);
      const m = metrics(r);
      if (m.timedOut || m.size !== 100_000) continue;
      await checkUpload(o, endpoint);
      return endpoint;
    } catch (_) { /* следующий сервер */ }
  }
  throw new Error('Speedtest.net: нет доступного HTTPS-сервера замера');
}

async function transfer(o, kind, endpoint, file, downloadBytes, onRate) {
  const started = performance.now();
  const deadline = started + o.seconds * 1000;
  let bytes = 0;
  let failure = null;
  const count = o.provider === 'cloudflare' ? 1 : o.streams;
  const samples = [];
  const percentile90 = (values) => {
    values.sort((a, b) => a - b);
    const position = (values.length - 1) * 0.9;
    const low = Math.floor(position);
    return values[low] + (values[Math.ceil(position)] - values[low]) * (position - low);
  };
  function rate() {
    const elapsed = Math.max(0.001, (performance.now() - started) / 1000);
    if (o.provider === 'cloudflare') {
      return samples.length ? percentile90(samples.map((s) => s.bytes * 8 / s.seconds)) : null;
    }
    // Параллельные потоки — одна общая выборка, а не сумма пиков каждого потока.
    return bytes * 8 / elapsed;
  }

  function record(size, time, ready) {
    if (o.provider === 'cloudflare') {
      // Полный HTTP-обмен после CONNECT/TLS: ожидание ответа не вырезается,
      // иначе буферизация и короткие пробы дают завышенную скорость.
      const seconds = time - ready;
      if (seconds < 0.01) return;
      samples.push({ bytes: size, seconds });
    }
    bytes += size;
    if (onRate) onRate(rate() / 1e6);
  }

  async function worker() {
    let attempt = 0;
    while (!failure) {
      throwIfAborted(o.signal);
      const remaining = deadline - performance.now();
      if (remaining < 250) break;
      const requested = kind === 'download' && o.provider === 'cloudflare' && downloadBytes !== FALLBACK_BYTES
        ? (++attempt % 2 ? 10_000_000 : DOWNLOAD_BYTES) : downloadBytes;
      const expected = kind === 'download' ? (endpoint.expectedDown == null ? null : requested)
        : (endpoint.uploadBytes || UPLOAD_BYTES);
      // Дать завершающему POST время получить подтверждение. Фактическое
      // время ожидания входит в результат, а не отбрасывается.
      const budget = remaining + (kind === 'upload' && o.provider !== 'yandex' ? 2000 : 0);
      const args = [...baseArgs(o, endpoint.headers), '-o', NULL_DEV, '-w',
        kind === 'download'
          ? '%{http_code}|%{size_download}|%{time_total}|%{time_starttransfer}|%{time_pretransfer}'
          : '%{http_code}|%{size_upload}|%{time_total}|%{time_starttransfer}|%{time_pretransfer}',
        '--max-time', (budget / 1000).toFixed(3)];
      if (kind === 'download') args.push(endpoint.downloadUrl(requested));
      else args.push('-H', 'Content-Type: application/octet-stream', '-H', 'Expect:',
        '--data-binary', `@${file}`, endpoint.uploadUrl);
      const r = await curl(args, Math.ceil(budget) + 2000, o.signal);
      try {
        const { code, size, time, ready } = parseMetrics(r);
        if (r.err && (r.err.code === 28 || r.err.code === '28') &&
            performance.now() >= deadline - 250 && (code === 0 || code === 100)) {
          // Локальный буфер отправки не означает подтверждение от сервера.
          // Сохраняем прежний подсчёт Яндекса, но не используем такие пробы
          // для Cloudflare/Speedtest.net.
          if (o.provider === 'yandex' && kind === 'upload' && size > 0 && size <= expected) record(size, time, ready);
          break;
        }
        const m = metrics(r);
        if (expected != null && (m.size > expected || (!m.timedOut && m.size !== expected))) {
          throw new Error(`неполный ответ ${kind}: ${m.size} из ${expected} байт`);
        }
        if (o.provider === 'cloudflare' && kind === 'upload' && m.timedOut) break;
        record(m.size, m.time, m.ready);
      } catch (e) { failure = e; }
    }
  }

  await Promise.all(Array.from({ length: count }, () => worker()));
  if (failure) throw failure;
  if (!bytes) throw new Error(`нет достоверных данных ${kind}; увеличьте длительность замера`);
  const result = rate();
  if (!Number.isFinite(result) || result <= 0) throw new Error(`неверный результат ${kind}`);
  return result;
}

async function upload(o, endpoint, onRate) {
  const file = path.join(os.tmpdir(), `happ_up_${process.pid}_${crypto.randomBytes(6).toString('hex')}.bin`);
  fs.writeFileSync(file, crypto.randomBytes(endpoint.uploadBytes || UPLOAD_BYTES));
  try { return await transfer(o, 'upload', endpoint, file, null, onRate); }
  finally { try { fs.unlinkSync(file); } catch (_) { /* ignore */ } }
}

/** opts: { provider, server, proxy, seconds, streams }; onPhase(phase), onProgress(partial result) */
async function runSpeedTest(opts, onPhase, onProgress) {
  const o = { provider: 'yandex', server: 'https://speed.cloudflare.com', proxy: '', seconds: 6, streams: 4, signal: null, ...opts };
  throwIfAborted(o.signal);
  o.server = String(o.server).replace(/\/+$/, '');
  o.seconds = Math.max(3, Math.min(20, Number(o.seconds) || 6));
  o.streams = Math.max(1, Math.min(8, Math.trunc(Number(o.streams) || 4)));
  if (!['yandex', 'cloudflare', 'speedtest'].includes(o.provider)) throw new Error('неизвестный сервер замера');
  onPhase && onPhase('ping');
  let endpoint;
  if (o.provider === 'yandex') endpoint = await yandexEndpoint(o);
  else if (o.provider === 'speedtest') endpoint = await speedtestEndpoint(o);
  else endpoint = { pingMs: await pingCloudflare(o), headers: [], expectedDown: DOWNLOAD_BYTES,
    uploadBytes: 16 * 1024 * 1024,
    downloadUrl: (size) => `${o.server}/__down?bytes=${size}&r=${crypto.randomBytes(8).toString('hex')}`,
    uploadUrl: `${o.server}/__up` };
  const pingMs = endpoint.pingMs;
  onProgress && onProgress({ pingMs });
  onPhase && onPhase('download');
  const onDown = (downMbps) => onProgress && onProgress({ pingMs, downMbps });
  let down;
  try { down = await transfer(o, 'download', endpoint, null, endpoint.expectedDown || DOWNLOAD_BYTES, onDown); }
  catch (e) {
    if (o.provider !== 'cloudflare' || e.httpCode !== 429) throw e;
    endpoint.expectedDown = FALLBACK_BYTES;
    onProgress && onProgress({ downMbps: null });
    down = await transfer(o, 'download', endpoint, null, FALLBACK_BYTES, onDown);
  }
  const downMbps = down / 1e6;
  onProgress && onProgress({ pingMs, downMbps });
  onPhase && onPhase('upload');
  if (o.provider === 'cloudflare') await checkUpload(o, endpoint);
  const up = await upload(o, endpoint, (upMbps) => onProgress && onProgress({ pingMs, downMbps, upMbps }));
  return { pingMs, downMbps, upMbps: up / 1e6,
    server: endpoint.server || new URL(endpoint.uploadUrl).hostname };
}

module.exports = { runSpeedTest };
