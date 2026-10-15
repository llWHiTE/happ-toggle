'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const harness = require('./helpers/speed.cjs');
const { metrics, defaultReply } = harness;
const MIB = 1024 * 1024;
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const isUpload = (args) => args.includes('--data-binary') && args[args.indexOf('--data-binary') + 1].startsWith('@');

for (const provider of ['yandex', 'speedtest', 'cloudflare']) {
  for (const streams of [1, 4]) {
    test(`${provider}: bytes / shared wall time with ${streams} configured streams`, async () => {
      const h = harness(); const r = await h.run({ provider, streams });
      const used = provider === 'cloudflare' ? 1 : streams;
      const down = provider === 'yandex' ? 50 * MIB : 25_000_000;
      near(r.downMbps, used * 3 * down * 8 / 3e6);
      near(r.upMbps, used * 3 * 8 * MIB * 8 / 3e6);
      assert.equal(r.pingMs, 100);
      assert.equal(r.measurement.method, 'http-goodput');
      assert.equal(r.measurement.download.seconds, 3);
      assert.equal(r.measurement.download.streams, used);
      assert.equal(r.measurement.upload.bytes, used * 3 * 8 * MIB);
      assert.equal(h.files.size, 0);
      assert.deepEqual(h.phases, ['ping', 'download', 'upload']);
      assert.ok(h.partials.some((p) => p.downMbps > 0) && h.partials.some((p) => p.upMbps > 0));
    });
  }
}

test('Cloudflare reports mean phase goodput, not P90 or the mean of per-request peaks', async () => {
  const delays = [500, 1500, 1000]; let i = 0;
  const h = harness((args) => {
    const u = new URL(args.at(-1));
    if (u.pathname === '/__down' && u.searchParams.get('bytes') !== '0') {
      const delayMs = delays[i++]; return { out: metrics(25_000_000, delayMs / 1000), delayMs };
    }
    return defaultReply(args);
  });
  const r = await h.run({ provider: 'cloudflare' });
  near(r.downMbps, 75_000_000 * 8 / 3e6);
  assert.notEqual(r.downMbps, (400 + 133.333333333 + 200) / 3);
});

test('slow final upload extends the denominator instead of inflating the result', async () => {
  let i = 0;
  const h = harness((args) => isUpload(args)
    ? { out: metrics(8 * MIB, 1.5), delayMs: ++i % 2 ? 1000 : 2000 }
    : defaultReply(args));
  const r = await h.run({ provider: 'yandex', streams: 2 });
  // Two workers finish 5 accepted uploads at 1, 2, 3, 3, 4 seconds.
  assert.equal(r.measurement.upload.seconds, 4);
  near(r.upMbps, 5 * 8 * MIB * 8 / 4e6);
});

test('HTTP/TLS/response waiting time is not cut out of goodput', async () => {
  const h = harness((args) => {
    const r = defaultReply(args);
    if (r.out.includes('25000000|')) r.out = '200|25000000|1|0.9|0.8|application/octet-stream';
    return r;
  });
  const r = await h.run({ provider: 'cloudflare' });
  near(r.downMbps, 200); // Not 1000 Mbps after subtracting TLS/response wait.
});

test('received partial download on a successful HTTP response is measured with real elapsed time', async () => {
  const h = harness((args) => {
    const u = new URL(args.at(-1));
    if (u.pathname === '/__down' && u.searchParams.get('bytes') !== '0') return { out: metrics(5_000_000, 3), delayMs: 3000, err: { code: 28 } };
    return defaultReply(args);
  });
  const r = await h.run({ provider: 'cloudflare' });
  near(r.downMbps, 5_000_000 * 8 / 3e6);
});

for (const provider of ['yandex', 'cloudflare', 'speedtest']) {
  for (const code of [0, 100, 200]) {
    test(`${provider}: timed-out upload HTTP ${code} never becomes a successful speed result`, async () => {
      const h = harness((args) => isUpload(args)
        ? { out: metrics(4_000_000, 3, code), delayMs: 3000, err: { code: 28 } } : defaultReply(args));
      await assert.rejects(h.run({ provider }), /HTTP 0|HTTP 100|not acknowledged/);
      assert.equal(h.files.size, 0);
    });
  }
}

test('Speedtest cache-buster and 100 KB preflight are handled independently of transfer data', async () => {
  const h = harness(); const r = await h.run({ provider: 'speedtest' });
  assert.equal(r.server, 'Speedtest.net #31341');
  assert.ok(h.calls.some(({ args }) => new URL(args.at(-1)).pathname === '/latency.txt' && new URL(args.at(-1)).searchParams.has('r')));
  assert.ok(h.calls.some(({ args }) => new URL(args.at(-1)).searchParams.get('size') === '100000'));
  assert.equal(r.measurement.download.requests, 12);
});

