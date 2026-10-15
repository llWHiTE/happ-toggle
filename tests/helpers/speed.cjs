'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.resolve(__dirname, '../../com.llwhite.happtoggle.sdPlugin/lib/speedtest.js'), 'utf8');
const metrics = (bytes, seconds = 1, code = 200, type = 'application/octet-stream') => `${code}|${bytes}|${seconds}|0.2|0.1|${type}`;
function defaultReply(args) {
  const u = new URL(args.at(-1));
  if (u.pathname.endsWith('/get-probes')) return { out: JSON.stringify({
    latency: { probes: [{ url: 'https://bad.example/ping' }, { url: 'https://test.cdn.yandex.net/ping' }] },
    download: { probes: [{ url: 'https://test.cdn.yandex.net/probes/50mb' }] },
    upload: { probes: [{ url: 'https://test.cdn.yandex.net/upload' }] },
  }) + '\n__HTTP__200' };
  if (u.pathname.endsWith('/servers')) return { out: '[{"id":"31341"}]\n__HTTP__200' };
  if (u.pathname.endsWith('/ping') || u.pathname.endsWith('/latency.txt') || u.searchParams.get('bytes') === '0') return { out: '200|0.2|0.1' };
  if (args.includes('--data-binary')) return { out: metrics(args[args.indexOf('--data-binary') + 1] === 'x' ? 1 : 8 * 1024 * 1024) };
  if (u.pathname.endsWith('/50mb')) return { out: metrics(50 * 1024 * 1024) };
  if (u.pathname.endsWith('/download')) return { out: metrics(Number(u.searchParams.get('size'))) };
  if (u.pathname.endsWith('/__down')) return { out: metrics(Number(u.searchParams.get('bytes'))) };
  throw new Error('Unexpected fixture URL: ' + u.href);
}
module.exports = function harness(reply = defaultReply, options = {}) {
  let now = 0, flushing = false;
  const jobs = [], calls = [], phases = [], partials = [], files = new Set();
  function pump() {
    if (flushing || !jobs.length) return;
    flushing = true;
    setImmediate(() => {
      flushing = false;
      if (!jobs.length) return;
      const next = Math.min(...jobs.map((j) => j.due));
      now = next;
      const ready = jobs.filter((j) => j.due === next);
      for (const job of ready) {
        jobs.splice(jobs.indexOf(job), 1);
        job.signal?.removeEventListener('abort', job.abort);
        job.cb(job.r.err || null, job.r.out || '', job.r.stderr || '');
      }
      pump();
    });
  }
  const child = { execFile(file, args, settings, cb) {
    assert.equal(file, 'curl.exe');
    assert.notEqual(settings.signal, null, 'Node child_process rejects a null AbortSignal');
    calls.push({ args, settings, phase: phases.at(-1), start: now });
    const r = reply(args, { now, calls, phases, partials, files }, defaultReply);
    const job = { r, cb, signal: settings.signal, due: now + (r.delayMs ?? 1000) };
    job.abort = () => {
      const i = jobs.indexOf(job);
      if (i < 0) return;
      jobs.splice(i, 1);
      const error = new Error('aborted'); error.name = 'AbortError'; cb(error, '', '');
    };
    jobs.push(job); settings.signal?.addEventListener('abort', job.abort, { once: true });
    pump();
  } };
  const module = { exports: {} };
  vm.runInNewContext(source, { module, Buffer, URL,
    process: { platform: 'win32', pid: 44 }, require(name) {
      if (name === 'child_process') return child;
      if (name === 'fs') return { writeFileSync(file) { files.add(file); if (options.writeError) throw new Error('disk full'); },
        unlinkSync(file) { if (!files.delete(file)) throw new Error('file missing'); } };
      if (name === 'os') return { tmpdir: () => 'C:/Temp' };
      if (name === 'path') return path;
      if (name === 'crypto') return { randomBytes: (n) => n > 64 ? { length: n } : Buffer.alloc(n, 1) };
      if (name === 'perf_hooks') return { performance: { now: () => now } };
      throw new Error('Unexpected dependency: ' + name);
    } }, { filename: 'speedtest.js' });
  return { calls, phases, partials, files,
    run(opts = {}, onPhase) { return module.exports.runSpeedTest({ seconds: 3, streams: 4, ...opts },
      (phase) => { phases.push(phase); onPhase?.(phase); }, (partial) => partials.push(partial)); } };
};
module.exports.metrics = metrics;
module.exports.defaultReply = defaultReply;
