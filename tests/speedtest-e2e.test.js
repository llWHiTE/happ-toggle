'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { runSpeedTest } = require('../com.llwhite.happtoggle.sdPlugin/lib/speedtest.js');

async function fixture(mode = 'normal') {
  const rate = 4 * 1024 * 1024;
  const accepted = [], timers = new Set();
  const observed = { download: { bytes: 0, start: null, end: null }, upload: { start: null, end: null } };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/__down') {
      const size = Number(url.searchParams.get('bytes'));
      if (!size) { res.writeHead(200); res.end(); return; }
      if (mode === 'html') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html>not test data</html>'); return; }
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': size });
      let left = size;
      const start = performance.now();
      observed.download.start ??= start;
      const chunk = Buffer.alloc(256 * 1024, 0x5a);
      const timer = setInterval(() => {
        // Pace against actual time, not timer ticks (Windows can coalesce 20 ms timers).
        const target = Math.min(size, Math.floor(rate * (performance.now() - start) / 1000));
        let allowed = target - (size - left);
        while (allowed > 0 && !res.writableNeedDrain) {
          const count = Math.min(left, chunk.length, allowed);
          res.write(chunk.subarray(0, count)); left -= count; allowed -= count;
          observed.download.bytes += count;
        }
        if (!left) { clearInterval(timer); timers.delete(timer); res.end(); }
      }, 20);
      timers.add(timer);
      res.on('close', () => { observed.download.end = performance.now(); clearInterval(timer); timers.delete(timer); });
      return;
    }
    if (url.pathname === '/__up') {
      const start = performance.now(); let bytes = 0;
      req.on('data', (data) => { bytes += data.length; });
      req.on('end', () => {
        const delay = Math.max(0, bytes / rate * 1000 - (performance.now() - start));
        const timer = setTimeout(() => {
          timers.delete(timer); accepted.push(bytes);
          if (bytes > 1) { observed.upload.start ??= start; observed.upload.end = performance.now(); }
          res.writeHead(200); res.end('accepted');
        }, delay);
        timers.add(timer);
      });
      return;
    }
    res.writeHead(404); res.end();
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return { server: `http://127.0.0.1:${server.address().port}`, rate, accepted, observed,
    async close() { for (const timer of timers) { clearTimeout(timer); clearInterval(timer); } server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); } };
}

test('real curl measures a paced loopback server and counts only completed POSTs', { timeout: 25000 }, async () => {
  const h = await fixture();
  try {
    const phases = {};
    const result = await runSpeedTest({ provider: 'cloudflare', server: h.server, proxy: '', seconds: 3, streams: 4 },
      (phase) => { phases[phase] = performance.now(); });
    const finished = performance.now();
    const { download, upload } = result.measurement;
    // Independent client/server clocks bracket the actual phase, including curl/HTTP overhead.
    // The configured pacing rate is an upper bound, not a promised minimum goodput on a busy host.
    for (const [kind, value, data, end] of [['download', result.downMbps, download, phases.upload], ['upload', result.upMbps, upload, finished]]) {
      const outer = (end - phases[kind]) / 1000;
      const inner = (h.observed[kind].end - h.observed[kind].start) / 1000;
      assert.ok(inner > 0 && outer >= inner * 0.95);
      const lower = data.bytes * 8 / outer / 1e6 * 0.95;
      const upper = Math.min(data.bytes * 8 / inner / 1e6 * 1.05, h.rate * 8 / 1e6 * 1.15);
      assert.ok(value >= lower && value <= upper, JSON.stringify({ kind, value, lower, upper, outer, inner, result }));
    }
    assert.equal(upload.bytes, h.accepted.filter((bytes) => bytes > 1).reduce((sum, bytes) => sum + bytes, 0));
    assert.ok(download.bytes <= h.observed.download.bytes && h.observed.download.bytes - download.bytes <= 1024 * 1024);
    assert.equal(download.streams, 1);
    assert.ok(download.seconds >= 2.7 && upload.seconds >= 2.7);
    assert.ok(Math.abs(result.downMbps - download.bytes * 8 / download.seconds / 1e6) < 1e-9);
    assert.ok(Math.abs(result.upMbps - upload.bytes * 8 / upload.seconds / 1e6) < 1e-9);
  } finally { await h.close(); }
});

test('real curl rejects an HTTP 200 HTML page instead of showing a speed', { timeout: 10000 }, async () => {
  const h = await fixture('html');
  try { await assert.rejects(runSpeedTest({ provider: 'cloudflare', server: h.server, proxy: '', seconds: 3 }), /Incomplete download|page instead of binary/); }
  finally { await h.close(); }
});