test('Yandex uses only advertised HTTPS Yandex hosts and exact 50 MiB downloads', async () => {
  const h = harness(); await h.run();
  assert.ok(h.calls.every(({ args }) => !args.at(-1).includes('bad.example')));
  assert.equal(h.calls.filter(({ args }) => args.at(-1).includes('/probes/50mb')).length, 12);
  await assert.rejects(h.run({ provider: 'openspeedtest' }), /Unknown test service/);
});

for (const [reply, expected] of [
  [{ out: metrics(25_000_000, 1, 403) }, /HTTP 403/],
  [{ out: metrics(25_000_000, 1, 500) }, /HTTP 500/],
  [{ out: metrics(25_000_000, 1, 200, 'text/html') }, /page instead of binary/],
  [{ out: metrics(512) }, /Incomplete download/],
  [{ out: metrics(0) }, /No transferred data/],
  [{ out: '200|NaN|1|0.2|0.1|application/octet-stream' }, /Invalid curl metrics/],
  [{ out: '200|25000000|0.1|0.2|0.3|application/octet-stream' }, /Invalid curl metrics/],
  [{ out: metrics(25_000_000), err: { code: 7 }, stderr: 'connection refused' }, /curl failed/],
]) {
  test(`rejects invalid transfer: ${expected}`, async () => {
    const h = harness((args) => new URL(args.at(-1)).searchParams.get('bytes') === '25000000' ? reply : defaultReply(args));
    await assert.rejects(h.run({ provider: 'cloudflare' }), expected);
    assert.equal(h.files.size, 0);
  });
}

test('Cloudflare 429 gets one bounded fallback to smaller transfers', async () => {
  const h = harness((args) => new URL(args.at(-1)).searchParams.get('bytes') === '25000000'
    ? { out: metrics(1, 1, 429) } : defaultReply(args));
  const r = await h.run({ provider: 'cloudflare' });
  near(r.downMbps, 5_000_000 * 8 / 1e6);
  assert.equal(h.calls.filter(({ args }) => new URL(args.at(-1)).searchParams.get('bytes') === '25000000').length, 1);
  const always = harness((args) => {
    const n = new URL(args.at(-1)).searchParams.get('bytes');
    return n && n !== '0' ? { out: metrics(1, 1, 429) } : defaultReply(args);
  });
  await assert.rejects(always.run({ provider: 'cloudflare' }), /429/);
  assert.equal(always.calls.filter(({ phase }) => phase === 'download').length, 2);
});

for (const response of ['not JSON\n__HTTP__200', '{}\n__HTTP__200', '{}\n__HTTP__403']) {
  test(`invalid discovery is not treated as test data: ${response}`, async () => {
    const h = harness(() => ({ out: response }));
    await assert.rejects(h.run(), /discovery/);
    assert.equal(h.files.size, 0);
  });
}

for (const phase of ['ping', 'download', 'upload']) {
  test(`abort during ${phase} cleans up and never reports a successful result`, async () => {
    const controller = new AbortController(); const h = harness();
    await assert.rejects(h.run({ provider: 'cloudflare', signal: controller.signal }, (p) => { if (p === phase) controller.abort(); }), { name: 'AbortError' });
    assert.equal(h.files.size, 0);
  });
}

test('abort of an in-flight upload removes the temporary file', async () => {
  const controller = new AbortController();
  const h = harness((args) => {
    if (isUpload(args)) { setImmediate(() => controller.abort()); return { out: metrics(8 * MIB), delayMs: 5000 }; }
    return defaultReply(args);
  });
  await assert.rejects(h.run({ signal: controller.signal }), { name: 'AbortError' });
  assert.equal(h.files.size, 0);
});

test('temporary files are removed on write failure', async () => {
  const h = harness(defaultReply, { writeError: true });
  await assert.rejects(h.run(), /disk full/);
  assert.equal(h.files.size, 0);
});

test('proxy/direct routes are explicit; curl config is disabled', async () => {
  for (const proxy of ['', 'socks5h://127.0.0.1:10808']) {
    const h = harness(); await h.run({ proxy });
    for (const { args } of h.calls) {
      assert.equal(args[0], '-q');
      assert.equal(args[args.indexOf('--noproxy') + 1], proxy ? '' : '*');
      assert.equal(args.includes('-x'), !!proxy);
      if (proxy) assert.equal(args[args.indexOf('-x') + 1], proxy);
    }
  }
});

test('error output redacts proxy credentials', async () => {
  const h = harness((args) => new URL(args.at(-1)).searchParams.get('bytes') === '25000000'
    ? { out: metrics(1, 1, 403), stderr: 'proxy http://user:secret@127.0.0.1:1 failed' } : defaultReply(args));
  await assert.rejects(h.run({ provider: 'cloudflare' }), (e) => !e.message.includes('secret') && e.message.includes('***@'));
});
