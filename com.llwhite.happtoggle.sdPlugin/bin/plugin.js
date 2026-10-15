import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url'; import { dirname, resolve } from 'node:path'; const require = createRequire(import.meta.url); const __dirname = resolve(dirname(fileURLToPath(import.meta.url)), '..');
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/sdk.js
var require_sdk = __commonJS({
  "happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/sdk.js"(exports, module) {
    "use strict";
    module.exports = function createSDKAdapter(sdk, { actionIds, onMessage, log }) {
      const streamDeck2 = sdk.default;
      const placements = /* @__PURE__ */ new Map();
      const emit = (message) => onMessage(JSON.stringify(message));
      function forward(event, ev, manifestId) {
        const context = ev.action.id;
        if (event === "willAppear") {
          placements.set(context, { action: ev.action, layout: Promise.resolve() });
        }
        emit({ event, context, action: manifestId, device: ev.action.device.id, payload: ev.payload });
        if (event === "willDisappear") placements.delete(context);
      }
      class ForwardAction extends sdk.SingletonAction {
        constructor(manifestId) {
          super();
          this.actionId = manifestId;
        }
        onWillAppear(ev) {
          forward("willAppear", ev, this.actionId);
        }
        onWillDisappear(ev) {
          forward("willDisappear", ev, this.actionId);
        }
        onDidReceiveSettings(ev) {
          forward("didReceiveSettings", ev, this.actionId);
        }
        onKeyDown(ev) {
          forward("keyDown", ev, this.actionId);
        }
        onKeyUp(ev) {
          forward("keyUp", ev, this.actionId);
        }
        onDialDown(ev) {
          forward("dialDown", ev, this.actionId);
        }
        onDialUp(ev) {
          forward("dialUp", ev, this.actionId);
        }
        onDialRotate(ev) {
          forward("dialRotate", ev, this.actionId);
        }
        onTouchTap(ev) {
          forward("touchTap", ev, this.actionId);
        }
      }
      for (const UUID of actionIds) {
        class PluginAction extends ForwardAction {
          constructor() {
            super(UUID);
          }
        }
        const Decorated = sdk.action({ UUID })(PluginAction) || PluginAction;
        streamDeck2.actions.registerAction(new Decorated());
      }
      streamDeck2.devices.onDeviceDidDisconnect((ev) => {
        emit({ event: "deviceDidDisconnect", device: ev.device.id });
      });
      return {
        translate(key) {
          return streamDeck2.i18n.translate(key);
        },
        async connect() {
          await streamDeck2.connect();
          log("connected to Stream Deck through official SDK");
        },
        sendJSON(message) {
          const placement = placements.get(message.context);
          if (!placement) return;
          const { action: action2 } = placement;
          const payload = message.payload || {};
          const current = () => placements.get(message.context) === placement;
          const screen = action2.isDial() || action2.isNeoInfobar();
          const fail = () => log("Stream Deck SDK command failed:", message.event);
          if (message.event === "setFeedbackLayout" && screen) {
            placement.layout = placement.layout.catch(() => {
            }).then(() => {
              if (current()) return action2.setFeedbackLayout(payload.layout);
            });
            placement.layout.catch(fail);
            return;
          }
          Promise.resolve().then(async () => {
            if (message.event === "setFeedback") await placement.layout;
            if (!current()) return;
            switch (message.event) {
              case "setImage":
                if (action2.isKey()) return action2.setImage(payload.image);
                break;
              case "setFeedback":
                if (screen) return action2.setFeedback(payload);
                break;
              case "setSettings":
                return action2.setSettings(payload);
              case "showAlert":
                if (!action2.isNeoInfobar()) return action2.showAlert();
                break;
            }
          }).catch(fail);
        }
      };
    };
  }
});

// happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/speedtest.js
var require_speedtest = __commonJS({
  "happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/speedtest.js"(exports, module) {
    "use strict";
    var { execFile } = __require("child_process");
    var fs3 = __require("fs");
    var os = __require("os");
    var path5 = __require("path");
    var crypto = __require("crypto");
    var { performance } = __require("perf_hooks");
    var NULL_DEV = process.platform === "win32" ? "NUL" : "/dev/null";
    var CURL = process.platform === "win32" ? "curl.exe" : "curl";
    var DOWNLOAD_BYTES = 25e6;
    var FALLBACK_BYTES = 5e6;
    var UPLOAD_BYTES = 8 * 1024 * 1024;
    var FORMAT = "%{http_code}|%{size_download}|%{time_total}|%{time_starttransfer}|%{time_pretransfer}|%{content_type}";
    var UP_FORMAT = FORMAT.replace("size_download", "size_upload");
    function abortError() {
      const error40 = new Error("Speed test cancelled");
      error40.name = "AbortError";
      return error40;
    }
    function throwIfAborted(signal) {
      if (signal && signal.aborted) throw abortError();
    }
    function curl(args, timeoutMs, signal) {
      throwIfAborted(signal);
      return new Promise((resolve, reject) => {
        execFile(CURL, args, { windowsHide: true, timeout: timeoutMs, maxBuffer: 1024 * 1024, ...signal ? { signal } : {} }, (err, stdout, stderr) => {
          if (signal && signal.aborted || err && err.name === "AbortError") return reject(abortError());
          resolve({ err, out: String(stdout || "").trim(), stderr: String(stderr || "").trim() });
        });
      });
    }
    function baseArgs(o, headers = []) {
      const a = ["-q", "-s", "-S", "--connect-timeout", "8", "-H", "Cache-Control: no-cache", "-H", "Accept-Encoding: identity"];
      if (o.proxy) a.push("-x", o.proxy, "--noproxy", "");
      else a.push("--noproxy", "*");
      for (const h of headers) a.push("-H", h);
      return a;
    }
    function details(r) {
      return String(r.stderr || r.err && `curl code ${r.err.code || "unknown"}` || "no response").replace(/(\w+:\/\/)[^\s/]*@/g, "$1***@").slice(0, 200);
    }
    function parseMetrics(r) {
      const fields = r.out.split("|");
      const [code, size, time3, first, ready] = fields.slice(0, 5).map((x) => x.trim() ? Number(x.replace(",", ".")) : NaN);
      if (fields.length !== 6 || ![code, size, time3, first, ready].every(Number.isFinite) || !Number.isInteger(code) || code < 0 || code > 599 || !Number.isSafeInteger(size) || size < 0 || time3 <= 0 || first < 0 || ready < 0 || ready > time3 || first > time3) {
        throw new Error(`Invalid curl metrics: ${details(r)}`);
      }
      return { code, size, time: time3, first, ready, contentType: fields[5].trim().toLowerCase() };
    }
    function metrics(r) {
      const m = parseMetrics(r);
      if (m.code !== 200) {
        const error40 = new Error(m.code === 429 ? "Rate limited (HTTP 429); try again later" : `Test server returned HTTP ${m.code}: ${details(r)}`);
        error40.httpCode = m.code;
        throw error40;
      }
      if (r.err && r.err.code !== 28 && r.err.code !== "28") throw new Error(`curl failed: ${details(r)}`);
      if (m.size <= 0) throw new Error(`No transferred data: ${details(r)}`);
      return { ...m, timedOut: !!r.err };
    }
    async function fetchJson(o, url2) {
      const r = await curl([
        ...baseArgs(o, ["Accept: application/json"]),
        "--max-time",
        "12",
        "--max-filesize",
        "1048576",
        "-w",
        "\n__HTTP__%{http_code}",
        url2
      ], 15e3, o.signal);
      const marker = r.out.lastIndexOf("\n__HTTP__");
      const code = marker < 0 ? 0 : Number(r.out.slice(marker + 9));
      if (r.err || code !== 200) throw new Error(`Server discovery failed (HTTP ${code}): ${details(r)}`);
      try {
        return JSON.parse(r.out.slice(0, marker));
      } catch (_) {
        throw new Error("Invalid server discovery response");
      }
    }
    async function pingUrl(o, url2, headers = []) {
      const r = await curl([
        ...baseArgs(o, headers),
        "-o",
        NULL_DEV,
        "-w",
        "%{http_code}|%{time_starttransfer}|%{time_pretransfer}",
        "--max-time",
        "6",
        url2
      ], 9e3, o.signal);
      const fields = r.out.split("|");
      const [code, first, ready] = fields.map((x) => x.trim() ? Number(x.replace(",", ".")) : NaN);
      const latency = first - ready;
      return !r.err && fields.length === 3 && code === 200 && ready >= 0 && Number.isFinite(latency) && latency > 0 ? Math.round(latency * 1e3) : null;
    }
    async function stablePing(o, url2, headers, first) {
      const times = [first];
      for (let i = 0; i < 2; i++) {
        const ms = await pingUrl(o, url2, headers);
        if (ms != null) times.push(ms);
      }
      times.sort((a, b) => a - b);
      return times[Math.floor(times.length / 2)];
    }
    async function pingCloudflare(o) {
      const times = [];
      for (let i = 0; i < 5; i++) {
        const ms = await pingUrl(o, `${o.server}/__down?bytes=0&r=${crypto.randomBytes(4).toString("hex")}`);
        if (ms != null) times.push(ms);
      }
      times.sort((a, b) => a - b);
      return times.length ? times[Math.floor(times.length / 2)] : null;
    }
    async function checkUpload(o, endpoint) {
      const r = await curl([
        ...baseArgs(o, endpoint.headers),
        "-o",
        NULL_DEV,
        "-w",
        UP_FORMAT,
        "--max-time",
        "6",
        "-H",
        "Content-Type: application/octet-stream",
        "-H",
        "Expect:",
        "--data-binary",
        "x",
        endpoint.uploadUrl
      ], 9e3, o.signal);
      const m = metrics(r);
      if (m.timedOut || m.size !== 1) throw new Error("Upload preflight was not acknowledged");
    }
    function yandexUrl(url2) {
      try {
        const u = new URL(url2);
        return u.protocol === "https:" && (u.hostname === "yandex.net" || u.hostname.endsWith(".yandex.net")) ? u : null;
      } catch (_) {
        return null;
      }
    }
    async function yandexEndpoint(o) {
      const data = await fetchJson(o, "https://yandex.ru/internet/api/v0/get-probes");
      const latencies = data && data.latency && data.latency.probes;
      const downloads = data && data.download && data.download.probes;
      const uploads = data && data.upload && data.upload.probes;
      if (![latencies, downloads, uploads].every(Array.isArray)) throw new Error("Invalid Yandex discovery response");
      const headers = ["User-Agent: Mozilla/5.0", "Referer: https://yandex.ru/internet", "Origin: https://yandex.ru"];
      for (const candidate of latencies.slice(0, 5)) {
        const ping = candidate && yandexUrl(candidate.url);
        if (!ping) continue;
        const down = downloads.find((p) => {
          const u = p && yandexUrl(p.url);
          return u && u.hostname === ping.hostname && /\/50mb$/i.test(u.pathname) && !p.timeout;
        });
        const up = uploads.find((p) => {
          const u = p && yandexUrl(p.url);
          return u && u.hostname === ping.hostname && !p.timeout;
        });
        if (!down || !up) continue;
        const endpoint = {
          downloadUrl: () => down.url,
          uploadUrl: up.url,
          headers,
          expectedDown: 50 * 1024 * 1024,
          uploadBytes: 8 * 1024 * 1024
        };
        try {
          const ms = await pingUrl(o, ping.href, headers);
          if (ms == null) continue;
          await checkUpload(o, endpoint);
          endpoint.pingMs = await stablePing(o, ping.href, headers, ms);
          return endpoint;
        } catch (e) {
          throwIfAborted(o.signal);
        }
      }
      throw new Error("Yandex: no available test server");
    }
    async function speedtestEndpoint(o) {
      const servers = await fetchJson(o, "https://www.speedtest.net/api/js/servers?engine=js");
      if (!Array.isArray(servers)) throw new Error("Speedtest.net: invalid server list");
      const ids = [...new Set(servers.map((s) => String(s && s.id || "")))].filter((id) => /^\d{1,8}$/.test(id)).slice(0, 4);
      const probes = await Promise.all(ids.map(async (id) => {
        const base = `https://server-${id}.prod.hosts.ooklaserver.net:8080`;
        const url2 = `${base}/latency.txt?r=${crypto.randomBytes(4).toString("hex")}`;
        const first = await pingUrl(o, url2);
        if (first == null) return null;
        return { ms: await stablePing(o, url2, [], first), base, id };
      }));
      for (const { ms, base, id } of probes.filter(Boolean).sort((a, b) => a.ms - b.ms)) {
        const endpoint = {
          pingMs: ms,
          server: `Speedtest.net #${id}`,
          downloadUrl: (size) => `${base}/download?size=${size}&r=${crypto.randomBytes(4).toString("hex")}`,
          uploadUrl: `${base}/upload`,
          headers: [],
          expectedDown: DOWNLOAD_BYTES,
          uploadBytes: UPLOAD_BYTES
        };
        try {
          const r = await curl([
            ...baseArgs(o),
            "-o",
            NULL_DEV,
            "--max-time",
            "6",
            "-w",
            FORMAT,
            endpoint.downloadUrl(1e5)
          ], 9e3, o.signal);
          const m = metrics(r);
          if (m.timedOut || m.size !== 1e5 || /^(text\/html|application\/json)/.test(m.contentType)) continue;
          await checkUpload(o, endpoint);
          return endpoint;
        } catch (e) {
          throwIfAborted(o.signal);
        }
      }
      throw new Error("Speedtest.net: no available HTTPS test server");
    }
    async function transfer(o, kind, endpoint, file2, downloadBytes, onRate) {
      const started = performance.now();
      const deadline = started + o.seconds * 1e3;
      let bytes = 0, requests = 0, failure = null;
      const streams = o.provider === "cloudflare" ? 1 : o.streams;
      const seconds = () => Math.max(1e-3, (performance.now() - started) / 1e3);
      async function worker() {
        try {
          while (!failure) {
            throwIfAborted(o.signal);
            const remaining = deadline - performance.now();
            if (remaining < 250) break;
            const expected = kind === "download" ? downloadBytes : endpoint.uploadBytes;
            const budget = remaining + (kind === "upload" ? 2e3 : 0);
            const args = [
              ...baseArgs(o, endpoint.headers),
              "-o",
              NULL_DEV,
              "-w",
              kind === "download" ? FORMAT : UP_FORMAT,
              "--max-time",
              (budget / 1e3).toFixed(3)
            ];
            if (kind === "download") args.push(endpoint.downloadUrl(expected));
            else args.push("-H", "Content-Type: application/octet-stream", "-H", "Expect:", "--data-binary", `@${file2}`, endpoint.uploadUrl);
            const r = await curl(args, Math.ceil(budget) + 2e3, o.signal);
            throwIfAborted(o.signal);
            const m = metrics(r);
            if (m.size > expected || !m.timedOut && m.size !== expected) throw new Error(`Incomplete ${kind}: ${m.size} of ${expected} bytes`);
            if (kind === "download" && /^(text\/html|application\/json)/.test(m.contentType)) throw new Error("Test download returned a page instead of binary data");
            if (kind === "upload" && m.timedOut) throw new Error("Upload was not acknowledged; increase test duration or reduce streams");
            bytes += m.size;
            requests++;
            if (onRate) onRate(bytes * 8 / seconds() / 1e6);
          }
        } catch (e) {
          if (!failure) failure = e;
        }
      }
      await Promise.all(Array.from({ length: streams }, () => worker()));
      throwIfAborted(o.signal);
      if (failure) throw failure;
      if (!bytes) throw new Error(`No reliable ${kind} data; increase test duration`);
      const elapsed = seconds();
      return { bps: bytes * 8 / elapsed, bytes, seconds: elapsed, requests, streams };
    }
    async function upload(o, endpoint, onRate) {
      const file2 = path5.join(os.tmpdir(), `happ_up_${process.pid}_${crypto.randomBytes(6).toString("hex")}.bin`);
      try {
        fs3.writeFileSync(file2, crypto.randomBytes(endpoint.uploadBytes || UPLOAD_BYTES));
        return await transfer(o, "upload", endpoint, file2, null, onRate);
      } finally {
        try {
          fs3.unlinkSync(file2);
        } catch (_) {
        }
      }
    }
    async function runSpeedTest(opts, onPhase, onProgress) {
      const o = { provider: "yandex", server: "https://speed.cloudflare.com", proxy: "", seconds: 6, streams: 4, signal: null, ...opts };
      throwIfAborted(o.signal);
      o.server = String(o.server).replace(/\/+$/, "");
      o.seconds = Math.max(3, Math.min(20, Number(o.seconds) || 6));
      o.streams = Math.max(1, Math.min(8, Math.trunc(Number(o.streams) || 4)));
      if (!["yandex", "cloudflare", "speedtest"].includes(o.provider)) throw new Error("Unknown test service");
      onPhase && onPhase("ping");
      let endpoint;
      if (o.provider === "yandex") endpoint = await yandexEndpoint(o);
      else if (o.provider === "speedtest") endpoint = await speedtestEndpoint(o);
      else endpoint = {
        pingMs: await pingCloudflare(o),
        headers: [],
        expectedDown: DOWNLOAD_BYTES,
        uploadBytes: UPLOAD_BYTES,
        downloadUrl: (size) => `${o.server}/__down?bytes=${size}&r=${crypto.randomBytes(8).toString("hex")}`,
        uploadUrl: `${o.server}/__up`
      };
      const pingMs = endpoint.pingMs;
      onProgress && onProgress({ pingMs });
      onPhase && onPhase("download");
      const onDown = (downMbps2) => onProgress && onProgress({ pingMs, downMbps: downMbps2 });
      let down;
      try {
        down = await transfer(o, "download", endpoint, null, endpoint.expectedDown, onDown);
      } catch (e) {
        if (o.provider !== "cloudflare" || e.httpCode !== 429) throw e;
        endpoint.expectedDown = FALLBACK_BYTES;
        onProgress && onProgress({ downMbps: null });
        down = await transfer(o, "download", endpoint, null, FALLBACK_BYTES, onDown);
      }
      const downMbps = down.bps / 1e6;
      onProgress && onProgress({ pingMs, downMbps });
      onPhase && onPhase("upload");
      if (o.provider === "cloudflare") await checkUpload(o, endpoint);
      const up = await upload(o, endpoint, (upMbps) => onProgress && onProgress({ pingMs, downMbps, upMbps }));
      return {
        pingMs,
        downMbps,
        upMbps: up.bps / 1e6,
        server: endpoint.server || new URL(endpoint.uploadUrl).hostname,
        measurement: { method: "http-goodput", download: down, upload: up }
      };
    }
    module.exports = { runSpeedTest };
  }
});

// happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/happ-window.js
var require_happ_window = __commonJS({
  "happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/happ-window.js"(exports, module) {
    "use strict";
    var { exec, execFile } = __require("child_process");
    var API = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class HappToggleWindow {
  public delegate bool WindowCallback(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern bool EnumWindows(WindowCallback callback, IntPtr p);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int count);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int count);
  [DllImport("user32.dll", SetLastError = true)] public static extern bool PostMessage(IntPtr h, uint message, IntPtr wParam, IntPtr lParam);
  public static bool IsMainWindow(IntPtr h, uint pid) {
    uint owner;
    GetWindowThreadProcessId(h, out owner);
    if (!IsWindow(h) || owner != pid) return false;
    var cls = new StringBuilder(256);
    var title = new StringBuilder(256);
    GetClassName(h, cls, cls.Capacity);
    GetWindowText(h, title, title.Capacity);
    return cls.ToString().StartsWith("Qt") && cls.ToString().EndsWith("QWindowIcon") &&
      (title.ToString() == "Happ" || title.ToString().StartsWith("Happ "));
  }
}
'@
function Test-HappProcess($p) {
  return ($p -and $p.ProcessName -eq 'Happ' -and $p.Path -and
    [IO.Path]::GetFileName($p.Path) -eq 'Happ.exe' -and
    [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($p.Path)) -eq 'Happ')
}
`;
    var SNAPSHOT = `${API}
$apps = @(Get-Process -Name Happ -ErrorAction SilentlyContinue | Where-Object { Test-HappProcess $_ })
if ($apps.Count -ne 1) { Write-Output 'unavailable'; exit }
$p = $apps[0]
$matches = New-Object 'System.Collections.Generic.List[System.IntPtr]'
$callback = [HappToggleWindow+WindowCallback]{param($h, $unused)
  if ([HappToggleWindow]::IsMainWindow($h, $p.Id)) { $matches.Add($h) }
  return $true
}
[void][HappToggleWindow]::EnumWindows($callback, [IntPtr]::Zero)
if ($matches.Count -ne 1) { Write-Output 'unavailable'; exit }
$h = $matches[0]
$state = if ([HappToggleWindow]::IsIconic($h)) { 'minimized' }
  elseif ([HappToggleWindow]::IsWindowVisible($h)) { 'visible' } else { 'tray' }
Write-Output "$($p.Id)|$($h.ToInt64())|$($p.StartTime.ToUniversalTime().Ticks)|$state"
`;
    function restoreScript(snapshot) {
      const { pid, handle, started, state } = snapshot;
      const message = state === "tray" ? "0x0010" : "0x0112";
      const parameter = state === "tray" ? "0" : "0xF020";
      return `${API}
$h = [IntPtr]::new([long]${handle})
$deadline = [Diagnostics.Stopwatch]::StartNew()
while ($deadline.ElapsedMilliseconds -lt 1800) {
  $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
  if (-not (Test-HappProcess $p) -or
      $p.StartTime.ToUniversalTime().Ticks.ToString() -ne '${started}' -or
      -not [HappToggleWindow]::IsMainWindow($h, ${pid})) { Write-Output 'stale'; exit }
  if ([HappToggleWindow]::IsWindowVisible($h) -and
      (${state === "tray" ? "$true" : "-not [HappToggleWindow]::IsIconic($h)"})) {
    # Let Happ handle its own close/minimize event; never force native visibility.
    if (-not [HappToggleWindow]::PostMessage($h, ${message}, [IntPtr]${parameter}, [IntPtr]::Zero)) {
      throw 'Window state request failed'
    }
    Write-Output 'requested'
    exit
  }
  Start-Sleep -Milliseconds 40
}
Write-Output 'unchanged'
`;
    }
    module.exports = function makeToggle(log, commands = { exec, execFile }) {
      const ps = (script) => new Promise((resolve) => {
        commands.execFile(
          "powershell.exe",
          ["-NoProfile", "-NonInteractive", "-Command", script],
          { windowsHide: true, timeout: 6e3, maxBuffer: 4096 },
          (err, stdout) => {
            if (err) {
              log("window helper error:", err.message);
              resolve(null);
            } else resolve(String(stdout || "").trim());
          }
        );
      });
      async function toggleKeepingTray(deeplink) {
        const output = await ps(SNAPSHOT);
        const match = output && output.match(/^([1-9]\d{0,9})\|([1-9]\d{0,15})\|([1-9]\d{0,18})\|(tray|minimized|visible)$/);
        const snapshot = match ? { pid: match[1], handle: match[2], started: match[3], state: match[4] } : null;
        const launched = await new Promise((resolve) => {
          commands.exec(`start "" "${deeplink}"`, { windowsHide: true }, (err) => {
            if (err) log("deeplink error:", err.message);
            resolve(!err);
          });
        });
        if (launched && snapshot && snapshot.state !== "visible") {
          const result = await ps(restoreScript(snapshot));
          if (result === "stale") log("window state skipped: Happ window changed");
        } else if (launched && !snapshot) {
          log("window state unavailable; Happ visibility left unchanged by plugin");
        }
      }
      let previous = Promise.resolve();
      return function enqueueToggle(deeplink) {
        if (deeplink !== "happ://toggle_without_ui") return Promise.reject(new Error("Unsupported Happ deeplink"));
        const next = previous.then(() => toggleKeepingTray(deeplink));
        previous = next.catch(() => {
        });
        return next;
      };
    };
  }
});

// happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/display.js
var require_display = __commonJS({
  "happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/lib/display.js"(exports, module) {
    "use strict";
    var PROVIDERS = ["yandex", "cloudflare", "speedtest"];
    var PROVIDER_NAMES = { yandex: "Yandex", cloudflare: "Cloudflare", speedtest: "Speedtest.net" };
    var FONT = "Bahnschrift";
    var FONTS = { segoe: "Segoe UI", arial: "Arial", consolas: "Consolas", bahnschrift: FONT };
    var STYLES = {
      regular: { weight: 400, style: "normal" },
      semibold: { weight: 600, style: "normal" },
      bold: { weight: 700, style: "normal" },
      italic: { weight: 400, style: "italic" }
    };
    var translate = (key) => key;
    function setTranslator(provider) {
      translate = provider;
    }
    var COLORS = {
      on: "#34d399",
      off: "#829198",
      pending: "#d69e2e",
      unknown: "#f87171",
      ping: "#d69e2e",
      download: "#34d399",
      upload: "#c084fc"
    };
    var DEFAULT_DISPLAY = {
      speedDisplayMode: "combined",
      speedUnit: "mbps",
      showSpeedUnits: true,
      showScreenPing: false,
      numberFont: "bahnschrift",
      numberStyle: "semibold",
      screenStatusIcon: "link",
      animateTest: true,
      animateIdle: true
    };
    function normalizeDisplay(settings2) {
      const result = { ...DEFAULT_DISPLAY, ...settings2 };
      delete result.speedPrecision;
      delete result.hideStatusLabels;
      for (const [key, allowed] of Object.entries({
        speedDisplayMode: ["combined", "phase"],
        speedUnit: ["mbps", "mbytes"],
        numberFont: Object.keys(FONTS),
        numberStyle: Object.keys(STYLES),
        screenStatusIcon: ["link", "power"]
      })) {
        if (!allowed.includes(result[key])) result[key] = DEFAULT_DISPLAY[key];
      }
      for (const key of ["showSpeedUnits", "showScreenPing", "animateTest", "animateIdle"]) {
        if (typeof result[key] !== "boolean") result[key] = DEFAULT_DISPLAY[key];
      }
      return result;
    }
    function xml(value) {
      return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
    }
    function localizedText() {
      return { error: translate("Speed test failed"), mbps: translate("Mbps"), mbytes: translate("MB/s") };
    }
    function fmtSpeed(value, settings2) {
      if (!Number.isFinite(value)) return "\u2014";
      const v = settings2.speedUnit === "mbytes" ? value / 8 : value;
      return v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2);
    }
    function fmtPing(value) {
      return Number.isFinite(value) ? String(Math.round(value)) : "\u2014";
    }
    function text(x, y, value, size, color = "#e5edeb", anchor = "middle", settings2) {
      const font = settings2 ? FONTS[settings2.numberFont] || FONT : FONT;
      const style = settings2 ? STYLES[settings2.numberStyle] || STYLES.semibold : STYLES.regular;
      return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${style.weight}" font-style="${style.style}" fill="${color}" text-anchor="${anchor}">${xml(value)}</text>`;
    }
    function textWidth(value, settings2) {
      const mono = settings2 && settings2.numberFont === "consolas";
      const width = [...String(value)].reduce((sum, char) => sum + (char === "\u2014" ? 1.05 : mono ? 0.66 : /[.,]/.test(char) ? 0.3 : char === " " ? 0.35 : /[mwMW]/.test(char) ? 0.9 : 0.66), 0);
      return Math.max(0.3, width) * (settings2 && settings2.numberStyle === "italic" ? 1.08 : 1);
    }
    function fit(value, width, max, settings2) {
      return Math.max(8, Math.min(max, Math.floor(width / textWidth(value, settings2))));
    }
    function svg(width, height, body, base643 = false) {
      const image = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
      return base643 ? "data:image/svg+xml;base64," + Buffer.from(image).toString("base64") : "data:image/svg+xml;charset=utf8," + encodeURIComponent(image);
    }
    function animationMode(settings2, speed) {
      if (speed.phase) return settings2.animateTest ? "test" : null;
      return !speed.error && settings2.animateIdle ? "idle" : null;
    }
    function wave(time3, period = 6e3) {
      return (1 + Math.cos(2 * Math.PI * (time3 % period) / period)) / 2;
    }
    function breathe(settings2, speed, time3) {
      return animationMode(settings2, speed) === "idle" ? (0.25 + 0.75 * wave(time3)).toFixed(3) : "1";
    }
    function power(state, x, y, size, opacity = "1") {
      const mark = state === "unknown" ? '<circle cx="12" cy="12" r="9"/><path d="M12 6 V13 M12 17 V17.2"/>' : `<path d="M18.6 5.4 A9 9 0 1 1 5.4 5.4"${state === "pending" ? ' stroke-dasharray="3 2"' : ""}/><path d="M12 2 V11"/>`;
      return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${COLORS[state]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">${mark}</g>`;
    }
    function screenStatus(state, x, y, size, settings2, opacity) {
      if (settings2.screenStatusIcon === "power") return power(state, x, y, size, opacity);
      const joined = state === "on";
      const mark = `<rect x="2" y="7" width="${joined ? 9 : 7}" height="10" rx="4"/><rect x="${joined ? 13 : 15}" y="7" width="${joined ? 9 : 7}" height="10" rx="4"/>` + (joined ? '<path d="M8 12 H16"/>' : state === "pending" ? '<path d="M11 12 H13" stroke-dasharray=".5 1.5"/>' : state === "unknown" ? '<path d="M9 5 L15 19"/>' : "");
      return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${COLORS[state]}" stroke-width="2.2" stroke-linecap="round" opacity="${opacity}">${mark}</g>`;
    }
    function metricIcon(type, x, y, size, settings2, speed, time3) {
      const mode = animationMode(settings2, speed);
      const offset = mode === "test" && type !== "ping" ? (1.5 * Math.sin(2 * Math.PI * (time3 % 2400) / 2400)).toFixed(2) : 0;
      const opacity = mode === "idle" ? (0.55 + 0.45 * wave(time3)).toFixed(3) : "1";
      const angle = mode === "test" && type === "ping" ? (time3 % 3e3 / 3e3 * 360).toFixed(1) : 0;
      const mark = type === "ping" ? `<circle cx="12" cy="12" r="8"/><path d="M12 12 V6" transform="rotate(${angle} 12 12)"/><path d="M12 12 L16 14"/>` : type === "download" ? '<path d="M12 3 V20 M6 14 L12 20 L18 14"/>' : '<path d="M12 21 V4 M6 10 L12 4 L18 10"/>';
      return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${COLORS[type]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"><g transform="translate(0 ${offset})">${mark}</g></g>`;
    }
    function speedIdleImage(settings2, speed, time3) {
      const hidden = settings2.hideTestServer;
      const angle = animationMode(settings2, speed) === "idle" ? (7 * Math.sin(2 * Math.PI * (time3 % 6e3) / 6e3)).toFixed(2) : 0;
      return `<g${hidden ? ' transform="translate(72 72) scale(1.4) translate(-72 -72)"' : ""}><path d="M32 91 A40 40 0 0 1 112 91" fill="none" stroke="#829198" stroke-width="5" stroke-linecap="round"/><path d="M72 91 L93 59" transform="rotate(${angle} 72 91)" stroke="#34d399" stroke-width="5" stroke-linecap="round"/><circle cx="72" cy="91" r="5" fill="#34d399" opacity="${breathe(settings2, speed, time3)}"/></g>` + (hidden ? "" : text(72, 129, PROVIDER_NAMES[settings2.speedProvider] || "Yandex", 17));
    }
    function customImage(uri, opacity = 1) {
      return `<image href="${xml(uri)}" x="0" y="0" width="144" height="144" opacity="${opacity}" preserveAspectRatio="xMidYMid slice"/>`;
    }
    function speedResultImage(values, settings2, speed, time3) {
      const down = fmtSpeed(values.downMbps, settings2), up = fmtSpeed(values.upMbps, settings2);
      const units = settings2.showSpeedUnits;
      const size = (v) => fit(v, 100, units ? 40 : 47, settings2);
      const downY = units ? 44 : 51, upY = units ? 87 : 103;
      return metricIcon("download", 15, downY - 13, 24, settings2, speed, time3) + text(134, downY, down, size(down), COLORS.download, "end", settings2) + metricIcon("upload", 15, upY - 13, 24, settings2, speed, time3) + text(134, upY, up, size(up), COLORS.upload, "end", settings2) + (units ? text(72, 111, localizedText()[settings2.speedUnit], 18) : "") + metricIcon("ping", 26, 129, 17, settings2, speed, time3) + text(85, 137, `${fmtPing(values.pingMs)} ms`, fit(`${fmtPing(values.pingMs)} ms`, 94, 20, settings2), "#e5edeb", "middle", settings2);
    }
    function phaseValue(phase, values, settings2) {
      return phase === "ping" ? fmtPing(values.pingMs) : fmtSpeed(phase === "download" ? values.downMbps : values.upMbps, settings2);
    }
    function speedPhaseImage(speed, values, settings2, time3) {
      const phase = speed.phase, value = phaseValue(phase, values, settings2);
      const unit = phase === "ping" ? "ms" : settings2.showSpeedUnits ? localizedText()[settings2.speedUnit] : "";
      return metricIcon(phase, 72, unit ? 28 : 23, 28, settings2, speed, time3) + text(72, unit ? 101 : 115, value, fit(value, 126, unit ? 64 : 74, settings2), COLORS[phase], "middle", settings2) + (unit ? text(72, 132, unit, 18) : "");
    }
    function renderKey(info, state, time3) {
      const settings2 = info.settings, speed = info.speed;
      const custom2 = info.action === "com.llwhite.happtoggle.toggle" && settings2.icons && settings2.icons[state];
      if (!speed.phase && !speed.result && !speed.error) {
        if (custom2 && !animationMode(settings2, speed)) return custom2;
        return svg(144, 144, custom2 ? customImage(custom2, breathe(settings2, speed, time3)) : info.action === "com.llwhite.happtoggle.speed" ? speedIdleImage(settings2, speed, time3) : power(state, 72, 72, 108, breathe(settings2, speed, time3)));
      }
      const values = speed.phase ? speed.partial || {} : speed.result || {};
      const body = speed.error ? text(72, 76, localizedText().error, fit(localizedText().error, 128, 20), "#f87171") : speed.phase && settings2.speedDisplayMode === "phase" ? speedPhaseImage(speed, values, settings2, time3) : speedResultImage(values, settings2, speed, time3);
      return svg(144, 144, (custom2 ? customImage(custom2, 0.25) : "") + body);
    }
    function metric(type, value, x, y, width, max, settings2, speed, time3) {
      const gap = ["arial", "segoe"].includes(settings2.numberFont) ? 12 : 8;
      const iconSize = Math.max(12, Math.min(24, max * 0.65));
      const size = fit(value, width - iconSize - gap, max, settings2);
      const span = textWidth(value, settings2) * size;
      const left = x - (span + iconSize + gap) / 2;
      return metricIcon(type, left + iconSize / 2, y - size * 0.35, iconSize, settings2, speed, time3) + text(left + iconSize + gap + span / 2, y, value, size, COLORS[type], "middle", settings2);
    }
    function renderScreen(info, state, snapshot, time3) {
      const settings2 = info.settings, neo = info.controller === "Neo";
      const speed = snapshot ? snapshot.speed : info.speed;
      const values = speed.phase ? speed.partial || {} : speed.result || {};
      const provider = snapshot ? snapshot.provider : neo ? null : settings2.speedProvider;
      const label = speed.result && speed.result.server && provider === "speedtest" ? speed.result.server : PROVIDER_NAMES[provider] || "";
      const clean = String(label).replace(/[\x00-\x1f\x7f]/g, "");
      const limit = neo ? 25 : 23;
      const short = clean.length > limit ? clean.slice(0, limit - 1) + "\u2026" : clean;
      const serverVisible = !settings2.hideTestServer && !!short;
      const t = localizedText(), width = neo ? 232 : 200, height = neo ? 50 : 100;
      const phaseMode = speed.phase && settings2.speedDisplayMode === "phase";
      const inPingPhase = phaseMode && speed.phase === "ping";
      const pingVisible = settings2.showScreenPing && !inPingPhase;
      const unit = inPingPhase ? "ms" : settings2.showSpeedUnits ? t[settings2.speedUnit] : "";
      const opacity = breathe(settings2, speed, time3);
      let labels, numbers = "";
      if (neo) {
        labels = screenStatus(state, serverVisible ? 16 : width / 2, 11, serverVisible ? 20 : 24, settings2, opacity);
        if (serverVisible) labels += text(132, 16, short, fit(short, 192, 14));
      } else {
        labels = screenStatus(state, serverVisible ? 18 : width / 2, serverVisible ? 15 : 16, serverVisible ? 26 : 32, settings2, opacity);
        if (serverVisible) labels += text(116, 20, short, fit(short, 156, 16));
      }
      if (speed.error) {
        numbers = text(width / 2, neo ? 38 : 65, t.error, fit(t.error, width - 16, neo ? 15 : 20), "#f87171");
      } else {
        const top = neo ? 22 : serverVisible ? 33 : 28;
        const bottom = neo ? unit ? 36 : 48 : pingVisible ? unit ? 65 : 71 : unit ? 79 : 95;
        const max = Math.min(neo ? pingVisible ? 17 : 25 : pingVisible ? 32 : 48, bottom - top + 1);
        const y = (top + bottom) / 2 + max * 0.32;
        if (phaseMode) {
          numbers = metric(speed.phase, phaseValue(speed.phase, values, settings2), width / 2, y, width - 16, max, settings2, speed, time3);
        } else if (neo && pingVisible) {
          const cell = width / 3;
          numbers = metric("download", fmtSpeed(values.downMbps, settings2), cell / 2, y, cell - 4, max, settings2, speed, time3) + metric("upload", fmtSpeed(values.upMbps, settings2), cell * 1.5, y, cell - 4, max, settings2, speed, time3) + metric("ping", `${fmtPing(values.pingMs)} ms`, cell * 2.5, y, cell - 4, max, settings2, speed, time3);
        } else {
          numbers = metric("download", fmtSpeed(values.downMbps, settings2), width / 4, y, width / 2 - 8, max, settings2, speed, time3) + metric("upload", fmtSpeed(values.upMbps, settings2), width * 3 / 4, y, width / 2 - 8, max, settings2, speed, time3);
        }
        if (!neo && pingVisible) {
          const ping = `${fmtPing(values.pingMs)} ms`;
          numbers += metric("ping", ping, width / 2, unit ? 82 : 95, width - 32, unit ? 18 : 20, settings2, speed, time3);
        } else if (neo && pingVisible && phaseMode) {
          numbers = metric(speed.phase, phaseValue(speed.phase, values, settings2), 79, y, 148, max, settings2, speed, time3) + metric("ping", `${fmtPing(values.pingMs)} ms`, 195, y, 66, max, settings2, speed, time3);
        }
        if (unit) numbers += text(width / 2, height - 2, unit, neo ? 9 : 12, "#a9b8bc");
      }
      return svg(width, height, (settings2.transparentScreen ? "" : `<rect width="${width}" height="${height}" fill="#171b1e"/>`) + labels + numbers, true);
    }
    module.exports = { PROVIDERS, DEFAULT_DISPLAY, normalizeDisplay, animationMode, renderKey, renderScreen, setTranslator };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/i18n/language.js
var defaultLanguage;
var init_language = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/i18n/language.js"() {
    defaultLanguage = "en";
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/deferred.js
function deferredDisposable(dispose) {
  let isDisposed = false;
  const guardedDispose = () => {
    if (!isDisposed) {
      dispose();
      isDisposed = true;
    }
  };
  return {
    [Symbol.dispose]: guardedDispose,
    dispose: guardedDispose
  };
}
var init_deferred = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/deferred.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/event-emitter.js
var EventEmitter;
var init_event_emitter = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/event-emitter.js"() {
    init_deferred();
    EventEmitter = class {
      /**
       * Underlying collection of events and their listeners.
       */
      events = /* @__PURE__ */ new Map();
      /**
       * Adds the event {@link listener} for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns This instance with the {@link listener} added.
       */
      addListener(eventName, listener) {
        return this.add(eventName, listener, (listeners) => listeners.push({ listener }));
      }
      /**
       * Adds the event {@link listener} for the event named {@link eventName}, and returns a disposable capable of removing the event listener.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns A disposable that removes the listener when disposed.
       */
      disposableOn(eventName, listener) {
        this.add(eventName, listener, (listeners) => listeners.push({ listener }));
        return deferredDisposable(() => this.removeListener(eventName, listener));
      }
      /**
       * Emits the {@link eventName}, invoking all event listeners with the specified {@link args}.
       * @param eventName Name of the event.
       * @param args Arguments supplied to each event listener.
       * @returns `true` when there was a listener associated with the event; otherwise `false`.
       */
      emit(eventName, ...args) {
        const listeners = this.events.get(eventName);
        if (listeners === void 0) {
          return false;
        }
        for (let i = 0; i < listeners.length; ) {
          const { listener, once } = listeners[i];
          if (once) {
            this.remove(eventName, listeners, i);
          } else {
            i++;
          }
          listener(...args);
        }
        return true;
      }
      /**
       * Gets the event names with event listeners.
       * @returns Event names.
       */
      eventNames() {
        return Array.from(this.events.keys());
      }
      /**
       * Gets the number of event listeners for the event named {@link eventName}. When a {@link listener} is defined, only matching event listeners are counted.
       * @param eventName Name of the event.
       * @param listener Optional event listener to count.
       * @returns Number of event listeners.
       */
      listenerCount(eventName, listener) {
        const listeners = this.events.get(eventName);
        if (listeners === void 0 || listener == void 0) {
          return listeners?.length || 0;
        }
        let count = 0;
        listeners.forEach((ev) => {
          if (ev.listener === listener) {
            count++;
          }
        });
        return count;
      }
      /**
       * Gets the event listeners for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @returns The event listeners.
       */
      listeners(eventName) {
        return Array.from(this.events.get(eventName) || []).map(({ listener }) => listener);
      }
      /**
       * Removes the event {@link listener} for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns This instance with the event {@link listener} removed.
       */
      off(eventName, listener) {
        const listeners = this.events.get(eventName) ?? [];
        for (let i = listeners.length - 1; i >= 0; i--) {
          if (listeners[i].listener === listener) {
            this.remove(eventName, listeners, i);
          }
        }
        return this;
      }
      /**
       * Adds the event {@link listener} for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns This instance with the event {@link listener} added.
       */
      on(eventName, listener) {
        return this.add(eventName, listener, (listeners) => listeners.push({ listener }));
      }
      /**
       * Adds the **one-time** event {@link listener} for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns This instance with the event {@link listener} added.
       */
      once(eventName, listener) {
        return this.add(eventName, listener, (listeners) => listeners.push({ listener, once: true }));
      }
      /**
       * Adds the event {@link listener} to the beginning of the listeners for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns This instance with the event {@link listener} prepended.
       */
      prependListener(eventName, listener) {
        return this.add(eventName, listener, (listeners) => listeners.splice(0, 0, { listener }));
      }
      /**
       * Adds the **one-time** event {@link listener} to the beginning of the listeners for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns This instance with the event {@link listener} prepended.
       */
      prependOnceListener(eventName, listener) {
        return this.add(eventName, listener, (listeners) => listeners.splice(0, 0, { listener, once: true }));
      }
      /**
       * Removes all event listeners for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @returns This instance with the event listeners removed
       */
      removeAllListeners(eventName) {
        const listeners = this.events.get(eventName) ?? [];
        while (listeners.length > 0) {
          this.remove(eventName, listeners, 0);
        }
        this.events.delete(eventName);
        return this;
      }
      /**
       * Removes the event {@link listener} for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @returns This instance with the event {@link listener} removed.
       */
      removeListener(eventName, listener) {
        return this.off(eventName, listener);
      }
      /**
       * Adds the event {@link listener} for the event named {@link eventName}.
       * @param eventName Name of the event.
       * @param listener Event handler function.
       * @param fn Function responsible for adding the new event handler function.
       * @returns This instance with event {@link listener} added.
       */
      add(eventName, listener, fn) {
        let listeners = this.events.get(eventName);
        if (listeners === void 0) {
          listeners = [];
          this.events.set(eventName, listeners);
        }
        fn(listeners);
        if (eventName !== "newListener") {
          const args = [eventName, listener];
          this.emit("newListener", ...args);
        }
        return this;
      }
      /**
       * Removes the listener at the given index.
       * @param eventName Name of the event.
       * @param listeners Listeners registered with the event.
       * @param index Index of the listener to remove.
       */
      remove(eventName, listeners, index) {
        const [{ listener }] = listeners.splice(index, 1);
        if (eventName !== "removeListener") {
          const args = [eventName, listener];
          this.emit("removeListener", ...args);
        }
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/objects/freeze.js
function freeze(value) {
  if (value !== void 0 && value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
}
var init_freeze = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/objects/freeze.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/objects/get.js
function get(source, path5) {
  const props = path5.split(".");
  return props.reduce((obj, prop) => obj && obj[prop], source);
}
var init_get = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/objects/get.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/i18n/provider.js
var I18nProvider;
var init_provider = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/i18n/provider.js"() {
    init_event_emitter();
    init_freeze();
    init_get();
    init_language();
    I18nProvider = class {
      /**
       * Backing field for the default language.
       */
      #language;
      /**
       * Map of localized resources, indexed by their language.
       */
      #translations = /* @__PURE__ */ new Map();
      /**
       * Function responsible for providing localized resources for a given language.
       */
      #readTranslations;
      /**
       * Internal events handler.
       */
      #events = new EventEmitter();
      /**
       * Initializes a new instance of the {@link I18nProvider} class.
       * @param language The default language to be used when retrieving translations for a given key.
       * @param readTranslations Function responsible for providing localized resources for a given language.
       */
      constructor(language, readTranslations) {
        this.#language = language;
        this.#readTranslations = readTranslations;
      }
      /**
       * The default language of the provider.
       * @returns The language.
       */
      get language() {
        return this.#language;
      }
      /**
       * The default language of the provider.
       * @param value The language.
       */
      set language(value) {
        if (this.#language !== value) {
          this.#language = value;
          this.#events.emit("languageChange", value);
        }
      }
      /**
       * Adds an event listener that is called when the language within the provider changes.
       * @param listener Listener function to be called.
       * @returns Resource manager that, when disposed, removes the event listener.
       */
      onLanguageChange(listener) {
        return this.#events.disposableOn("languageChange", listener);
      }
      /**
       * Translates the specified {@link key}, as defined within the resources for the {@link language}.
       * When the key is not found, the default language is checked. Alias of {@link I18nProvider.translate}.
       * @param key Key of the translation.
       * @param language Optional language to get the translation for; otherwise the default language.
       * @returns The translation; otherwise the key.
       */
      t(key, language = this.language) {
        return this.translate(key, language);
      }
      /**
       * Translates the specified {@link key}, as defined within the resources for the {@link language}.
       * When the key is not found, the default language is checked.
       * @param key Key of the translation.
       * @param language Optional language to get the translation for; otherwise the default language.
       * @returns The translation; otherwise the key.
       */
      translate(key, language = this.language) {
        const languages = /* @__PURE__ */ new Set([
          language,
          language.replaceAll("_", "-").split("-").at(0),
          defaultLanguage
        ]);
        for (const language2 of languages) {
          const resource = get(this.getTranslations(language2), key);
          if (resource) {
            return resource.toString();
          }
        }
        return key;
      }
      /**
       * Gets the translations for the specified language.
       * @param language Language whose translations are being retrieved.
       * @returns The translations; otherwise `null`.
       */
      getTranslations(language) {
        let translations = this.#translations.get(language);
        if (translations === void 0) {
          translations = this.#readTranslations(language);
          freeze(translations);
          this.#translations.set(language, translations);
        }
        return translations;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/i18n/index.js
var init_i18n = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/i18n/index.js"() {
    init_language();
    init_provider();
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/enumerable.js
var Enumerable;
var init_enumerable = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/enumerable.js"() {
    Enumerable = class _Enumerable {
      /**
       * Backing function responsible for providing the iterator of items.
       */
      #items;
      /**
       * Backing function for {@link Enumerable.length}.
       */
      #length;
      /**
       * Captured iterator from the underlying iterable; used to fulfil {@link IterableIterator} methods.
       */
      #iterator;
      /**
       * Initializes a new instance of the {@link Enumerable} class.
       * @param source Source that contains the items.
       * @returns The enumerable.
       */
      constructor(source) {
        if (source instanceof _Enumerable) {
          this.#items = source.#items;
          this.#length = source.#length;
        } else if (Array.isArray(source)) {
          this.#items = () => source.values();
          this.#length = () => source.length;
        } else if (source instanceof Map || source instanceof Set) {
          this.#items = () => source.values();
          this.#length = () => source.size;
        } else {
          this.#items = source;
          this.#length = () => {
            let i = 0;
            for (const _ of this) {
              i++;
            }
            return i;
          };
        }
      }
      /**
       * Gets the number of items in the enumerable.
       * @returns The number of items.
       */
      get length() {
        return this.#length();
      }
      /**
       * Gets the iterator for the enumerable.
       * @yields The items.
       */
      *[Symbol.iterator]() {
        for (const item of this.#items()) {
          yield item;
        }
      }
      /**
       * Transforms each item within this iterator to an indexed pair, with each pair represented as an array.
       * @returns An iterator of indexed pairs.
       */
      asIndexedPairs() {
        return new _Enumerable(function* () {
          let i = 0;
          for (const item of this) {
            yield [i++, item];
          }
        }.bind(this));
      }
      /**
       * Returns an iterator with the first items dropped, up to the specified limit.
       * @param limit The number of elements to drop from the start of the iteration.
       * @returns An iterator of items after the limit.
       */
      drop(limit) {
        if (isNaN(limit) || limit < 0) {
          throw new RangeError("limit must be 0, or a positive number");
        }
        return new _Enumerable(function* () {
          let i = 0;
          for (const item of this) {
            if (i++ >= limit) {
              yield item;
            }
          }
        }.bind(this));
      }
      /**
       * Determines whether all items satisfy the specified predicate.
       * @param predicate Function that determines whether each item fulfils the predicate.
       * @returns `true` when all items satisfy the predicate; otherwise `false`.
       */
      every(predicate) {
        for (const item of this) {
          if (!predicate(item)) {
            return false;
          }
        }
        return true;
      }
      /**
       * Returns an iterator of items that meet the specified predicate..
       * @param predicate Function that determines which items to filter.
       * @returns An iterator of filtered items.
       */
      filter(predicate) {
        return new _Enumerable(function* () {
          for (const item of this) {
            if (predicate(item)) {
              yield item;
            }
          }
        }.bind(this));
      }
      /**
       * Finds the first item that satisfies the specified predicate.
       * @param predicate Predicate to match items against.
       * @returns The first item that satisfied the predicate; otherwise `undefined`.
       */
      find(predicate) {
        for (const item of this) {
          if (predicate(item)) {
            return item;
          }
        }
      }
      /**
       * Finds the last item that satisfies the specified predicate.
       * @param predicate Predicate to match items against.
       * @returns The first item that satisfied the predicate; otherwise `undefined`.
       */
      findLast(predicate) {
        let result = void 0;
        for (const item of this) {
          if (predicate(item)) {
            result = item;
          }
        }
        return result;
      }
      /**
       * Returns an iterator containing items transformed using the specified mapper function.
       * @param mapper Function responsible for transforming each item.
       * @returns An iterator of transformed items.
       */
      flatMap(mapper) {
        return new _Enumerable(function* () {
          for (const item of this) {
            for (const mapped of mapper(item)) {
              yield mapped;
            }
          }
        }.bind(this));
      }
      /**
       * Iterates over each item, and invokes the specified function.
       * @param fn Function to invoke against each item.
       */
      forEach(fn) {
        for (const item of this) {
          fn(item);
        }
      }
      /**
       * Determines whether the search item exists in the collection exists.
       * @param search Item to search for.
       * @returns `true` when the item was found; otherwise `false`.
       */
      includes(search) {
        return this.some((item) => item === search);
      }
      /**
       * Returns an iterator of mapped items using the mapper function.
       * @param mapper Function responsible for mapping the items.
       * @returns An iterator of mapped items.
       */
      map(mapper) {
        return new _Enumerable(function* () {
          for (const item of this) {
            yield mapper(item);
          }
        }.bind(this));
      }
      /**
       * Captures the underlying iterable, if it is not already captured, and gets the next item in the iterator.
       * @param args Optional values to send to the generator.
       * @returns An iterator result of the current iteration; when `done` is `false`, the current `value` is provided.
       */
      next(...args) {
        this.#iterator ??= this.#items();
        const result = this.#iterator.next(...args);
        if (result.done) {
          this.#iterator = void 0;
        }
        return result;
      }
      /**
       * Applies the accumulator function to each item, and returns the result.
       * @param accumulator Function responsible for accumulating all items within the collection.
       * @param initial Initial value supplied to the accumulator.
       * @returns Result of accumulating each value.
       */
      reduce(accumulator, initial) {
        if (this.length === 0) {
          if (initial === void 0) {
            throw new TypeError("Reduce of empty enumerable with no initial value.");
          }
          return initial;
        }
        let result = initial;
        for (const item of this) {
          if (result === void 0) {
            result = item;
          } else {
            result = accumulator(result, item);
          }
        }
        return result;
      }
      /**
       * Acts as if a `return` statement is inserted in the generator's body at the current suspended position.
       *
       * Please note, in the context of an {@link Enumerable}, calling {@link Enumerable.return} will clear the captured iterator,
       * if there is one. Subsequent calls to {@link Enumerable.next} will result in re-capturing the underlying iterable, and
       * yielding items from the beginning.
       * @param value Value to return.
       * @returns The value as an iterator result.
       */
      return(value) {
        this.#iterator = void 0;
        return { done: true, value };
      }
      /**
       * Determines whether an item in the collection exists that satisfies the specified predicate.
       * @param predicate Function used to search for an item.
       * @returns `true` when the item was found; otherwise `false`.
       */
      some(predicate) {
        for (const item of this) {
          if (predicate(item)) {
            return true;
          }
        }
        return false;
      }
      /**
       * Returns an iterator with the items, from 0, up to the specified limit.
       * @param limit Limit of items to take.
       * @returns An iterator of items from 0 to the limit.
       */
      take(limit) {
        if (isNaN(limit) || limit < 0) {
          throw new RangeError("limit must be 0, or a positive number");
        }
        return new _Enumerable(function* () {
          let i = 0;
          for (const item of this) {
            if (i++ < limit) {
              yield item;
            }
          }
        }.bind(this));
      }
      /**
       * Acts as if a `throw` statement is inserted in the generator's body at the current suspended position.
       * @param e Error to throw.
       */
      throw(e) {
        throw e;
      }
      /**
       * Converts this iterator to an array.
       * @returns The array of items from this iterator.
       */
      toArray() {
        return Array.from(this);
      }
      /**
       * Converts this iterator to serializable collection.
       * @returns The serializable collection of items.
       */
      toJSON() {
        return this.toArray();
      }
      /**
       * Converts this iterator to a string.
       * @returns The string.
       */
      toString() {
        return `${this.toArray()}`;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/disposable-stack.js
var init_disposable_stack = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/disposable-stack.js"() {
    init_deferred();
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/disposable.js
var init_disposable = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/disposable.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/index.js
var init_explicit_resource_management = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/explicit-resource-management/index.js"() {
    init_deferred();
    init_disposable_stack();
    init_disposable();
    Symbol.dispose ??= Symbol("Symbol.dispose");
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/json.js
var init_json = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/json.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/lazy.js
var Lazy;
var init_lazy = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/lazy.js"() {
    Lazy = class {
      /**
       * Private backing field for {@link Lazy.value}.
       */
      #value = void 0;
      /**
       * Factory responsible for instantiating the value.
       */
      #valueFactory;
      /**
       * Initializes a new instance of the {@link Lazy} class.
       * @param valueFactory The factory responsible for instantiating the value.
       */
      constructor(valueFactory) {
        this.#valueFactory = valueFactory;
      }
      /**
       * Gets the value.
       * @returns The value.
       */
      get value() {
        if (this.#value === void 0) {
          this.#value = this.#valueFactory();
        }
        return this.#value;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/objects/set.js
var init_set = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/objects/set.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/parsers.js
var init_parsers = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/parsers.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/processes/posix.js
var init_posix = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/processes/posix.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/processes/win32.js
var init_win32 = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/processes/win32.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/processes.js
var init_processes = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/processes.js"() {
    init_posix();
    init_win32();
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/promises.js
function withResolvers() {
  let resolve;
  let reject;
  const promise2 = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise: promise2, resolve, reject };
}
var init_promises = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/promises.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/strings.js
var init_strings = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/strings.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/timers.js
var init_timers = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/timers.js"() {
    init_promises();
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/types.js
var init_types = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/types.js"() {
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/core.js
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer2, params) {
  function init(inst, def) {
    var _a;
    Object.defineProperty(inst, "_zod", {
      value: inst._zod ?? {},
      enumerable: false
    });
    (_a = inst._zod).traits ?? (_a.traits = /* @__PURE__ */ new Set());
    inst._zod.traits.add(name);
    initializer2(inst, def);
    for (const k in _.prototype) {
      if (!(k in inst))
        Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
    }
    inst._zod.constr = _;
    inst._zod.def = def;
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
var NEVER, $brand, $ZodAsyncError, globalConfig;
var init_core = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/core.js"() {
    NEVER = Object.freeze({
      status: "aborted"
    });
    $brand = Symbol("zod_brand");
    $ZodAsyncError = class extends Error {
      constructor() {
        super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
      }
    };
    globalConfig = {};
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  stringifyPrimitive: () => stringifyPrimitive,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error();
}
function assert(_) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set3 = false;
  return {
    get value() {
      if (!set3) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function defineLazy(object2, key, getter) {
  const set3 = false;
  Object.defineProperty(object2, key, {
    get() {
      if (!set3) {
        const value = getter();
        object2[key] = value;
        return value;
      }
      throw new Error("cached value already set");
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function getElementAtPath(obj, path5) {
  if (!path5)
    return obj;
  return path5.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
function pick(schema, mask) {
  const newShape = {};
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(`Unrecognized key: "${key}"`);
    }
    if (!mask[key])
      continue;
    newShape[key] = currDef.shape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function omit(schema, mask) {
  const newShape = { ...schema._zod.def.shape };
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(`Unrecognized key: "${key}"`);
    }
    if (!mask[key])
      continue;
    delete newShape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const def = {
    ...schema._zod.def,
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: []
    // delete existing checks
  };
  return clone(schema, def);
}
function merge(a, b) {
  return clone(a, {
    ...a._zod.def,
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    catchall: b._zod.def.catchall,
    checks: []
    // delete existing checks
  });
}
function partial(Class2, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in oldShape)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
      if (!mask[key])
        continue;
      shape[key] = Class2 ? new Class2({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  } else {
    for (const key in oldShape) {
      shape[key] = Class2 ? new Class2({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    checks: []
  });
}
function required(Class2, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in shape)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
      if (!mask[key])
        continue;
      shape[key] = new Class2({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  } else {
    for (const key in oldShape) {
      shape[key] = new Class2({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    // optional: [],
    checks: []
  });
}
function aborted(x, startIndex = 0) {
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true)
      return true;
  }
  return false;
}
function prefixIssues(path5, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path5);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    const message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
    full.message = message;
  }
  delete full.inst;
  delete full.continue;
  if (!ctx?.reportInput) {
    delete full.input;
  }
  return full;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
var captureStackTrace, allowsEval, getParsedType, propertyKeyTypes, primitiveTypes, NUMBER_FORMAT_RANGES, BIGINT_FORMAT_RANGES, Class;
var init_util = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/util.js"() {
    captureStackTrace = Error.captureStackTrace ? Error.captureStackTrace : (..._args) => {
    };
    allowsEval = cached(() => {
      if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
        return false;
      }
      try {
        const F = Function;
        new F("");
        return true;
      } catch (_) {
        return false;
      }
    });
    getParsedType = (data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return "undefined";
        case "string":
          return "string";
        case "number":
          return Number.isNaN(data) ? "nan" : "number";
        case "boolean":
          return "boolean";
        case "function":
          return "function";
        case "bigint":
          return "bigint";
        case "symbol":
          return "symbol";
        case "object":
          if (Array.isArray(data)) {
            return "array";
          }
          if (data === null) {
            return "null";
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return "promise";
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return "map";
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return "set";
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return "date";
          }
          if (typeof File !== "undefined" && data instanceof File) {
            return "file";
          }
          return "object";
        default:
          throw new Error(`Unknown data type: ${t}`);
      }
    };
    propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
    primitiveTypes = /* @__PURE__ */ new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
    NUMBER_FORMAT_RANGES = {
      safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
      int32: [-2147483648, 2147483647],
      uint32: [0, 4294967295],
      float32: [-34028234663852886e22, 34028234663852886e22],
      float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
    };
    BIGINT_FORMAT_RANGES = {
      int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
      uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
    };
    Class = class {
      constructor(..._args) {
      }
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/errors.js
function flattenError(error40, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error40.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error40, _mapper) {
  const mapper = _mapper || function(issue2) {
    return issue2.message;
  };
  const fieldErrors = { _errors: [] };
  const processError = (error41) => {
    for (const issue2 of error41.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues });
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues });
      } else if (issue2.path.length === 0) {
        fieldErrors._errors.push(mapper(issue2));
      } else {
        let curr = fieldErrors;
        let i = 0;
        while (i < issue2.path.length) {
          const el = issue2.path[i];
          const terminal = i === issue2.path.length - 1;
          if (!terminal) {
            curr[el] = curr[el] || { _errors: [] };
          } else {
            curr[el] = curr[el] || { _errors: [] };
            curr[el]._errors.push(mapper(issue2));
          }
          curr = curr[el];
          i++;
        }
      }
    }
  };
  processError(error40);
  return fieldErrors;
}
function treeifyError(error40, _mapper) {
  const mapper = _mapper || function(issue2) {
    return issue2.message;
  };
  const result = { errors: [] };
  const processError = (error41, path5 = []) => {
    var _a, _b;
    for (const issue2 of error41.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, issue2.path));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, issue2.path);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, issue2.path);
      } else {
        const fullpath = [...path5, ...issue2.path];
        if (fullpath.length === 0) {
          result.errors.push(mapper(issue2));
          continue;
        }
        let curr = result;
        let i = 0;
        while (i < fullpath.length) {
          const el = fullpath[i];
          const terminal = i === fullpath.length - 1;
          if (typeof el === "string") {
            curr.properties ?? (curr.properties = {});
            (_a = curr.properties)[el] ?? (_a[el] = { errors: [] });
            curr = curr.properties[el];
          } else {
            curr.items ?? (curr.items = []);
            (_b = curr.items)[el] ?? (_b[el] = { errors: [] });
            curr = curr.items[el];
          }
          if (terminal) {
            curr.errors.push(mapper(issue2));
          }
          i++;
        }
      }
    }
  };
  processError(error40);
  return result;
}
function toDotPath(path5) {
  const segs = [];
  for (const seg of path5) {
    if (typeof seg === "number")
      segs.push(`[${seg}]`);
    else if (typeof seg === "symbol")
      segs.push(`[${JSON.stringify(String(seg))}]`);
    else if (/[^\w$]/.test(seg))
      segs.push(`[${JSON.stringify(seg)}]`);
    else {
      if (segs.length)
        segs.push(".");
      segs.push(seg);
    }
  }
  return segs.join("");
}
function prettifyError(error40) {
  const lines = [];
  const issues = [...error40.issues].sort((a, b) => a.path.length - b.path.length);
  for (const issue2 of issues) {
    lines.push(`\u2716 ${issue2.message}`);
    if (issue2.path?.length)
      lines.push(`  \u2192 at ${toDotPath(issue2.path)}`);
  }
  return lines.join("\n");
}
var initializer, $ZodError, $ZodRealError;
var init_errors = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/errors.js"() {
    init_core();
    init_util();
    initializer = (inst, def) => {
      inst.name = "$ZodError";
      Object.defineProperty(inst, "_zod", {
        value: inst._zod,
        enumerable: false
      });
      Object.defineProperty(inst, "issues", {
        value: def,
        enumerable: false
      });
      Object.defineProperty(inst, "message", {
        get() {
          return JSON.stringify(def, jsonStringifyReplacer, 2);
        },
        enumerable: true
        // configurable: false,
      });
      Object.defineProperty(inst, "toString", {
        value: () => inst.message,
        enumerable: false
      });
    };
    $ZodError = $constructor("$ZodError", initializer);
    $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/parse.js
var _parse, parse, _parseAsync, parseAsync, _safeParse, safeParse, _safeParseAsync, safeParseAsync;
var init_parse = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/parse.js"() {
    init_core();
    init_errors();
    init_util();
    _parse = (_Err) => (schema, value, _ctx, _params) => {
      const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
      const result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise) {
        throw new $ZodAsyncError();
      }
      if (result.issues.length) {
        const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, _params?.callee);
        throw e;
      }
      return result.value;
    };
    parse = /* @__PURE__ */ _parse($ZodRealError);
    _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
      const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
      let result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise)
        result = await result;
      if (result.issues.length) {
        const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, params?.callee);
        throw e;
      }
      return result.value;
    };
    parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
    _safeParse = (_Err) => (schema, value, _ctx) => {
      const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
      const result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise) {
        throw new $ZodAsyncError();
      }
      return result.issues.length ? {
        success: false,
        error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
      } : { success: true, data: result.value };
    };
    safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
    _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
      const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
      let result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise)
        result = await result;
      return result.issues.length ? {
        success: false,
        error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
      } : { success: true, data: result.value };
    };
    safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/regexes.js
var regexes_exports = {};
__export(regexes_exports, {
  _emoji: () => _emoji,
  base64: () => base64,
  base64url: () => base64url,
  bigint: () => bigint,
  boolean: () => boolean,
  browserEmail: () => browserEmail,
  cidrv4: () => cidrv4,
  cidrv6: () => cidrv6,
  cuid: () => cuid,
  cuid2: () => cuid2,
  date: () => date,
  datetime: () => datetime,
  domain: () => domain,
  duration: () => duration,
  e164: () => e164,
  email: () => email,
  emoji: () => emoji,
  extendedDuration: () => extendedDuration,
  guid: () => guid,
  hostname: () => hostname,
  html5Email: () => html5Email,
  integer: () => integer,
  ipv4: () => ipv4,
  ipv6: () => ipv6,
  ksuid: () => ksuid,
  lowercase: () => lowercase,
  nanoid: () => nanoid,
  null: () => _null,
  number: () => number,
  rfc5322Email: () => rfc5322Email,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  undefined: () => _undefined,
  unicodeEmail: () => unicodeEmail,
  uppercase: () => uppercase,
  uuid: () => uuid,
  uuid4: () => uuid4,
  uuid6: () => uuid6,
  uuid7: () => uuid7,
  xid: () => xid
});
function emoji() {
  return new RegExp(_emoji, "u");
}
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time3 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-]\\d{2}:\\d{2})`);
  const timeRegex = `${time3}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var cuid, cuid2, ulid, xid, ksuid, nanoid, duration, extendedDuration, guid, uuid, uuid4, uuid6, uuid7, email, html5Email, rfc5322Email, unicodeEmail, browserEmail, _emoji, ipv4, ipv6, cidrv4, cidrv6, base64, base64url, hostname, domain, e164, dateSource, date, string, bigint, integer, number, boolean, _null, _undefined, lowercase, uppercase;
var init_regexes = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/regexes.js"() {
    cuid = /^[cC][^\s-]{8,}$/;
    cuid2 = /^[0-9a-z]+$/;
    ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
    xid = /^[0-9a-vA-V]{20}$/;
    ksuid = /^[A-Za-z0-9]{27}$/;
    nanoid = /^[a-zA-Z0-9_-]{21}$/;
    duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
    extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
    uuid = (version2) => {
      if (!version2)
        return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;
      return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
    };
    uuid4 = /* @__PURE__ */ uuid(4);
    uuid6 = /* @__PURE__ */ uuid(6);
    uuid7 = /* @__PURE__ */ uuid(7);
    email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
    html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
    browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/;
    cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
    cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
    base64url = /^[A-Za-z0-9_-]*$/;
    hostname = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
    domain = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    e164 = /^\+(?:[0-9]){6,14}[0-9]$/;
    dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
    date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
    string = (params) => {
      const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
      return new RegExp(`^${regex}$`);
    };
    bigint = /^\d+n?$/;
    integer = /^\d+$/;
    number = /^-?\d+(?:\.\d+)?/i;
    boolean = /true|false/i;
    _null = /null/i;
    _undefined = /undefined/i;
    lowercase = /^[^A-Z]*$/;
    uppercase = /^[^a-z]*$/;
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/checks.js
function handleCheckPropertyResult(result, payload, property) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(property, result.issues));
  }
}
var $ZodCheck, numericOriginMap, $ZodCheckLessThan, $ZodCheckGreaterThan, $ZodCheckMultipleOf, $ZodCheckNumberFormat, $ZodCheckBigIntFormat, $ZodCheckMaxSize, $ZodCheckMinSize, $ZodCheckSizeEquals, $ZodCheckMaxLength, $ZodCheckMinLength, $ZodCheckLengthEquals, $ZodCheckStringFormat, $ZodCheckRegex, $ZodCheckLowerCase, $ZodCheckUpperCase, $ZodCheckIncludes, $ZodCheckStartsWith, $ZodCheckEndsWith, $ZodCheckProperty, $ZodCheckMimeType, $ZodCheckOverwrite;
var init_checks = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/checks.js"() {
    init_core();
    init_regexes();
    init_util();
    $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
      var _a;
      inst._zod ?? (inst._zod = {});
      inst._zod.def = def;
      (_a = inst._zod).onattach ?? (_a.onattach = []);
    });
    numericOriginMap = {
      number: "number",
      bigint: "bigint",
      object: "date"
    };
    $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
      $ZodCheck.init(inst, def);
      const origin = numericOriginMap[typeof def.value];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
        if (def.value < curr) {
          if (def.inclusive)
            bag.maximum = def.value;
          else
            bag.exclusiveMaximum = def.value;
        }
      });
      inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
          return;
        }
        payload.issues.push({
          origin,
          code: "too_big",
          maximum: def.value,
          input: payload.value,
          inclusive: def.inclusive,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
      $ZodCheck.init(inst, def);
      const origin = numericOriginMap[typeof def.value];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
        if (def.value > curr) {
          if (def.inclusive)
            bag.minimum = def.value;
          else
            bag.exclusiveMinimum = def.value;
        }
      });
      inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
          return;
        }
        payload.issues.push({
          origin,
          code: "too_small",
          minimum: def.value,
          input: payload.value,
          inclusive: def.inclusive,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
      $ZodCheck.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        var _a;
        (_a = inst2._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
      });
      inst._zod.check = (payload) => {
        if (typeof payload.value !== typeof def.value)
          throw new Error("Cannot mix number and bigint in multiple_of check.");
        const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
        if (isMultiple)
          return;
        payload.issues.push({
          origin: typeof payload.value,
          code: "not_multiple_of",
          divisor: def.value,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
      $ZodCheck.init(inst, def);
      def.format = def.format || "float64";
      const isInt = def.format?.includes("int");
      const origin = isInt ? "int" : "number";
      const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
        if (isInt)
          bag.pattern = integer;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        if (isInt) {
          if (!Number.isInteger(input)) {
            payload.issues.push({
              expected: origin,
              format: def.format,
              code: "invalid_type",
              input,
              inst
            });
            return;
          }
          if (!Number.isSafeInteger(input)) {
            if (input > 0) {
              payload.issues.push({
                input,
                code: "too_big",
                maximum: Number.MAX_SAFE_INTEGER,
                note: "Integers must be within the safe integer range.",
                inst,
                origin,
                continue: !def.abort
              });
            } else {
              payload.issues.push({
                input,
                code: "too_small",
                minimum: Number.MIN_SAFE_INTEGER,
                note: "Integers must be within the safe integer range.",
                inst,
                origin,
                continue: !def.abort
              });
            }
            return;
          }
        }
        if (input < minimum) {
          payload.issues.push({
            origin: "number",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
        if (input > maximum) {
          payload.issues.push({
            origin: "number",
            input,
            code: "too_big",
            maximum,
            inst
          });
        }
      };
    });
    $ZodCheckBigIntFormat = /* @__PURE__ */ $constructor("$ZodCheckBigIntFormat", (inst, def) => {
      $ZodCheck.init(inst, def);
      const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        if (input < minimum) {
          payload.issues.push({
            origin: "bigint",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
          });
        }
        if (input > maximum) {
          payload.issues.push({
            origin: "bigint",
            input,
            code: "too_big",
            maximum,
            inst
          });
        }
      };
    });
    $ZodCheckMaxSize = /* @__PURE__ */ $constructor("$ZodCheckMaxSize", (inst, def) => {
      var _a;
      $ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
        if (def.maximum < curr)
          inst2._zod.bag.maximum = def.maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size <= def.maximum)
          return;
        payload.issues.push({
          origin: getSizableOrigin(input),
          code: "too_big",
          maximum: def.maximum,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMinSize = /* @__PURE__ */ $constructor("$ZodCheckMinSize", (inst, def) => {
      var _a;
      $ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
        if (def.minimum > curr)
          inst2._zod.bag.minimum = def.minimum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size >= def.minimum)
          return;
        payload.issues.push({
          origin: getSizableOrigin(input),
          code: "too_small",
          minimum: def.minimum,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckSizeEquals = /* @__PURE__ */ $constructor("$ZodCheckSizeEquals", (inst, def) => {
      var _a;
      $ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.size !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.minimum = def.size;
        bag.maximum = def.size;
        bag.size = def.size;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size === def.size)
          return;
        const tooBig = size > def.size;
        payload.issues.push({
          origin: getSizableOrigin(input),
          ...tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size },
          inclusive: true,
          exact: true,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
      var _a;
      $ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
        if (def.maximum < curr)
          inst2._zod.bag.maximum = def.maximum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length <= def.maximum)
          return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
          origin,
          code: "too_big",
          maximum: def.maximum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
      var _a;
      $ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
        if (def.minimum > curr)
          inst2._zod.bag.minimum = def.minimum;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length >= def.minimum)
          return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
          origin,
          code: "too_small",
          minimum: def.minimum,
          inclusive: true,
          input,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
      var _a;
      $ZodCheck.init(inst, def);
      (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      });
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.minimum = def.length;
        bag.maximum = def.length;
        bag.length = def.length;
      });
      inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length === def.length)
          return;
        const origin = getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
          origin,
          ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
          inclusive: true,
          exact: true,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
      var _a, _b;
      $ZodCheck.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = def.format;
        if (def.pattern) {
          bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
          bag.patterns.add(def.pattern);
        }
      });
      if (def.pattern)
        (_a = inst._zod).check ?? (_a.check = (payload) => {
          def.pattern.lastIndex = 0;
          if (def.pattern.test(payload.value))
            return;
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            ...def.pattern ? { pattern: def.pattern.toString() } : {},
            inst,
            continue: !def.abort
          });
        });
      else
        (_b = inst._zod).check ?? (_b.check = () => {
        });
    });
    $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
      $ZodCheckStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "regex",
          input: payload.value,
          pattern: def.pattern.toString(),
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
      def.pattern ?? (def.pattern = lowercase);
      $ZodCheckStringFormat.init(inst, def);
    });
    $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
      def.pattern ?? (def.pattern = uppercase);
      $ZodCheckStringFormat.init(inst, def);
    });
    $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
      $ZodCheck.init(inst, def);
      const escapedRegex = escapeRegex(def.includes);
      const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
      def.pattern = pattern;
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.includes(def.includes, def.position))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "includes",
          includes: def.includes,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
      $ZodCheck.init(inst, def);
      const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
      def.pattern ?? (def.pattern = pattern);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.startsWith(def.prefix))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "starts_with",
          prefix: def.prefix,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
      $ZodCheck.init(inst, def);
      const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
      def.pattern ?? (def.pattern = pattern);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
        bag.patterns.add(pattern);
      });
      inst._zod.check = (payload) => {
        if (payload.value.endsWith(def.suffix))
          return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: "ends_with",
          suffix: def.suffix,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCheckProperty = /* @__PURE__ */ $constructor("$ZodCheckProperty", (inst, def) => {
      $ZodCheck.init(inst, def);
      inst._zod.check = (payload) => {
        const result = def.schema._zod.run({
          value: payload.value[def.property],
          issues: []
        }, {});
        if (result instanceof Promise) {
          return result.then((result2) => handleCheckPropertyResult(result2, payload, def.property));
        }
        handleCheckPropertyResult(result, payload, def.property);
        return;
      };
    });
    $ZodCheckMimeType = /* @__PURE__ */ $constructor("$ZodCheckMimeType", (inst, def) => {
      $ZodCheck.init(inst, def);
      const mimeSet = new Set(def.mime);
      inst._zod.onattach.push((inst2) => {
        inst2._zod.bag.mime = def.mime;
      });
      inst._zod.check = (payload) => {
        if (mimeSet.has(payload.value.type))
          return;
        payload.issues.push({
          code: "invalid_value",
          values: def.mime,
          input: payload.value.type,
          inst
        });
      };
    });
    $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
      $ZodCheck.init(inst, def);
      inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
      };
    });
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/doc.js
var Doc;
var init_doc = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/doc.js"() {
    Doc = class {
      constructor(args = []) {
        this.content = [];
        this.indent = 0;
        if (this)
          this.args = args;
      }
      indented(fn) {
        this.indent += 1;
        fn(this);
        this.indent -= 1;
      }
      write(arg) {
        if (typeof arg === "function") {
          arg(this, { execution: "sync" });
          arg(this, { execution: "async" });
          return;
        }
        const content = arg;
        const lines = content.split("\n").filter((x) => x);
        const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
        const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
        for (const line of dedented) {
          this.content.push(line);
        }
      }
      compile() {
        const F = Function;
        const args = this?.args;
        const content = this?.content ?? [``];
        const lines = [...content.map((x) => `  ${x}`)];
        return new F(...args, lines.join("\n"));
      }
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/versions.js
var version;
var init_versions = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/versions.js"() {
    version = {
      major: 4,
      minor: 0,
      patch: 0
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/schemas.js
function isValidBase64(data) {
  if (data === "")
    return true;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base643 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base643.padEnd(Math.ceil(base643.length / 4) * 4, "=");
  return isValidBase64(padded);
}
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handleObjectResult(result, final, key) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(key, result.issues));
  }
  final.value[key] = result.value;
}
function handleOptionalObjectResult(result, final, key, input) {
  if (result.issues.length) {
    if (input[key] === void 0) {
      if (key in input) {
        final.value[key] = void 0;
      } else {
        final.value[key] = result.value;
      }
    } else {
      final.issues.push(...prefixIssues(key, result.issues));
    }
  } else if (result.value === void 0) {
    if (key in input)
      final.value[key] = void 0;
  } else {
    final.value[key] = result.value;
  }
}
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  if (left.issues.length) {
    result.issues.push(...left.issues);
  }
  if (right.issues.length) {
    result.issues.push(...right.issues);
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
  if (keyResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, keyResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_key",
        input,
        inst,
        issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  if (valueResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, valueResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_element",
        input,
        inst,
        key,
        issues: valueResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}
function handleSetResult(result, final) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
function handlePipeResult(left, def, ctx) {
  if (aborted(left)) {
    return left;
  }
  return def.out._zod.run({ value: left.value, issues: left.issues }, ctx);
}
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
var $ZodType, $ZodString, $ZodStringFormat, $ZodGUID, $ZodUUID, $ZodEmail, $ZodURL, $ZodEmoji, $ZodNanoID, $ZodCUID, $ZodCUID2, $ZodULID, $ZodXID, $ZodKSUID, $ZodISODateTime, $ZodISODate, $ZodISOTime, $ZodISODuration, $ZodIPv4, $ZodIPv6, $ZodCIDRv4, $ZodCIDRv6, $ZodBase64, $ZodBase64URL, $ZodE164, $ZodJWT, $ZodCustomStringFormat, $ZodNumber, $ZodNumberFormat, $ZodBoolean, $ZodBigInt, $ZodBigIntFormat, $ZodSymbol, $ZodUndefined, $ZodNull, $ZodAny, $ZodUnknown, $ZodNever, $ZodVoid, $ZodDate, $ZodArray, $ZodObject, $ZodUnion, $ZodDiscriminatedUnion, $ZodIntersection, $ZodTuple, $ZodRecord, $ZodMap, $ZodSet, $ZodEnum, $ZodLiteral, $ZodFile, $ZodTransform, $ZodOptional, $ZodNullable, $ZodDefault, $ZodPrefault, $ZodNonOptional, $ZodSuccess, $ZodCatch, $ZodNaN, $ZodPipe, $ZodReadonly, $ZodTemplateLiteral, $ZodPromise, $ZodLazy, $ZodCustom;
var init_schemas = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/schemas.js"() {
    init_checks();
    init_core();
    init_doc();
    init_parse();
    init_regexes();
    init_util();
    init_versions();
    init_util();
    $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
      var _a;
      inst ?? (inst = {});
      inst._zod.def = def;
      inst._zod.bag = inst._zod.bag || {};
      inst._zod.version = version;
      const checks = [...inst._zod.def.checks ?? []];
      if (inst._zod.traits.has("$ZodCheck")) {
        checks.unshift(inst);
      }
      for (const ch of checks) {
        for (const fn of ch._zod.onattach) {
          fn(inst);
        }
      }
      if (checks.length === 0) {
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(() => {
          inst._zod.run = inst._zod.parse;
        });
      } else {
        const runChecks = (payload, checks2, ctx) => {
          let isAborted = aborted(payload);
          let asyncResult;
          for (const ch of checks2) {
            if (ch._zod.def.when) {
              const shouldRun = ch._zod.def.when(payload);
              if (!shouldRun)
                continue;
            } else if (isAborted) {
              continue;
            }
            const currLen = payload.issues.length;
            const _ = ch._zod.check(payload);
            if (_ instanceof Promise && ctx?.async === false) {
              throw new $ZodAsyncError();
            }
            if (asyncResult || _ instanceof Promise) {
              asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                await _;
                const nextLen = payload.issues.length;
                if (nextLen === currLen)
                  return;
                if (!isAborted)
                  isAborted = aborted(payload, currLen);
              });
            } else {
              const nextLen = payload.issues.length;
              if (nextLen === currLen)
                continue;
              if (!isAborted)
                isAborted = aborted(payload, currLen);
            }
          }
          if (asyncResult) {
            return asyncResult.then(() => {
              return payload;
            });
          }
          return payload;
        };
        inst._zod.run = (payload, ctx) => {
          const result = inst._zod.parse(payload, ctx);
          if (result instanceof Promise) {
            if (ctx.async === false)
              throw new $ZodAsyncError();
            return result.then((result2) => runChecks(result2, checks, ctx));
          }
          return runChecks(result, checks, ctx);
        };
      }
      inst["~standard"] = {
        validate: (value) => {
          try {
            const r = safeParse(inst, value);
            return r.success ? { value: r.data } : { issues: r.error?.issues };
          } catch (_) {
            return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
          }
        },
        vendor: "zod",
        version: 1
      };
    });
    $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
      inst._zod.parse = (payload, _) => {
        if (def.coerce)
          try {
            payload.value = String(payload.value);
          } catch (_2) {
          }
        if (typeof payload.value === "string")
          return payload;
        payload.issues.push({
          expected: "string",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
      $ZodCheckStringFormat.init(inst, def);
      $ZodString.init(inst, def);
    });
    $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
      def.pattern ?? (def.pattern = guid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
      if (def.version) {
        const versionMap = {
          v1: 1,
          v2: 2,
          v3: 3,
          v4: 4,
          v5: 5,
          v6: 6,
          v7: 7,
          v8: 8
        };
        const v = versionMap[def.version];
        if (v === void 0)
          throw new Error(`Invalid UUID version: "${def.version}"`);
        def.pattern ?? (def.pattern = uuid(v));
      } else
        def.pattern ?? (def.pattern = uuid());
      $ZodStringFormat.init(inst, def);
    });
    $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
      def.pattern ?? (def.pattern = email);
      $ZodStringFormat.init(inst, def);
    });
    $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        try {
          const orig = payload.value;
          const url2 = new URL(orig);
          const href = url2.href;
          if (def.hostname) {
            def.hostname.lastIndex = 0;
            if (!def.hostname.test(url2.hostname)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: hostname.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
          }
          if (def.protocol) {
            def.protocol.lastIndex = 0;
            if (!def.protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid protocol",
                pattern: def.protocol.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
          }
          if (!orig.endsWith("/") && href.endsWith("/")) {
            payload.value = href.slice(0, -1);
          } else {
            payload.value = href;
          }
          return;
        } catch (_) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
      def.pattern ?? (def.pattern = emoji());
      $ZodStringFormat.init(inst, def);
    });
    $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
      def.pattern ?? (def.pattern = nanoid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
      def.pattern ?? (def.pattern = cuid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
      def.pattern ?? (def.pattern = cuid2);
      $ZodStringFormat.init(inst, def);
    });
    $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
      def.pattern ?? (def.pattern = ulid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
      def.pattern ?? (def.pattern = xid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
      def.pattern ?? (def.pattern = ksuid);
      $ZodStringFormat.init(inst, def);
    });
    $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
      def.pattern ?? (def.pattern = datetime(def));
      $ZodStringFormat.init(inst, def);
    });
    $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
      def.pattern ?? (def.pattern = date);
      $ZodStringFormat.init(inst, def);
    });
    $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
      def.pattern ?? (def.pattern = time(def));
      $ZodStringFormat.init(inst, def);
    });
    $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
      def.pattern ?? (def.pattern = duration);
      $ZodStringFormat.init(inst, def);
    });
    $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
      def.pattern ?? (def.pattern = ipv4);
      $ZodStringFormat.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = `ipv4`;
      });
    });
    $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
      def.pattern ?? (def.pattern = ipv6);
      $ZodStringFormat.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        const bag = inst2._zod.bag;
        bag.format = `ipv6`;
      });
      inst._zod.check = (payload) => {
        try {
          new URL(`http://[${payload.value}]`);
        } catch {
          payload.issues.push({
            code: "invalid_format",
            format: "ipv6",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
      def.pattern ?? (def.pattern = cidrv4);
      $ZodStringFormat.init(inst, def);
    });
    $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
      def.pattern ?? (def.pattern = cidrv6);
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        const [address, prefix] = payload.value.split("/");
        try {
          if (!prefix)
            throw new Error();
          const prefixNum = Number(prefix);
          if (`${prefixNum}` !== prefix)
            throw new Error();
          if (prefixNum < 0 || prefixNum > 128)
            throw new Error();
          new URL(`http://[${address}]`);
        } catch {
          payload.issues.push({
            code: "invalid_format",
            format: "cidrv6",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      };
    });
    $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
      def.pattern ?? (def.pattern = base64);
      $ZodStringFormat.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        inst2._zod.bag.contentEncoding = "base64";
      });
      inst._zod.check = (payload) => {
        if (isValidBase64(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "base64",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
      def.pattern ?? (def.pattern = base64url);
      $ZodStringFormat.init(inst, def);
      inst._zod.onattach.push((inst2) => {
        inst2._zod.bag.contentEncoding = "base64url";
      });
      inst._zod.check = (payload) => {
        if (isValidBase64URL(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "base64url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
      def.pattern ?? (def.pattern = e164);
      $ZodStringFormat.init(inst, def);
    });
    $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        if (isValidJWT(payload.value, def.alg))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: "jwt",
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodCustomStringFormat = /* @__PURE__ */ $constructor("$ZodCustomStringFormat", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      inst._zod.check = (payload) => {
        if (def.fn(payload.value))
          return;
        payload.issues.push({
          code: "invalid_format",
          format: def.format,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      };
    });
    $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = inst._zod.bag.pattern ?? number;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = Number(payload.value);
          } catch (_) {
          }
        const input = payload.value;
        if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
          return payload;
        }
        const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
        payload.issues.push({
          expected: "number",
          code: "invalid_type",
          input,
          inst,
          ...received ? { received } : {}
        });
        return payload;
      };
    });
    $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
      $ZodCheckNumberFormat.init(inst, def);
      $ZodNumber.init(inst, def);
    });
    $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = boolean;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = Boolean(payload.value);
          } catch (_) {
          }
        const input = payload.value;
        if (typeof input === "boolean")
          return payload;
        payload.issues.push({
          expected: "boolean",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = bigint;
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
          try {
            payload.value = BigInt(payload.value);
          } catch (_) {
          }
        if (typeof payload.value === "bigint")
          return payload;
        payload.issues.push({
          expected: "bigint",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    $ZodBigIntFormat = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
      $ZodCheckBigIntFormat.init(inst, def);
      $ZodBigInt.init(inst, def);
    });
    $ZodSymbol = /* @__PURE__ */ $constructor("$ZodSymbol", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "symbol")
          return payload;
        payload.issues.push({
          expected: "symbol",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = _undefined;
      inst._zod.values = /* @__PURE__ */ new Set([void 0]);
      inst._zod.optin = "optional";
      inst._zod.optout = "optional";
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
          return payload;
        payload.issues.push({
          expected: "undefined",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.pattern = _null;
      inst._zod.values = /* @__PURE__ */ new Set([null]);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input === null)
          return payload;
        payload.issues.push({
          expected: "null",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload) => payload;
    });
    $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload) => payload;
    });
    $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        payload.issues.push({
          expected: "never",
          code: "invalid_type",
          input: payload.value,
          inst
        });
        return payload;
      };
    });
    $ZodVoid = /* @__PURE__ */ $constructor("$ZodVoid", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
          return payload;
        payload.issues.push({
          expected: "void",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        if (def.coerce) {
          try {
            payload.value = new Date(payload.value);
          } catch (_err) {
          }
        }
        const input = payload.value;
        const isDate = input instanceof Date;
        const isValidDate = isDate && !Number.isNaN(input.getTime());
        if (isValidDate)
          return payload;
        payload.issues.push({
          expected: "date",
          code: "invalid_type",
          input,
          ...isDate ? { received: "Invalid Date" } : {},
          inst
        });
        return payload;
      };
    });
    $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
          payload.issues.push({
            expected: "array",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        payload.value = Array(input.length);
        const proms = [];
        for (let i = 0; i < input.length; i++) {
          const item = input[i];
          const result = def.element._zod.run({
            value: item,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
          } else {
            handleArrayResult(result, payload, i);
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => payload);
        }
        return payload;
      };
    });
    $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
      $ZodType.init(inst, def);
      const _normalized = cached(() => {
        const keys = Object.keys(def.shape);
        for (const k of keys) {
          if (!(def.shape[k] instanceof $ZodType)) {
            throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
          }
        }
        const okeys = optionalKeys(def.shape);
        return {
          shape: def.shape,
          keys,
          keySet: new Set(keys),
          numKeys: keys.length,
          optionalKeys: new Set(okeys)
        };
      });
      defineLazy(inst._zod, "propValues", () => {
        const shape = def.shape;
        const propValues = {};
        for (const key in shape) {
          const field = shape[key]._zod;
          if (field.values) {
            propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
            for (const v of field.values)
              propValues[key].add(v);
          }
        }
        return propValues;
      });
      const generateFastpass = (shape) => {
        const doc = new Doc(["shape", "payload", "ctx"]);
        const normalized = _normalized.value;
        const parseStr = (key) => {
          const k = esc(key);
          return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
        };
        doc.write(`const input = payload.value;`);
        const ids = /* @__PURE__ */ Object.create(null);
        let counter = 0;
        for (const key of normalized.keys) {
          ids[key] = `key_${counter++}`;
        }
        doc.write(`const newResult = {}`);
        for (const key of normalized.keys) {
          if (normalized.optionalKeys.has(key)) {
            const id = ids[key];
            doc.write(`const ${id} = ${parseStr(key)};`);
            const k = esc(key);
            doc.write(`
        if (${id}.issues.length) {
          if (input[${k}] === undefined) {
            if (${k} in input) {
              newResult[${k}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${id}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${k}, ...iss.path] : [${k}],
              }))
            );
          }
        } else if (${id}.value === undefined) {
          if (${k} in input) newResult[${k}] = undefined;
        } else {
          newResult[${k}] = ${id}.value;
        }
        `);
          } else {
            const id = ids[key];
            doc.write(`const ${id} = ${parseStr(key)};`);
            doc.write(`
          if (${id}.issues.length) payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${esc(key)}, ...iss.path] : [${esc(key)}]
          })));`);
            doc.write(`newResult[${esc(key)}] = ${id}.value`);
          }
        }
        doc.write(`payload.value = newResult;`);
        doc.write(`return payload;`);
        const fn = doc.compile();
        return (payload, ctx) => fn(shape, payload, ctx);
      };
      let fastpass;
      const isObject2 = isObject;
      const jit = !globalConfig.jitless;
      const allowsEval2 = allowsEval;
      const fastEnabled = jit && allowsEval2.value;
      const catchall2 = def.catchall;
      let value;
      inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject2(input)) {
          payload.issues.push({
            expected: "object",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        const proms = [];
        if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
          if (!fastpass)
            fastpass = generateFastpass(def.shape);
          payload = fastpass(payload, ctx);
        } else {
          payload.value = {};
          const shape = value.shape;
          for (const key of value.keys) {
            const el = shape[key];
            const r = el._zod.run({ value: input[key], issues: [] }, ctx);
            const isOptional = el._zod.optin === "optional" && el._zod.optout === "optional";
            if (r instanceof Promise) {
              proms.push(r.then((r2) => isOptional ? handleOptionalObjectResult(r2, payload, key, input) : handleObjectResult(r2, payload, key)));
            } else if (isOptional) {
              handleOptionalObjectResult(r, payload, key, input);
            } else {
              handleObjectResult(r, payload, key);
            }
          }
        }
        if (!catchall2) {
          return proms.length ? Promise.all(proms).then(() => payload) : payload;
        }
        const unrecognized = [];
        const keySet = value.keySet;
        const _catchall = catchall2._zod;
        const t = _catchall.def.type;
        for (const key of Object.keys(input)) {
          if (keySet.has(key))
            continue;
          if (t === "never") {
            unrecognized.push(key);
            continue;
          }
          const r = _catchall.run({ value: input[key], issues: [] }, ctx);
          if (r instanceof Promise) {
            proms.push(r.then((r2) => handleObjectResult(r2, payload, key)));
          } else {
            handleObjectResult(r, payload, key);
          }
        }
        if (unrecognized.length) {
          payload.issues.push({
            code: "unrecognized_keys",
            keys: unrecognized,
            input,
            inst
          });
        }
        if (!proms.length)
          return payload;
        return Promise.all(proms).then(() => {
          return payload;
        });
      };
    });
    $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
      defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
      defineLazy(inst._zod, "values", () => {
        if (def.options.every((o) => o._zod.values)) {
          return new Set(def.options.flatMap((option2) => Array.from(option2._zod.values)));
        }
        return void 0;
      });
      defineLazy(inst._zod, "pattern", () => {
        if (def.options.every((o) => o._zod.pattern)) {
          const patterns = def.options.map((o) => o._zod.pattern);
          return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
        }
        return void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        let async = false;
        const results = [];
        for (const option2 of def.options) {
          const result = option2._zod.run({
            value: payload.value,
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            results.push(result);
            async = true;
          } else {
            if (result.issues.length === 0)
              return result;
            results.push(result);
          }
        }
        if (!async)
          return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results2) => {
          return handleUnionResults(results2, payload, inst, ctx);
        });
      };
    });
    $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
      $ZodUnion.init(inst, def);
      const _super = inst._zod.parse;
      defineLazy(inst._zod, "propValues", () => {
        const propValues = {};
        for (const option2 of def.options) {
          const pv = option2._zod.propValues;
          if (!pv || Object.keys(pv).length === 0)
            throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option2)}"`);
          for (const [k, v] of Object.entries(pv)) {
            if (!propValues[k])
              propValues[k] = /* @__PURE__ */ new Set();
            for (const val of v) {
              propValues[k].add(val);
            }
          }
        }
        return propValues;
      });
      const disc = cached(() => {
        const opts = def.options;
        const map2 = /* @__PURE__ */ new Map();
        for (const o of opts) {
          const values = o._zod.propValues[def.discriminator];
          if (!values || values.size === 0)
            throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
          for (const v of values) {
            if (map2.has(v)) {
              throw new Error(`Duplicate discriminator value "${String(v)}"`);
            }
            map2.set(v, o);
          }
        }
        return map2;
      });
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!isObject(input)) {
          payload.issues.push({
            code: "invalid_type",
            expected: "object",
            input,
            inst
          });
          return payload;
        }
        const opt = disc.value.get(input?.[def.discriminator]);
        if (opt) {
          return opt._zod.run(payload, ctx);
        }
        if (def.unionFallback) {
          return _super(payload, ctx);
        }
        payload.issues.push({
          code: "invalid_union",
          errors: [],
          note: "No matching discriminator",
          input,
          path: [def.discriminator],
          inst
        });
        return payload;
      };
    });
    $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        const left = def.left._zod.run({ value: input, issues: [] }, ctx);
        const right = def.right._zod.run({ value: input, issues: [] }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) {
          return Promise.all([left, right]).then(([left2, right2]) => {
            return handleIntersectionResults(payload, left2, right2);
          });
        }
        return handleIntersectionResults(payload, left, right);
      };
    });
    $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
      $ZodType.init(inst, def);
      const items = def.items;
      const optStart = items.length - [...items].reverse().findIndex((item) => item._zod.optin !== "optional");
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
          payload.issues.push({
            input,
            inst,
            expected: "tuple",
            code: "invalid_type"
          });
          return payload;
        }
        payload.value = [];
        const proms = [];
        if (!def.rest) {
          const tooBig = input.length > items.length;
          const tooSmall = input.length < optStart - 1;
          if (tooBig || tooSmall) {
            payload.issues.push({
              input,
              inst,
              origin: "array",
              ...tooBig ? { code: "too_big", maximum: items.length } : { code: "too_small", minimum: items.length }
            });
            return payload;
          }
        }
        let i = -1;
        for (const item of items) {
          i++;
          if (i >= input.length) {
            if (i >= optStart)
              continue;
          }
          const result = item._zod.run({
            value: input[i],
            issues: []
          }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => handleTupleResult(result2, payload, i)));
          } else {
            handleTupleResult(result, payload, i);
          }
        }
        if (def.rest) {
          const rest = input.slice(items.length);
          for (const el of rest) {
            i++;
            const result = def.rest._zod.run({
              value: el,
              issues: []
            }, ctx);
            if (result instanceof Promise) {
              proms.push(result.then((result2) => handleTupleResult(result2, payload, i)));
            } else {
              handleTupleResult(result, payload, i);
            }
          }
        }
        if (proms.length)
          return Promise.all(proms).then(() => payload);
        return payload;
      };
    });
    $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!isPlainObject(input)) {
          payload.issues.push({
            expected: "record",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        const proms = [];
        if (def.keyType._zod.values) {
          const values = def.keyType._zod.values;
          payload.value = {};
          for (const key of values) {
            if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
              const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
              if (result instanceof Promise) {
                proms.push(result.then((result2) => {
                  if (result2.issues.length) {
                    payload.issues.push(...prefixIssues(key, result2.issues));
                  }
                  payload.value[key] = result2.value;
                }));
              } else {
                if (result.issues.length) {
                  payload.issues.push(...prefixIssues(key, result.issues));
                }
                payload.value[key] = result.value;
              }
            }
          }
          let unrecognized;
          for (const key in input) {
            if (!values.has(key)) {
              unrecognized = unrecognized ?? [];
              unrecognized.push(key);
            }
          }
          if (unrecognized && unrecognized.length > 0) {
            payload.issues.push({
              code: "unrecognized_keys",
              input,
              inst,
              keys: unrecognized
            });
          }
        } else {
          payload.value = {};
          for (const key of Reflect.ownKeys(input)) {
            if (key === "__proto__")
              continue;
            const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
            if (keyResult instanceof Promise) {
              throw new Error("Async schemas not supported in object keys currently");
            }
            if (keyResult.issues.length) {
              payload.issues.push({
                origin: "record",
                code: "invalid_key",
                issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
                input: key,
                path: [key],
                inst
              });
              payload.value[keyResult.value] = keyResult.value;
              continue;
            }
            const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
            if (result instanceof Promise) {
              proms.push(result.then((result2) => {
                if (result2.issues.length) {
                  payload.issues.push(...prefixIssues(key, result2.issues));
                }
                payload.value[keyResult.value] = result2.value;
              }));
            } else {
              if (result.issues.length) {
                payload.issues.push(...prefixIssues(key, result.issues));
              }
              payload.value[keyResult.value] = result.value;
            }
          }
        }
        if (proms.length) {
          return Promise.all(proms).then(() => payload);
        }
        return payload;
      };
    });
    $ZodMap = /* @__PURE__ */ $constructor("$ZodMap", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Map)) {
          payload.issues.push({
            expected: "map",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        }
        const proms = [];
        payload.value = /* @__PURE__ */ new Map();
        for (const [key, value] of input) {
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          const valueResult = def.valueType._zod.run({ value, issues: [] }, ctx);
          if (keyResult instanceof Promise || valueResult instanceof Promise) {
            proms.push(Promise.all([keyResult, valueResult]).then(([keyResult2, valueResult2]) => {
              handleMapResult(keyResult2, valueResult2, payload, key, input, inst, ctx);
            }));
          } else {
            handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
          }
        }
        if (proms.length)
          return Promise.all(proms).then(() => payload);
        return payload;
      };
    });
    $ZodSet = /* @__PURE__ */ $constructor("$ZodSet", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Set)) {
          payload.issues.push({
            input,
            inst,
            expected: "set",
            code: "invalid_type"
          });
          return payload;
        }
        const proms = [];
        payload.value = /* @__PURE__ */ new Set();
        for (const item of input) {
          const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => handleSetResult(result2, payload)));
          } else
            handleSetResult(result, payload);
        }
        if (proms.length)
          return Promise.all(proms).then(() => payload);
        return payload;
      };
    });
    $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
      $ZodType.init(inst, def);
      const values = getEnumValues(def.entries);
      inst._zod.values = new Set(values);
      inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (inst._zod.values.has(input)) {
          return payload;
        }
        payload.issues.push({
          code: "invalid_value",
          values,
          input,
          inst
        });
        return payload;
      };
    });
    $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.values = new Set(def.values);
      inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? o.toString() : String(o)).join("|")})$`);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (inst._zod.values.has(input)) {
          return payload;
        }
        payload.issues.push({
          code: "invalid_value",
          values: def.values,
          input,
          inst
        });
        return payload;
      };
    });
    $ZodFile = /* @__PURE__ */ $constructor("$ZodFile", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input instanceof File)
          return payload;
        payload.issues.push({
          expected: "file",
          code: "invalid_type",
          input,
          inst
        });
        return payload;
      };
    });
    $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        const _out = def.transform(payload.value, payload);
        if (_ctx.async) {
          const output = _out instanceof Promise ? _out : Promise.resolve(_out);
          return output.then((output2) => {
            payload.value = output2;
            return payload;
          });
        }
        if (_out instanceof Promise) {
          throw new $ZodAsyncError();
        }
        payload.value = _out;
        return payload;
      };
    });
    $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      inst._zod.optout = "optional";
      defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
      });
      defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        if (def.innerType._zod.optin === "optional") {
          return def.innerType._zod.run(payload, ctx);
        }
        if (payload.value === void 0) {
          return payload;
        }
        return def.innerType._zod.run(payload, ctx);
      };
    });
    $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
      defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
      defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
      });
      defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        if (payload.value === null)
          return payload;
        return def.innerType._zod.run(payload, ctx);
      };
    });
    $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (payload.value === void 0) {
          payload.value = def.defaultValue;
          return payload;
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => handleDefaultResult(result2, def));
        }
        return handleDefaultResult(result, def);
      };
    });
    $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        if (payload.value === void 0) {
          payload.value = def.defaultValue;
        }
        return def.innerType._zod.run(payload, ctx);
      };
    });
    $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "values", () => {
        const v = def.innerType._zod.values;
        return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
      });
      inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => handleNonOptionalResult(result2, inst));
        }
        return handleNonOptionalResult(result, inst);
      };
    });
    $ZodSuccess = /* @__PURE__ */ $constructor("$ZodSuccess", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => {
            payload.value = result2.issues.length === 0;
            return payload;
          });
        }
        payload.value = result.issues.length === 0;
        return payload;
      };
    });
    $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.optin = "optional";
      defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then((result2) => {
            payload.value = result2.value;
            if (result2.issues.length) {
              payload.value = def.catchValue({
                ...payload,
                error: {
                  issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
                },
                input: payload.value
              });
              payload.issues = [];
            }
            return payload;
          });
        }
        payload.value = result.value;
        if (result.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
        }
        return payload;
      };
    });
    $ZodNaN = /* @__PURE__ */ $constructor("$ZodNaN", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
          payload.issues.push({
            input: payload.value,
            inst,
            expected: "nan",
            code: "invalid_type"
          });
          return payload;
        }
        return payload;
      };
    });
    $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "values", () => def.in._zod.values);
      defineLazy(inst._zod, "optin", () => def.in._zod.optin);
      defineLazy(inst._zod, "optout", () => def.out._zod.optout);
      inst._zod.parse = (payload, ctx) => {
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) {
          return left.then((left2) => handlePipeResult(left2, def, ctx));
        }
        return handlePipeResult(left, def, ctx);
      };
    });
    $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
      defineLazy(inst._zod, "values", () => def.innerType._zod.values);
      defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
      defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
      inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
          return result.then(handleReadonlyResult);
        }
        return handleReadonlyResult(result);
      };
    });
    $ZodTemplateLiteral = /* @__PURE__ */ $constructor("$ZodTemplateLiteral", (inst, def) => {
      $ZodType.init(inst, def);
      const regexParts = [];
      for (const part of def.parts) {
        if (part instanceof $ZodType) {
          if (!part._zod.pattern) {
            throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
          }
          const source = part._zod.pattern instanceof RegExp ? part._zod.pattern.source : part._zod.pattern;
          if (!source)
            throw new Error(`Invalid template literal part: ${part._zod.traits}`);
          const start = source.startsWith("^") ? 1 : 0;
          const end = source.endsWith("$") ? source.length - 1 : source.length;
          regexParts.push(source.slice(start, end));
        } else if (part === null || primitiveTypes.has(typeof part)) {
          regexParts.push(escapeRegex(`${part}`));
        } else {
          throw new Error(`Invalid template literal part: ${part}`);
        }
      }
      inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
      inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "string") {
          payload.issues.push({
            input: payload.value,
            inst,
            expected: "template_literal",
            code: "invalid_type"
          });
          return payload;
        }
        inst._zod.pattern.lastIndex = 0;
        if (!inst._zod.pattern.test(payload.value)) {
          payload.issues.push({
            input: payload.value,
            inst,
            code: "invalid_format",
            format: "template_literal",
            pattern: inst._zod.pattern.source
          });
          return payload;
        }
        return payload;
      };
    });
    $ZodPromise = /* @__PURE__ */ $constructor("$ZodPromise", (inst, def) => {
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, ctx) => {
        return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
      };
    });
    $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
      $ZodType.init(inst, def);
      defineLazy(inst._zod, "innerType", () => def.getter());
      defineLazy(inst._zod, "pattern", () => inst._zod.innerType._zod.pattern);
      defineLazy(inst._zod, "propValues", () => inst._zod.innerType._zod.propValues);
      defineLazy(inst._zod, "optin", () => inst._zod.innerType._zod.optin);
      defineLazy(inst._zod, "optout", () => inst._zod.innerType._zod.optout);
      inst._zod.parse = (payload, ctx) => {
        const inner = inst._zod.innerType;
        return inner._zod.run(payload, ctx);
      };
    });
    $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
      $ZodCheck.init(inst, def);
      $ZodType.init(inst, def);
      inst._zod.parse = (payload, _) => {
        return payload;
      };
      inst._zod.check = (payload) => {
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) {
          return r.then((r2) => handleRefineResult(r2, payload, input, inst));
        }
        handleRefineResult(r, payload, input, inst);
        return;
      };
    });
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ar.js
function ar_default() {
  return {
    localeError: error()
  };
}
var error;
var init_ar = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ar.js"() {
    init_util();
    error = () => {
      const Sizable = {
        string: { unit: "\u062D\u0631\u0641", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
        file: { unit: "\u0628\u0627\u064A\u062A", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
        array: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
        set: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0645\u062F\u062E\u0644",
        email: "\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
        url: "\u0631\u0627\u0628\u0637",
        emoji: "\u0625\u064A\u0645\u0648\u062C\u064A",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        date: "\u062A\u0627\u0631\u064A\u062E \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        time: "\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        duration: "\u0645\u062F\u0629 \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
        ipv4: "\u0639\u0646\u0648\u0627\u0646 IPv4",
        ipv6: "\u0639\u0646\u0648\u0627\u0646 IPv6",
        cidrv4: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv4",
        cidrv6: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv6",
        base64: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64-encoded",
        base64url: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64url-encoded",
        json_string: "\u0646\u064E\u0635 \u0639\u0644\u0649 \u0647\u064A\u0626\u0629 JSON",
        e164: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0628\u0645\u0639\u064A\u0627\u0631 E.164",
        jwt: "JWT",
        template_literal: "\u0645\u062F\u062E\u0644"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${issue2.expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${stringifyPrimitive(issue2.values[0])}`;
            return `\u0627\u062E\u062A\u064A\u0627\u0631 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062A\u0648\u0642\u0639 \u0627\u0646\u062A\u0642\u0627\u0621 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A: ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return ` \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"}`;
            return `\u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 "${issue2.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0646\u062A\u0647\u064A \u0628\u0640 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0636\u0645\u0651\u064E\u0646 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0646\u0645\u0637 ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644`;
          }
          case "not_multiple_of":
            return `\u0631\u0642\u0645 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0646 \u0645\u0636\u0627\u0639\u0641\u0627\u062A ${issue2.divisor}`;
          case "unrecognized_keys":
            return `\u0645\u0639\u0631\u0641${issue2.keys.length > 1 ? "\u0627\u062A" : ""} \u063A\u0631\u064A\u0628${issue2.keys.length > 1 ? "\u0629" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
          case "invalid_key":
            return `\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
          case "invalid_union":
            return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
          case "invalid_element":
            return `\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
          default:
            return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/az.js
function az_default() {
  return {
    localeError: error2()
  };
}
var error2;
var init_az = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/az.js"() {
    init_util();
    error2 = () => {
      const Sizable = {
        string: { unit: "simvol", verb: "olmal\u0131d\u0131r" },
        file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
        array: { unit: "element", verb: "olmal\u0131d\u0131r" },
        set: { unit: "element", verb: "olmal\u0131d\u0131r" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        jwt: "JWT",
        template_literal: "input"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${issue2.expected}, daxil olan ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${stringifyPrimitive(issue2.values[0])}`;
            return `Yanl\u0131\u015F se\xE7im: a\u015Fa\u011F\u0131dak\u0131lardan biri olmal\u0131d\u0131r: ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
            return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Yanl\u0131\u015F m\u0259tn: "${_issue.prefix}" il\u0259 ba\u015Flamal\u0131d\u0131r`;
            if (_issue.format === "ends_with")
              return `Yanl\u0131\u015F m\u0259tn: "${_issue.suffix}" il\u0259 bitm\u0259lidir`;
            if (_issue.format === "includes")
              return `Yanl\u0131\u015F m\u0259tn: "${_issue.includes}" daxil olmal\u0131d\u0131r`;
            if (_issue.format === "regex")
              return `Yanl\u0131\u015F m\u0259tn: ${_issue.pattern} \u015Fablonuna uy\u011Fun olmal\u0131d\u0131r`;
            return `Yanl\u0131\u015F ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Yanl\u0131\u015F \u0259d\u0259d: ${issue2.divisor} il\u0259 b\xF6l\xFCn\u0259 bil\u0259n olmal\u0131d\u0131r`;
          case "unrecognized_keys":
            return `Tan\u0131nmayan a\xE7ar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F a\xE7ar`;
          case "invalid_union":
            return "Yanl\u0131\u015F d\u0259y\u0259r";
          case "invalid_element":
            return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F d\u0259y\u0259r`;
          default:
            return `Yanl\u0131\u015F d\u0259y\u0259r`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/be.js
function getBelarusianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
function be_default() {
  return {
    localeError: error3()
  };
}
var error3;
var init_be = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/be.js"() {
    init_util();
    error3 = () => {
      const Sizable = {
        string: {
          unit: {
            one: "\u0441\u0456\u043C\u0432\u0430\u043B",
            few: "\u0441\u0456\u043C\u0432\u0430\u043B\u044B",
            many: "\u0441\u0456\u043C\u0432\u0430\u043B\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        },
        array: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        },
        set: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        },
        file: {
          unit: {
            one: "\u0431\u0430\u0439\u0442",
            few: "\u0431\u0430\u0439\u0442\u044B",
            many: "\u0431\u0430\u0439\u0442\u0430\u045E"
          },
          verb: "\u043C\u0435\u0446\u044C"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u043B\u0456\u043A";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u043C\u0430\u0441\u0456\u045E";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0443\u0432\u043E\u0434",
        email: "email \u0430\u0434\u0440\u0430\u0441",
        url: "URL",
        emoji: "\u044D\u043C\u043E\u0434\u0437\u0456",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0434\u0430\u0442\u0430 \u0456 \u0447\u0430\u0441",
        date: "ISO \u0434\u0430\u0442\u0430",
        time: "ISO \u0447\u0430\u0441",
        duration: "ISO \u043F\u0440\u0430\u0446\u044F\u0433\u043B\u0430\u0441\u0446\u044C",
        ipv4: "IPv4 \u0430\u0434\u0440\u0430\u0441",
        ipv6: "IPv6 \u0430\u0434\u0440\u0430\u0441",
        cidrv4: "IPv4 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
        cidrv6: "IPv6 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
        base64: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64",
        base64url: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64url",
        json_string: "JSON \u0440\u0430\u0434\u043E\u043A",
        e164: "\u043D\u0443\u043C\u0430\u0440 E.164",
        jwt: "JWT",
        template_literal: "\u0443\u0432\u043E\u0434"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F ${issue2.expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0432\u0430\u0440\u044B\u044F\u043D\u0442: \u0447\u0430\u043A\u0430\u045E\u0441\u044F \u0430\u0434\u0437\u0456\u043D \u0437 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const maxValue = Number(issue2.maximum);
              const unit = getBelarusianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.maximum.toString()} ${unit}`;
            }
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const minValue = Number(issue2.minimum);
              const unit = getBelarusianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.minimum.toString()} ${unit}`;
            }
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u043F\u0430\u0447\u044B\u043D\u0430\u0446\u0446\u0430 \u0437 "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u0430\u043A\u0430\u043D\u0447\u0432\u0430\u0446\u0446\u0430 \u043D\u0430 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u043C\u044F\u0448\u0447\u0430\u0446\u044C "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0430\u0434\u043F\u0430\u0432\u044F\u0434\u0430\u0446\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043B\u0456\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0431\u044B\u0446\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
          case "unrecognized_keys":
            return `\u041D\u0435\u0440\u0430\u0441\u043F\u0430\u0437\u043D\u0430\u043D\u044B ${issue2.keys.length > 1 ? "\u043A\u043B\u044E\u0447\u044B" : "\u043A\u043B\u044E\u0447"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
          case "invalid_union":
            return "\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434";
          case "invalid_element":
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u0430\u0435 \u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435 \u045E ${issue2.origin}`;
          default:
            return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ca.js
function ca_default() {
  return {
    localeError: error4()
  };
}
var error4;
var init_ca = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ca.js"() {
    init_util();
    error4 = () => {
      const Sizable = {
        string: { unit: "car\xE0cters", verb: "contenir" },
        file: { unit: "bytes", verb: "contenir" },
        array: { unit: "elements", verb: "contenir" },
        set: { unit: "elements", verb: "contenir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "entrada",
        email: "adre\xE7a electr\xF2nica",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data i hora ISO",
        date: "data ISO",
        time: "hora ISO",
        duration: "durada ISO",
        ipv4: "adre\xE7a IPv4",
        ipv6: "adre\xE7a IPv6",
        cidrv4: "rang IPv4",
        cidrv6: "rang IPv6",
        base64: "cadena codificada en base64",
        base64url: "cadena codificada en base64url",
        json_string: "cadena JSON",
        e164: "n\xFAmero E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Tipus inv\xE0lid: s'esperava ${issue2.expected}, s'ha rebut ${parsedType4(issue2.input)}`;
          // return `Tipus invàlid: s'esperava ${issue.expected}, s'ha rebut ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Valor inv\xE0lid: s'esperava ${stringifyPrimitive(issue2.values[0])}`;
            return `Opci\xF3 inv\xE0lida: s'esperava una de ${joinValues(issue2.values, " o ")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "com a m\xE0xim" : "menys de";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} contingu\xE9s ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
            return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} fos ${adj} ${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? "com a m\xEDnim" : "m\xE9s de";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Massa petit: s'esperava que ${issue2.origin} contingu\xE9s ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Massa petit: s'esperava que ${issue2.origin} fos ${adj} ${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `Format inv\xE0lid: ha de comen\xE7ar amb "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Format inv\xE0lid: ha d'acabar amb "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Format inv\xE0lid: ha d'incloure "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Format inv\xE0lid: ha de coincidir amb el patr\xF3 ${_issue.pattern}`;
            return `Format inv\xE0lid per a ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `N\xFAmero inv\xE0lid: ha de ser m\xFAltiple de ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Clau${issue2.keys.length > 1 ? "s" : ""} no reconeguda${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Clau inv\xE0lida a ${issue2.origin}`;
          case "invalid_union":
            return "Entrada inv\xE0lida";
          // Could also be "Tipus d'unió invàlid" but "Entrada invàlida" is more general
          case "invalid_element":
            return `Element inv\xE0lid a ${issue2.origin}`;
          default:
            return `Entrada inv\xE0lida`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/cs.js
function cs_default() {
  return {
    localeError: error5()
  };
}
var error5;
var init_cs = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/cs.js"() {
    init_util();
    error5 = () => {
      const Sizable = {
        string: { unit: "znak\u016F", verb: "m\xEDt" },
        file: { unit: "bajt\u016F", verb: "m\xEDt" },
        array: { unit: "prvk\u016F", verb: "m\xEDt" },
        set: { unit: "prvk\u016F", verb: "m\xEDt" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u010D\xEDslo";
          }
          case "string": {
            return "\u0159et\u011Bzec";
          }
          case "boolean": {
            return "boolean";
          }
          case "bigint": {
            return "bigint";
          }
          case "function": {
            return "funkce";
          }
          case "symbol": {
            return "symbol";
          }
          case "undefined": {
            return "undefined";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "pole";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "regul\xE1rn\xED v\xFDraz",
        email: "e-mailov\xE1 adresa",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "datum a \u010Das ve form\xE1tu ISO",
        date: "datum ve form\xE1tu ISO",
        time: "\u010Das ve form\xE1tu ISO",
        duration: "doba trv\xE1n\xED ISO",
        ipv4: "IPv4 adresa",
        ipv6: "IPv6 adresa",
        cidrv4: "rozsah IPv4",
        cidrv6: "rozsah IPv6",
        base64: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64",
        base64url: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64url",
        json_string: "\u0159et\u011Bzec ve form\xE1tu JSON",
        e164: "\u010D\xEDslo E.164",
        jwt: "JWT",
        template_literal: "vstup"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${issue2.expected}, obdr\u017Eeno ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${stringifyPrimitive(issue2.values[0])}`;
            return `Neplatn\xE1 mo\u017Enost: o\u010Dek\xE1v\xE1na jedna z hodnot ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
            }
            return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
            }
            return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED za\u010D\xEDnat na "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED kon\u010Dit na "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED obsahovat "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Neplatn\xFD \u0159et\u011Bzec: mus\xED odpov\xEDdat vzoru ${_issue.pattern}`;
            return `Neplatn\xFD form\xE1t ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Neplatn\xE9 \u010D\xEDslo: mus\xED b\xFDt n\xE1sobkem ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Nezn\xE1m\xE9 kl\xED\u010De: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Neplatn\xFD kl\xED\u010D v ${issue2.origin}`;
          case "invalid_union":
            return "Neplatn\xFD vstup";
          case "invalid_element":
            return `Neplatn\xE1 hodnota v ${issue2.origin}`;
          default:
            return `Neplatn\xFD vstup`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/de.js
function de_default() {
  return {
    localeError: error6()
  };
}
var error6;
var init_de = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/de.js"() {
    init_util();
    error6 = () => {
      const Sizable = {
        string: { unit: "Zeichen", verb: "zu haben" },
        file: { unit: "Bytes", verb: "zu haben" },
        array: { unit: "Elemente", verb: "zu haben" },
        set: { unit: "Elemente", verb: "zu haben" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "Zahl";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "Array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "Eingabe",
        email: "E-Mail-Adresse",
        url: "URL",
        emoji: "Emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-Datum und -Uhrzeit",
        date: "ISO-Datum",
        time: "ISO-Uhrzeit",
        duration: "ISO-Dauer",
        ipv4: "IPv4-Adresse",
        ipv6: "IPv6-Adresse",
        cidrv4: "IPv4-Bereich",
        cidrv6: "IPv6-Bereich",
        base64: "Base64-codierter String",
        base64url: "Base64-URL-codierter String",
        json_string: "JSON-String",
        e164: "E.164-Nummer",
        jwt: "JWT",
        template_literal: "Eingabe"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Ung\xFCltige Eingabe: erwartet ${issue2.expected}, erhalten ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Ung\xFCltige Eingabe: erwartet ${stringifyPrimitive(issue2.values[0])}`;
            return `Ung\xFCltige Option: erwartet eine von ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "Elemente"} hat`;
            return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ist`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} hat`;
            }
            return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ist`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Ung\xFCltiger String: muss mit "${_issue.prefix}" beginnen`;
            if (_issue.format === "ends_with")
              return `Ung\xFCltiger String: muss mit "${_issue.suffix}" enden`;
            if (_issue.format === "includes")
              return `Ung\xFCltiger String: muss "${_issue.includes}" enthalten`;
            if (_issue.format === "regex")
              return `Ung\xFCltiger String: muss dem Muster ${_issue.pattern} entsprechen`;
            return `Ung\xFCltig: ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Ung\xFCltige Zahl: muss ein Vielfaches von ${issue2.divisor} sein`;
          case "unrecognized_keys":
            return `${issue2.keys.length > 1 ? "Unbekannte Schl\xFCssel" : "Unbekannter Schl\xFCssel"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Ung\xFCltiger Schl\xFCssel in ${issue2.origin}`;
          case "invalid_union":
            return "Ung\xFCltige Eingabe";
          case "invalid_element":
            return `Ung\xFCltiger Wert in ${issue2.origin}`;
          default:
            return `Ung\xFCltige Eingabe`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/en.js
function en_default() {
  return {
    localeError: error7()
  };
}
var parsedType, error7;
var init_en = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/en.js"() {
    init_util();
    parsedType = (data) => {
      const t = typeof data;
      switch (t) {
        case "number": {
          return Number.isNaN(data) ? "NaN" : "number";
        }
        case "object": {
          if (Array.isArray(data)) {
            return "array";
          }
          if (data === null) {
            return "null";
          }
          if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
            return data.constructor.name;
          }
        }
      }
      return t;
    };
    error7 = () => {
      const Sizable = {
        string: { unit: "characters", verb: "to have" },
        file: { unit: "bytes", verb: "to have" },
        array: { unit: "items", verb: "to have" },
        set: { unit: "items", verb: "to have" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const Nouns = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        jwt: "JWT",
        template_literal: "input"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Invalid input: expected ${issue2.expected}, received ${parsedType(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
            return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
            return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `Invalid string: must start with "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Invalid string: must end with "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Invalid string: must include "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Invalid string: must match pattern ${_issue.pattern}`;
            return `Invalid ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Invalid number: must be a multiple of ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Invalid key in ${issue2.origin}`;
          case "invalid_union":
            return "Invalid input";
          case "invalid_element":
            return `Invalid value in ${issue2.origin}`;
          default:
            return `Invalid input`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/eo.js
function eo_default() {
  return {
    localeError: error8()
  };
}
var parsedType2, error8;
var init_eo = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/eo.js"() {
    init_util();
    parsedType2 = (data) => {
      const t = typeof data;
      switch (t) {
        case "number": {
          return Number.isNaN(data) ? "NaN" : "nombro";
        }
        case "object": {
          if (Array.isArray(data)) {
            return "tabelo";
          }
          if (data === null) {
            return "senvalora";
          }
          if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
            return data.constructor.name;
          }
        }
      }
      return t;
    };
    error8 = () => {
      const Sizable = {
        string: { unit: "karaktrojn", verb: "havi" },
        file: { unit: "bajtojn", verb: "havi" },
        array: { unit: "elementojn", verb: "havi" },
        set: { unit: "elementojn", verb: "havi" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const Nouns = {
        regex: "enigo",
        email: "retadreso",
        url: "URL",
        emoji: "emo\u011Dio",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-datotempo",
        date: "ISO-dato",
        time: "ISO-tempo",
        duration: "ISO-da\u016Dro",
        ipv4: "IPv4-adreso",
        ipv6: "IPv6-adreso",
        cidrv4: "IPv4-rango",
        cidrv6: "IPv6-rango",
        base64: "64-ume kodita karaktraro",
        base64url: "URL-64-ume kodita karaktraro",
        json_string: "JSON-karaktraro",
        e164: "E.164-nombro",
        jwt: "JWT",
        template_literal: "enigo"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Nevalida enigo: atendi\u011Dis ${issue2.expected}, ricevi\u011Dis ${parsedType2(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Nevalida enigo: atendi\u011Dis ${stringifyPrimitive(issue2.values[0])}`;
            return `Nevalida opcio: atendi\u011Dis unu el ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementojn"}`;
            return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} havu ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} estu ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Nevalida karaktraro: devas komenci\u011Di per "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Nevalida karaktraro: devas fini\u011Di per "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Nevalida karaktraro: devas inkluzivi "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Nevalida karaktraro: devas kongrui kun la modelo ${_issue.pattern}`;
            return `Nevalida ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Nevalida nombro: devas esti oblo de ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Nekonata${issue2.keys.length > 1 ? "j" : ""} \u015Dlosilo${issue2.keys.length > 1 ? "j" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Nevalida \u015Dlosilo en ${issue2.origin}`;
          case "invalid_union":
            return "Nevalida enigo";
          case "invalid_element":
            return `Nevalida valoro en ${issue2.origin}`;
          default:
            return `Nevalida enigo`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/es.js
function es_default() {
  return {
    localeError: error9()
  };
}
var error9;
var init_es = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/es.js"() {
    init_util();
    error9 = () => {
      const Sizable = {
        string: { unit: "caracteres", verb: "tener" },
        file: { unit: "bytes", verb: "tener" },
        array: { unit: "elementos", verb: "tener" },
        set: { unit: "elementos", verb: "tener" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "n\xFAmero";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "arreglo";
            }
            if (data === null) {
              return "nulo";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "entrada",
        email: "direcci\xF3n de correo electr\xF3nico",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "fecha y hora ISO",
        date: "fecha ISO",
        time: "hora ISO",
        duration: "duraci\xF3n ISO",
        ipv4: "direcci\xF3n IPv4",
        ipv6: "direcci\xF3n IPv6",
        cidrv4: "rango IPv4",
        cidrv6: "rango IPv6",
        base64: "cadena codificada en base64",
        base64url: "URL codificada en base64",
        json_string: "cadena JSON",
        e164: "n\xFAmero E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Entrada inv\xE1lida: se esperaba ${issue2.expected}, recibido ${parsedType4(issue2.input)}`;
          // return `Entrada inválida: se esperaba ${issue.expected}, recibido ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Entrada inv\xE1lida: se esperaba ${stringifyPrimitive(issue2.values[0])}`;
            return `Opci\xF3n inv\xE1lida: se esperaba una de ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Demasiado grande: se esperaba que ${issue2.origin ?? "valor"} tuviera ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
            return `Demasiado grande: se esperaba que ${issue2.origin ?? "valor"} fuera ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Demasiado peque\xF1o: se esperaba que ${issue2.origin} tuviera ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Demasiado peque\xF1o: se esperaba que ${issue2.origin} fuera ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Cadena inv\xE1lida: debe comenzar con "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Cadena inv\xE1lida: debe terminar en "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Cadena inv\xE1lida: debe incluir "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Cadena inv\xE1lida: debe coincidir con el patr\xF3n ${_issue.pattern}`;
            return `Inv\xE1lido ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `N\xFAmero inv\xE1lido: debe ser m\xFAltiplo de ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Llave${issue2.keys.length > 1 ? "s" : ""} desconocida${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Llave inv\xE1lida en ${issue2.origin}`;
          case "invalid_union":
            return "Entrada inv\xE1lida";
          case "invalid_element":
            return `Valor inv\xE1lido en ${issue2.origin}`;
          default:
            return `Entrada inv\xE1lida`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/fa.js
function fa_default() {
  return {
    localeError: error10()
  };
}
var error10;
var init_fa = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/fa.js"() {
    init_util();
    error10 = () => {
      const Sizable = {
        string: { unit: "\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
        file: { unit: "\u0628\u0627\u06CC\u062A", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
        array: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
        set: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u0639\u062F\u062F";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u0622\u0631\u0627\u06CC\u0647";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0648\u0631\u0648\u062F\u06CC",
        email: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644",
        url: "URL",
        emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u062A\u0627\u0631\u06CC\u062E \u0648 \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
        date: "\u062A\u0627\u0631\u06CC\u062E \u0627\u06CC\u0632\u0648",
        time: "\u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
        duration: "\u0645\u062F\u062A \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
        ipv4: "IPv4 \u0622\u062F\u0631\u0633",
        ipv6: "IPv6 \u0622\u062F\u0631\u0633",
        cidrv4: "IPv4 \u062F\u0627\u0645\u0646\u0647",
        cidrv6: "IPv6 \u062F\u0627\u0645\u0646\u0647",
        base64: "base64-encoded \u0631\u0634\u062A\u0647",
        base64url: "base64url-encoded \u0631\u0634\u062A\u0647",
        json_string: "JSON \u0631\u0634\u062A\u0647",
        e164: "E.164 \u0639\u062F\u062F",
        jwt: "JWT",
        template_literal: "\u0648\u0631\u0648\u062F\u06CC"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${issue2.expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${parsedType4(issue2.input)} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
          case "invalid_value":
            if (issue2.values.length === 1) {
              return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${stringifyPrimitive(issue2.values[0])} \u0645\u06CC\u200C\u0628\u0648\u062F`;
            }
            return `\u06AF\u0632\u06CC\u0646\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A \u06CC\u06A9\u06CC \u0627\u0632 ${joinValues(issue2.values, "|")} \u0645\u06CC\u200C\u0628\u0648\u062F`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"} \u0628\u0627\u0634\u062F`;
            }
            return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0628\u0627\u0634\u062F`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0628\u0627\u0634\u062F`;
            }
            return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0628\u0627\u0634\u062F`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.prefix}" \u0634\u0631\u0648\u0639 \u0634\u0648\u062F`;
            }
            if (_issue.format === "ends_with") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.suffix}" \u062A\u0645\u0627\u0645 \u0634\u0648\u062F`;
            }
            if (_issue.format === "includes") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0634\u0627\u0645\u0644 "${_issue.includes}" \u0628\u0627\u0634\u062F`;
            }
            if (_issue.format === "regex") {
              return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 \u0627\u0644\u06AF\u0648\u06CC ${_issue.pattern} \u0645\u0637\u0627\u0628\u0642\u062A \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F`;
            }
            return `${Nouns[_issue.format] ?? issue2.format} \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
          }
          case "not_multiple_of":
            return `\u0639\u062F\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0645\u0636\u0631\u0628 ${issue2.divisor} \u0628\u0627\u0634\u062F`;
          case "unrecognized_keys":
            return `\u06A9\u0644\u06CC\u062F${issue2.keys.length > 1 ? "\u0647\u0627\u06CC" : ""} \u0646\u0627\u0634\u0646\u0627\u0633: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u06A9\u0644\u06CC\u062F \u0646\u0627\u0634\u0646\u0627\u0633 \u062F\u0631 ${issue2.origin}`;
          case "invalid_union":
            return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
          case "invalid_element":
            return `\u0645\u0642\u062F\u0627\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u062F\u0631 ${issue2.origin}`;
          default:
            return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/fi.js
function fi_default() {
  return {
    localeError: error11()
  };
}
var error11;
var init_fi = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/fi.js"() {
    init_util();
    error11 = () => {
      const Sizable = {
        string: { unit: "merkki\xE4", subject: "merkkijonon" },
        file: { unit: "tavua", subject: "tiedoston" },
        array: { unit: "alkiota", subject: "listan" },
        set: { unit: "alkiota", subject: "joukon" },
        number: { unit: "", subject: "luvun" },
        bigint: { unit: "", subject: "suuren kokonaisluvun" },
        int: { unit: "", subject: "kokonaisluvun" },
        date: { unit: "", subject: "p\xE4iv\xE4m\xE4\xE4r\xE4n" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "s\xE4\xE4nn\xF6llinen lauseke",
        email: "s\xE4hk\xF6postiosoite",
        url: "URL-osoite",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-aikaleima",
        date: "ISO-p\xE4iv\xE4m\xE4\xE4r\xE4",
        time: "ISO-aika",
        duration: "ISO-kesto",
        ipv4: "IPv4-osoite",
        ipv6: "IPv6-osoite",
        cidrv4: "IPv4-alue",
        cidrv6: "IPv6-alue",
        base64: "base64-koodattu merkkijono",
        base64url: "base64url-koodattu merkkijono",
        json_string: "JSON-merkkijono",
        e164: "E.164-luku",
        jwt: "JWT",
        template_literal: "templaattimerkkijono"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Virheellinen tyyppi: odotettiin ${issue2.expected}, oli ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Virheellinen sy\xF6te: t\xE4ytyy olla ${stringifyPrimitive(issue2.values[0])}`;
            return `Virheellinen valinta: t\xE4ytyy olla yksi seuraavista: ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Liian suuri: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.maximum.toString()} ${sizing.unit}`.trim();
            }
            return `Liian suuri: arvon t\xE4ytyy olla ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Liian pieni: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.minimum.toString()} ${sizing.unit}`.trim();
            }
            return `Liian pieni: arvon t\xE4ytyy olla ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Virheellinen sy\xF6te: t\xE4ytyy alkaa "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Virheellinen sy\xF6te: t\xE4ytyy loppua "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Virheellinen sy\xF6te: t\xE4ytyy sis\xE4lt\xE4\xE4 "${_issue.includes}"`;
            if (_issue.format === "regex") {
              return `Virheellinen sy\xF6te: t\xE4ytyy vastata s\xE4\xE4nn\xF6llist\xE4 lauseketta ${_issue.pattern}`;
            }
            return `Virheellinen ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Virheellinen luku: t\xE4ytyy olla luvun ${issue2.divisor} monikerta`;
          case "unrecognized_keys":
            return `${issue2.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return "Virheellinen avain tietueessa";
          case "invalid_union":
            return "Virheellinen unioni";
          case "invalid_element":
            return "Virheellinen arvo joukossa";
          default:
            return `Virheellinen sy\xF6te`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/fr.js
function fr_default() {
  return {
    localeError: error12()
  };
}
var error12;
var init_fr = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/fr.js"() {
    init_util();
    error12 = () => {
      const Sizable = {
        string: { unit: "caract\xE8res", verb: "avoir" },
        file: { unit: "octets", verb: "avoir" },
        array: { unit: "\xE9l\xE9ments", verb: "avoir" },
        set: { unit: "\xE9l\xE9ments", verb: "avoir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "nombre";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "tableau";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "entr\xE9e",
        email: "adresse e-mail",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "date et heure ISO",
        date: "date ISO",
        time: "heure ISO",
        duration: "dur\xE9e ISO",
        ipv4: "adresse IPv4",
        ipv6: "adresse IPv6",
        cidrv4: "plage IPv4",
        cidrv6: "plage IPv6",
        base64: "cha\xEEne encod\xE9e en base64",
        base64url: "cha\xEEne encod\xE9e en base64url",
        json_string: "cha\xEEne JSON",
        e164: "num\xE9ro E.164",
        jwt: "JWT",
        template_literal: "entr\xE9e"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Entr\xE9e invalide : ${issue2.expected} attendu, ${parsedType4(issue2.input)} re\xE7u`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Entr\xE9e invalide : ${stringifyPrimitive(issue2.values[0])} attendu`;
            return `Option invalide : une valeur parmi ${joinValues(issue2.values, "|")} attendue`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Trop grand : ${issue2.origin ?? "valeur"} doit ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xE9l\xE9ment(s)"}`;
            return `Trop grand : ${issue2.origin ?? "valeur"} doit \xEAtre ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Trop petit : ${issue2.origin} doit ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Trop petit : ${issue2.origin} doit \xEAtre ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Cha\xEEne invalide : doit correspondre au mod\xE8le ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} invalide`;
          }
          case "not_multiple_of":
            return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Cl\xE9 invalide dans ${issue2.origin}`;
          case "invalid_union":
            return "Entr\xE9e invalide";
          case "invalid_element":
            return `Valeur invalide dans ${issue2.origin}`;
          default:
            return `Entr\xE9e invalide`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/fr-CA.js
function fr_CA_default() {
  return {
    localeError: error13()
  };
}
var error13;
var init_fr_CA = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/fr-CA.js"() {
    init_util();
    error13 = () => {
      const Sizable = {
        string: { unit: "caract\xE8res", verb: "avoir" },
        file: { unit: "octets", verb: "avoir" },
        array: { unit: "\xE9l\xE9ments", verb: "avoir" },
        set: { unit: "\xE9l\xE9ments", verb: "avoir" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "entr\xE9e",
        email: "adresse courriel",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "date-heure ISO",
        date: "date ISO",
        time: "heure ISO",
        duration: "dur\xE9e ISO",
        ipv4: "adresse IPv4",
        ipv6: "adresse IPv6",
        cidrv4: "plage IPv4",
        cidrv6: "plage IPv6",
        base64: "cha\xEEne encod\xE9e en base64",
        base64url: "cha\xEEne encod\xE9e en base64url",
        json_string: "cha\xEEne JSON",
        e164: "num\xE9ro E.164",
        jwt: "JWT",
        template_literal: "entr\xE9e"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Entr\xE9e invalide : attendu ${issue2.expected}, re\xE7u ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Entr\xE9e invalide : attendu ${stringifyPrimitive(issue2.values[0])}`;
            return `Option invalide : attendu l'une des valeurs suivantes ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "\u2264" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} ait ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
            return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} soit ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? "\u2265" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Trop petit : attendu que ${issue2.origin} ait ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Trop petit : attendu que ${issue2.origin} soit ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Cha\xEEne invalide : doit correspondre au motif ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} invalide`;
          }
          case "not_multiple_of":
            return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Cl\xE9 invalide dans ${issue2.origin}`;
          case "invalid_union":
            return "Entr\xE9e invalide";
          case "invalid_element":
            return `Valeur invalide dans ${issue2.origin}`;
          default:
            return `Entr\xE9e invalide`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/he.js
function he_default() {
  return {
    localeError: error14()
  };
}
var error14;
var init_he = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/he.js"() {
    init_util();
    error14 = () => {
      const Sizable = {
        string: { unit: "\u05D0\u05D5\u05EA\u05D9\u05D5\u05EA", verb: "\u05DC\u05DB\u05DC\u05D5\u05DC" },
        file: { unit: "\u05D1\u05D9\u05D9\u05D8\u05D9\u05DD", verb: "\u05DC\u05DB\u05DC\u05D5\u05DC" },
        array: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", verb: "\u05DC\u05DB\u05DC\u05D5\u05DC" },
        set: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", verb: "\u05DC\u05DB\u05DC\u05D5\u05DC" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u05E7\u05DC\u05D8",
        email: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC",
        url: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05E8\u05E9\u05EA",
        emoji: "\u05D0\u05D9\u05DE\u05D5\u05D2'\u05D9",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u05EA\u05D0\u05E8\u05D9\u05DA \u05D5\u05D6\u05DE\u05DF ISO",
        date: "\u05EA\u05D0\u05E8\u05D9\u05DA ISO",
        time: "\u05D6\u05DE\u05DF ISO",
        duration: "\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF ISO",
        ipv4: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv4",
        ipv6: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv6",
        cidrv4: "\u05D8\u05D5\u05D5\u05D7 IPv4",
        cidrv6: "\u05D8\u05D5\u05D5\u05D7 IPv6",
        base64: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64",
        base64url: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64 \u05DC\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA \u05E8\u05E9\u05EA",
        json_string: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA JSON",
        e164: "\u05DE\u05E1\u05E4\u05E8 E.164",
        jwt: "JWT",
        template_literal: "\u05E7\u05DC\u05D8"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA ${issue2.expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${parsedType4(issue2.input)}`;
          // return `Invalid input: expected ${issue.expected}, received ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA ${stringifyPrimitive(issue2.values[0])}`;
            return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05D0\u05D7\u05EA \u05DE\u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA  ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${issue2.origin ?? "value"} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
            return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${issue2.origin ?? "value"} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${issue2.origin} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${issue2.origin} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4: \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05D1"${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4: \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05E1\u05EA\u05D9\u05D9\u05DD \u05D1 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4: \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05E0\u05D4: \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D0\u05D9\u05DD \u05DC\u05EA\u05D1\u05E0\u05D9\u05EA ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF`;
          }
          case "not_multiple_of":
            return `\u05DE\u05E1\u05E4\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05DB\u05E4\u05DC\u05D4 \u05E9\u05DC ${issue2.divisor}`;
          case "unrecognized_keys":
            return `\u05DE\u05E4\u05EA\u05D7${issue2.keys.length > 1 ? "\u05D5\u05EA" : ""} \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4${issue2.keys.length > 1 ? "\u05D9\u05DD" : "\u05D4"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u05DE\u05E4\u05EA\u05D7 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1${issue2.origin}`;
          case "invalid_union":
            return "\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF";
          case "invalid_element":
            return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1${issue2.origin}`;
          default:
            return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/hu.js
function hu_default() {
  return {
    localeError: error15()
  };
}
var error15;
var init_hu = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/hu.js"() {
    init_util();
    error15 = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "legyen" },
        file: { unit: "byte", verb: "legyen" },
        array: { unit: "elem", verb: "legyen" },
        set: { unit: "elem", verb: "legyen" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "sz\xE1m";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "t\xF6mb";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "bemenet",
        email: "email c\xEDm",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO id\u0151b\xE9lyeg",
        date: "ISO d\xE1tum",
        time: "ISO id\u0151",
        duration: "ISO id\u0151intervallum",
        ipv4: "IPv4 c\xEDm",
        ipv6: "IPv6 c\xEDm",
        cidrv4: "IPv4 tartom\xE1ny",
        cidrv6: "IPv6 tartom\xE1ny",
        base64: "base64-k\xF3dolt string",
        base64url: "base64url-k\xF3dolt string",
        json_string: "JSON string",
        e164: "E.164 sz\xE1m",
        jwt: "JWT",
        template_literal: "bemenet"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${issue2.expected}, a kapott \xE9rt\xE9k ${parsedType4(issue2.input)}`;
          // return `Invalid input: expected ${issue.expected}, received ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${stringifyPrimitive(issue2.values[0])}`;
            return `\xC9rv\xE9nytelen opci\xF3: valamelyik \xE9rt\xE9k v\xE1rt ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `T\xFAl nagy: ${issue2.origin ?? "\xE9rt\xE9k"} m\xE9rete t\xFAl nagy ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elem"}`;
            return `T\xFAl nagy: a bemeneti \xE9rt\xE9k ${issue2.origin ?? "\xE9rt\xE9k"} t\xFAl nagy: ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} m\xE9rete t\xFAl kicsi ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} t\xFAl kicsi ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\xC9rv\xE9nytelen string: "${_issue.prefix}" \xE9rt\xE9kkel kell kezd\u0151dnie`;
            if (_issue.format === "ends_with")
              return `\xC9rv\xE9nytelen string: "${_issue.suffix}" \xE9rt\xE9kkel kell v\xE9gz\u0151dnie`;
            if (_issue.format === "includes")
              return `\xC9rv\xE9nytelen string: "${_issue.includes}" \xE9rt\xE9ket kell tartalmaznia`;
            if (_issue.format === "regex")
              return `\xC9rv\xE9nytelen string: ${_issue.pattern} mint\xE1nak kell megfelelnie`;
            return `\xC9rv\xE9nytelen ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\xC9rv\xE9nytelen sz\xE1m: ${issue2.divisor} t\xF6bbsz\xF6r\xF6s\xE9nek kell lennie`;
          case "unrecognized_keys":
            return `Ismeretlen kulcs${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\xC9rv\xE9nytelen kulcs ${issue2.origin}`;
          case "invalid_union":
            return "\xC9rv\xE9nytelen bemenet";
          case "invalid_element":
            return `\xC9rv\xE9nytelen \xE9rt\xE9k: ${issue2.origin}`;
          default:
            return `\xC9rv\xE9nytelen bemenet`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/id.js
function id_default() {
  return {
    localeError: error16()
  };
}
var error16;
var init_id = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/id.js"() {
    init_util();
    error16 = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "memiliki" },
        file: { unit: "byte", verb: "memiliki" },
        array: { unit: "item", verb: "memiliki" },
        set: { unit: "item", verb: "memiliki" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "input",
        email: "alamat email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "tanggal dan waktu format ISO",
        date: "tanggal format ISO",
        time: "jam format ISO",
        duration: "durasi format ISO",
        ipv4: "alamat IPv4",
        ipv6: "alamat IPv6",
        cidrv4: "rentang alamat IPv4",
        cidrv6: "rentang alamat IPv6",
        base64: "string dengan enkode base64",
        base64url: "string dengan enkode base64url",
        json_string: "string JSON",
        e164: "angka E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Input tidak valid: diharapkan ${issue2.expected}, diterima ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Input tidak valid: diharapkan ${stringifyPrimitive(issue2.values[0])}`;
            return `Pilihan tidak valid: diharapkan salah satu dari ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} memiliki ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
            return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} menjadi ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Terlalu kecil: diharapkan ${issue2.origin} memiliki ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Terlalu kecil: diharapkan ${issue2.origin} menjadi ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `String tidak valid: harus dimulai dengan "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `String tidak valid: harus berakhir dengan "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `String tidak valid: harus menyertakan "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `String tidak valid: harus sesuai pola ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} tidak valid`;
          }
          case "not_multiple_of":
            return `Angka tidak valid: harus kelipatan dari ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Kunci tidak dikenali ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Kunci tidak valid di ${issue2.origin}`;
          case "invalid_union":
            return "Input tidak valid";
          case "invalid_element":
            return `Nilai tidak valid di ${issue2.origin}`;
          default:
            return `Input tidak valid`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/it.js
function it_default() {
  return {
    localeError: error17()
  };
}
var error17;
var init_it = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/it.js"() {
    init_util();
    error17 = () => {
      const Sizable = {
        string: { unit: "caratteri", verb: "avere" },
        file: { unit: "byte", verb: "avere" },
        array: { unit: "elementi", verb: "avere" },
        set: { unit: "elementi", verb: "avere" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "numero";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "vettore";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "input",
        email: "indirizzo email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data e ora ISO",
        date: "data ISO",
        time: "ora ISO",
        duration: "durata ISO",
        ipv4: "indirizzo IPv4",
        ipv6: "indirizzo IPv6",
        cidrv4: "intervallo IPv4",
        cidrv6: "intervallo IPv6",
        base64: "stringa codificata in base64",
        base64url: "URL codificata in base64",
        json_string: "stringa JSON",
        e164: "numero E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Input non valido: atteso ${issue2.expected}, ricevuto ${parsedType4(issue2.input)}`;
          // return `Input non valido: atteso ${issue.expected}, ricevuto ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Input non valido: atteso ${stringifyPrimitive(issue2.values[0])}`;
            return `Opzione non valida: atteso uno tra ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Troppo grande: ${issue2.origin ?? "valore"} deve avere ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementi"}`;
            return `Troppo grande: ${issue2.origin ?? "valore"} deve essere ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Troppo piccolo: ${issue2.origin} deve avere ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Troppo piccolo: ${issue2.origin} deve essere ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Stringa non valida: deve iniziare con "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Stringa non valida: deve terminare con "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Stringa non valida: deve includere "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Stringa non valida: deve corrispondere al pattern ${_issue.pattern}`;
            return `Invalid ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Numero non valido: deve essere un multiplo di ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Chiav${issue2.keys.length > 1 ? "i" : "e"} non riconosciut${issue2.keys.length > 1 ? "e" : "a"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Chiave non valida in ${issue2.origin}`;
          case "invalid_union":
            return "Input non valido";
          case "invalid_element":
            return `Valore non valido in ${issue2.origin}`;
          default:
            return `Input non valido`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ja.js
function ja_default() {
  return {
    localeError: error18()
  };
}
var error18;
var init_ja = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ja.js"() {
    init_util();
    error18 = () => {
      const Sizable = {
        string: { unit: "\u6587\u5B57", verb: "\u3067\u3042\u308B" },
        file: { unit: "\u30D0\u30A4\u30C8", verb: "\u3067\u3042\u308B" },
        array: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" },
        set: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u6570\u5024";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u914D\u5217";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u5165\u529B\u5024",
        email: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9",
        url: "URL",
        emoji: "\u7D75\u6587\u5B57",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO\u65E5\u6642",
        date: "ISO\u65E5\u4ED8",
        time: "ISO\u6642\u523B",
        duration: "ISO\u671F\u9593",
        ipv4: "IPv4\u30A2\u30C9\u30EC\u30B9",
        ipv6: "IPv6\u30A2\u30C9\u30EC\u30B9",
        cidrv4: "IPv4\u7BC4\u56F2",
        cidrv6: "IPv6\u7BC4\u56F2",
        base64: "base64\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
        base64url: "base64url\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
        json_string: "JSON\u6587\u5B57\u5217",
        e164: "E.164\u756A\u53F7",
        jwt: "JWT",
        template_literal: "\u5165\u529B\u5024"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u7121\u52B9\u306A\u5165\u529B: ${issue2.expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${parsedType4(issue2.input)}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u7121\u52B9\u306A\u5165\u529B: ${stringifyPrimitive(issue2.values[0])}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F`;
            return `\u7121\u52B9\u306A\u9078\u629E: ${joinValues(issue2.values, "\u3001")}\u306E\u3044\u305A\u308C\u304B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          case "too_big": {
            const adj = issue2.inclusive ? "\u4EE5\u4E0B\u3067\u3042\u308B" : "\u3088\u308A\u5C0F\u3055\u3044";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${sizing.unit ?? "\u8981\u7D20"}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? "\u4EE5\u4E0A\u3067\u3042\u308B" : "\u3088\u308A\u5927\u304D\u3044";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${sizing.unit}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.prefix}"\u3067\u59CB\u307E\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            if (_issue.format === "ends_with")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.suffix}"\u3067\u7D42\u308F\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            if (_issue.format === "includes")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.includes}"\u3092\u542B\u3080\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            if (_issue.format === "regex")
              return `\u7121\u52B9\u306A\u6587\u5B57\u5217: \u30D1\u30BF\u30FC\u30F3${_issue.pattern}\u306B\u4E00\u81F4\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
            return `\u7121\u52B9\u306A${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u7121\u52B9\u306A\u6570\u5024: ${issue2.divisor}\u306E\u500D\u6570\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
          case "unrecognized_keys":
            return `\u8A8D\u8B58\u3055\u308C\u3066\u3044\u306A\u3044\u30AD\u30FC${issue2.keys.length > 1 ? "\u7FA4" : ""}: ${joinValues(issue2.keys, "\u3001")}`;
          case "invalid_key":
            return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u30AD\u30FC`;
          case "invalid_union":
            return "\u7121\u52B9\u306A\u5165\u529B";
          case "invalid_element":
            return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u5024`;
          default:
            return `\u7121\u52B9\u306A\u5165\u529B`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/kh.js
function kh_default() {
  return {
    localeError: error19()
  };
}
var error19;
var init_kh = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/kh.js"() {
    init_util();
    error19 = () => {
      const Sizable = {
        string: { unit: "\u178F\u17BD\u17A2\u1780\u17D2\u179F\u179A", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
        file: { unit: "\u1794\u17C3", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
        array: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
        set: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "\u1798\u17B7\u1793\u1798\u17C2\u1793\u1787\u17B6\u179B\u17C1\u1781 (NaN)" : "\u179B\u17C1\u1781";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u17A2\u17B6\u179A\u17C1 (Array)";
            }
            if (data === null) {
              return "\u1782\u17D2\u1798\u17B6\u1793\u178F\u1798\u17D2\u179B\u17C3 (null)";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B",
        email: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793\u17A2\u17CA\u17B8\u1798\u17C2\u179B",
        url: "URL",
        emoji: "\u179F\u1789\u17D2\u1789\u17B6\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 \u1793\u17B7\u1784\u1798\u17C9\u17C4\u1784 ISO",
        date: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 ISO",
        time: "\u1798\u17C9\u17C4\u1784 ISO",
        duration: "\u179A\u1799\u17C8\u1796\u17C1\u179B ISO",
        ipv4: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
        ipv6: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
        cidrv4: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
        cidrv6: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
        base64: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64",
        base64url: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64url",
        json_string: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A JSON",
        e164: "\u179B\u17C1\u1781 E.164",
        jwt: "JWT",
        template_literal: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${stringifyPrimitive(issue2.values[0])}`;
            return `\u1787\u1798\u17D2\u179A\u17BE\u179F\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1787\u17B6\u1798\u17BD\u1799\u1780\u17D2\u1793\u17BB\u1784\u1785\u17C6\u178E\u17C4\u1798 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u1792\u17B6\u178F\u17BB"}`;
            return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1785\u17B6\u1794\u17CB\u1795\u17D2\u178F\u17BE\u1798\u178A\u17C4\u1799 "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1794\u1789\u17D2\u1785\u1794\u17CB\u178A\u17C4\u1799 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1798\u17B6\u1793 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1795\u17D2\u1782\u17BC\u1795\u17D2\u1782\u1784\u1793\u17B9\u1784\u1791\u1798\u17D2\u179A\u1784\u17CB\u178A\u17C2\u179B\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB ${_issue.pattern}`;
            return `\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u179B\u17C1\u1781\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1787\u17B6\u1796\u17A0\u17BB\u1782\u17BB\u178E\u1793\u17C3 ${issue2.divisor}`;
          case "unrecognized_keys":
            return `\u179A\u1780\u1783\u17BE\u1789\u179F\u17C4\u1798\u17B7\u1793\u179F\u17D2\u1782\u17B6\u179B\u17CB\u17D6 ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u179F\u17C4\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
          case "invalid_union":
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
          case "invalid_element":
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
          default:
            return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ko.js
function ko_default() {
  return {
    localeError: error20()
  };
}
var error20;
var init_ko = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ko.js"() {
    init_util();
    error20 = () => {
      const Sizable = {
        string: { unit: "\uBB38\uC790", verb: "to have" },
        file: { unit: "\uBC14\uC774\uD2B8", verb: "to have" },
        array: { unit: "\uAC1C", verb: "to have" },
        set: { unit: "\uAC1C", verb: "to have" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\uC785\uB825",
        email: "\uC774\uBA54\uC77C \uC8FC\uC18C",
        url: "URL",
        emoji: "\uC774\uBAA8\uC9C0",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \uB0A0\uC9DC\uC2DC\uAC04",
        date: "ISO \uB0A0\uC9DC",
        time: "ISO \uC2DC\uAC04",
        duration: "ISO \uAE30\uAC04",
        ipv4: "IPv4 \uC8FC\uC18C",
        ipv6: "IPv6 \uC8FC\uC18C",
        cidrv4: "IPv4 \uBC94\uC704",
        cidrv6: "IPv6 \uBC94\uC704",
        base64: "base64 \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
        base64url: "base64url \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
        json_string: "JSON \uBB38\uC790\uC5F4",
        e164: "E.164 \uBC88\uD638",
        jwt: "JWT",
        template_literal: "\uC785\uB825"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 ${issue2.expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${parsedType4(issue2.input)}\uC785\uB2C8\uB2E4`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\uC798\uBABB\uB41C \uC785\uB825: \uAC12\uC740 ${stringifyPrimitive(issue2.values[0])} \uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4`;
            return `\uC798\uBABB\uB41C \uC635\uC158: ${joinValues(issue2.values, "\uB610\uB294 ")} \uC911 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
          case "too_big": {
            const adj = issue2.inclusive ? "\uC774\uD558" : "\uBBF8\uB9CC";
            const suffix = adj === "\uBBF8\uB9CC" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
            const sizing = getSizing(issue2.origin);
            const unit = sizing?.unit ?? "\uC694\uC18C";
            if (sizing)
              return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()}${unit} ${adj}${suffix}`;
            return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()} ${adj}${suffix}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? "\uC774\uC0C1" : "\uCD08\uACFC";
            const suffix = adj === "\uC774\uC0C1" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
            const sizing = getSizing(issue2.origin);
            const unit = sizing?.unit ?? "\uC694\uC18C";
            if (sizing) {
              return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()}${unit} ${adj}${suffix}`;
            }
            return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()} ${adj}${suffix}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.prefix}"(\uC73C)\uB85C \uC2DC\uC791\uD574\uC57C \uD569\uB2C8\uB2E4`;
            }
            if (_issue.format === "ends_with")
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.suffix}"(\uC73C)\uB85C \uB05D\uB098\uC57C \uD569\uB2C8\uB2E4`;
            if (_issue.format === "includes")
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.includes}"\uC744(\uB97C) \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4`;
            if (_issue.format === "regex")
              return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: \uC815\uADDC\uC2DD ${_issue.pattern} \uD328\uD134\uACFC \uC77C\uCE58\uD574\uC57C \uD569\uB2C8\uB2E4`;
            return `\uC798\uBABB\uB41C ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\uC798\uBABB\uB41C \uC22B\uC790: ${issue2.divisor}\uC758 \uBC30\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
          case "unrecognized_keys":
            return `\uC778\uC2DD\uD560 \uC218 \uC5C6\uB294 \uD0A4: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\uC798\uBABB\uB41C \uD0A4: ${issue2.origin}`;
          case "invalid_union":
            return `\uC798\uBABB\uB41C \uC785\uB825`;
          case "invalid_element":
            return `\uC798\uBABB\uB41C \uAC12: ${issue2.origin}`;
          default:
            return `\uC798\uBABB\uB41C \uC785\uB825`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/mk.js
function mk_default() {
  return {
    localeError: error21()
  };
}
var error21;
var init_mk = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/mk.js"() {
    init_util();
    error21 = () => {
      const Sizable = {
        string: { unit: "\u0437\u043D\u0430\u0446\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
        file: { unit: "\u0431\u0430\u0458\u0442\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
        array: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
        set: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u0431\u0440\u043E\u0458";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u043D\u0438\u0437\u0430";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0432\u043D\u0435\u0441",
        email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u043D\u0430 \u0435-\u043F\u043E\u0448\u0442\u0430",
        url: "URL",
        emoji: "\u0435\u043C\u043E\u045F\u0438",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0434\u0430\u0442\u0443\u043C \u0438 \u0432\u0440\u0435\u043C\u0435",
        date: "ISO \u0434\u0430\u0442\u0443\u043C",
        time: "ISO \u0432\u0440\u0435\u043C\u0435",
        duration: "ISO \u0432\u0440\u0435\u043C\u0435\u0442\u0440\u0430\u0435\u045A\u0435",
        ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441\u0430",
        ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441\u0430",
        cidrv4: "IPv4 \u043E\u043F\u0441\u0435\u0433",
        cidrv6: "IPv6 \u043E\u043F\u0441\u0435\u0433",
        base64: "base64-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
        base64url: "base64url-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
        json_string: "JSON \u043D\u0438\u0437\u0430",
        e164: "E.164 \u0431\u0440\u043E\u0458",
        jwt: "JWT",
        template_literal: "\u0432\u043D\u0435\u0441"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${parsedType4(issue2.input)}`;
          // return `Invalid input: expected ${issue.expected}, received ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
            return `\u0413\u0440\u0435\u0448\u0430\u043D\u0430 \u043E\u043F\u0446\u0438\u0458\u0430: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 \u0435\u0434\u043D\u0430 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0438"}`;
            return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u043D\u0443\u0432\u0430 \u0441\u043E "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u0432\u0440\u0448\u0443\u0432\u0430 \u0441\u043E "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0432\u043A\u043B\u0443\u0447\u0443\u0432\u0430 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u043E\u0434\u0433\u043E\u0430\u0440\u0430 \u043D\u0430 \u043F\u0430\u0442\u0435\u0440\u043D\u043E\u0442 ${_issue.pattern}`;
            return `Invalid ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u0431\u0440\u043E\u0458: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0431\u0438\u0434\u0435 \u0434\u0435\u043B\u0438\u0432 \u0441\u043E ${issue2.divisor}`;
          case "unrecognized_keys":
            return `${issue2.keys.length > 1 ? "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D\u0438 \u043A\u043B\u0443\u0447\u0435\u0432\u0438" : "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D \u043A\u043B\u0443\u0447"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u043A\u043B\u0443\u0447 \u0432\u043E ${issue2.origin}`;
          case "invalid_union":
            return "\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441";
          case "invalid_element":
            return `\u0413\u0440\u0435\u0448\u043D\u0430 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442 \u0432\u043E ${issue2.origin}`;
          default:
            return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ms.js
function ms_default() {
  return {
    localeError: error22()
  };
}
var error22;
var init_ms = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ms.js"() {
    init_util();
    error22 = () => {
      const Sizable = {
        string: { unit: "aksara", verb: "mempunyai" },
        file: { unit: "bait", verb: "mempunyai" },
        array: { unit: "elemen", verb: "mempunyai" },
        set: { unit: "elemen", verb: "mempunyai" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "nombor";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "input",
        email: "alamat e-mel",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "tarikh masa ISO",
        date: "tarikh ISO",
        time: "masa ISO",
        duration: "tempoh ISO",
        ipv4: "alamat IPv4",
        ipv6: "alamat IPv6",
        cidrv4: "julat IPv4",
        cidrv6: "julat IPv6",
        base64: "string dikodkan base64",
        base64url: "string dikodkan base64url",
        json_string: "string JSON",
        e164: "nombor E.164",
        jwt: "JWT",
        template_literal: "input"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Input tidak sah: dijangka ${issue2.expected}, diterima ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Input tidak sah: dijangka ${stringifyPrimitive(issue2.values[0])}`;
            return `Pilihan tidak sah: dijangka salah satu daripada ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
            return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} adalah ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Terlalu kecil: dijangka ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Terlalu kecil: dijangka ${issue2.origin} adalah ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `String tidak sah: mesti bermula dengan "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `String tidak sah: mesti berakhir dengan "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `String tidak sah: mesti mengandungi "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `String tidak sah: mesti sepadan dengan corak ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} tidak sah`;
          }
          case "not_multiple_of":
            return `Nombor tidak sah: perlu gandaan ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Kunci tidak dikenali: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Kunci tidak sah dalam ${issue2.origin}`;
          case "invalid_union":
            return "Input tidak sah";
          case "invalid_element":
            return `Nilai tidak sah dalam ${issue2.origin}`;
          default:
            return `Input tidak sah`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/nl.js
function nl_default() {
  return {
    localeError: error23()
  };
}
var error23;
var init_nl = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/nl.js"() {
    init_util();
    error23 = () => {
      const Sizable = {
        string: { unit: "tekens" },
        file: { unit: "bytes" },
        array: { unit: "elementen" },
        set: { unit: "elementen" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "getal";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "invoer",
        email: "emailadres",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum en tijd",
        date: "ISO datum",
        time: "ISO tijd",
        duration: "ISO duur",
        ipv4: "IPv4-adres",
        ipv6: "IPv6-adres",
        cidrv4: "IPv4-bereik",
        cidrv6: "IPv6-bereik",
        base64: "base64-gecodeerde tekst",
        base64url: "base64 URL-gecodeerde tekst",
        json_string: "JSON string",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "invoer"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Ongeldige invoer: verwacht ${issue2.expected}, ontving ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Ongeldige invoer: verwacht ${stringifyPrimitive(issue2.values[0])}`;
            return `Ongeldige optie: verwacht \xE9\xE9n van ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Te lang: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementen"} bevat`;
            return `Te lang: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} is`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Te kort: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} bevat`;
            }
            return `Te kort: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} is`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `Ongeldige tekst: moet met "${_issue.prefix}" beginnen`;
            }
            if (_issue.format === "ends_with")
              return `Ongeldige tekst: moet op "${_issue.suffix}" eindigen`;
            if (_issue.format === "includes")
              return `Ongeldige tekst: moet "${_issue.includes}" bevatten`;
            if (_issue.format === "regex")
              return `Ongeldige tekst: moet overeenkomen met patroon ${_issue.pattern}`;
            return `Ongeldig: ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Ongeldig getal: moet een veelvoud van ${issue2.divisor} zijn`;
          case "unrecognized_keys":
            return `Onbekende key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Ongeldige key in ${issue2.origin}`;
          case "invalid_union":
            return "Ongeldige invoer";
          case "invalid_element":
            return `Ongeldige waarde in ${issue2.origin}`;
          default:
            return `Ongeldige invoer`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/no.js
function no_default() {
  return {
    localeError: error24()
  };
}
var error24;
var init_no = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/no.js"() {
    init_util();
    error24 = () => {
      const Sizable = {
        string: { unit: "tegn", verb: "\xE5 ha" },
        file: { unit: "bytes", verb: "\xE5 ha" },
        array: { unit: "elementer", verb: "\xE5 inneholde" },
        set: { unit: "elementer", verb: "\xE5 inneholde" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "tall";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "liste";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "input",
        email: "e-postadresse",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO dato- og klokkeslett",
        date: "ISO-dato",
        time: "ISO-klokkeslett",
        duration: "ISO-varighet",
        ipv4: "IPv4-omr\xE5de",
        ipv6: "IPv6-omr\xE5de",
        cidrv4: "IPv4-spekter",
        cidrv6: "IPv6-spekter",
        base64: "base64-enkodet streng",
        base64url: "base64url-enkodet streng",
        json_string: "JSON-streng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "input"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Ugyldig input: forventet ${issue2.expected}, fikk ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Ugyldig verdi: forventet ${stringifyPrimitive(issue2.values[0])}`;
            return `Ugyldig valg: forventet en av ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementer"}`;
            return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Ugyldig streng: m\xE5 starte med "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Ugyldig streng: m\xE5 ende med "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Ugyldig streng: m\xE5 inneholde "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Ugyldig streng: m\xE5 matche m\xF8nsteret ${_issue.pattern}`;
            return `Ugyldig ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Ugyldig tall: m\xE5 v\xE6re et multiplum av ${issue2.divisor}`;
          case "unrecognized_keys":
            return `${issue2.keys.length > 1 ? "Ukjente n\xF8kler" : "Ukjent n\xF8kkel"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Ugyldig n\xF8kkel i ${issue2.origin}`;
          case "invalid_union":
            return "Ugyldig input";
          case "invalid_element":
            return `Ugyldig verdi i ${issue2.origin}`;
          default:
            return `Ugyldig input`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ota.js
function ota_default() {
  return {
    localeError: error25()
  };
}
var error25;
var init_ota = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ota.js"() {
    init_util();
    error25 = () => {
      const Sizable = {
        string: { unit: "harf", verb: "olmal\u0131d\u0131r" },
        file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
        array: { unit: "unsur", verb: "olmal\u0131d\u0131r" },
        set: { unit: "unsur", verb: "olmal\u0131d\u0131r" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "numara";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "saf";
            }
            if (data === null) {
              return "gayb";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "giren",
        email: "epostag\xE2h",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO heng\xE2m\u0131",
        date: "ISO tarihi",
        time: "ISO zaman\u0131",
        duration: "ISO m\xFCddeti",
        ipv4: "IPv4 ni\u015F\xE2n\u0131",
        ipv6: "IPv6 ni\u015F\xE2n\u0131",
        cidrv4: "IPv4 menzili",
        cidrv6: "IPv6 menzili",
        base64: "base64-\u015Fifreli metin",
        base64url: "base64url-\u015Fifreli metin",
        json_string: "JSON metin",
        e164: "E.164 say\u0131s\u0131",
        jwt: "JWT",
        template_literal: "giren"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `F\xE2sit giren: umulan ${issue2.expected}, al\u0131nan ${parsedType4(issue2.input)}`;
          // return `Fâsit giren: umulan ${issue.expected}, alınan ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `F\xE2sit giren: umulan ${stringifyPrimitive(issue2.values[0])}`;
            return `F\xE2sit tercih: m\xFBteberler ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"} sahip olmal\u0131yd\u0131.`;
            return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} olmal\u0131yd\u0131.`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} ${sizing.unit} sahip olmal\u0131yd\u0131.`;
            }
            return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} olmal\u0131yd\u0131.`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `F\xE2sit metin: "${_issue.prefix}" ile ba\u015Flamal\u0131.`;
            if (_issue.format === "ends_with")
              return `F\xE2sit metin: "${_issue.suffix}" ile bitmeli.`;
            if (_issue.format === "includes")
              return `F\xE2sit metin: "${_issue.includes}" ihtiv\xE2 etmeli.`;
            if (_issue.format === "regex")
              return `F\xE2sit metin: ${_issue.pattern} nak\u015F\u0131na uymal\u0131.`;
            return `F\xE2sit ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `F\xE2sit say\u0131: ${issue2.divisor} kat\u0131 olmal\u0131yd\u0131.`;
          case "unrecognized_keys":
            return `Tan\u0131nmayan anahtar ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `${issue2.origin} i\xE7in tan\u0131nmayan anahtar var.`;
          case "invalid_union":
            return "Giren tan\u0131namad\u0131.";
          case "invalid_element":
            return `${issue2.origin} i\xE7in tan\u0131nmayan k\u0131ymet var.`;
          default:
            return `K\u0131ymet tan\u0131namad\u0131.`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ps.js
function ps_default() {
  return {
    localeError: error26()
  };
}
var error26;
var init_ps = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ps.js"() {
    init_util();
    error26 = () => {
      const Sizable = {
        string: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
        file: { unit: "\u0628\u0627\u06CC\u067C\u0633", verb: "\u0648\u0644\u0631\u064A" },
        array: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
        set: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u0639\u062F\u062F";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u0627\u0631\u06D0";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0648\u0631\u0648\u062F\u064A",
        email: "\u0628\u0631\u06CC\u069A\u0646\u0627\u0644\u06CC\u06A9",
        url: "\u06CC\u0648 \u0622\u0631 \u0627\u0644",
        emoji: "\u0627\u06CC\u0645\u0648\u062C\u064A",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u0646\u06CC\u067C\u0647 \u0627\u0648 \u0648\u062E\u062A",
        date: "\u0646\u06D0\u067C\u0647",
        time: "\u0648\u062E\u062A",
        duration: "\u0645\u0648\u062F\u0647",
        ipv4: "\u062F IPv4 \u067E\u062A\u0647",
        ipv6: "\u062F IPv6 \u067E\u062A\u0647",
        cidrv4: "\u062F IPv4 \u0633\u0627\u062D\u0647",
        cidrv6: "\u062F IPv6 \u0633\u0627\u062D\u0647",
        base64: "base64-encoded \u0645\u062A\u0646",
        base64url: "base64url-encoded \u0645\u062A\u0646",
        json_string: "JSON \u0645\u062A\u0646",
        e164: "\u062F E.164 \u0634\u0645\u06D0\u0631\u0647",
        jwt: "JWT",
        template_literal: "\u0648\u0631\u0648\u062F\u064A"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${issue2.expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${parsedType4(issue2.input)} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
          case "invalid_value":
            if (issue2.values.length === 1) {
              return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${stringifyPrimitive(issue2.values[0])} \u0648\u0627\u06CC`;
            }
            return `\u0646\u0627\u0633\u0645 \u0627\u0646\u062A\u062E\u0627\u0628: \u0628\u0627\u06CC\u062F \u06CC\u0648 \u0644\u0647 ${joinValues(issue2.values, "|")} \u0685\u062E\u0647 \u0648\u0627\u06CC`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631\u0648\u0646\u0647"} \u0648\u0644\u0631\u064A`;
            }
            return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0648\u064A`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0648\u0644\u0631\u064A`;
            }
            return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0648\u064A`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.prefix}" \u0633\u0631\u0647 \u067E\u06CC\u0644 \u0634\u064A`;
            }
            if (_issue.format === "ends_with") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.suffix}" \u0633\u0631\u0647 \u067E\u0627\u06CC \u062A\u0647 \u0648\u0631\u0633\u064A\u0696\u064A`;
            }
            if (_issue.format === "includes") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F "${_issue.includes}" \u0648\u0644\u0631\u064A`;
            }
            if (_issue.format === "regex") {
              return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F ${_issue.pattern} \u0633\u0631\u0647 \u0645\u0637\u0627\u0628\u0642\u062A \u0648\u0644\u0631\u064A`;
            }
            return `${Nouns[_issue.format] ?? issue2.format} \u0646\u0627\u0633\u0645 \u062F\u06CC`;
          }
          case "not_multiple_of":
            return `\u0646\u0627\u0633\u0645 \u0639\u062F\u062F: \u0628\u0627\u06CC\u062F \u062F ${issue2.divisor} \u0645\u0636\u0631\u0628 \u0648\u064A`;
          case "unrecognized_keys":
            return `\u0646\u0627\u0633\u0645 ${issue2.keys.length > 1 ? "\u06A9\u0644\u06CC\u0689\u0648\u0646\u0647" : "\u06A9\u0644\u06CC\u0689"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u0646\u0627\u0633\u0645 \u06A9\u0644\u06CC\u0689 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
          case "invalid_union":
            return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
          case "invalid_element":
            return `\u0646\u0627\u0633\u0645 \u0639\u0646\u0635\u0631 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
          default:
            return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/pl.js
function pl_default() {
  return {
    localeError: error27()
  };
}
var error27;
var init_pl = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/pl.js"() {
    init_util();
    error27 = () => {
      const Sizable = {
        string: { unit: "znak\xF3w", verb: "mie\u0107" },
        file: { unit: "bajt\xF3w", verb: "mie\u0107" },
        array: { unit: "element\xF3w", verb: "mie\u0107" },
        set: { unit: "element\xF3w", verb: "mie\u0107" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "liczba";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "tablica";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "wyra\u017Cenie",
        email: "adres email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data i godzina w formacie ISO",
        date: "data w formacie ISO",
        time: "godzina w formacie ISO",
        duration: "czas trwania ISO",
        ipv4: "adres IPv4",
        ipv6: "adres IPv6",
        cidrv4: "zakres IPv4",
        cidrv6: "zakres IPv6",
        base64: "ci\u0105g znak\xF3w zakodowany w formacie base64",
        base64url: "ci\u0105g znak\xF3w zakodowany w formacie base64url",
        json_string: "ci\u0105g znak\xF3w w formacie JSON",
        e164: "liczba E.164",
        jwt: "JWT",
        template_literal: "wej\u015Bcie"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${issue2.expected}, otrzymano ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${stringifyPrimitive(issue2.values[0])}`;
            return `Nieprawid\u0142owa opcja: oczekiwano jednej z warto\u015Bci ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Za du\u017Ca warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element\xF3w"}`;
            }
            return `Zbyt du\u017C(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Za ma\u0142a warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "element\xF3w"}`;
            }
            return `Zbyt ma\u0142(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zaczyna\u0107 si\u0119 od "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi ko\u0144czy\u0107 si\u0119 na "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zawiera\u0107 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi odpowiada\u0107 wzorcowi ${_issue.pattern}`;
            return `Nieprawid\u0142ow(y/a/e) ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Nieprawid\u0142owa liczba: musi by\u0107 wielokrotno\u015Bci\u0105 ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Nierozpoznane klucze${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Nieprawid\u0142owy klucz w ${issue2.origin}`;
          case "invalid_union":
            return "Nieprawid\u0142owe dane wej\u015Bciowe";
          case "invalid_element":
            return `Nieprawid\u0142owa warto\u015B\u0107 w ${issue2.origin}`;
          default:
            return `Nieprawid\u0142owe dane wej\u015Bciowe`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/pt.js
function pt_default() {
  return {
    localeError: error28()
  };
}
var error28;
var init_pt = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/pt.js"() {
    init_util();
    error28 = () => {
      const Sizable = {
        string: { unit: "caracteres", verb: "ter" },
        file: { unit: "bytes", verb: "ter" },
        array: { unit: "itens", verb: "ter" },
        set: { unit: "itens", verb: "ter" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "n\xFAmero";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "nulo";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "padr\xE3o",
        email: "endere\xE7o de e-mail",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "data e hora ISO",
        date: "data ISO",
        time: "hora ISO",
        duration: "dura\xE7\xE3o ISO",
        ipv4: "endere\xE7o IPv4",
        ipv6: "endere\xE7o IPv6",
        cidrv4: "faixa de IPv4",
        cidrv6: "faixa de IPv6",
        base64: "texto codificado em base64",
        base64url: "URL codificada em base64",
        json_string: "texto JSON",
        e164: "n\xFAmero E.164",
        jwt: "JWT",
        template_literal: "entrada"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Tipo inv\xE1lido: esperado ${issue2.expected}, recebido ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Entrada inv\xE1lida: esperado ${stringifyPrimitive(issue2.values[0])}`;
            return `Op\xE7\xE3o inv\xE1lida: esperada uma das ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Muito grande: esperado que ${issue2.origin ?? "valor"} tivesse ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
            return `Muito grande: esperado que ${issue2.origin ?? "valor"} fosse ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Muito pequeno: esperado que ${issue2.origin} tivesse ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Muito pequeno: esperado que ${issue2.origin} fosse ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Texto inv\xE1lido: deve come\xE7ar com "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Texto inv\xE1lido: deve terminar com "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Texto inv\xE1lido: deve incluir "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Texto inv\xE1lido: deve corresponder ao padr\xE3o ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} inv\xE1lido`;
          }
          case "not_multiple_of":
            return `N\xFAmero inv\xE1lido: deve ser m\xFAltiplo de ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Chave${issue2.keys.length > 1 ? "s" : ""} desconhecida${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Chave inv\xE1lida em ${issue2.origin}`;
          case "invalid_union":
            return "Entrada inv\xE1lida";
          case "invalid_element":
            return `Valor inv\xE1lido em ${issue2.origin}`;
          default:
            return `Campo inv\xE1lido`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ru.js
function getRussianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
function ru_default() {
  return {
    localeError: error29()
  };
}
var error29;
var init_ru = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ru.js"() {
    init_util();
    error29 = () => {
      const Sizable = {
        string: {
          unit: {
            one: "\u0441\u0438\u043C\u0432\u043E\u043B",
            few: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430",
            many: "\u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        },
        file: {
          unit: {
            one: "\u0431\u0430\u0439\u0442",
            few: "\u0431\u0430\u0439\u0442\u0430",
            many: "\u0431\u0430\u0439\u0442"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        },
        array: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        },
        set: {
          unit: {
            one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
            few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
            many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
          },
          verb: "\u0438\u043C\u0435\u0442\u044C"
        }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u0447\u0438\u0441\u043B\u043E";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u043C\u0430\u0441\u0441\u0438\u0432";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0432\u0432\u043E\u0434",
        email: "email \u0430\u0434\u0440\u0435\u0441",
        url: "URL",
        emoji: "\u044D\u043C\u043E\u0434\u0437\u0438",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F",
        date: "ISO \u0434\u0430\u0442\u0430",
        time: "ISO \u0432\u0440\u0435\u043C\u044F",
        duration: "ISO \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
        ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
        ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
        cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
        cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
        base64: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64",
        base64url: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64url",
        json_string: "JSON \u0441\u0442\u0440\u043E\u043A\u0430",
        e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
        jwt: "JWT",
        template_literal: "\u0432\u0432\u043E\u0434"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${issue2.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${stringifyPrimitive(issue2.values[0])}`;
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0434\u043D\u043E \u0438\u0437 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const maxValue = Number(issue2.maximum);
              const unit = getRussianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.maximum.toString()} ${unit}`;
            }
            return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              const minValue = Number(issue2.minimum);
              const unit = getRussianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
              return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.minimum.toString()} ${unit}`;
            }
            return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0442\u044C\u0441\u044F \u0441 "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E: \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
          case "unrecognized_keys":
            return `\u041D\u0435\u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D${issue2.keys.length > 1 ? "\u044B\u0435" : "\u044B\u0439"} \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0438" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u0432 ${issue2.origin}`;
          case "invalid_union":
            return "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435";
          case "invalid_element":
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432 ${issue2.origin}`;
          default:
            return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/sl.js
function sl_default() {
  return {
    localeError: error30()
  };
}
var error30;
var init_sl = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/sl.js"() {
    init_util();
    error30 = () => {
      const Sizable = {
        string: { unit: "znakov", verb: "imeti" },
        file: { unit: "bajtov", verb: "imeti" },
        array: { unit: "elementov", verb: "imeti" },
        set: { unit: "elementov", verb: "imeti" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u0161tevilo";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "tabela";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "vnos",
        email: "e-po\u0161tni naslov",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datum in \u010Das",
        date: "ISO datum",
        time: "ISO \u010Das",
        duration: "ISO trajanje",
        ipv4: "IPv4 naslov",
        ipv6: "IPv6 naslov",
        cidrv4: "obseg IPv4",
        cidrv6: "obseg IPv6",
        base64: "base64 kodiran niz",
        base64url: "base64url kodiran niz",
        json_string: "JSON niz",
        e164: "E.164 \u0161tevilka",
        jwt: "JWT",
        template_literal: "vnos"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Neveljaven vnos: pri\u010Dakovano ${issue2.expected}, prejeto ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Neveljaven vnos: pri\u010Dakovano ${stringifyPrimitive(issue2.values[0])}`;
            return `Neveljavna mo\u017Enost: pri\u010Dakovano eno izmed ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} imelo ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementov"}`;
            return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} imelo ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `Neveljaven niz: mora se za\u010Deti z "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Neveljaven niz: mora se kon\u010Dati z "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Neveljaven niz: mora vsebovati "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Neveljaven niz: mora ustrezati vzorcu ${_issue.pattern}`;
            return `Neveljaven ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Neveljavno \u0161tevilo: mora biti ve\u010Dkratnik ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Neprepoznan${issue2.keys.length > 1 ? "i klju\u010Di" : " klju\u010D"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Neveljaven klju\u010D v ${issue2.origin}`;
          case "invalid_union":
            return "Neveljaven vnos";
          case "invalid_element":
            return `Neveljavna vrednost v ${issue2.origin}`;
          default:
            return "Neveljaven vnos";
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/sv.js
function sv_default() {
  return {
    localeError: error31()
  };
}
var error31;
var init_sv = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/sv.js"() {
    init_util();
    error31 = () => {
      const Sizable = {
        string: { unit: "tecken", verb: "att ha" },
        file: { unit: "bytes", verb: "att ha" },
        array: { unit: "objekt", verb: "att inneh\xE5lla" },
        set: { unit: "objekt", verb: "att inneh\xE5lla" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "antal";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "lista";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "regulj\xE4rt uttryck",
        email: "e-postadress",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO-datum och tid",
        date: "ISO-datum",
        time: "ISO-tid",
        duration: "ISO-varaktighet",
        ipv4: "IPv4-intervall",
        ipv6: "IPv6-intervall",
        cidrv4: "IPv4-spektrum",
        cidrv6: "IPv6-spektrum",
        base64: "base64-kodad str\xE4ng",
        base64url: "base64url-kodad str\xE4ng",
        json_string: "JSON-str\xE4ng",
        e164: "E.164-nummer",
        jwt: "JWT",
        template_literal: "mall-literal"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Ogiltig inmatning: f\xF6rv\xE4ntat ${issue2.expected}, fick ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Ogiltig inmatning: f\xF6rv\xE4ntat ${stringifyPrimitive(issue2.values[0])}`;
            return `Ogiltigt val: f\xF6rv\xE4ntade en av ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `F\xF6r stor(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
            }
            return `F\xF6r stor(t): f\xF6rv\xE4ntat ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `Ogiltig str\xE4ng: m\xE5ste b\xF6rja med "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `Ogiltig str\xE4ng: m\xE5ste sluta med "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Ogiltig str\xE4ng: m\xE5ste inneh\xE5lla "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Ogiltig str\xE4ng: m\xE5ste matcha m\xF6nstret "${_issue.pattern}"`;
            return `Ogiltig(t) ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Ogiltigt tal: m\xE5ste vara en multipel av ${issue2.divisor}`;
          case "unrecognized_keys":
            return `${issue2.keys.length > 1 ? "Ok\xE4nda nycklar" : "Ok\xE4nd nyckel"}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Ogiltig nyckel i ${issue2.origin ?? "v\xE4rdet"}`;
          case "invalid_union":
            return "Ogiltig input";
          case "invalid_element":
            return `Ogiltigt v\xE4rde i ${issue2.origin ?? "v\xE4rdet"}`;
          default:
            return `Ogiltig input`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ta.js
function ta_default() {
  return {
    localeError: error32()
  };
}
var error32;
var init_ta = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ta.js"() {
    init_util();
    error32 = () => {
      const Sizable = {
        string: { unit: "\u0B8E\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
        file: { unit: "\u0BAA\u0BC8\u0B9F\u0BCD\u0B9F\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
        array: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
        set: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "\u0B8E\u0BA3\u0BCD \u0B85\u0BB2\u0BCD\u0BB2\u0BBE\u0BA4\u0BA4\u0BC1" : "\u0B8E\u0BA3\u0BCD";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u0B85\u0BA3\u0BBF";
            }
            if (data === null) {
              return "\u0BB5\u0BC6\u0BB1\u0BC1\u0BAE\u0BC8";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1",
        email: "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u0BA4\u0BC7\u0BA4\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
        date: "ISO \u0BA4\u0BC7\u0BA4\u0BBF",
        time: "ISO \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
        duration: "ISO \u0B95\u0BBE\u0BB2 \u0B85\u0BB3\u0BB5\u0BC1",
        ipv4: "IPv4 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
        ipv6: "IPv6 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
        cidrv4: "IPv4 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
        cidrv6: "IPv6 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
        base64: "base64-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
        base64url: "base64url-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
        json_string: "JSON \u0B9A\u0BB0\u0BAE\u0BCD",
        e164: "E.164 \u0B8E\u0BA3\u0BCD",
        jwt: "JWT",
        template_literal: "input"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${stringifyPrimitive(issue2.values[0])}`;
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${joinValues(issue2.values, "|")} \u0B87\u0BB2\u0BCD \u0B92\u0BA9\u0BCD\u0BB1\u0BC1`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD"} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            }
            return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            }
            return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.prefix}" \u0B87\u0BB2\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            if (_issue.format === "ends_with")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.suffix}" \u0B87\u0BB2\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0B9F\u0BC8\u0BAF \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            if (_issue.format === "includes")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.includes}" \u0B90 \u0B89\u0BB3\u0BCD\u0BB3\u0B9F\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            if (_issue.format === "regex")
              return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: ${_issue.pattern} \u0BAE\u0BC1\u0BB1\u0BC8\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0B9F\u0BA9\u0BCD \u0BAA\u0BCA\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B8E\u0BA3\u0BCD: ${issue2.divisor} \u0B87\u0BA9\u0BCD \u0BAA\u0BB2\u0BAE\u0BBE\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
          case "unrecognized_keys":
            return `\u0B85\u0B9F\u0BC8\u0BAF\u0BBE\u0BB3\u0BAE\u0BCD \u0BA4\u0BC6\u0BB0\u0BBF\u0BAF\u0BBE\u0BA4 \u0BB5\u0BBF\u0B9A\u0BC8${issue2.keys.length > 1 ? "\u0B95\u0BB3\u0BCD" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0B9A\u0BC8`;
          case "invalid_union":
            return "\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1";
          case "invalid_element":
            return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1`;
          default:
            return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/th.js
function th_default() {
  return {
    localeError: error33()
  };
}
var error33;
var init_th = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/th.js"() {
    init_util();
    error33 = () => {
      const Sizable = {
        string: { unit: "\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
        file: { unit: "\u0E44\u0E1A\u0E15\u0E4C", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
        array: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
        set: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 (NaN)" : "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u0E2D\u0E32\u0E23\u0E4C\u0E40\u0E23\u0E22\u0E4C (Array)";
            }
            if (data === null) {
              return "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 (null)";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19",
        email: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2D\u0E35\u0E40\u0E21\u0E25",
        url: "URL",
        emoji: "\u0E2D\u0E34\u0E42\u0E21\u0E08\u0E34",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
        date: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1A\u0E1A ISO",
        time: "\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
        duration: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
        ipv4: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv4",
        ipv6: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv6",
        cidrv4: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv4",
        cidrv6: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv6",
        base64: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64",
        base64url: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A URL",
        json_string: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A JSON",
        e164: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28 (E.164)",
        jwt: "\u0E42\u0E17\u0E40\u0E04\u0E19 JWT",
        template_literal: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${issue2.expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u0E04\u0E48\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${stringifyPrimitive(issue2.values[0])}`;
            return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E19 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19" : "\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}`;
            return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? "\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22" : "\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 "${_issue.prefix}"`;
            }
            if (_issue.format === "ends_with")
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E25\u0E07\u0E17\u0E49\u0E32\u0E22\u0E14\u0E49\u0E27\u0E22 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35 "${_issue.includes}" \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21`;
            if (_issue.format === "regex")
              return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14 ${_issue.pattern}`;
            return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22 ${issue2.divisor} \u0E44\u0E14\u0E49\u0E25\u0E07\u0E15\u0E31\u0E27`;
          case "unrecognized_keys":
            return `\u0E1E\u0E1A\u0E04\u0E35\u0E22\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u0E04\u0E35\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
          case "invalid_union":
            return "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E22\u0E39\u0E40\u0E19\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49";
          case "invalid_element":
            return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
          default:
            return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/tr.js
function tr_default() {
  return {
    localeError: error34()
  };
}
var parsedType3, error34;
var init_tr = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/tr.js"() {
    init_util();
    parsedType3 = (data) => {
      const t = typeof data;
      switch (t) {
        case "number": {
          return Number.isNaN(data) ? "NaN" : "number";
        }
        case "object": {
          if (Array.isArray(data)) {
            return "array";
          }
          if (data === null) {
            return "null";
          }
          if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
            return data.constructor.name;
          }
        }
      }
      return t;
    };
    error34 = () => {
      const Sizable = {
        string: { unit: "karakter", verb: "olmal\u0131" },
        file: { unit: "bayt", verb: "olmal\u0131" },
        array: { unit: "\xF6\u011Fe", verb: "olmal\u0131" },
        set: { unit: "\xF6\u011Fe", verb: "olmal\u0131" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const Nouns = {
        regex: "girdi",
        email: "e-posta adresi",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO tarih ve saat",
        date: "ISO tarih",
        time: "ISO saat",
        duration: "ISO s\xFCre",
        ipv4: "IPv4 adresi",
        ipv6: "IPv6 adresi",
        cidrv4: "IPv4 aral\u0131\u011F\u0131",
        cidrv6: "IPv6 aral\u0131\u011F\u0131",
        base64: "base64 ile \u015Fifrelenmi\u015F metin",
        base64url: "base64url ile \u015Fifrelenmi\u015F metin",
        json_string: "JSON dizesi",
        e164: "E.164 say\u0131s\u0131",
        jwt: "JWT",
        template_literal: "\u015Eablon dizesi"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `Ge\xE7ersiz de\u011Fer: beklenen ${issue2.expected}, al\u0131nan ${parsedType3(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `Ge\xE7ersiz de\u011Fer: beklenen ${stringifyPrimitive(issue2.values[0])}`;
            return `Ge\xE7ersiz se\xE7enek: a\u015Fa\u011F\u0131dakilerden biri olmal\u0131: ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xF6\u011Fe"}`;
            return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Ge\xE7ersiz metin: "${_issue.prefix}" ile ba\u015Flamal\u0131`;
            if (_issue.format === "ends_with")
              return `Ge\xE7ersiz metin: "${_issue.suffix}" ile bitmeli`;
            if (_issue.format === "includes")
              return `Ge\xE7ersiz metin: "${_issue.includes}" i\xE7ermeli`;
            if (_issue.format === "regex")
              return `Ge\xE7ersiz metin: ${_issue.pattern} desenine uymal\u0131`;
            return `Ge\xE7ersiz ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Ge\xE7ersiz say\u0131: ${issue2.divisor} ile tam b\xF6l\xFCnebilmeli`;
          case "unrecognized_keys":
            return `Tan\u0131nmayan anahtar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `${issue2.origin} i\xE7inde ge\xE7ersiz anahtar`;
          case "invalid_union":
            return "Ge\xE7ersiz de\u011Fer";
          case "invalid_element":
            return `${issue2.origin} i\xE7inde ge\xE7ersiz de\u011Fer`;
          default:
            return `Ge\xE7ersiz de\u011Fer`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ua.js
function ua_default() {
  return {
    localeError: error35()
  };
}
var error35;
var init_ua = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ua.js"() {
    init_util();
    error35 = () => {
      const Sizable = {
        string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
        file: { unit: "\u0431\u0430\u0439\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
        array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
        set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u0447\u0438\u0441\u043B\u043E";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u043C\u0430\u0441\u0438\u0432";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456",
        email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u043F\u043E\u0448\u0442\u0438",
        url: "URL",
        emoji: "\u0435\u043C\u043E\u0434\u0437\u0456",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "\u0434\u0430\u0442\u0430 \u0442\u0430 \u0447\u0430\u0441 ISO",
        date: "\u0434\u0430\u0442\u0430 ISO",
        time: "\u0447\u0430\u0441 ISO",
        duration: "\u0442\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C ISO",
        ipv4: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv4",
        ipv6: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv6",
        cidrv4: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv4",
        cidrv6: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv6",
        base64: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64",
        base64url: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64url",
        json_string: "\u0440\u044F\u0434\u043E\u043A JSON",
        e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
        jwt: "JWT",
        template_literal: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${issue2.expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${parsedType4(issue2.input)}`;
          // return `Неправильні вхідні дані: очікується ${issue.expected}, отримано ${util.getParsedType(issue.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430 \u043E\u043F\u0446\u0456\u044F: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u043D\u0435 \u0437 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432"}`;
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} \u0431\u0443\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} \u0431\u0443\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043F\u043E\u0447\u0438\u043D\u0430\u0442\u0438\u0441\u044F \u0437 "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0437\u0430\u043A\u0456\u043D\u0447\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0447\u0438\u0441\u043B\u043E: \u043F\u043E\u0432\u0438\u043D\u043D\u043E \u0431\u0443\u0442\u0438 \u043A\u0440\u0430\u0442\u043D\u0438\u043C ${issue2.divisor}`;
          case "unrecognized_keys":
            return `\u041D\u0435\u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u043D\u0438\u0439 \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0456" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
          case "invalid_union":
            return "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456";
          case "invalid_element":
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0443 ${issue2.origin}`;
          default:
            return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/ur.js
function ur_default() {
  return {
    localeError: error36()
  };
}
var error36;
var init_ur = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/ur.js"() {
    init_util();
    error36 = () => {
      const Sizable = {
        string: { unit: "\u062D\u0631\u0648\u0641", verb: "\u06C1\u0648\u0646\u0627" },
        file: { unit: "\u0628\u0627\u0626\u0679\u0633", verb: "\u06C1\u0648\u0646\u0627" },
        array: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" },
        set: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "\u0646\u0645\u0628\u0631";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u0622\u0631\u06D2";
            }
            if (data === null) {
              return "\u0646\u0644";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0627\u0646 \u067E\u0679",
        email: "\u0627\u06CC \u0645\u06CC\u0644 \u0627\u06CC\u0688\u0631\u06CC\u0633",
        url: "\u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644",
        emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
        uuid: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        uuidv4: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 4",
        uuidv6: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 6",
        nanoid: "\u0646\u06CC\u0646\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        guid: "\u062C\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        cuid: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        cuid2: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC 2",
        ulid: "\u06CC\u0648 \u0627\u06CC\u0644 \u0622\u0626\u06CC \u0688\u06CC",
        xid: "\u0627\u06CC\u06A9\u0633 \u0622\u0626\u06CC \u0688\u06CC",
        ksuid: "\u06A9\u06D2 \u0627\u06CC\u0633 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
        datetime: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0688\u06CC\u0679 \u0679\u0627\u0626\u0645",
        date: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u062A\u0627\u0631\u06CC\u062E",
        time: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0648\u0642\u062A",
        duration: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0645\u062F\u062A",
        ipv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0627\u06CC\u0688\u0631\u06CC\u0633",
        ipv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0627\u06CC\u0688\u0631\u06CC\u0633",
        cidrv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0631\u06CC\u0646\u062C",
        cidrv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0631\u06CC\u0646\u062C",
        base64: "\u0628\u06CC\u0633 64 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
        base64url: "\u0628\u06CC\u0633 64 \u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
        json_string: "\u062C\u06D2 \u0627\u06CC\u0633 \u0627\u0648 \u0627\u06CC\u0646 \u0633\u0679\u0631\u0646\u06AF",
        e164: "\u0627\u06CC 164 \u0646\u0645\u0628\u0631",
        jwt: "\u062C\u06D2 \u0688\u0628\u0644\u06CC\u0648 \u0679\u06CC",
        template_literal: "\u0627\u0646 \u067E\u0679"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${issue2.expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${parsedType4(issue2.input)} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${stringifyPrimitive(issue2.values[0])} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
            return `\u063A\u0644\u0637 \u0622\u067E\u0634\u0646: ${joinValues(issue2.values, "|")} \u0645\u06CC\u06BA \u0633\u06D2 \u0627\u06CC\u06A9 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u06D2 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0627\u0635\u0631"} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
            return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u0627 ${adj}${issue2.maximum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u06D2 ${adj}${issue2.minimum.toString()} ${sizing.unit} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
            }
            return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u0627 ${adj}${issue2.minimum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.prefix}" \u0633\u06D2 \u0634\u0631\u0648\u0639 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            }
            if (_issue.format === "ends_with")
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.suffix}" \u067E\u0631 \u062E\u062A\u0645 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            if (_issue.format === "includes")
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.includes}" \u0634\u0627\u0645\u0644 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            if (_issue.format === "regex")
              return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: \u067E\u06CC\u0679\u0631\u0646 ${_issue.pattern} \u0633\u06D2 \u0645\u06CC\u0686 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
            return `\u063A\u0644\u0637 ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u063A\u0644\u0637 \u0646\u0645\u0628\u0631: ${issue2.divisor} \u06A9\u0627 \u0645\u0636\u0627\u0639\u0641 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
          case "unrecognized_keys":
            return `\u063A\u06CC\u0631 \u062A\u0633\u0644\u06CC\u0645 \u0634\u062F\u06C1 \u06A9\u06CC${issue2.keys.length > 1 ? "\u0632" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
          case "invalid_key":
            return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u06A9\u06CC`;
          case "invalid_union":
            return "\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679";
          case "invalid_element":
            return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u0648\u06CC\u0644\u06CC\u0648`;
          default:
            return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/vi.js
function vi_default() {
  return {
    localeError: error37()
  };
}
var error37;
var init_vi = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/vi.js"() {
    init_util();
    error37 = () => {
      const Sizable = {
        string: { unit: "k\xFD t\u1EF1", verb: "c\xF3" },
        file: { unit: "byte", verb: "c\xF3" },
        array: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" },
        set: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "s\u1ED1";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "m\u1EA3ng";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u0111\u1EA7u v\xE0o",
        email: "\u0111\u1ECBa ch\u1EC9 email",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ng\xE0y gi\u1EDD ISO",
        date: "ng\xE0y ISO",
        time: "gi\u1EDD ISO",
        duration: "kho\u1EA3ng th\u1EDDi gian ISO",
        ipv4: "\u0111\u1ECBa ch\u1EC9 IPv4",
        ipv6: "\u0111\u1ECBa ch\u1EC9 IPv6",
        cidrv4: "d\u1EA3i IPv4",
        cidrv6: "d\u1EA3i IPv6",
        base64: "chu\u1ED7i m\xE3 h\xF3a base64",
        base64url: "chu\u1ED7i m\xE3 h\xF3a base64url",
        json_string: "chu\u1ED7i JSON",
        e164: "s\u1ED1 E.164",
        jwt: "JWT",
        template_literal: "\u0111\u1EA7u v\xE0o"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${issue2.expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${stringifyPrimitive(issue2.values[0])}`;
            return `T\xF9y ch\u1ECDn kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i m\u1ED9t trong c\xE1c gi\xE1 tr\u1ECB ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "ph\u1EA7n t\u1EED"}`;
            return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng "${_issue.prefix}"`;
            if (_issue.format === "ends_with")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i k\u1EBFt th\xFAc b\u1EB1ng "${_issue.suffix}"`;
            if (_issue.format === "includes")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i bao g\u1ED3m "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i kh\u1EDBp v\u1EDBi m\u1EABu ${_issue.pattern}`;
            return `${Nouns[_issue.format] ?? issue2.format} kh\xF4ng h\u1EE3p l\u1EC7`;
          }
          case "not_multiple_of":
            return `S\u1ED1 kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i l\xE0 b\u1ED9i s\u1ED1 c\u1EE7a ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Kh\xF3a kh\xF4ng \u0111\u01B0\u1EE3c nh\u1EADn d\u1EA1ng: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Kh\xF3a kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
          case "invalid_union":
            return "\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7";
          case "invalid_element":
            return `Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
          default:
            return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/zh-CN.js
function zh_CN_default() {
  return {
    localeError: error38()
  };
}
var error38;
var init_zh_CN = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/zh-CN.js"() {
    init_util();
    error38 = () => {
      const Sizable = {
        string: { unit: "\u5B57\u7B26", verb: "\u5305\u542B" },
        file: { unit: "\u5B57\u8282", verb: "\u5305\u542B" },
        array: { unit: "\u9879", verb: "\u5305\u542B" },
        set: { unit: "\u9879", verb: "\u5305\u542B" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "\u975E\u6570\u5B57(NaN)" : "\u6570\u5B57";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "\u6570\u7EC4";
            }
            if (data === null) {
              return "\u7A7A\u503C(null)";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u8F93\u5165",
        email: "\u7535\u5B50\u90AE\u4EF6",
        url: "URL",
        emoji: "\u8868\u60C5\u7B26\u53F7",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO\u65E5\u671F\u65F6\u95F4",
        date: "ISO\u65E5\u671F",
        time: "ISO\u65F6\u95F4",
        duration: "ISO\u65F6\u957F",
        ipv4: "IPv4\u5730\u5740",
        ipv6: "IPv6\u5730\u5740",
        cidrv4: "IPv4\u7F51\u6BB5",
        cidrv6: "IPv6\u7F51\u6BB5",
        base64: "base64\u7F16\u7801\u5B57\u7B26\u4E32",
        base64url: "base64url\u7F16\u7801\u5B57\u7B26\u4E32",
        json_string: "JSON\u5B57\u7B26\u4E32",
        e164: "E.164\u53F7\u7801",
        jwt: "JWT",
        template_literal: "\u8F93\u5165"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${issue2.expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${stringifyPrimitive(issue2.values[0])}`;
            return `\u65E0\u6548\u9009\u9879\uFF1A\u671F\u671B\u4EE5\u4E0B\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u4E2A\u5143\u7D20"}`;
            return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.prefix}" \u5F00\u5934`;
            if (_issue.format === "ends_with")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.suffix}" \u7ED3\u5C3E`;
            if (_issue.format === "includes")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u5305\u542B "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u6EE1\u8DB3\u6B63\u5219\u8868\u8FBE\u5F0F ${_issue.pattern}`;
            return `\u65E0\u6548${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u65E0\u6548\u6570\u5B57\uFF1A\u5FC5\u987B\u662F ${issue2.divisor} \u7684\u500D\u6570`;
          case "unrecognized_keys":
            return `\u51FA\u73B0\u672A\u77E5\u7684\u952E(key): ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `${issue2.origin} \u4E2D\u7684\u952E(key)\u65E0\u6548`;
          case "invalid_union":
            return "\u65E0\u6548\u8F93\u5165";
          case "invalid_element":
            return `${issue2.origin} \u4E2D\u5305\u542B\u65E0\u6548\u503C(value)`;
          default:
            return `\u65E0\u6548\u8F93\u5165`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/zh-TW.js
function zh_TW_default() {
  return {
    localeError: error39()
  };
}
var error39;
var init_zh_TW = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/zh-TW.js"() {
    init_util();
    error39 = () => {
      const Sizable = {
        string: { unit: "\u5B57\u5143", verb: "\u64C1\u6709" },
        file: { unit: "\u4F4D\u5143\u7D44", verb: "\u64C1\u6709" },
        array: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" },
        set: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" }
      };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      const parsedType4 = (data) => {
        const t = typeof data;
        switch (t) {
          case "number": {
            return Number.isNaN(data) ? "NaN" : "number";
          }
          case "object": {
            if (Array.isArray(data)) {
              return "array";
            }
            if (data === null) {
              return "null";
            }
            if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
              return data.constructor.name;
            }
          }
        }
        return t;
      };
      const Nouns = {
        regex: "\u8F38\u5165",
        email: "\u90F5\u4EF6\u5730\u5740",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO \u65E5\u671F\u6642\u9593",
        date: "ISO \u65E5\u671F",
        time: "ISO \u6642\u9593",
        duration: "ISO \u671F\u9593",
        ipv4: "IPv4 \u4F4D\u5740",
        ipv6: "IPv6 \u4F4D\u5740",
        cidrv4: "IPv4 \u7BC4\u570D",
        cidrv6: "IPv6 \u7BC4\u570D",
        base64: "base64 \u7DE8\u78BC\u5B57\u4E32",
        base64url: "base64url \u7DE8\u78BC\u5B57\u4E32",
        json_string: "JSON \u5B57\u4E32",
        e164: "E.164 \u6578\u503C",
        jwt: "JWT",
        template_literal: "\u8F38\u5165"
      };
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type":
            return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${issue2.expected}\uFF0C\u4F46\u6536\u5230 ${parsedType4(issue2.input)}`;
          case "invalid_value":
            if (issue2.values.length === 1)
              return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${stringifyPrimitive(issue2.values[0])}`;
            return `\u7121\u6548\u7684\u9078\u9805\uFF1A\u9810\u671F\u70BA\u4EE5\u4E0B\u5176\u4E2D\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            const adj = issue2.inclusive ? "<=" : "<";
            const sizing = getSizing(issue2.origin);
            if (sizing)
              return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u500B\u5143\u7D20"}`;
            return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            const adj = issue2.inclusive ? ">=" : ">";
            const sizing = getSizing(issue2.origin);
            if (sizing) {
              return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
            }
            return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            const _issue = issue2;
            if (_issue.format === "starts_with") {
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.prefix}" \u958B\u982D`;
            }
            if (_issue.format === "ends_with")
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.suffix}" \u7D50\u5C3E`;
            if (_issue.format === "includes")
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u5305\u542B "${_issue.includes}"`;
            if (_issue.format === "regex")
              return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u7B26\u5408\u683C\u5F0F ${_issue.pattern}`;
            return `\u7121\u6548\u7684 ${Nouns[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `\u7121\u6548\u7684\u6578\u5B57\uFF1A\u5FC5\u9808\u70BA ${issue2.divisor} \u7684\u500D\u6578`;
          case "unrecognized_keys":
            return `\u7121\u6CD5\u8B58\u5225\u7684\u9375\u503C${issue2.keys.length > 1 ? "\u5011" : ""}\uFF1A${joinValues(issue2.keys, "\u3001")}`;
          case "invalid_key":
            return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u9375\u503C`;
          case "invalid_union":
            return "\u7121\u6548\u7684\u8F38\u5165\u503C";
          case "invalid_element":
            return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u503C`;
          default:
            return `\u7121\u6548\u7684\u8F38\u5165\u503C`;
        }
      };
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/locales/index.js
var locales_exports = {};
__export(locales_exports, {
  ar: () => ar_default,
  az: () => az_default,
  be: () => be_default,
  ca: () => ca_default,
  cs: () => cs_default,
  de: () => de_default,
  en: () => en_default,
  eo: () => eo_default,
  es: () => es_default,
  fa: () => fa_default,
  fi: () => fi_default,
  fr: () => fr_default,
  frCA: () => fr_CA_default,
  he: () => he_default,
  hu: () => hu_default,
  id: () => id_default,
  it: () => it_default,
  ja: () => ja_default,
  kh: () => kh_default,
  ko: () => ko_default,
  mk: () => mk_default,
  ms: () => ms_default,
  nl: () => nl_default,
  no: () => no_default,
  ota: () => ota_default,
  pl: () => pl_default,
  ps: () => ps_default,
  pt: () => pt_default,
  ru: () => ru_default,
  sl: () => sl_default,
  sv: () => sv_default,
  ta: () => ta_default,
  th: () => th_default,
  tr: () => tr_default,
  ua: () => ua_default,
  ur: () => ur_default,
  vi: () => vi_default,
  zhCN: () => zh_CN_default,
  zhTW: () => zh_TW_default
});
var init_locales = __esm({
  "happ-toggle/tools/node_modules/zod/v4/locales/index.js"() {
    init_ar();
    init_az();
    init_be();
    init_ca();
    init_cs();
    init_de();
    init_en();
    init_eo();
    init_es();
    init_fa();
    init_fi();
    init_fr();
    init_fr_CA();
    init_he();
    init_hu();
    init_id();
    init_it();
    init_ja();
    init_kh();
    init_ko();
    init_mk();
    init_ms();
    init_nl();
    init_no();
    init_ota();
    init_ps();
    init_pl();
    init_pt();
    init_ru();
    init_sl();
    init_sv();
    init_ta();
    init_th();
    init_tr();
    init_ua();
    init_ur();
    init_vi();
    init_zh_CN();
    init_zh_TW();
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/registries.js
function registry() {
  return new $ZodRegistry();
}
var $output, $input, $ZodRegistry, globalRegistry;
var init_registries = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/registries.js"() {
    $output = Symbol("ZodOutput");
    $input = Symbol("ZodInput");
    $ZodRegistry = class {
      constructor() {
        this._map = /* @__PURE__ */ new Map();
        this._idmap = /* @__PURE__ */ new Map();
      }
      add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && typeof meta === "object" && "id" in meta) {
          if (this._idmap.has(meta.id)) {
            throw new Error(`ID ${meta.id} already exists in the registry`);
          }
          this._idmap.set(meta.id, schema);
        }
        return this;
      }
      clear() {
        this._map = /* @__PURE__ */ new Map();
        this._idmap = /* @__PURE__ */ new Map();
        return this;
      }
      remove(schema) {
        const meta = this._map.get(schema);
        if (meta && typeof meta === "object" && "id" in meta) {
          this._idmap.delete(meta.id);
        }
        this._map.delete(schema);
        return this;
      }
      get(schema) {
        const p = schema._zod.parent;
        if (p) {
          const pm = { ...this.get(p) ?? {} };
          delete pm.id;
          return { ...pm, ...this._map.get(schema) };
        }
        return this._map.get(schema);
      }
      has(schema) {
        return this._map.has(schema);
      }
    };
    globalRegistry = /* @__PURE__ */ registry();
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/api.js
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
function _coercedString(Class2, params) {
  return new Class2({
    type: "string",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _coercedNumber(Class2, params) {
  return new Class2({
    type: "number",
    coerce: true,
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _float32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float32",
    ...normalizeParams(params)
  });
}
function _float64(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float64",
    ...normalizeParams(params)
  });
}
function _int32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "int32",
    ...normalizeParams(params)
  });
}
function _uint32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "uint32",
    ...normalizeParams(params)
  });
}
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _bigint(Class2, params) {
  return new Class2({
    type: "bigint",
    ...normalizeParams(params)
  });
}
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _int64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "int64",
    ...normalizeParams(params)
  });
}
function _uint64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "uint64",
    ...normalizeParams(params)
  });
}
function _symbol(Class2, params) {
  return new Class2({
    type: "symbol",
    ...normalizeParams(params)
  });
}
function _undefined2(Class2, params) {
  return new Class2({
    type: "undefined",
    ...normalizeParams(params)
  });
}
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
function _void(Class2, params) {
  return new Class2({
    type: "void",
    ...normalizeParams(params)
  });
}
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params)
  });
}
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _nan(Class2, params) {
  return new Class2({
    type: "nan",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _positive(params) {
  return _gt(0, params);
}
function _negative(params) {
  return _lt(0, params);
}
function _nonpositive(params) {
  return _lte(0, params);
}
function _nonnegative(params) {
  return _gte(0, params);
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxSize(maximum, params) {
  return new $ZodCheckMaxSize({
    check: "max_size",
    ...normalizeParams(params),
    maximum
  });
}
function _minSize(minimum, params) {
  return new $ZodCheckMinSize({
    check: "min_size",
    ...normalizeParams(params),
    minimum
  });
}
function _size(size, params) {
  return new $ZodCheckSizeEquals({
    check: "size_equals",
    ...normalizeParams(params),
    size
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _property(property, schema, params) {
  return new $ZodCheckProperty({
    check: "property",
    property,
    schema,
    ...normalizeParams(params)
  });
}
function _mime(types, params) {
  return new $ZodCheckMimeType({
    check: "mime_type",
    mime: types,
    ...normalizeParams(params)
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
function _union(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
function _discriminatedUnion(Class2, discriminator, options, params) {
  return new Class2({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params)
  });
}
function _intersection(Class2, left, right) {
  return new Class2({
    type: "intersection",
    left,
    right
  });
}
function _tuple(Class2, items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new Class2({
    type: "tuple",
    items,
    rest,
    ...normalizeParams(params)
  });
}
function _record(Class2, keyType, valueType, params) {
  return new Class2({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
function _map(Class2, keyType, valueType, params) {
  return new Class2({
    type: "map",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
function _set(Class2, valueType, params) {
  return new Class2({
    type: "set",
    valueType,
    ...normalizeParams(params)
  });
}
function _enum(Class2, values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
function _nativeEnum(Class2, entries, params) {
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
function _literal(Class2, value, params) {
  return new Class2({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
function _file(Class2, params) {
  return new Class2({
    type: "file",
    ...normalizeParams(params)
  });
}
function _transform(Class2, fn) {
  return new Class2({
    type: "transform",
    transform: fn
  });
}
function _optional(Class2, innerType) {
  return new Class2({
    type: "optional",
    innerType
  });
}
function _nullable(Class2, innerType) {
  return new Class2({
    type: "nullable",
    innerType
  });
}
function _default(Class2, innerType, defaultValue) {
  return new Class2({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
function _nonoptional(Class2, innerType, params) {
  return new Class2({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
function _success(Class2, innerType) {
  return new Class2({
    type: "success",
    innerType
  });
}
function _catch(Class2, innerType, catchValue) {
  return new Class2({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
function _pipe(Class2, in_, out) {
  return new Class2({
    type: "pipe",
    in: in_,
    out
  });
}
function _readonly(Class2, innerType) {
  return new Class2({
    type: "readonly",
    innerType
  });
}
function _templateLiteral(Class2, parts, params) {
  return new Class2({
    type: "template_literal",
    parts,
    ...normalizeParams(params)
  });
}
function _lazy(Class2, getter) {
  return new Class2({
    type: "lazy",
    getter
  });
}
function _promise(Class2, innerType) {
  return new Class2({
    type: "promise",
    innerType
  });
}
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _stringbool(Classes, _params) {
  const params = normalizeParams(_params);
  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
    falsyArray = falsyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
  }
  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);
  const _Pipe = Classes.Pipe ?? $ZodPipe;
  const _Boolean = Classes.Boolean ?? $ZodBoolean;
  const _String = Classes.String ?? $ZodString;
  const _Transform = Classes.Transform ?? $ZodTransform;
  const tx = new _Transform({
    type: "transform",
    transform: (input, payload) => {
      let data = input;
      if (params.case !== "sensitive")
        data = data.toLowerCase();
      if (truthySet.has(data)) {
        return true;
      } else if (falsySet.has(data)) {
        return false;
      } else {
        payload.issues.push({
          code: "invalid_value",
          expected: "stringbool",
          values: [...truthySet, ...falsySet],
          input: payload.value,
          inst: tx
        });
        return {};
      }
    },
    error: params.error
  });
  const innerPipe = new _Pipe({
    type: "pipe",
    in: new _String({ type: "string", error: params.error }),
    out: tx,
    error: params.error
  });
  const outerPipe = new _Pipe({
    type: "pipe",
    in: innerPipe,
    out: new _Boolean({
      type: "boolean",
      error: params.error
    }),
    error: params.error
  });
  return outerPipe;
}
function _stringFormat(Class2, format, fnOrRegex, _params = {}) {
  const params = normalizeParams(_params);
  const def = {
    ...normalizeParams(_params),
    check: "string_format",
    type: "string",
    format,
    fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
    ...params
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }
  const inst = new Class2(def);
  return inst;
}
var TimePrecision;
var init_api = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/api.js"() {
    init_checks();
    init_schemas();
    init_util();
    TimePrecision = {
      Any: null,
      Minute: -1,
      Second: 0,
      Millisecond: 3,
      Microsecond: 6
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/function.js
function _function(params) {
  return new $ZodFunction({
    type: "function",
    input: Array.isArray(params?.input) ? _tuple($ZodTuple, params?.input) : params?.input ?? _array($ZodArray, _unknown($ZodUnknown)),
    output: params?.output ?? _unknown($ZodUnknown)
  });
}
var $ZodFunction;
var init_function = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/function.js"() {
    init_api();
    init_parse();
    init_schemas();
    init_schemas();
    $ZodFunction = class {
      constructor(def) {
        this._def = def;
        this.def = def;
      }
      implement(func) {
        if (typeof func !== "function") {
          throw new Error("implement() must be called with a function");
        }
        const impl = ((...args) => {
          const parsedArgs = this._def.input ? parse(this._def.input, args, void 0, { callee: impl }) : args;
          if (!Array.isArray(parsedArgs)) {
            throw new Error("Invalid arguments schema: not an array or tuple schema.");
          }
          const output = func(...parsedArgs);
          return this._def.output ? parse(this._def.output, output, void 0, { callee: impl }) : output;
        });
        return impl;
      }
      implementAsync(func) {
        if (typeof func !== "function") {
          throw new Error("implement() must be called with a function");
        }
        const impl = (async (...args) => {
          const parsedArgs = this._def.input ? await parseAsync(this._def.input, args, void 0, { callee: impl }) : args;
          if (!Array.isArray(parsedArgs)) {
            throw new Error("Invalid arguments schema: not an array or tuple schema.");
          }
          const output = await func(...parsedArgs);
          return this._def.output ? parseAsync(this._def.output, output, void 0, { callee: impl }) : output;
        });
        return impl;
      }
      input(...args) {
        const F = this.constructor;
        if (Array.isArray(args[0])) {
          return new F({
            type: "function",
            input: new $ZodTuple({
              type: "tuple",
              items: args[0],
              rest: args[1]
            }),
            output: this._def.output
          });
        }
        return new F({
          type: "function",
          input: args[0],
          output: this._def.output
        });
      }
      output(output) {
        const F = this.constructor;
        return new F({
          type: "function",
          input: this._def.input,
          output
        });
      }
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/to-json-schema.js
function toJSONSchema(input, _params) {
  if (input instanceof $ZodRegistry) {
    const gen2 = new JSONSchemaGenerator(_params);
    const defs = {};
    for (const entry of input._idmap.entries()) {
      const [_, schema] = entry;
      gen2.process(schema);
    }
    const schemas = {};
    const external = {
      registry: input,
      uri: _params?.uri,
      defs
    };
    for (const entry of input._idmap.entries()) {
      const [key, schema] = entry;
      schemas[key] = gen2.emit(schema, {
        ..._params,
        external
      });
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = gen2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const gen = new JSONSchemaGenerator(_params);
  gen.process(input);
  return gen.emit(input, _params);
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const schema = _schema;
  const def = schema._zod.def;
  switch (def.type) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "date":
    case "symbol":
    case "undefined":
    case "null":
    case "any":
    case "unknown":
    case "never":
    case "void":
    case "literal":
    case "enum":
    case "nan":
    case "file":
    case "template_literal":
      return false;
    case "array": {
      return isTransforming(def.element, ctx);
    }
    case "object": {
      for (const key in def.shape) {
        if (isTransforming(def.shape[key], ctx))
          return true;
      }
      return false;
    }
    case "union": {
      for (const option2 of def.options) {
        if (isTransforming(option2, ctx))
          return true;
      }
      return false;
    }
    case "intersection": {
      return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    case "tuple": {
      for (const item of def.items) {
        if (isTransforming(item, ctx))
          return true;
      }
      if (def.rest && isTransforming(def.rest, ctx))
        return true;
      return false;
    }
    case "record": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "map": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "set": {
      return isTransforming(def.valueType, ctx);
    }
    // inner types
    case "promise":
    case "optional":
    case "nonoptional":
    case "nullable":
    case "readonly":
      return isTransforming(def.innerType, ctx);
    case "lazy":
      return isTransforming(def.getter(), ctx);
    case "default": {
      return isTransforming(def.innerType, ctx);
    }
    case "prefault": {
      return isTransforming(def.innerType, ctx);
    }
    case "custom": {
      return false;
    }
    case "transform": {
      return true;
    }
    case "pipe": {
      return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    case "success": {
      return false;
    }
    case "catch": {
      return false;
    }
    default:
      def;
  }
  throw new Error(`Unknown schema type: ${def.type}`);
}
var JSONSchemaGenerator;
var init_to_json_schema = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/to-json-schema.js"() {
    init_registries();
    init_util();
    JSONSchemaGenerator = class {
      constructor(params) {
        this.counter = 0;
        this.metadataRegistry = params?.metadata ?? globalRegistry;
        this.target = params?.target ?? "draft-2020-12";
        this.unrepresentable = params?.unrepresentable ?? "throw";
        this.override = params?.override ?? (() => {
        });
        this.io = params?.io ?? "output";
        this.seen = /* @__PURE__ */ new Map();
      }
      process(schema, _params = { path: [], schemaPath: [] }) {
        var _a;
        const def = schema._zod.def;
        const formatMap = {
          guid: "uuid",
          url: "uri",
          datetime: "date-time",
          json_string: "json-string",
          regex: ""
          // do not set
        };
        const seen = this.seen.get(schema);
        if (seen) {
          seen.count++;
          const isCycle = _params.schemaPath.includes(schema);
          if (isCycle) {
            seen.cycle = _params.path;
          }
          return seen.schema;
        }
        const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
        this.seen.set(schema, result);
        const overrideSchema = schema._zod.toJSONSchema?.();
        if (overrideSchema) {
          result.schema = overrideSchema;
        } else {
          const params = {
            ..._params,
            schemaPath: [..._params.schemaPath, schema],
            path: _params.path
          };
          const parent = schema._zod.parent;
          if (parent) {
            result.ref = parent;
            this.process(parent, params);
            this.seen.get(parent).isParent = true;
          } else {
            const _json = result.schema;
            switch (def.type) {
              case "string": {
                const json2 = _json;
                json2.type = "string";
                const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
                if (typeof minimum === "number")
                  json2.minLength = minimum;
                if (typeof maximum === "number")
                  json2.maxLength = maximum;
                if (format) {
                  json2.format = formatMap[format] ?? format;
                  if (json2.format === "")
                    delete json2.format;
                }
                if (contentEncoding)
                  json2.contentEncoding = contentEncoding;
                if (patterns && patterns.size > 0) {
                  const regexes = [...patterns];
                  if (regexes.length === 1)
                    json2.pattern = regexes[0].source;
                  else if (regexes.length > 1) {
                    result.schema.allOf = [
                      ...regexes.map((regex) => ({
                        ...this.target === "draft-7" ? { type: "string" } : {},
                        pattern: regex.source
                      }))
                    ];
                  }
                }
                break;
              }
              case "number": {
                const json2 = _json;
                const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
                if (typeof format === "string" && format.includes("int"))
                  json2.type = "integer";
                else
                  json2.type = "number";
                if (typeof exclusiveMinimum === "number")
                  json2.exclusiveMinimum = exclusiveMinimum;
                if (typeof minimum === "number") {
                  json2.minimum = minimum;
                  if (typeof exclusiveMinimum === "number") {
                    if (exclusiveMinimum >= minimum)
                      delete json2.minimum;
                    else
                      delete json2.exclusiveMinimum;
                  }
                }
                if (typeof exclusiveMaximum === "number")
                  json2.exclusiveMaximum = exclusiveMaximum;
                if (typeof maximum === "number") {
                  json2.maximum = maximum;
                  if (typeof exclusiveMaximum === "number") {
                    if (exclusiveMaximum <= maximum)
                      delete json2.maximum;
                    else
                      delete json2.exclusiveMaximum;
                  }
                }
                if (typeof multipleOf === "number")
                  json2.multipleOf = multipleOf;
                break;
              }
              case "boolean": {
                const json2 = _json;
                json2.type = "boolean";
                break;
              }
              case "bigint": {
                if (this.unrepresentable === "throw") {
                  throw new Error("BigInt cannot be represented in JSON Schema");
                }
                break;
              }
              case "symbol": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Symbols cannot be represented in JSON Schema");
                }
                break;
              }
              case "null": {
                _json.type = "null";
                break;
              }
              case "any": {
                break;
              }
              case "unknown": {
                break;
              }
              case "undefined": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Undefined cannot be represented in JSON Schema");
                }
                break;
              }
              case "void": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Void cannot be represented in JSON Schema");
                }
                break;
              }
              case "never": {
                _json.not = {};
                break;
              }
              case "date": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Date cannot be represented in JSON Schema");
                }
                break;
              }
              case "array": {
                const json2 = _json;
                const { minimum, maximum } = schema._zod.bag;
                if (typeof minimum === "number")
                  json2.minItems = minimum;
                if (typeof maximum === "number")
                  json2.maxItems = maximum;
                json2.type = "array";
                json2.items = this.process(def.element, { ...params, path: [...params.path, "items"] });
                break;
              }
              case "object": {
                const json2 = _json;
                json2.type = "object";
                json2.properties = {};
                const shape = def.shape;
                for (const key in shape) {
                  json2.properties[key] = this.process(shape[key], {
                    ...params,
                    path: [...params.path, "properties", key]
                  });
                }
                const allKeys = new Set(Object.keys(shape));
                const requiredKeys = new Set([...allKeys].filter((key) => {
                  const v = def.shape[key]._zod;
                  if (this.io === "input") {
                    return v.optin === void 0;
                  } else {
                    return v.optout === void 0;
                  }
                }));
                if (requiredKeys.size > 0) {
                  json2.required = Array.from(requiredKeys);
                }
                if (def.catchall?._zod.def.type === "never") {
                  json2.additionalProperties = false;
                } else if (!def.catchall) {
                  if (this.io === "output")
                    json2.additionalProperties = false;
                } else if (def.catchall) {
                  json2.additionalProperties = this.process(def.catchall, {
                    ...params,
                    path: [...params.path, "additionalProperties"]
                  });
                }
                break;
              }
              case "union": {
                const json2 = _json;
                json2.anyOf = def.options.map((x, i) => this.process(x, {
                  ...params,
                  path: [...params.path, "anyOf", i]
                }));
                break;
              }
              case "intersection": {
                const json2 = _json;
                const a = this.process(def.left, {
                  ...params,
                  path: [...params.path, "allOf", 0]
                });
                const b = this.process(def.right, {
                  ...params,
                  path: [...params.path, "allOf", 1]
                });
                const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
                const allOf = [
                  ...isSimpleIntersection(a) ? a.allOf : [a],
                  ...isSimpleIntersection(b) ? b.allOf : [b]
                ];
                json2.allOf = allOf;
                break;
              }
              case "tuple": {
                const json2 = _json;
                json2.type = "array";
                const prefixItems = def.items.map((x, i) => this.process(x, { ...params, path: [...params.path, "prefixItems", i] }));
                if (this.target === "draft-2020-12") {
                  json2.prefixItems = prefixItems;
                } else {
                  json2.items = prefixItems;
                }
                if (def.rest) {
                  const rest = this.process(def.rest, {
                    ...params,
                    path: [...params.path, "items"]
                  });
                  if (this.target === "draft-2020-12") {
                    json2.items = rest;
                  } else {
                    json2.additionalItems = rest;
                  }
                }
                if (def.rest) {
                  json2.items = this.process(def.rest, {
                    ...params,
                    path: [...params.path, "items"]
                  });
                }
                const { minimum, maximum } = schema._zod.bag;
                if (typeof minimum === "number")
                  json2.minItems = minimum;
                if (typeof maximum === "number")
                  json2.maxItems = maximum;
                break;
              }
              case "record": {
                const json2 = _json;
                json2.type = "object";
                json2.propertyNames = this.process(def.keyType, { ...params, path: [...params.path, "propertyNames"] });
                json2.additionalProperties = this.process(def.valueType, {
                  ...params,
                  path: [...params.path, "additionalProperties"]
                });
                break;
              }
              case "map": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Map cannot be represented in JSON Schema");
                }
                break;
              }
              case "set": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Set cannot be represented in JSON Schema");
                }
                break;
              }
              case "enum": {
                const json2 = _json;
                const values = getEnumValues(def.entries);
                if (values.every((v) => typeof v === "number"))
                  json2.type = "number";
                if (values.every((v) => typeof v === "string"))
                  json2.type = "string";
                json2.enum = values;
                break;
              }
              case "literal": {
                const json2 = _json;
                const vals = [];
                for (const val of def.values) {
                  if (val === void 0) {
                    if (this.unrepresentable === "throw") {
                      throw new Error("Literal `undefined` cannot be represented in JSON Schema");
                    } else {
                    }
                  } else if (typeof val === "bigint") {
                    if (this.unrepresentable === "throw") {
                      throw new Error("BigInt literals cannot be represented in JSON Schema");
                    } else {
                      vals.push(Number(val));
                    }
                  } else {
                    vals.push(val);
                  }
                }
                if (vals.length === 0) {
                } else if (vals.length === 1) {
                  const val = vals[0];
                  json2.type = val === null ? "null" : typeof val;
                  json2.const = val;
                } else {
                  if (vals.every((v) => typeof v === "number"))
                    json2.type = "number";
                  if (vals.every((v) => typeof v === "string"))
                    json2.type = "string";
                  if (vals.every((v) => typeof v === "boolean"))
                    json2.type = "string";
                  if (vals.every((v) => v === null))
                    json2.type = "null";
                  json2.enum = vals;
                }
                break;
              }
              case "file": {
                const json2 = _json;
                const file2 = {
                  type: "string",
                  format: "binary",
                  contentEncoding: "binary"
                };
                const { minimum, maximum, mime } = schema._zod.bag;
                if (minimum !== void 0)
                  file2.minLength = minimum;
                if (maximum !== void 0)
                  file2.maxLength = maximum;
                if (mime) {
                  if (mime.length === 1) {
                    file2.contentMediaType = mime[0];
                    Object.assign(json2, file2);
                  } else {
                    json2.anyOf = mime.map((m) => {
                      const mFile = { ...file2, contentMediaType: m };
                      return mFile;
                    });
                  }
                } else {
                  Object.assign(json2, file2);
                }
                break;
              }
              case "transform": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Transforms cannot be represented in JSON Schema");
                }
                break;
              }
              case "nullable": {
                const inner = this.process(def.innerType, params);
                _json.anyOf = [inner, { type: "null" }];
                break;
              }
              case "nonoptional": {
                this.process(def.innerType, params);
                result.ref = def.innerType;
                break;
              }
              case "success": {
                const json2 = _json;
                json2.type = "boolean";
                break;
              }
              case "default": {
                this.process(def.innerType, params);
                result.ref = def.innerType;
                _json.default = JSON.parse(JSON.stringify(def.defaultValue));
                break;
              }
              case "prefault": {
                this.process(def.innerType, params);
                result.ref = def.innerType;
                if (this.io === "input")
                  _json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
                break;
              }
              case "catch": {
                this.process(def.innerType, params);
                result.ref = def.innerType;
                let catchValue;
                try {
                  catchValue = def.catchValue(void 0);
                } catch {
                  throw new Error("Dynamic catch values are not supported in JSON Schema");
                }
                _json.default = catchValue;
                break;
              }
              case "nan": {
                if (this.unrepresentable === "throw") {
                  throw new Error("NaN cannot be represented in JSON Schema");
                }
                break;
              }
              case "template_literal": {
                const json2 = _json;
                const pattern = schema._zod.pattern;
                if (!pattern)
                  throw new Error("Pattern not found in template literal");
                json2.type = "string";
                json2.pattern = pattern.source;
                break;
              }
              case "pipe": {
                const innerType = this.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
                this.process(innerType, params);
                result.ref = innerType;
                break;
              }
              case "readonly": {
                this.process(def.innerType, params);
                result.ref = def.innerType;
                _json.readOnly = true;
                break;
              }
              // passthrough types
              case "promise": {
                this.process(def.innerType, params);
                result.ref = def.innerType;
                break;
              }
              case "optional": {
                this.process(def.innerType, params);
                result.ref = def.innerType;
                break;
              }
              case "lazy": {
                const innerType = schema._zod.innerType;
                this.process(innerType, params);
                result.ref = innerType;
                break;
              }
              case "custom": {
                if (this.unrepresentable === "throw") {
                  throw new Error("Custom types cannot be represented in JSON Schema");
                }
                break;
              }
              default: {
                def;
              }
            }
          }
        }
        const meta = this.metadataRegistry.get(schema);
        if (meta)
          Object.assign(result.schema, meta);
        if (this.io === "input" && isTransforming(schema)) {
          delete result.schema.examples;
          delete result.schema.default;
        }
        if (this.io === "input" && result.schema._prefault)
          (_a = result.schema).default ?? (_a.default = result.schema._prefault);
        delete result.schema._prefault;
        const _result = this.seen.get(schema);
        return _result.schema;
      }
      emit(schema, _params) {
        const params = {
          cycles: _params?.cycles ?? "ref",
          reused: _params?.reused ?? "inline",
          // unrepresentable: _params?.unrepresentable ?? "throw",
          // uri: _params?.uri ?? ((id) => `${id}`),
          external: _params?.external ?? void 0
        };
        const root = this.seen.get(schema);
        if (!root)
          throw new Error("Unprocessed schema. This is a bug in Zod.");
        const makeURI = (entry) => {
          const defsSegment = this.target === "draft-2020-12" ? "$defs" : "definitions";
          if (params.external) {
            const externalId = params.external.registry.get(entry[0])?.id;
            const uriGenerator = params.external.uri ?? ((id2) => id2);
            if (externalId) {
              return { ref: uriGenerator(externalId) };
            }
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${this.counter++}`;
            entry[1].defId = id;
            return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
          }
          if (entry[1] === root) {
            return { ref: "#" };
          }
          const uriPrefix = `#`;
          const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
          const defId = entry[1].schema.id ?? `__schema${this.counter++}`;
          return { defId, ref: defUriPrefix + defId };
        };
        const extractToDef = (entry) => {
          if (entry[1].schema.$ref) {
            return;
          }
          const seen = entry[1];
          const { ref, defId } = makeURI(entry);
          seen.def = { ...seen.schema };
          if (defId)
            seen.defId = defId;
          const schema2 = seen.schema;
          for (const key in schema2) {
            delete schema2[key];
          }
          schema2.$ref = ref;
        };
        if (params.cycles === "throw") {
          for (const entry of this.seen.entries()) {
            const seen = entry[1];
            if (seen.cycle) {
              throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
            }
          }
        }
        for (const entry of this.seen.entries()) {
          const seen = entry[1];
          if (schema === entry[0]) {
            extractToDef(entry);
            continue;
          }
          if (params.external) {
            const ext = params.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
              extractToDef(entry);
              continue;
            }
          }
          const id = this.metadataRegistry.get(entry[0])?.id;
          if (id) {
            extractToDef(entry);
            continue;
          }
          if (seen.cycle) {
            extractToDef(entry);
            continue;
          }
          if (seen.count > 1) {
            if (params.reused === "ref") {
              extractToDef(entry);
              continue;
            }
          }
        }
        const flattenRef = (zodSchema, params2) => {
          const seen = this.seen.get(zodSchema);
          const schema2 = seen.def ?? seen.schema;
          const _cached = { ...schema2 };
          if (seen.ref === null) {
            return;
          }
          const ref = seen.ref;
          seen.ref = null;
          if (ref) {
            flattenRef(ref, params2);
            const refSchema = this.seen.get(ref).schema;
            if (refSchema.$ref && params2.target === "draft-7") {
              schema2.allOf = schema2.allOf ?? [];
              schema2.allOf.push(refSchema);
            } else {
              Object.assign(schema2, refSchema);
              Object.assign(schema2, _cached);
            }
          }
          if (!seen.isParent)
            this.override({
              zodSchema,
              jsonSchema: schema2,
              path: seen.path ?? []
            });
        };
        for (const entry of [...this.seen.entries()].reverse()) {
          flattenRef(entry[0], { target: this.target });
        }
        const result = {};
        if (this.target === "draft-2020-12") {
          result.$schema = "https://json-schema.org/draft/2020-12/schema";
        } else if (this.target === "draft-7") {
          result.$schema = "http://json-schema.org/draft-07/schema#";
        } else {
          console.warn(`Invalid target: ${this.target}`);
        }
        if (params.external?.uri) {
          const id = params.external.registry.get(schema)?.id;
          if (!id)
            throw new Error("Schema is missing an `id` property");
          result.$id = params.external.uri(id);
        }
        Object.assign(result, root.def);
        const defs = params.external?.defs ?? {};
        for (const entry of this.seen.entries()) {
          const seen = entry[1];
          if (seen.def && seen.defId) {
            defs[seen.defId] = seen.def;
          }
        }
        if (params.external) {
        } else {
          if (Object.keys(defs).length > 0) {
            if (this.target === "draft-2020-12") {
              result.$defs = defs;
            } else {
              result.definitions = defs;
            }
          }
        }
        try {
          return JSON.parse(JSON.stringify(result));
        } catch (_err) {
          throw new Error("Error converting schema to JSON.");
        }
      }
    };
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/json-schema.js
var json_schema_exports = {};
var init_json_schema = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/json-schema.js"() {
  }
});

// happ-toggle/tools/node_modules/zod/v4/core/index.js
var core_exports2 = {};
__export(core_exports2, {
  $ZodAny: () => $ZodAny,
  $ZodArray: () => $ZodArray,
  $ZodAsyncError: () => $ZodAsyncError,
  $ZodBase64: () => $ZodBase64,
  $ZodBase64URL: () => $ZodBase64URL,
  $ZodBigInt: () => $ZodBigInt,
  $ZodBigIntFormat: () => $ZodBigIntFormat,
  $ZodBoolean: () => $ZodBoolean,
  $ZodCIDRv4: () => $ZodCIDRv4,
  $ZodCIDRv6: () => $ZodCIDRv6,
  $ZodCUID: () => $ZodCUID,
  $ZodCUID2: () => $ZodCUID2,
  $ZodCatch: () => $ZodCatch,
  $ZodCheck: () => $ZodCheck,
  $ZodCheckBigIntFormat: () => $ZodCheckBigIntFormat,
  $ZodCheckEndsWith: () => $ZodCheckEndsWith,
  $ZodCheckGreaterThan: () => $ZodCheckGreaterThan,
  $ZodCheckIncludes: () => $ZodCheckIncludes,
  $ZodCheckLengthEquals: () => $ZodCheckLengthEquals,
  $ZodCheckLessThan: () => $ZodCheckLessThan,
  $ZodCheckLowerCase: () => $ZodCheckLowerCase,
  $ZodCheckMaxLength: () => $ZodCheckMaxLength,
  $ZodCheckMaxSize: () => $ZodCheckMaxSize,
  $ZodCheckMimeType: () => $ZodCheckMimeType,
  $ZodCheckMinLength: () => $ZodCheckMinLength,
  $ZodCheckMinSize: () => $ZodCheckMinSize,
  $ZodCheckMultipleOf: () => $ZodCheckMultipleOf,
  $ZodCheckNumberFormat: () => $ZodCheckNumberFormat,
  $ZodCheckOverwrite: () => $ZodCheckOverwrite,
  $ZodCheckProperty: () => $ZodCheckProperty,
  $ZodCheckRegex: () => $ZodCheckRegex,
  $ZodCheckSizeEquals: () => $ZodCheckSizeEquals,
  $ZodCheckStartsWith: () => $ZodCheckStartsWith,
  $ZodCheckStringFormat: () => $ZodCheckStringFormat,
  $ZodCheckUpperCase: () => $ZodCheckUpperCase,
  $ZodCustom: () => $ZodCustom,
  $ZodCustomStringFormat: () => $ZodCustomStringFormat,
  $ZodDate: () => $ZodDate,
  $ZodDefault: () => $ZodDefault,
  $ZodDiscriminatedUnion: () => $ZodDiscriminatedUnion,
  $ZodE164: () => $ZodE164,
  $ZodEmail: () => $ZodEmail,
  $ZodEmoji: () => $ZodEmoji,
  $ZodEnum: () => $ZodEnum,
  $ZodError: () => $ZodError,
  $ZodFile: () => $ZodFile,
  $ZodFunction: () => $ZodFunction,
  $ZodGUID: () => $ZodGUID,
  $ZodIPv4: () => $ZodIPv4,
  $ZodIPv6: () => $ZodIPv6,
  $ZodISODate: () => $ZodISODate,
  $ZodISODateTime: () => $ZodISODateTime,
  $ZodISODuration: () => $ZodISODuration,
  $ZodISOTime: () => $ZodISOTime,
  $ZodIntersection: () => $ZodIntersection,
  $ZodJWT: () => $ZodJWT,
  $ZodKSUID: () => $ZodKSUID,
  $ZodLazy: () => $ZodLazy,
  $ZodLiteral: () => $ZodLiteral,
  $ZodMap: () => $ZodMap,
  $ZodNaN: () => $ZodNaN,
  $ZodNanoID: () => $ZodNanoID,
  $ZodNever: () => $ZodNever,
  $ZodNonOptional: () => $ZodNonOptional,
  $ZodNull: () => $ZodNull,
  $ZodNullable: () => $ZodNullable,
  $ZodNumber: () => $ZodNumber,
  $ZodNumberFormat: () => $ZodNumberFormat,
  $ZodObject: () => $ZodObject,
  $ZodOptional: () => $ZodOptional,
  $ZodPipe: () => $ZodPipe,
  $ZodPrefault: () => $ZodPrefault,
  $ZodPromise: () => $ZodPromise,
  $ZodReadonly: () => $ZodReadonly,
  $ZodRealError: () => $ZodRealError,
  $ZodRecord: () => $ZodRecord,
  $ZodRegistry: () => $ZodRegistry,
  $ZodSet: () => $ZodSet,
  $ZodString: () => $ZodString,
  $ZodStringFormat: () => $ZodStringFormat,
  $ZodSuccess: () => $ZodSuccess,
  $ZodSymbol: () => $ZodSymbol,
  $ZodTemplateLiteral: () => $ZodTemplateLiteral,
  $ZodTransform: () => $ZodTransform,
  $ZodTuple: () => $ZodTuple,
  $ZodType: () => $ZodType,
  $ZodULID: () => $ZodULID,
  $ZodURL: () => $ZodURL,
  $ZodUUID: () => $ZodUUID,
  $ZodUndefined: () => $ZodUndefined,
  $ZodUnion: () => $ZodUnion,
  $ZodUnknown: () => $ZodUnknown,
  $ZodVoid: () => $ZodVoid,
  $ZodXID: () => $ZodXID,
  $brand: () => $brand,
  $constructor: () => $constructor,
  $input: () => $input,
  $output: () => $output,
  Doc: () => Doc,
  JSONSchema: () => json_schema_exports,
  JSONSchemaGenerator: () => JSONSchemaGenerator,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  _any: () => _any,
  _array: () => _array,
  _base64: () => _base64,
  _base64url: () => _base64url,
  _bigint: () => _bigint,
  _boolean: () => _boolean,
  _catch: () => _catch,
  _cidrv4: () => _cidrv4,
  _cidrv6: () => _cidrv6,
  _coercedBigint: () => _coercedBigint,
  _coercedBoolean: () => _coercedBoolean,
  _coercedDate: () => _coercedDate,
  _coercedNumber: () => _coercedNumber,
  _coercedString: () => _coercedString,
  _cuid: () => _cuid,
  _cuid2: () => _cuid2,
  _custom: () => _custom,
  _date: () => _date,
  _default: () => _default,
  _discriminatedUnion: () => _discriminatedUnion,
  _e164: () => _e164,
  _email: () => _email,
  _emoji: () => _emoji2,
  _endsWith: () => _endsWith,
  _enum: () => _enum,
  _file: () => _file,
  _float32: () => _float32,
  _float64: () => _float64,
  _gt: () => _gt,
  _gte: () => _gte,
  _guid: () => _guid,
  _includes: () => _includes,
  _int: () => _int,
  _int32: () => _int32,
  _int64: () => _int64,
  _intersection: () => _intersection,
  _ipv4: () => _ipv4,
  _ipv6: () => _ipv6,
  _isoDate: () => _isoDate,
  _isoDateTime: () => _isoDateTime,
  _isoDuration: () => _isoDuration,
  _isoTime: () => _isoTime,
  _jwt: () => _jwt,
  _ksuid: () => _ksuid,
  _lazy: () => _lazy,
  _length: () => _length,
  _literal: () => _literal,
  _lowercase: () => _lowercase,
  _lt: () => _lt,
  _lte: () => _lte,
  _map: () => _map,
  _max: () => _lte,
  _maxLength: () => _maxLength,
  _maxSize: () => _maxSize,
  _mime: () => _mime,
  _min: () => _gte,
  _minLength: () => _minLength,
  _minSize: () => _minSize,
  _multipleOf: () => _multipleOf,
  _nan: () => _nan,
  _nanoid: () => _nanoid,
  _nativeEnum: () => _nativeEnum,
  _negative: () => _negative,
  _never: () => _never,
  _nonnegative: () => _nonnegative,
  _nonoptional: () => _nonoptional,
  _nonpositive: () => _nonpositive,
  _normalize: () => _normalize,
  _null: () => _null2,
  _nullable: () => _nullable,
  _number: () => _number,
  _optional: () => _optional,
  _overwrite: () => _overwrite,
  _parse: () => _parse,
  _parseAsync: () => _parseAsync,
  _pipe: () => _pipe,
  _positive: () => _positive,
  _promise: () => _promise,
  _property: () => _property,
  _readonly: () => _readonly,
  _record: () => _record,
  _refine: () => _refine,
  _regex: () => _regex,
  _safeParse: () => _safeParse,
  _safeParseAsync: () => _safeParseAsync,
  _set: () => _set,
  _size: () => _size,
  _startsWith: () => _startsWith,
  _string: () => _string,
  _stringFormat: () => _stringFormat,
  _stringbool: () => _stringbool,
  _success: () => _success,
  _symbol: () => _symbol,
  _templateLiteral: () => _templateLiteral,
  _toLowerCase: () => _toLowerCase,
  _toUpperCase: () => _toUpperCase,
  _transform: () => _transform,
  _trim: () => _trim,
  _tuple: () => _tuple,
  _uint32: () => _uint32,
  _uint64: () => _uint64,
  _ulid: () => _ulid,
  _undefined: () => _undefined2,
  _union: () => _union,
  _unknown: () => _unknown,
  _uppercase: () => _uppercase,
  _url: () => _url,
  _uuid: () => _uuid,
  _uuidv4: () => _uuidv4,
  _uuidv6: () => _uuidv6,
  _uuidv7: () => _uuidv7,
  _void: () => _void,
  _xid: () => _xid,
  clone: () => clone,
  config: () => config,
  flattenError: () => flattenError,
  formatError: () => formatError,
  function: () => _function,
  globalConfig: () => globalConfig,
  globalRegistry: () => globalRegistry,
  isValidBase64: () => isValidBase64,
  isValidBase64URL: () => isValidBase64URL,
  isValidJWT: () => isValidJWT,
  locales: () => locales_exports,
  parse: () => parse,
  parseAsync: () => parseAsync,
  prettifyError: () => prettifyError,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeParse: () => safeParse,
  safeParseAsync: () => safeParseAsync,
  toDotPath: () => toDotPath,
  toJSONSchema: () => toJSONSchema,
  treeifyError: () => treeifyError,
  util: () => util_exports,
  version: () => version
});
var init_core2 = __esm({
  "happ-toggle/tools/node_modules/zod/v4/core/index.js"() {
    init_core();
    init_parse();
    init_errors();
    init_schemas();
    init_checks();
    init_versions();
    init_util();
    init_regexes();
    init_locales();
    init_registries();
    init_doc();
    init_function();
    init_api();
    init_to_json_schema();
    init_json_schema();
  }
});

// happ-toggle/tools/node_modules/zod/v4/mini/parse.js
var init_parse2 = __esm({
  "happ-toggle/tools/node_modules/zod/v4/mini/parse.js"() {
    init_core2();
  }
});

// happ-toggle/tools/node_modules/zod/v4/mini/schemas.js
function string2(params) {
  return _string(ZodMiniString, params);
}
function email2(params) {
  return _email(ZodMiniEmail, params);
}
function guid2(params) {
  return _guid(ZodMiniGUID, params);
}
function uuid2(params) {
  return _uuid(ZodMiniUUID, params);
}
function uuidv4(params) {
  return _uuidv4(ZodMiniUUID, params);
}
function uuidv6(params) {
  return _uuidv6(ZodMiniUUID, params);
}
function uuidv7(params) {
  return _uuidv7(ZodMiniUUID, params);
}
function url(params) {
  return _url(ZodMiniURL, params);
}
function emoji2(params) {
  return _emoji2(ZodMiniEmoji, params);
}
function nanoid2(params) {
  return _nanoid(ZodMiniNanoID, params);
}
function cuid3(params) {
  return _cuid(ZodMiniCUID, params);
}
function cuid22(params) {
  return _cuid2(ZodMiniCUID2, params);
}
function ulid2(params) {
  return _ulid(ZodMiniULID, params);
}
function xid2(params) {
  return _xid(ZodMiniXID, params);
}
function ksuid2(params) {
  return _ksuid(ZodMiniKSUID, params);
}
function ipv42(params) {
  return _ipv4(ZodMiniIPv4, params);
}
function ipv62(params) {
  return _ipv6(ZodMiniIPv6, params);
}
function cidrv42(params) {
  return _cidrv4(ZodMiniCIDRv4, params);
}
function cidrv62(params) {
  return _cidrv6(ZodMiniCIDRv6, params);
}
function base642(params) {
  return _base64(ZodMiniBase64, params);
}
function base64url2(params) {
  return _base64url(ZodMiniBase64URL, params);
}
function e1642(params) {
  return _e164(ZodMiniE164, params);
}
function jwt(params) {
  return _jwt(ZodMiniJWT, params);
}
function stringFormat(format, fnOrRegex, _params = {}) {
  return _stringFormat(ZodMiniCustomStringFormat, format, fnOrRegex, _params);
}
function number2(params) {
  return _number(ZodMiniNumber, params);
}
function int(params) {
  return _int(ZodMiniNumberFormat, params);
}
function float32(params) {
  return _float32(ZodMiniNumberFormat, params);
}
function float64(params) {
  return _float64(ZodMiniNumberFormat, params);
}
function int32(params) {
  return _int32(ZodMiniNumberFormat, params);
}
function uint32(params) {
  return _uint32(ZodMiniNumberFormat, params);
}
function boolean2(params) {
  return _boolean(ZodMiniBoolean, params);
}
function bigint2(params) {
  return _bigint(ZodMiniBigInt, params);
}
function int64(params) {
  return _int64(ZodMiniBigIntFormat, params);
}
function uint64(params) {
  return _uint64(ZodMiniBigIntFormat, params);
}
function symbol(params) {
  return _symbol(ZodMiniSymbol, params);
}
function _undefined3(params) {
  return _undefined2(ZodMiniUndefined, params);
}
function _null3(params) {
  return _null2(ZodMiniNull, params);
}
function any() {
  return _any(ZodMiniAny);
}
function unknown() {
  return _unknown(ZodMiniUnknown);
}
function never(params) {
  return _never(ZodMiniNever, params);
}
function _void2(params) {
  return _void(ZodMiniVoid, params);
}
function date2(params) {
  return _date(ZodMiniDate, params);
}
function array(element, params) {
  return new ZodMiniArray({
    type: "array",
    element,
    ...util_exports.normalizeParams(params)
  });
}
function keyof(schema) {
  const shape = schema._zod.def.shape;
  return literal(Object.keys(shape));
}
function object(shape, params) {
  const def = {
    type: "object",
    get shape() {
      util_exports.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    ...util_exports.normalizeParams(params)
  };
  return new ZodMiniObject(def);
}
function strictObject(shape, params) {
  return new ZodMiniObject({
    type: "object",
    // shape: shape as core.$ZodLooseShape,
    get shape() {
      util_exports.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    catchall: never(),
    ...util_exports.normalizeParams(params)
  });
}
function looseObject(shape, params) {
  return new ZodMiniObject({
    type: "object",
    // shape: shape as core.$ZodLooseShape,
    get shape() {
      util_exports.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    // get optional() {
    //   return util.optionalKeys(shape);
    // },
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
function extend2(schema, shape) {
  return util_exports.extend(schema, shape);
}
function merge2(schema, shape) {
  return util_exports.extend(schema, shape);
}
function pick2(schema, mask) {
  return util_exports.pick(schema, mask);
}
function omit2(schema, mask) {
  return util_exports.omit(schema, mask);
}
function partial2(schema, mask) {
  return util_exports.partial(ZodMiniOptional, schema, mask);
}
function required2(schema, mask) {
  return util_exports.required(ZodMiniNonOptional, schema, mask);
}
function catchall(inst, catchall2) {
  return inst.clone({ ...inst._zod.def, catchall: catchall2 });
}
function union(options, params) {
  return new ZodMiniUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
function discriminatedUnion(discriminator, options, params) {
  return new ZodMiniDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
function intersection(left, right) {
  return new ZodMiniIntersection({
    type: "intersection",
    left,
    right
  });
}
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodMiniTuple({
    type: "tuple",
    items,
    rest,
    ...util_exports.normalizeParams(params)
  });
}
function record(keyType, valueType, params) {
  return new ZodMiniRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function partialRecord(keyType, valueType, params) {
  return new ZodMiniRecord({
    type: "record",
    keyType: union([keyType, never()]),
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function map(keyType, valueType, params) {
  return new ZodMiniMap({
    type: "map",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function set(valueType, params) {
  return new ZodMiniSet({
    type: "set",
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function _enum2(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodMiniEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
function nativeEnum(entries, params) {
  return new ZodMiniEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
function literal(value, params) {
  return new ZodMiniLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
function file(params) {
  return _file(ZodMiniFile, params);
}
function transform(fn) {
  return new ZodMiniTransform({
    type: "transform",
    transform: fn
  });
}
function optional(innerType) {
  return new ZodMiniOptional({
    type: "optional",
    innerType
  });
}
function nullable(innerType) {
  return new ZodMiniNullable({
    type: "nullable",
    innerType
  });
}
function nullish2(innerType) {
  return optional(nullable(innerType));
}
function _default2(innerType, defaultValue) {
  return new ZodMiniDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
function prefault(innerType, defaultValue) {
  return new ZodMiniPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
function nonoptional(innerType, params) {
  return new ZodMiniNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
function success(innerType) {
  return new ZodMiniSuccess({
    type: "success",
    innerType
  });
}
function _catch2(innerType, catchValue) {
  return new ZodMiniCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
function nan(params) {
  return _nan(ZodMiniNaN, params);
}
function pipe(in_, out) {
  return new ZodMiniPipe({
    type: "pipe",
    in: in_,
    out
  });
}
function readonly(innerType) {
  return new ZodMiniReadonly({
    type: "readonly",
    innerType
  });
}
function templateLiteral(parts, params) {
  return new ZodMiniTemplateLiteral({
    type: "template_literal",
    parts,
    ...util_exports.normalizeParams(params)
  });
}
function _lazy2(getter) {
  return new ZodMiniLazy({
    type: "lazy",
    getter
  });
}
function promise(innerType) {
  return new ZodMiniPromise({
    type: "promise",
    innerType
  });
}
function check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...util_exports.normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
function custom(fn, _params) {
  return _custom(ZodMiniCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodMiniCustom, fn, _params);
}
function _instanceof(cls, params = {
  error: `Input not instance of ${cls.name}`
}) {
  const inst = custom((data) => data instanceof cls, params);
  inst._zod.bag.Class = cls;
  return inst;
}
function json() {
  const jsonSchema = _lazy2(() => {
    return union([string2(), number2(), boolean2(), _null3(), array(jsonSchema), record(string2(), jsonSchema)]);
  });
  return jsonSchema;
}
var ZodMiniType, ZodMiniString, ZodMiniStringFormat, ZodMiniEmail, ZodMiniGUID, ZodMiniUUID, ZodMiniURL, ZodMiniEmoji, ZodMiniNanoID, ZodMiniCUID, ZodMiniCUID2, ZodMiniULID, ZodMiniXID, ZodMiniKSUID, ZodMiniIPv4, ZodMiniIPv6, ZodMiniCIDRv4, ZodMiniCIDRv6, ZodMiniBase64, ZodMiniBase64URL, ZodMiniE164, ZodMiniJWT, ZodMiniCustomStringFormat, ZodMiniNumber, ZodMiniNumberFormat, ZodMiniBoolean, ZodMiniBigInt, ZodMiniBigIntFormat, ZodMiniSymbol, ZodMiniUndefined, ZodMiniNull, ZodMiniAny, ZodMiniUnknown, ZodMiniNever, ZodMiniVoid, ZodMiniDate, ZodMiniArray, ZodMiniObject, ZodMiniUnion, ZodMiniDiscriminatedUnion, ZodMiniIntersection, ZodMiniTuple, ZodMiniRecord, ZodMiniMap, ZodMiniSet, ZodMiniEnum, ZodMiniLiteral, ZodMiniFile, ZodMiniTransform, ZodMiniOptional, ZodMiniNullable, ZodMiniDefault, ZodMiniPrefault, ZodMiniNonOptional, ZodMiniSuccess, ZodMiniCatch, ZodMiniNaN, ZodMiniPipe, ZodMiniReadonly, ZodMiniTemplateLiteral, ZodMiniLazy, ZodMiniPromise, ZodMiniCustom, stringbool;
var init_schemas2 = __esm({
  "happ-toggle/tools/node_modules/zod/v4/mini/schemas.js"() {
    init_core2();
    init_core2();
    init_parse2();
    ZodMiniType = /* @__PURE__ */ $constructor("ZodMiniType", (inst, def) => {
      if (!inst._zod)
        throw new Error("Uninitialized schema in ZodMiniType.");
      $ZodType.init(inst, def);
      inst.def = def;
      inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
      inst.safeParse = (data, params) => safeParse(inst, data, params);
      inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
      inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
      inst.check = (...checks) => {
        return inst.clone(
          {
            ...def,
            checks: [
              ...def.checks ?? [],
              ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
            ]
          }
          // { parent: true }
        );
      };
      inst.clone = (_def, params) => clone(inst, _def, params);
      inst.brand = () => inst;
      inst.register = ((reg, meta) => {
        reg.add(inst, meta);
        return inst;
      });
    });
    ZodMiniString = /* @__PURE__ */ $constructor("ZodMiniString", (inst, def) => {
      $ZodString.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniStringFormat = /* @__PURE__ */ $constructor("ZodMiniStringFormat", (inst, def) => {
      $ZodStringFormat.init(inst, def);
      ZodMiniString.init(inst, def);
    });
    ZodMiniEmail = /* @__PURE__ */ $constructor("ZodMiniEmail", (inst, def) => {
      $ZodEmail.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniGUID = /* @__PURE__ */ $constructor("ZodMiniGUID", (inst, def) => {
      $ZodGUID.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniUUID = /* @__PURE__ */ $constructor("ZodMiniUUID", (inst, def) => {
      $ZodUUID.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniURL = /* @__PURE__ */ $constructor("ZodMiniURL", (inst, def) => {
      $ZodURL.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniEmoji = /* @__PURE__ */ $constructor("ZodMiniEmoji", (inst, def) => {
      $ZodEmoji.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniNanoID = /* @__PURE__ */ $constructor("ZodMiniNanoID", (inst, def) => {
      $ZodNanoID.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniCUID = /* @__PURE__ */ $constructor("ZodMiniCUID", (inst, def) => {
      $ZodCUID.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniCUID2 = /* @__PURE__ */ $constructor("ZodMiniCUID2", (inst, def) => {
      $ZodCUID2.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniULID = /* @__PURE__ */ $constructor("ZodMiniULID", (inst, def) => {
      $ZodULID.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniXID = /* @__PURE__ */ $constructor("ZodMiniXID", (inst, def) => {
      $ZodXID.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniKSUID = /* @__PURE__ */ $constructor("ZodMiniKSUID", (inst, def) => {
      $ZodKSUID.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniIPv4 = /* @__PURE__ */ $constructor("ZodMiniIPv4", (inst, def) => {
      $ZodIPv4.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniIPv6 = /* @__PURE__ */ $constructor("ZodMiniIPv6", (inst, def) => {
      $ZodIPv6.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniCIDRv4 = /* @__PURE__ */ $constructor("ZodMiniCIDRv4", (inst, def) => {
      $ZodCIDRv4.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniCIDRv6 = /* @__PURE__ */ $constructor("ZodMiniCIDRv6", (inst, def) => {
      $ZodCIDRv6.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniBase64 = /* @__PURE__ */ $constructor("ZodMiniBase64", (inst, def) => {
      $ZodBase64.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniBase64URL = /* @__PURE__ */ $constructor("ZodMiniBase64URL", (inst, def) => {
      $ZodBase64URL.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniE164 = /* @__PURE__ */ $constructor("ZodMiniE164", (inst, def) => {
      $ZodE164.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniJWT = /* @__PURE__ */ $constructor("ZodMiniJWT", (inst, def) => {
      $ZodJWT.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniCustomStringFormat = /* @__PURE__ */ $constructor("ZodMiniCustomStringFormat", (inst, def) => {
      $ZodCustomStringFormat.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniNumber = /* @__PURE__ */ $constructor("ZodMiniNumber", (inst, def) => {
      $ZodNumber.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniNumberFormat = /* @__PURE__ */ $constructor("ZodMiniNumberFormat", (inst, def) => {
      $ZodNumberFormat.init(inst, def);
      ZodMiniNumber.init(inst, def);
    });
    ZodMiniBoolean = /* @__PURE__ */ $constructor("ZodMiniBoolean", (inst, def) => {
      $ZodBoolean.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniBigInt = /* @__PURE__ */ $constructor("ZodMiniBigInt", (inst, def) => {
      $ZodBigInt.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniBigIntFormat = /* @__PURE__ */ $constructor("ZodMiniBigIntFormat", (inst, def) => {
      $ZodBigIntFormat.init(inst, def);
      ZodMiniBigInt.init(inst, def);
    });
    ZodMiniSymbol = /* @__PURE__ */ $constructor("ZodMiniSymbol", (inst, def) => {
      $ZodSymbol.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniUndefined = /* @__PURE__ */ $constructor("ZodMiniUndefined", (inst, def) => {
      $ZodUndefined.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniNull = /* @__PURE__ */ $constructor("ZodMiniNull", (inst, def) => {
      $ZodNull.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniAny = /* @__PURE__ */ $constructor("ZodMiniAny", (inst, def) => {
      $ZodAny.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniUnknown = /* @__PURE__ */ $constructor("ZodMiniUnknown", (inst, def) => {
      $ZodUnknown.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniNever = /* @__PURE__ */ $constructor("ZodMiniNever", (inst, def) => {
      $ZodNever.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniVoid = /* @__PURE__ */ $constructor("ZodMiniVoid", (inst, def) => {
      $ZodVoid.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniDate = /* @__PURE__ */ $constructor("ZodMiniDate", (inst, def) => {
      $ZodDate.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniArray = /* @__PURE__ */ $constructor("ZodMiniArray", (inst, def) => {
      $ZodArray.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniObject = /* @__PURE__ */ $constructor("ZodMiniObject", (inst, def) => {
      $ZodObject.init(inst, def);
      ZodMiniType.init(inst, def);
      util_exports.defineLazy(inst, "shape", () => def.shape);
    });
    ZodMiniUnion = /* @__PURE__ */ $constructor("ZodMiniUnion", (inst, def) => {
      $ZodUnion.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodMiniDiscriminatedUnion", (inst, def) => {
      $ZodDiscriminatedUnion.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniIntersection = /* @__PURE__ */ $constructor("ZodMiniIntersection", (inst, def) => {
      $ZodIntersection.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniTuple = /* @__PURE__ */ $constructor("ZodMiniTuple", (inst, def) => {
      $ZodTuple.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniRecord = /* @__PURE__ */ $constructor("ZodMiniRecord", (inst, def) => {
      $ZodRecord.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniMap = /* @__PURE__ */ $constructor("ZodMiniMap", (inst, def) => {
      $ZodMap.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniSet = /* @__PURE__ */ $constructor("ZodMiniSet", (inst, def) => {
      $ZodSet.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniEnum = /* @__PURE__ */ $constructor("ZodMiniEnum", (inst, def) => {
      $ZodEnum.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniLiteral = /* @__PURE__ */ $constructor("ZodMiniLiteral", (inst, def) => {
      $ZodLiteral.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniFile = /* @__PURE__ */ $constructor("ZodMiniFile", (inst, def) => {
      $ZodFile.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniTransform = /* @__PURE__ */ $constructor("ZodMiniTransform", (inst, def) => {
      $ZodTransform.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniOptional = /* @__PURE__ */ $constructor("ZodMiniOptional", (inst, def) => {
      $ZodOptional.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniNullable = /* @__PURE__ */ $constructor("ZodMiniNullable", (inst, def) => {
      $ZodNullable.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniDefault = /* @__PURE__ */ $constructor("ZodMiniDefault", (inst, def) => {
      $ZodDefault.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniPrefault = /* @__PURE__ */ $constructor("ZodMiniPrefault", (inst, def) => {
      $ZodPrefault.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniNonOptional = /* @__PURE__ */ $constructor("ZodMiniNonOptional", (inst, def) => {
      $ZodNonOptional.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniSuccess = /* @__PURE__ */ $constructor("ZodMiniSuccess", (inst, def) => {
      $ZodSuccess.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniCatch = /* @__PURE__ */ $constructor("ZodMiniCatch", (inst, def) => {
      $ZodCatch.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniNaN = /* @__PURE__ */ $constructor("ZodMiniNaN", (inst, def) => {
      $ZodNaN.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniPipe = /* @__PURE__ */ $constructor("ZodMiniPipe", (inst, def) => {
      $ZodPipe.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniReadonly = /* @__PURE__ */ $constructor("ZodMiniReadonly", (inst, def) => {
      $ZodReadonly.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniTemplateLiteral = /* @__PURE__ */ $constructor("ZodMiniTemplateLiteral", (inst, def) => {
      $ZodTemplateLiteral.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniLazy = /* @__PURE__ */ $constructor("ZodMiniLazy", (inst, def) => {
      $ZodLazy.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniPromise = /* @__PURE__ */ $constructor("ZodMiniPromise", (inst, def) => {
      $ZodPromise.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    ZodMiniCustom = /* @__PURE__ */ $constructor("ZodMiniCustom", (inst, def) => {
      $ZodCustom.init(inst, def);
      ZodMiniType.init(inst, def);
    });
    stringbool = (...args) => _stringbool({
      Pipe: ZodMiniPipe,
      Boolean: ZodMiniBoolean,
      String: ZodMiniString,
      Transform: ZodMiniTransform
    }, ...args);
  }
});

// happ-toggle/tools/node_modules/zod/v4/mini/checks.js
var init_checks2 = __esm({
  "happ-toggle/tools/node_modules/zod/v4/mini/checks.js"() {
    init_core2();
  }
});

// happ-toggle/tools/node_modules/zod/v4/mini/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodMiniISODate: () => ZodMiniISODate,
  ZodMiniISODateTime: () => ZodMiniISODateTime,
  ZodMiniISODuration: () => ZodMiniISODuration,
  ZodMiniISOTime: () => ZodMiniISOTime,
  date: () => date3,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
function datetime2(params) {
  return _isoDateTime(ZodMiniISODateTime, params);
}
function date3(params) {
  return _isoDate(ZodMiniISODate, params);
}
function time2(params) {
  return _isoTime(ZodMiniISOTime, params);
}
function duration2(params) {
  return _isoDuration(ZodMiniISODuration, params);
}
var ZodMiniISODateTime, ZodMiniISODate, ZodMiniISOTime, ZodMiniISODuration;
var init_iso = __esm({
  "happ-toggle/tools/node_modules/zod/v4/mini/iso.js"() {
    init_core2();
    init_schemas2();
    ZodMiniISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
      $ZodISODateTime.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
      $ZodISODate.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
      $ZodISOTime.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
    ZodMiniISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
      $ZodISODuration.init(inst, def);
      ZodMiniStringFormat.init(inst, def);
    });
  }
});

// happ-toggle/tools/node_modules/zod/v4/mini/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint3,
  boolean: () => boolean3,
  date: () => date4,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodMiniString, params);
}
function number3(params) {
  return _coercedNumber(ZodMiniNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodMiniBoolean, params);
}
function bigint3(params) {
  return _coercedBigint(ZodMiniBigInt, params);
}
function date4(params) {
  return _coercedDate(ZodMiniDate, params);
}
var init_coerce = __esm({
  "happ-toggle/tools/node_modules/zod/v4/mini/coerce.js"() {
    init_core2();
    init_schemas2();
  }
});

// happ-toggle/tools/node_modules/zod/v4/mini/external.js
var external_exports = {};
__export(external_exports, {
  $brand: () => $brand,
  $input: () => $input,
  $output: () => $output,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  ZodMiniAny: () => ZodMiniAny,
  ZodMiniArray: () => ZodMiniArray,
  ZodMiniBase64: () => ZodMiniBase64,
  ZodMiniBase64URL: () => ZodMiniBase64URL,
  ZodMiniBigInt: () => ZodMiniBigInt,
  ZodMiniBigIntFormat: () => ZodMiniBigIntFormat,
  ZodMiniBoolean: () => ZodMiniBoolean,
  ZodMiniCIDRv4: () => ZodMiniCIDRv4,
  ZodMiniCIDRv6: () => ZodMiniCIDRv6,
  ZodMiniCUID: () => ZodMiniCUID,
  ZodMiniCUID2: () => ZodMiniCUID2,
  ZodMiniCatch: () => ZodMiniCatch,
  ZodMiniCustom: () => ZodMiniCustom,
  ZodMiniCustomStringFormat: () => ZodMiniCustomStringFormat,
  ZodMiniDate: () => ZodMiniDate,
  ZodMiniDefault: () => ZodMiniDefault,
  ZodMiniDiscriminatedUnion: () => ZodMiniDiscriminatedUnion,
  ZodMiniE164: () => ZodMiniE164,
  ZodMiniEmail: () => ZodMiniEmail,
  ZodMiniEmoji: () => ZodMiniEmoji,
  ZodMiniEnum: () => ZodMiniEnum,
  ZodMiniFile: () => ZodMiniFile,
  ZodMiniGUID: () => ZodMiniGUID,
  ZodMiniIPv4: () => ZodMiniIPv4,
  ZodMiniIPv6: () => ZodMiniIPv6,
  ZodMiniISODate: () => ZodMiniISODate,
  ZodMiniISODateTime: () => ZodMiniISODateTime,
  ZodMiniISODuration: () => ZodMiniISODuration,
  ZodMiniISOTime: () => ZodMiniISOTime,
  ZodMiniIntersection: () => ZodMiniIntersection,
  ZodMiniJWT: () => ZodMiniJWT,
  ZodMiniKSUID: () => ZodMiniKSUID,
  ZodMiniLazy: () => ZodMiniLazy,
  ZodMiniLiteral: () => ZodMiniLiteral,
  ZodMiniMap: () => ZodMiniMap,
  ZodMiniNaN: () => ZodMiniNaN,
  ZodMiniNanoID: () => ZodMiniNanoID,
  ZodMiniNever: () => ZodMiniNever,
  ZodMiniNonOptional: () => ZodMiniNonOptional,
  ZodMiniNull: () => ZodMiniNull,
  ZodMiniNullable: () => ZodMiniNullable,
  ZodMiniNumber: () => ZodMiniNumber,
  ZodMiniNumberFormat: () => ZodMiniNumberFormat,
  ZodMiniObject: () => ZodMiniObject,
  ZodMiniOptional: () => ZodMiniOptional,
  ZodMiniPipe: () => ZodMiniPipe,
  ZodMiniPrefault: () => ZodMiniPrefault,
  ZodMiniPromise: () => ZodMiniPromise,
  ZodMiniReadonly: () => ZodMiniReadonly,
  ZodMiniRecord: () => ZodMiniRecord,
  ZodMiniSet: () => ZodMiniSet,
  ZodMiniString: () => ZodMiniString,
  ZodMiniStringFormat: () => ZodMiniStringFormat,
  ZodMiniSuccess: () => ZodMiniSuccess,
  ZodMiniSymbol: () => ZodMiniSymbol,
  ZodMiniTemplateLiteral: () => ZodMiniTemplateLiteral,
  ZodMiniTransform: () => ZodMiniTransform,
  ZodMiniTuple: () => ZodMiniTuple,
  ZodMiniType: () => ZodMiniType,
  ZodMiniULID: () => ZodMiniULID,
  ZodMiniURL: () => ZodMiniURL,
  ZodMiniUUID: () => ZodMiniUUID,
  ZodMiniUndefined: () => ZodMiniUndefined,
  ZodMiniUnion: () => ZodMiniUnion,
  ZodMiniUnknown: () => ZodMiniUnknown,
  ZodMiniVoid: () => ZodMiniVoid,
  ZodMiniXID: () => ZodMiniXID,
  _default: () => _default2,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  catchall: () => catchall,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  clone: () => clone,
  coerce: () => coerce_exports,
  config: () => config,
  core: () => core_exports2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  endsWith: () => _endsWith,
  enum: () => _enum2,
  extend: () => extend2,
  file: () => file,
  flattenError: () => flattenError,
  float32: () => float32,
  float64: () => float64,
  formatError: () => formatError,
  function: () => _function,
  globalRegistry: () => globalRegistry,
  gt: () => _gt,
  gte: () => _gte,
  guid: () => guid2,
  includes: () => _includes,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  iso: () => iso_exports,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => _lazy2,
  length: () => _length,
  literal: () => literal,
  locales: () => locales_exports,
  looseObject: () => looseObject,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  map: () => map,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  maximum: () => _lte,
  merge: () => merge2,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  minimum: () => _gte,
  multipleOf: () => _multipleOf,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  negative: () => _negative,
  never: () => never,
  nonnegative: () => _nonnegative,
  nonoptional: () => nonoptional,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  omit: () => omit2,
  optional: () => optional,
  overwrite: () => _overwrite,
  parse: () => parse,
  parseAsync: () => parseAsync,
  partial: () => partial2,
  partialRecord: () => partialRecord,
  pick: () => pick2,
  pipe: () => pipe,
  positive: () => _positive,
  prefault: () => prefault,
  prettifyError: () => prettifyError,
  promise: () => promise,
  property: () => _property,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  regex: () => _regex,
  regexes: () => regexes_exports,
  registry: () => registry,
  required: () => required2,
  safeParse: () => safeParse,
  safeParseAsync: () => safeParseAsync,
  set: () => set,
  size: () => _size,
  startsWith: () => _startsWith,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  toJSONSchema: () => toJSONSchema,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  transform: () => transform,
  treeifyError: () => treeifyError,
  trim: () => _trim,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  uppercase: () => _uppercase,
  url: () => url,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2
});
var init_external = __esm({
  "happ-toggle/tools/node_modules/zod/v4/mini/external.js"() {
    init_core2();
    init_parse2();
    init_schemas2();
    init_checks2();
    init_core2();
    init_locales();
    init_iso();
    init_iso();
    init_coerce();
  }
});

// happ-toggle/tools/node_modules/zod/v4/mini/index.js
var init_mini = __esm({
  "happ-toggle/tools/node_modules/zod/v4/mini/index.js"() {
    init_external();
    init_external();
  }
});

// happ-toggle/tools/node_modules/zod/v4-mini/index.js
var init_v4_mini = __esm({
  "happ-toggle/tools/node_modules/zod/v4-mini/index.js"() {
    init_mini();
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/lists/option.js
var Option;
var init_option = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/lists/option.js"() {
    init_v4_mini();
    Option = external_exports.object({
      type: external_exports.literal("option"),
      disabled: external_exports.optional(external_exports.boolean()),
      label: external_exports.string(),
      value: external_exports.union([external_exports.boolean(), external_exports.number(), external_exports.string()])
    });
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/lists/option-group.js
var OptionGroup;
var init_option_group = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/lists/option-group.js"() {
    init_v4_mini();
    init_option();
    OptionGroup = external_exports.object({
      type: external_exports.literal("option-group"),
      disabled: external_exports.optional(external_exports.boolean()),
      options: external_exports.lazy(() => external_exports.array(external_exports.union([Option, OptionGroup]))),
      label: external_exports.string()
    });
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/index.js
var init_dist = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/index.js"() {
    init_enumerable();
    init_event_emitter();
    init_explicit_resource_management();
    init_json();
    init_lazy();
    init_freeze();
    init_get();
    init_set();
    init_parsers();
    init_processes();
    init_promises();
    init_strings();
    init_timers();
    init_types();
    init_option_group();
    init_option();
  }
});

// happ-toggle/tools/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// happ-toggle/tools/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// happ-toggle/tools/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// happ-toggle/tools/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// happ-toggle/tools/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// happ-toggle/tools/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error40 = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error40);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error40 = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error40);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error40 = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error40);
            return;
          }
          if (!this._fragmented) {
            const error40 = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error40);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error40 = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error40);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error40 = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error40);
            return;
          }
          if (compressed) {
            const error40 = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error40);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error40 = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error40);
            return;
          }
        } else {
          const error40 = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error40);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error40 = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error40);
            return;
          }
        } else if (this._masked) {
          const error40 = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error40);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error40 = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error40);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error40 = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error40);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error40 = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error40);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error40 = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error40);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error40 = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error40);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error40 = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error40);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error40 = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error40);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// happ-toggle/tools/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge3 = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge3 = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge3 ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge3) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// happ-toggle/tools/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event2 = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event2.prototype, "target", { enumerable: true });
    Object.defineProperty(Event2.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event2 {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event2 {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event2 {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error40) {
            const event = new ErrorEvent("error", {
              error: error40,
              message: error40.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event2("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event: Event2,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// happ-toggle/tools/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse2(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse: parse2 };
  }
});

// happ-toggle/tools/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter2 = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse: parse2 } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter2 {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            if (!options || options.protocols === void 0) {
              protocols = [];
            } else if (Array.isArray(options.protocols)) {
              protocols = options.protocols;
            } else {
              protocols = [options.protocols];
            }
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              if (options.protocols === void 0) {
                protocols = [];
              } else if (Array.isArray(options.protocols)) {
                protocols = options.protocols;
              } else {
                protocols = [options.protocols];
              }
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        this._readyState = _WebSocket.CLOSING;
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        protocols: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse2(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// happ-toggle/tools/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error40(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error40(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// happ-toggle/tools/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse2(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse: parse2 };
  }
});

// happ-toggle/tools/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "happ-toggle/tools/node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter2 = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter2 {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version2 = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version2 !== 13 && version2 !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version2 === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map2) {
      for (const event of Object.keys(map2)) server.on(event, map2[event]);
      return function removeListeners() {
        for (const event of Object.keys(map2)) {
          server.removeListener(event, map2[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// happ-toggle/tools/node_modules/ws/wrapper.mjs
var import_stream, import_extension, import_permessage_deflate, import_receiver, import_sender, import_subprotocol, import_websocket, import_websocket_server, wrapper_default;
var init_wrapper = __esm({
  "happ-toggle/tools/node_modules/ws/wrapper.mjs"() {
    import_stream = __toESM(require_stream(), 1);
    import_extension = __toESM(require_extension(), 1);
    import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
    import_receiver = __toESM(require_receiver(), 1);
    import_sender = __toESM(require_sender(), 1);
    import_subprotocol = __toESM(require_subprotocol(), 1);
    import_websocket = __toESM(require_websocket(), 1);
    import_websocket_server = __toESM(require_websocket_server(), 1);
    wrapper_default = import_websocket.default;
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/command.js
var init_command = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/command.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/schemas/dist/streamdeck/plugins/index.mjs
var DeviceType, BarSubType;
var init_plugins = __esm({
  "happ-toggle/tools/node_modules/@elgato/schemas/dist/streamdeck/plugins/index.mjs"() {
    (function(DeviceType2) {
      DeviceType2[DeviceType2["StreamDeck"] = 0] = "StreamDeck";
      DeviceType2[DeviceType2["StreamDeckMini"] = 1] = "StreamDeckMini";
      DeviceType2[DeviceType2["StreamDeckXL"] = 2] = "StreamDeckXL";
      DeviceType2[DeviceType2["StreamDeckMobile"] = 3] = "StreamDeckMobile";
      DeviceType2[DeviceType2["CorsairGKeys"] = 4] = "CorsairGKeys";
      DeviceType2[DeviceType2["StreamDeckPedal"] = 5] = "StreamDeckPedal";
      DeviceType2[DeviceType2["CorsairVoyager"] = 6] = "CorsairVoyager";
      DeviceType2[DeviceType2["StreamDeckPlus"] = 7] = "StreamDeckPlus";
      DeviceType2[DeviceType2["SCUFController"] = 8] = "SCUFController";
      DeviceType2[DeviceType2["StreamDeckNeo"] = 9] = "StreamDeckNeo";
      DeviceType2[DeviceType2["StreamDeckStudio"] = 10] = "StreamDeckStudio";
      DeviceType2[DeviceType2["VirtualStreamDeck"] = 11] = "VirtualStreamDeck";
      DeviceType2[DeviceType2["Galleon100SD"] = 12] = "Galleon100SD";
      DeviceType2[DeviceType2["StreamDeckPlusXL"] = 13] = "StreamDeckPlusXL";
    })(DeviceType || (DeviceType = {}));
    (function(BarSubType2) {
      BarSubType2[BarSubType2["Rectangle"] = 0] = "Rectangle";
      BarSubType2[BarSubType2["DoubleRectangle"] = 1] = "DoubleRectangle";
      BarSubType2[BarSubType2["Trapezoid"] = 2] = "Trapezoid";
      BarSubType2[BarSubType2["DoubleTrapezoid"] = 3] = "DoubleTrapezoid";
      BarSubType2[BarSubType2["Groove"] = 4] = "Groove";
    })(BarSubType || (BarSubType = {}));
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/device.js
var init_device = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/device.js"() {
    init_plugins();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/action.js
var init_action = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/action.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/device.js
var init_device2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/device.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/encoder.js
var init_encoder = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/encoder.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/keypad.js
var init_keypad = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/keypad.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/system.js
var init_system = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/system.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/ui.js
var init_ui = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/ui.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/index.js
var init_events = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/events/index.js"() {
    init_plugins();
    init_action();
    init_device2();
    init_action();
    init_device2();
    init_encoder();
    init_keypad();
    init_system();
    init_ui();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/i18n.js
var init_i18n2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/i18n.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/layout.js
var init_layout = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/layout.js"() {
    init_plugins();
    init_plugins();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/info.js
var init_info = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/info.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/parameters.js
var RegistrationParameter;
var init_parameters = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/parameters.js"() {
    (function(RegistrationParameter2) {
      RegistrationParameter2["Port"] = "-port";
      RegistrationParameter2["Info"] = "-info";
      RegistrationParameter2["PluginUUID"] = "-pluginUUID";
      RegistrationParameter2["RegisterEvent"] = "-registerEvent";
    })(RegistrationParameter || (RegistrationParameter = {}));
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/ui.js
var init_ui2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/ui.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/index.js
var init_registration = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/registration/index.js"() {
    init_info();
    init_parameters();
    init_ui2();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/resources.js
var init_resources = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/resources.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/target.js
var Target;
var init_target = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/target.js"() {
    (function(Target2) {
      Target2[Target2["HardwareAndSoftware"] = 0] = "HardwareAndSoftware";
      Target2[Target2["Hardware"] = 1] = "Hardware";
      Target2[Target2["Software"] = 2] = "Software";
    })(Target || (Target = {}));
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/index.js
var init_api2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/api/index.js"() {
    init_command();
    init_device();
    init_events();
    init_i18n2();
    init_layout();
    init_registration();
    init_resources();
    init_target();
    init_plugins();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/common/version.js
var Version;
var init_version = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/common/version.js"() {
    Version = class {
      /**
       * Build version number.
       */
      build;
      /**
       * Major version number.
       */
      major;
      /**
       * Minor version number.
       */
      minor;
      /**
       * Patch version number.
       */
      patch;
      /**
       * Initializes a new instance of the {@link Version} class.
       * @param value Value to parse the version from.
       */
      constructor(value) {
        const result = value.match(/^(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?$/);
        if (result === null) {
          throw new Error(`Invalid format; expected "{major}[.{minor}[.{patch}[.{build}]]]" but was "${value}"`);
        }
        [, this.major, this.minor, this.patch, this.build] = [...result.map((value2) => parseInt(value2) || 0)];
      }
      /**
       * Compares this instance to the {@link other} {@link Version}.
       * @param other The {@link Version} to compare to.
       * @returns `-1` when this instance is less than the {@link other}, `1` when this instance is greater than {@link other}, otherwise `0`.
       */
      compareTo(other) {
        const segments = ({ major, minor, build, patch }) => [major, minor, build, patch];
        const thisSegments = segments(this);
        const otherSegments = segments(other);
        for (let i = 0; i < 4; i++) {
          if (thisSegments[i] < otherSegments[i]) {
            return -1;
          } else if (thisSegments[i] > otherSegments[i]) {
            return 1;
          }
        }
        return 0;
      }
      /** @inheritdoc */
      toString() {
        return `${this.major}.${this.minor}`;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/logging/console-target.js
var ConsoleTarget;
var init_console_target = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/logging/console-target.js"() {
    ConsoleTarget = class {
      /**
       * @inheritdoc
       */
      write(entry) {
        switch (entry.level) {
          case "error":
            console.error(...entry.data);
            break;
          case "warn":
            console.warn(...entry.data);
            break;
          default:
            console.log(...entry.data);
        }
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/logging/format.js
function stringFormatter(opts) {
  if (opts?.dataOnly) {
    return ({ data }) => `${reduce(data)}`;
  } else {
    return (entry) => {
      const { data, level, scope } = entry;
      let prefix = `${(/* @__PURE__ */ new Date()).toISOString()} ${level.toUpperCase().padEnd(5)} `;
      if (scope) {
        prefix += `${scope}: `;
      }
      return `${prefix}${reduce(data)}`;
    };
  }
}
function reduce(data) {
  let result = "";
  let previousWasError = false;
  for (const value of data) {
    if (typeof value === "object" && value instanceof Error) {
      result += `${EOL}${value.stack}`;
      previousWasError = true;
      continue;
    }
    if (previousWasError) {
      result += EOL;
      previousWasError = false;
    }
    result += typeof value === "object" ? JSON.stringify(value) : value;
    result += " ";
  }
  return result.trimEnd();
}
var EOL;
var init_format = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/logging/format.js"() {
    EOL = "\n";
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/logging/level.js
function defcon(level) {
  switch (level) {
    case "error":
      return 0;
    case "warn":
      return 1;
    case "info":
      return 2;
    case "debug":
      return 3;
    case "trace":
    default:
      return 4;
  }
}
var init_level = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/logging/level.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/logging/logger.js
var Logger;
var init_logger = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/logging/logger.js"() {
    init_level();
    Logger = class _Logger {
      /**
       * Backing field for the {@link Logger.level}.
       */
      #level;
      /**
       * Options that define the loggers behavior.
       */
      #options;
      /**
       * Scope associated with this {@link Logger}.
       */
      #scope;
      /**
       * Initializes a new instance of the {@link Logger} class.
       * @param opts Options that define the loggers behavior.
       */
      constructor(opts) {
        this.#options = { minimumLevel: "trace", ...opts };
        this.#scope = this.#options.scope === void 0 || this.#options.scope.trim() === "" ? "" : this.#options.scope;
        if (typeof this.#options.level !== "function") {
          this.setLevel(this.#options.level);
        }
      }
      /**
       * Gets the {@link LogLevel}.
       * @returns The {@link LogLevel}.
       */
      get level() {
        if (this.#level !== void 0) {
          return this.#level;
        }
        return typeof this.#options.level === "function" ? this.#options.level() : this.#options.level;
      }
      /**
       * Creates a scoped logger with the given {@link scope}; logs created by scoped-loggers include their scope to enable their source to be easily identified.
       * @param scope Value that represents the scope of the new logger.
       * @returns The scoped logger, or this instance when {@link scope} is not defined.
       */
      createScope(scope) {
        scope = scope.trim();
        if (scope === "") {
          return this;
        }
        return new _Logger({
          ...this.#options,
          level: () => this.level,
          scope: this.#options.scope ? `${this.#options.scope}->${scope}` : scope
        });
      }
      /**
       * Writes the arguments as a debug log entry.
       * @param data Message or data to log.
       * @returns This instance for chaining.
       */
      debug(...data) {
        return this.write({ level: "debug", data, scope: this.#scope });
      }
      /**
       * Writes the arguments as error log entry.
       * @param data Message or data to log.
       * @returns This instance for chaining.
       */
      error(...data) {
        return this.write({ level: "error", data, scope: this.#scope });
      }
      /**
       * Writes the arguments as an info log entry.
       * @param data Message or data to log.
       * @returns This instance for chaining.
       */
      info(...data) {
        return this.write({ level: "info", data, scope: this.#scope });
      }
      /**
       * Sets the log-level that determines which logs should be written. The specified level will be inherited by all scoped loggers unless they have log-level explicitly defined.
       * @param level The log-level that determines which logs should be written; when `undefined`, the level will be inherited from the parent logger, or default to the environment level.
       * @returns This instance for chaining.
       */
      setLevel(level) {
        if (level !== void 0 && defcon(level) > defcon(this.#options.minimumLevel)) {
          this.#level = "info";
        } else {
          this.#level = level;
        }
        return this;
      }
      /**
       * Writes the arguments as a trace log entry.
       * @param data Message or data to log.
       * @returns This instance for chaining.
       */
      trace(...data) {
        return this.write({ level: "trace", data, scope: this.#scope });
      }
      /**
       * Writes the arguments as a warning log entry.
       * @param data Message or data to log.
       * @returns This instance for chaining.
       */
      warn(...data) {
        return this.write({ level: "warn", data, scope: this.#scope });
      }
      /**
       * Writes the log entry.
       * @param entry Log entry to write.
       * @returns This instance for chaining.
       */
      write(entry) {
        if (defcon(entry.level) <= defcon(this.level)) {
          this.#options.targets.forEach((t) => t.write(entry));
        }
        return this;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/logging/target.js
var init_target2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/logging/target.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/logging/index.js
var init_logging = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/logging/index.js"() {
    init_console_target();
    init_format();
    init_level();
    init_logger();
    init_target2();
  }
});

// happ-toggle/tools/node_modules/@elgato/utils/dist/logging/node/file-target.js
import fs from "node:fs";
import path from "node:path";
var FileTarget;
var init_file_target = __esm({
  "happ-toggle/tools/node_modules/@elgato/utils/dist/logging/node/file-target.js"() {
    FileTarget = class {
      /**
       * File path where logs will be written.
       */
      #filePath;
      /**
       * Options that defines how logs should be written to the local file system.
       */
      #options;
      /**
       * Current size of the logs that have been written to the {@link FileTarget.#filePath}.
       */
      #size = 0;
      /**
       * Initializes a new instance of the {@link FileTarget} class.
       * @param options Options that defines how logs should be written to the local file system.
       */
      constructor(options) {
        this.#options = options;
        this.#filePath = this.getLogFilePath();
        this.reIndex();
      }
      /**
       * @inheritdoc
       */
      write(entry) {
        const fd = fs.openSync(this.#filePath, "a");
        try {
          const msg = this.#options.format(entry);
          fs.writeSync(fd, msg + "\n");
          this.#size += msg.length;
        } finally {
          fs.closeSync(fd);
        }
        if (this.#size >= this.#options.maxSize) {
          this.reIndex();
          this.#size = 0;
        }
      }
      /**
       * Gets the file path to an indexed log file.
       * @param index Optional index of the log file to be included as part of the file name.
       * @returns File path that represents the indexed log file.
       */
      getLogFilePath(index = 0) {
        return path.join(this.#options.dest, `${this.#options.fileName}.${index}.log`);
      }
      /**
       * Gets the log files associated with this file target, including past and present.
       * @returns Log file entries.
       */
      getLogFiles() {
        const regex = /^\.(\d+)\.log$/;
        return fs.readdirSync(this.#options.dest, { withFileTypes: true }).reduce((prev, entry) => {
          if (entry.isDirectory() || entry.name.indexOf(this.#options.fileName) < 0) {
            return prev;
          }
          const match = entry.name.substring(this.#options.fileName.length).match(regex);
          if (match?.length !== 2) {
            return prev;
          }
          prev.push({
            path: path.join(this.#options.dest, entry.name),
            index: parseInt(match[1])
          });
          return prev;
        }, []).sort(({ index: a }, { index: b }) => {
          return a < b ? -1 : a > b ? 1 : 0;
        });
      }
      /**
       * Re-indexes the existing log files associated with this file target, removing old log files whose
       * index exceeds the `maxFileCount`, and renaming the remaining log files, leaving index "0" free
       * for a new log file.
       */
      reIndex() {
        if (!fs.existsSync(this.#options.dest)) {
          fs.mkdirSync(this.#options.dest, {
            recursive: true
          });
          return;
        }
        const logFiles = this.getLogFiles();
        for (let i = logFiles.length - 1; i >= 0; i--) {
          const log = logFiles[i];
          if (i >= this.#options.maxFileCount - 1) {
            fs.rmSync(log.path);
          } else {
            fs.renameSync(log.path, this.getLogFilePath(i + 1));
          }
        }
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/common/utils.js
import path2 from "node:path";
function isDebugMode() {
  if (__isDebugMode === void 0) {
    __isDebugMode = process.execArgv.some((arg) => {
      const name = arg.split("=")[0];
      return name === "--inspect" || name === "--inspect-brk" || name === "--inspect-port";
    });
  }
  return __isDebugMode;
}
function getPluginUUID() {
  const name = path2.basename(process.cwd());
  const suffixIndex = name.lastIndexOf(".sdPlugin");
  return suffixIndex < 0 ? name : name.substring(0, suffixIndex);
}
var __isDebugMode;
var init_utils = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/common/utils.js"() {
    __isDebugMode = void 0;
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/logging/index.js
import path3 from "node:path";
import { cwd } from "node:process";
var fileTarget, targets, logger;
var init_logging2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/logging/index.js"() {
    init_logging();
    init_file_target();
    init_utils();
    fileTarget = new FileTarget({
      dest: path3.join(cwd(), "logs"),
      fileName: getPluginUUID(),
      format: stringFormatter(),
      maxFileCount: 10,
      maxSize: 50 * 1024 * 1024
    });
    targets = [fileTarget];
    if (isDebugMode()) {
      targets.splice(0, 0, new ConsoleTarget());
    }
    logger = new Logger({
      level: isDebugMode() ? "debug" : "info",
      minimumLevel: isDebugMode() ? "trace" : "debug",
      targets
    });
    process.once("uncaughtException", (err) => logger.error("Process encountered uncaught exception", err));
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/connection.js
var Connection, connection;
var init_connection = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/connection.js"() {
    init_dist();
    init_wrapper();
    init_api2();
    init_version();
    init_logging2();
    Connection = class extends EventEmitter {
      /**
       * Private backing field for {@link Connection.registrationParameters}.
       */
      _registrationParameters;
      /**
       * Private backing field for {@link Connection.version}.
       */
      _version;
      /**
       * Used to ensure {@link Connection.connect} is invoked as a singleton; `false` when a connection is occurring or established.
       */
      canConnect = true;
      /**
       * Underlying web socket connection.
       */
      connection = withResolvers();
      /**
       * Logger scoped to the connection.
       */
      logger = logger.createScope("Connection");
      /**
       * Underlying connection information provided to the plugin to establish a connection with Stream Deck.
       * @returns The registration parameters.
       */
      get registrationParameters() {
        return this._registrationParameters ??= this.getRegistrationParameters();
      }
      /**
       * Version of Stream Deck this instance is connected to.
       * @returns The version.
       */
      get version() {
        return this._version ??= new Version(this.registrationParameters.info.application.version);
      }
      /**
       * Establishes a connection with the Stream Deck, allowing for the plugin to send and receive messages.
       * @returns A promise that is resolved when a connection has been established.
       */
      async connect() {
        if (this.canConnect) {
          this.canConnect = false;
          const webSocket = new wrapper_default(`ws://127.0.0.1:${this.registrationParameters.port}`);
          webSocket.onmessage = (ev) => this.tryEmit(ev);
          webSocket.onopen = () => {
            webSocket.send(JSON.stringify({
              event: this.registrationParameters.registerEvent,
              uuid: this.registrationParameters.pluginUUID
            }));
            this.connection.resolve(webSocket);
            this.emit("connected", this.registrationParameters.info);
          };
        }
        await this.connection.promise;
      }
      /**
       * Sends the commands to the Stream Deck, once the connection has been established and registered.
       * @param command Command being sent.
       * @returns `Promise` resolved when the command is sent to Stream Deck.
       */
      async send(command) {
        const connection2 = await this.connection.promise;
        const message = JSON.stringify(command);
        this.logger.trace(message);
        connection2.send(message);
      }
      /**
       * Gets the registration parameters, provided by Stream Deck, that provide information to the plugin, including how to establish a connection.
       * @returns Parsed registration parameters.
       */
      getRegistrationParameters() {
        const params = {
          port: void 0,
          info: void 0,
          pluginUUID: void 0,
          registerEvent: void 0
        };
        const scopedLogger = logger.createScope("RegistrationParameters");
        for (let i = 0; i < process.argv.length - 1; i++) {
          const param = process.argv[i];
          const value = process.argv[++i];
          switch (param) {
            case RegistrationParameter.Port:
              scopedLogger.debug(`port=${value}`);
              params.port = value;
              break;
            case RegistrationParameter.PluginUUID:
              scopedLogger.debug(`pluginUUID=${value}`);
              params.pluginUUID = value;
              break;
            case RegistrationParameter.RegisterEvent:
              scopedLogger.debug(`registerEvent=${value}`);
              params.registerEvent = value;
              break;
            case RegistrationParameter.Info:
              scopedLogger.debug(`info=${value}`);
              params.info = JSON.parse(value);
              break;
            default:
              i--;
              break;
          }
        }
        const invalidArgs = [];
        const validate = (name, value) => {
          if (value === void 0) {
            invalidArgs.push(name);
          }
        };
        validate(RegistrationParameter.Port, params.port);
        validate(RegistrationParameter.PluginUUID, params.pluginUUID);
        validate(RegistrationParameter.RegisterEvent, params.registerEvent);
        validate(RegistrationParameter.Info, params.info);
        if (invalidArgs.length > 0) {
          throw new Error(`Unable to establish a connection with Stream Deck, missing command line arguments: ${invalidArgs.join(", ")}`);
        }
        return params;
      }
      /**
       * Attempts to emit the {@link ev} that was received from the {@link Connection.connection}.
       * @param ev Event message data received from Stream Deck.
       */
      tryEmit(ev) {
        try {
          const message = JSON.parse(ev.data.toString());
          if (message.event) {
            this.logger.trace(ev.data.toString());
            this.emit(message.event, message);
          } else {
            this.logger.warn(`Received unknown message: ${ev.data}`);
          }
        } catch (err) {
          this.logger.error(`Failed to parse message: ${ev.data}`, err);
        }
      }
    };
    connection = new Connection();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/event.js
var Event;
var init_event = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/event.js"() {
    Event = class {
      /**
       * Event that occurred.
       */
      type;
      /**
       * Initializes a new instance of the {@link Event} class.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       */
      constructor(source) {
        this.type = source.event;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/action-event.js
var ActionWithoutPayloadEvent, ActionEvent;
var init_action_event = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/action-event.js"() {
    init_event();
    ActionWithoutPayloadEvent = class extends Event {
      action;
      /**
       * Initializes a new instance of the {@link ActionWithoutPayloadEvent} class.
       * @param action Action that raised the event.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       */
      constructor(action2, source) {
        super(source);
        this.action = action2;
      }
    };
    ActionEvent = class extends ActionWithoutPayloadEvent {
      /**
       * Provides additional information about the event that occurred, e.g. how many `ticks` the dial was rotated, the current `state` of the action, etc.
       */
      payload;
      /**
       * Initializes a new instance of the {@link ActionEvent} class.
       * @param action Action that raised the event.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       */
      constructor(action2, source) {
        super(action2, source);
        this.payload = source.payload;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/manifest.js
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
function getSoftwareMinimumVersion() {
  return softwareMinimumVersion.value;
}
function getManifest() {
  return manifest.value;
}
var manifest, softwareMinimumVersion;
var init_manifest = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/manifest.js"() {
    init_dist();
    init_api2();
    init_version();
    manifest = new Lazy(() => {
      const path5 = join(process.cwd(), "manifest.json");
      if (!existsSync(path5)) {
        throw new Error("Failed to read manifest.json as the file does not exist.");
      }
      try {
        return JSON.parse(readFileSync(path5, {
          encoding: "utf-8",
          flag: "r"
        }).toString());
      } catch (e) {
        if (e instanceof SyntaxError) {
          return null;
        } else {
          throw e;
        }
      }
    });
    softwareMinimumVersion = new Lazy(() => {
      if (manifest.value === null) {
        return null;
      }
      return new Version(manifest.value.Software.MinimumVersion);
    });
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/cache.js
var SettingsCache, settingsCache;
var init_cache = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/cache.js"() {
    SettingsCache = class {
      /**
       * Underlying map of action ID to cached settings.
       */
      #entries = /* @__PURE__ */ new Map();
      /**
       * Clears the cached settings.
       */
      clear() {
        this.#entries.clear();
      }
      /**
       * Removes the cached settings for the specified action.
       * @param id Action instance identifier.
       */
      delete(id) {
        this.#entries.delete(id);
      }
      /**
       * Gets the cached settings for the specified action.
       * @param id Action instance identifier.
       * @returns The cached settings when present; otherwise `undefined`.
       */
      get(id) {
        const settings2 = this.#entries.get(id);
        return settings2 !== void 0 ? structuredClone(settings2) : void 0;
      }
      /**
       * Sets the cached settings for the specified action.
       * @param id Action instance identifier.
       * @param settings The settings to cache.
       */
      set(id, settings2) {
        this.#entries.set(id, structuredClone(settings2));
      }
    };
    settingsCache = new SettingsCache();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/config.js
var actionConfig;
var init_config = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/config.js"() {
    actionConfig = {
      /**
       * Determines the behavior of when `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are fired.
       *
       * - `false` (default) — `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are only fired
       * after the settings are updated within the property inspector.
       * - `true` — `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are fired after the settings
       * are updated within the property inspector, and after calling `action.getSettings()` and
       * `streamDeck.settings.getGlobalSettings()` respectively.
       *
       * This option replaces `useExperimentalMessageIdentifiers`, with inverted behavior.
       */
      useLegacySettingsBehavior: false
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/store.js
var __items, ReadOnlyActionStore, ActionStore, actionStore;
var init_store = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/store.js"() {
    init_dist();
    __items = /* @__PURE__ */ new Map();
    ReadOnlyActionStore = class extends Enumerable {
      /**
       * Initializes a new instance of the {@link ReadOnlyActionStore}.
       */
      constructor() {
        super(__items);
      }
      /**
       * Gets the action with the specified identifier.
       * @param id Identifier of action to search for.
       * @returns The action, when present; otherwise `undefined`.
       */
      getActionById(id) {
        return __items.get(id);
      }
    };
    ActionStore = class extends ReadOnlyActionStore {
      /**
       * Deletes the action from the store.
       * @param id The action's identifier.
       */
      delete(id) {
        __items.delete(id);
      }
      /**
       * Adds the action to the store.
       * @param action The action.
       */
      set(action2) {
        __items.set(action2.id, action2);
      }
    };
    actionStore = new ActionStore();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/application-event.js
var ApplicationEvent;
var init_application_event = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/application-event.js"() {
    init_event();
    ApplicationEvent = class extends Event {
      /**
       * Monitored application that was launched/terminated.
       */
      application;
      /**
       * Initializes a new instance of the {@link ApplicationEvent} class.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       */
      constructor(source) {
        super(source);
        this.application = source.payload.application;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/device-event.js
var DeviceEvent;
var init_device_event = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/device-event.js"() {
    init_event();
    DeviceEvent = class extends Event {
      device;
      /**
       * Initializes a new instance of the {@link DeviceEvent} class.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       * @param device Device that event is associated with.
       */
      constructor(source, device) {
        super(source);
        this.device = device;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/deep-link-event.js
var DidReceiveDeepLinkEvent, PREFIX, DeepLinkURL;
var init_deep_link_event = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/deep-link-event.js"() {
    init_event();
    DidReceiveDeepLinkEvent = class extends Event {
      /**
       * Deep-link URL routed from Stream Deck.
       */
      url;
      /**
       * Initializes a new instance of the {@link DidReceiveDeepLinkEvent} class.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       */
      constructor(source) {
        super(source);
        this.url = new DeepLinkURL(source.payload.url);
      }
    };
    PREFIX = "streamdeck://";
    DeepLinkURL = class _DeepLinkURL {
      /**
       * Fragment of the URL, with the number sign (#) omitted. For example, a URL of "/test#heading" would result in a {@link DeepLinkURL.fragment} of "heading".
       */
      fragment;
      /**
       * Original URL. For example, a URL of "/test?one=two#heading" would result in a {@link DeepLinkURL.href} of "/test?one=two#heading".
       */
      href;
      /**
       * Path of the URL; the full URL with the query and fragment omitted. For example, a URL of "/test?one=two#heading" would result in a {@link DeepLinkURL.path} of "/test".
       */
      path;
      /**
       * Query of the URL, with the question mark (?) omitted. For example, a URL of "/test?name=elgato&key=123" would result in a {@link DeepLinkURL.query} of "name=elgato&key=123".
       * See also {@link DeepLinkURL.queryParameters}.
       */
      query;
      /**
       * Query string parameters parsed from the URL. See also {@link DeepLinkURL.query}.
       */
      queryParameters;
      /**
       * Initializes a new instance of the {@link DeepLinkURL} class.
       * @param url URL of the deep-link, with the schema and authority omitted.
       */
      constructor(url2) {
        const refUrl = new URL(`${PREFIX}${url2}`);
        this.fragment = refUrl.hash.substring(1);
        this.href = refUrl.href.substring(PREFIX.length);
        this.path = _DeepLinkURL.parsePath(this.href);
        this.query = refUrl.search.substring(1);
        this.queryParameters = refUrl.searchParams;
      }
      /**
       * Parses the {@link DeepLinkURL.path} from the specified {@link href}.
       * @param href Partial URL that contains the path to parse.
       * @returns The path of the URL.
       */
      static parsePath(href) {
        const indexOf = (char) => {
          const index = href.indexOf(char);
          return index >= 0 ? index : href.length;
        };
        return href.substring(0, Math.min(indexOf("?"), indexOf("#")));
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/global-settings-event.js
var DidReceiveGlobalSettingsEvent;
var init_global_settings_event = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/global-settings-event.js"() {
    init_event();
    DidReceiveGlobalSettingsEvent = class extends Event {
      /**
       * Settings associated with the event.
       */
      settings;
      /**
       * Initializes a new instance of the {@link DidReceiveGlobalSettingsEvent} class.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       */
      constructor(source) {
        super(source);
        this.settings = source.payload.settings;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/ui-message-event.js
var SendToPluginEvent;
var init_ui_message_event = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/ui-message-event.js"() {
    init_event();
    SendToPluginEvent = class extends Event {
      action;
      /**
       * Payload sent from the property inspector.
       */
      payload;
      /**
       * Initializes a new instance of the {@link SendToPluginEvent} class.
       * @param action Action that raised the event.
       * @param source Source of the event, i.e. the original message from Stream Deck.
       */
      constructor(action2, source) {
        super(source);
        this.action = action2;
        this.payload = source.payload;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/index.js
var init_events2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/events/index.js"() {
    init_action_event();
    init_application_event();
    init_device_event();
    init_event();
    init_deep_link_event();
    init_global_settings_event();
    init_ui_message_event();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/validation.js
function requiresVersion(minimumVersion, streamDeckVersion, feature) {
  const required3 = {
    major: Math.floor(minimumVersion),
    minor: Number(minimumVersion.toString().split(".").at(1) ?? 0),
    // Account for JavaScript's floating point precision.
    patch: 0,
    build: 0
  };
  if (streamDeckVersion.compareTo(required3) === -1) {
    throw new Error(`[ERR_NOT_SUPPORTED]: ${feature} requires Stream Deck version ${required3.major}.${required3.minor} or higher, but current version is ${streamDeckVersion.major}.${streamDeckVersion.minor}; please update Stream Deck and the "Software.MinimumVersion" in the plugin's manifest to "${required3.major}.${required3.minor}" or higher.`);
  }
  const softwareMinimumVersion2 = getSoftwareMinimumVersion();
  if (softwareMinimumVersion2 !== null && softwareMinimumVersion2.compareTo(required3) === -1) {
    throw new Error(`[ERR_NOT_SUPPORTED]: ${feature} requires Stream Deck version ${required3.major}.${required3.minor} or higher; please update the "Software.MinimumVersion" in the plugin's manifest to "${required3.major}.${required3.minor}" or higher.`);
  }
}
var init_validation = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/validation.js"() {
    init_version();
    init_manifest();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/settings.js
import { randomUUID } from "node:crypto";
function validateSettingsBehavior() {
  if (!settings.useLegacySettingsBehavior) {
    requiresVersion(7.1, connection.version, "Default onDidReceiveSettings/onDidReceiveGlobalSettings behavior");
  }
}
var settings;
var init_settings = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/settings.js"() {
    init_cache();
    init_config();
    init_store();
    init_connection();
    init_action_event();
    init_events2();
    init_validation();
    settings = {
      /**
       * Determines the behavior of when `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are fired.
       *
       * - `false` (default) — `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are only fired
       * after the settings are updated within the property inspector.
       * - `true` — `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are fired after the settings
       * are updated within the property inspector, and after calling `action.getSettings()` and
       * `streamDeck.settings.getGlobalSettings()` respectively.
       *
       * This option replaces `useExperimentalMessageIdentifiers`, with inverted behavior.
       */
      get useLegacySettingsBehavior() {
        return actionConfig.useLegacySettingsBehavior;
      },
      /**
       * Determines the behavior of when `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are fired.
       *
       * - `false` (default) — `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are only fired
       * after the settings are updated within the property inspector.
       * - `true` — `onDidReceiveSettings` and `onDidReceiveGlobalSettings` are fired after the settings
       * are updated within the property inspector, and after calling `action.getSettings()` and
       * `streamDeck.settings.getGlobalSettings()` respectively.
       *
       * This option replaces `useExperimentalMessageIdentifiers`, with inverted behavior.
       */
      set useLegacySettingsBehavior(value) {
        const prev = actionConfig.useLegacySettingsBehavior;
        if (prev === value) {
          return;
        }
        try {
          actionConfig.useLegacySettingsBehavior = value;
          validateSettingsBehavior();
          settingsCache.clear();
        } catch (err) {
          actionConfig.useLegacySettingsBehavior = prev;
          throw err;
        }
      },
      /**
       * Gets the global settings associated with the plugin.
       * @template T The type of global settings associated with the plugin.
       * @returns Promise containing the plugin's global settings.
       */
      getGlobalSettings: () => {
        return new Promise((resolve) => {
          connection.once("didReceiveGlobalSettings", (ev) => resolve(ev.payload.settings));
          connection.send({
            event: "getGlobalSettings",
            context: connection.registrationParameters.pluginUUID,
            id: randomUUID()
          });
        });
      },
      /**
       * Occurs when the global settings are updated within the property inspector.
       *
       * When `streamDeck.settings.useLegacySettingsBehavior` is set to `true`, this event will also
       * occur when calling `getGlobalSettings()`.
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that removes the listener.
       */
      onDidReceiveGlobalSettings: (listener) => {
        return connection.disposableOn("didReceiveGlobalSettings", (ev) => {
          if (!settings.useLegacySettingsBehavior && ev.id) {
            return;
          }
          listener(new DidReceiveGlobalSettingsEvent(ev));
        });
      },
      /**
       * Occurs when the settings, associated with an action, are updated within the property inspector.
       *
       * When `streamDeck.settings.useLegacySettingsBehavior` is set to `true`, this event will also
       * occur when calling `getSettings()` on an action.
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that removes the listener.
       */
      onDidReceiveSettings: (listener) => {
        return connection.disposableOn("didReceiveSettings", (ev) => {
          if (!settings.useLegacySettingsBehavior && ev.id) {
            return;
          }
          const action2 = actionStore.getActionById(ev.context);
          if (action2) {
            listener(new ActionEvent(action2, ev));
          }
        });
      },
      /**
       * Sets the global settings associated the plugin; these settings are only available to this plugin,
       * and should be used to persist information securely.
       * @param settings Settings to save.
       * @example
       * streamDeck.settings.setGlobalSettings({
       *   apiKey,
       *   connectedDate: new Date()
       * })
       */
      setGlobalSettings: async (settings2) => {
        await connection.send({
          event: "setGlobalSettings",
          context: connection.registrationParameters.pluginUUID,
          payload: settings2
        });
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/ui.js
var UIController, ui;
var init_ui3 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/ui.js"() {
    init_store();
    init_connection();
    init_action_event();
    init_events2();
    UIController = class {
      /**
       * Action associated with the current property inspector.
       */
      #action;
      /**
       * To overcome event races, the debounce counter keeps track of appear vs disappear events, ensuring
       * we only clear the current ui when an equal number of matching disappear events occur.
       */
      #appearanceStackCount = 0;
      /**
       * Initializes a new instance of the {@link UIController} class.
       */
      constructor() {
        this.onDidAppear((ev) => {
          if (this.#isCurrent(ev.action)) {
            this.#appearanceStackCount++;
          } else {
            this.#appearanceStackCount = 1;
            this.#action = ev.action;
          }
        });
        this.onDidDisappear((ev) => {
          if (this.#isCurrent(ev.action)) {
            this.#appearanceStackCount--;
            if (this.#appearanceStackCount <= 0) {
              this.#action = void 0;
            }
          }
        });
      }
      /**
       * Gets the action associated with the current property.
       * @returns The action; otherwise `undefined` when a property inspector is not visible.
       */
      get action() {
        return this.#action;
      }
      /**
       * Occurs when the property inspector associated with the action becomes visible, i.e. the user
       * selected an action in the Stream Deck application..
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDidAppear(listener) {
        return connection.disposableOn("propertyInspectorDidAppear", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2) {
            listener(new ActionWithoutPayloadEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the property inspector associated with the action disappears, i.e. the user unselected
       * the action in the Stream Deck application.
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDidDisappear(listener) {
        return connection.disposableOn("propertyInspectorDidDisappear", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2) {
            listener(new ActionWithoutPayloadEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when a message was sent to the plugin _from_ the property inspector.
       * @template TPayload The type of the payload received from the property inspector.
       * @template TSettings The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onSendToPlugin(listener) {
        return connection.disposableOn("sendToPlugin", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2) {
            listener(new SendToPluginEvent(action2, ev));
          }
        });
      }
      /**
       * Sends the payload to the property inspector; the payload is only sent when the property inspector
       * is visible for an action provided by this plugin.
       * @param payload Payload to send.
       */
      async sendToPropertyInspector(payload) {
        if (this.#action) {
          await connection.send({
            event: "sendToPropertyInspector",
            context: this.#action.id,
            payload
          });
        }
      }
      /**
       * Determines whether the specified action is the action for the current property inspector.
       * @param action Action to check against.
       * @returns `true` when the actions are the same.
       */
      #isCurrent(action2) {
        return this.#action?.id === action2.id && this.#action?.manifestId === action2.manifestId && this.#action?.device?.id === action2.device.id;
      }
    };
    ui = new UIController();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/store.js
var __items2, ReadOnlyDeviceStore, DeviceStore, deviceStore;
var init_store2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/store.js"() {
    init_dist();
    __items2 = /* @__PURE__ */ new Map();
    ReadOnlyDeviceStore = class extends Enumerable {
      /**
       * Initializes a new instance of the {@link ReadOnlyDeviceStore}.
       */
      constructor() {
        super(__items2);
      }
      /**
       * Gets the Stream Deck {@link Device} associated with the specified {@link deviceId}.
       * @param deviceId Identifier of the Stream Deck device.
       * @returns The Stream Deck device information; otherwise `undefined` if a device with the {@link deviceId} does not exist.
       */
      getDeviceById(deviceId) {
        return __items2.get(deviceId);
      }
    };
    DeviceStore = class extends ReadOnlyDeviceStore {
      /**
       * Adds the device to the store.
       * @param device The device.
       */
      set(device) {
        __items2.set(device.id, device);
      }
    };
    deviceStore = new DeviceStore();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/context.js
var ActionContext;
var init_context = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/context.js"() {
    init_store2();
    ActionContext = class {
      /**
       * Device the action is associated with.
       */
      #device;
      /**
       * Source of the action.
       */
      #source;
      /**
       * Initializes a new instance of the {@link ActionContext} class.
       * @param source Source of the action.
       */
      constructor(source) {
        this.#source = source;
        const device = deviceStore.getDeviceById(source.device);
        if (!device) {
          throw new Error(`Failed to initialize action; device ${source.device} not found`);
        }
        this.#device = device;
      }
      /**
       * Type of the action.
       * - `Keypad` is a key.
       * - `Encoder` is a dial and portion of the touch strip.
       * @returns Controller type.
       */
      get controllerType() {
        return this.#source.payload.controller;
      }
      /**
       * Stream Deck device the action is positioned on.
       * @returns Stream Deck device.
       */
      get device() {
        return this.#device;
      }
      /**
       * Action instance identifier.
       * @returns Identifier.
       */
      get id() {
        return this.#source.context;
      }
      /**
       * Manifest identifier (UUID) for this action type.
       * @returns Manifest identifier.
       */
      get manifestId() {
        return this.#source.action;
      }
      /**
       * Converts this instance to a serializable object.
       * @returns The serializable object.
       */
      toJSON() {
        return {
          controllerType: this.controllerType,
          device: this.device,
          id: this.id,
          manifestId: this.manifestId
        };
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/action-base.js
import { randomUUID as randomUUID2 } from "node:crypto";
var REQUEST_TIMEOUT, ActionBase;
var init_action_base = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/action-base.js"() {
    init_dist();
    init_connection();
    init_logging2();
    init_validation();
    init_cache();
    init_config();
    init_context();
    REQUEST_TIMEOUT = 15 * 1e3;
    ActionBase = class extends ActionContext {
      /**
       * Gets the resources (files) associated with this action; these resources are embedded into the action when it is
       * exported, either individually, or as part of a profile.
       *
       * Available from Stream Deck 7.1.
       * @returns The resources.
       */
      async getResources() {
        requiresVersion(7.1, connection.version, "getResources");
        const res = await this.#fetch("getResources", "didReceiveResources");
        return res.payload.resources;
      }
      /**
       * Gets the settings associated this action instance.
       * @returns Promise containing the action instance's settings.
       */
      async getSettings() {
        if (!actionConfig.useLegacySettingsBehavior) {
          const cached2 = settingsCache.get(this.id);
          if (cached2 !== void 0) {
            logger.trace(JSON.stringify({
              event: "getSettings",
              context: this.id,
              source: "cache",
              settings: cached2
            }));
            return cached2;
          }
        }
        const res = await this.#fetch("getSettings", "didReceiveSettings");
        return res.payload.settings;
      }
      /**
       * Determines whether this instance is a dial.
       * @returns `true` when this instance is a dial; otherwise `false`.
       */
      isDial() {
        return this.controllerType === "Encoder";
      }
      /**
       * Determines whether this instance is a key.
       * @returns `true` when this instance is a key; otherwise `false`.
       */
      isKey() {
        return this.controllerType === "Keypad";
      }
      /**
       * Determines whether this instance is an Infobar.
       * @returns `true` when this instance is an Infobar; otherwise `false`.
       */
      isNeoInfobar() {
        return this.controllerType === "Neo";
      }
      /**
       * Sets the resources (files) associated with this action; these resources are embedded into the action when it is
       * exported, either individually, or as part of a profile.
       *
       * Available from Stream Deck 7.1.
       * @example
       * action.setResources({
       *   fileOne: "c:\\hello-world.txt",
       *   anotherFile: "c:\\icon.png"
       * });
       * @param resources The resources as a map of file paths.
       * @returns `Promise` resolved when the resources are saved to Stream Deck.
       */
      setResources(resources) {
        requiresVersion(7.1, connection.version, "setResources");
        return connection.send({
          event: "setResources",
          context: this.id,
          payload: resources
        });
      }
      /**
       * Sets the settings associated with this action instance.
       * @param value Settings to persist.
       * @returns `Promise` resolved when the settings are sent to Stream Deck.
       */
      setSettings(value) {
        settingsCache.delete(this.id);
        return connection.send({
          event: "setSettings",
          context: this.id,
          payload: value
        });
      }
      /**
       * Fetches information from Stream Deck by sending the command, and awaiting the event.
       * @param command Name of the event (command) to send.
       * @param event Name of the event to await.
       * @returns The payload from the received event.
       */
      async #fetch(command, event) {
        const { resolve, reject, promise: promise2 } = withResolvers();
        const timeoutId = setTimeout(() => {
          listener.dispose();
          reject("The request timed out");
        }, REQUEST_TIMEOUT);
        const listener = connection.disposableOn(event, (ev) => {
          if (ev.context == this.id) {
            clearTimeout(timeoutId);
            listener.dispose();
            resolve(ev);
          }
        });
        await connection.send({
          event: command,
          context: this.id,
          id: randomUUID2()
        });
        return promise2;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/dial.js
var DialAction;
var init_dial = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/dial.js"() {
    init_connection();
    init_action_base();
    DialAction = class extends ActionBase {
      /**
       * Private backing field for the coordinates.
       */
      #coordinates;
      /**
       * Initializes a new instance of the {@see DialAction} class.
       * @param source Source of the action.
       */
      constructor(source) {
        super(source);
        if (source.payload.controller !== "Encoder") {
          throw new Error("Unable to create DialAction; source event is not a Encoder");
        }
        this.#coordinates = Object.freeze(source.payload.coordinates);
      }
      /**
       * Coordinates of the dial.
       * @returns The coordinates.
       */
      get coordinates() {
        return this.#coordinates;
      }
      /**
       * Sets the feedback for the current layout associated with this action instance, allowing for the visual items to be updated. Layouts are a powerful way to provide dynamic information
       * to users, and can be assigned in the manifest, or dynamically via {@link DialAction.setFeedbackLayout}.
       *
       * The {@link feedback} payload defines which items within the layout will be updated, and are identified by their property name (defined as the `key` in the layout's definition).
       * The values can either by a complete new definition, a `string` for layout item types of `text` and `pixmap`, or a `number` for layout item types of `bar` and `gbar`.
       * @param feedback Object containing information about the layout items to be updated.
       * @returns `Promise` resolved when the request to set the {@link feedback} has been sent to Stream Deck.
       */
      setFeedback(feedback) {
        return connection.send({
          event: "setFeedback",
          context: this.id,
          payload: feedback
        });
      }
      /**
       * Sets the layout associated with this action instance. The layout must be either a built-in layout identifier, or path to a local layout JSON file within the plugin's folder.
       * Use in conjunction with {@link DialAction.setFeedback} to update the layout's current items' settings.
       * @param layout Name of a pre-defined layout, or relative path to a custom one.
       * @returns `Promise` resolved when the new layout has been sent to Stream Deck.
       */
      setFeedbackLayout(layout) {
        return connection.send({
          event: "setFeedbackLayout",
          context: this.id,
          payload: {
            layout
          }
        });
      }
      /**
       * Sets the {@link image} to be display for this action instance within Stream Deck app.
       *
       * NB: The image can only be set by the plugin when the the user has not specified a custom image.
       * @param image Image to display; this can be either a path to a local file within the plugin's folder, a base64 encoded `string` with the mime type declared (e.g. PNG, JPEG, etc.),
       * or an SVG `string`. When `undefined`, the image from the manifest will be used.
       * @returns `Promise` resolved when the request to set the {@link image} has been sent to Stream Deck.
       */
      setImage(image) {
        return connection.send({
          event: "setImage",
          context: this.id,
          payload: {
            image
          }
        });
      }
      /**
       * Sets the {@link title} displayed for this action instance.
       *
       * NB: The title can only be set by the plugin when the the user has not specified a custom title.
       * @param title Title to display.
       * @returns `Promise` resolved when the request to set the {@link title} has been sent to Stream Deck.
       */
      setTitle(title) {
        return this.setFeedback({ title });
      }
      /**
       * Sets the trigger (interaction) {@link descriptions} associated with this action instance. Descriptions are shown within the Stream Deck application, and informs the user what
       * will happen when they interact with the action, e.g. rotate, touch, etc. When {@link descriptions} is `undefined`, the descriptions will be reset to the values provided as part
       * of the manifest.
       *
       * NB: Applies to encoders (dials / touchscreens) found on Stream Deck + devices.
       * @param descriptions Descriptions that detail the action's interaction.
       * @returns `Promise` resolved when the request to set the {@link descriptions} has been sent to Stream Deck.
       */
      setTriggerDescription(descriptions) {
        return connection.send({
          event: "setTriggerDescription",
          context: this.id,
          payload: descriptions || {}
        });
      }
      /**
       * Shows a temporary alert (i.e. warning) indicator on the touch strip associated with the action.
       * @returns `Promise` resolved when the request to show an alert has been sent to Stream Deck.
       */
      showAlert() {
        return connection.send({
          event: "showAlert",
          context: this.id
        });
      }
      /**
       * @inheritdoc
       */
      toJSON() {
        return {
          ...super.toJSON(),
          coordinates: this.coordinates
        };
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/key.js
var KeyAction;
var init_key = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/key.js"() {
    init_connection();
    init_action_base();
    KeyAction = class extends ActionBase {
      /**
       * Private backing field for the coordinates.
       */
      #coordinates;
      /**
       * Source of the action.
       */
      #source;
      /**
       * Initializes a new instance of the {@see KeyAction} class.
       * @param source Source of the action.
       */
      constructor(source) {
        super(source);
        if (source.payload.controller !== "Keypad") {
          throw new Error("Unable to create KeyAction; source event is not a Keypad");
        }
        this.#coordinates = !source.payload.isInMultiAction ? Object.freeze(source.payload.coordinates) : void 0;
        this.#source = source;
      }
      /**
       * Coordinates of the key; otherwise `undefined` when the action is part of a multi-action.
       * @returns The coordinates.
       */
      get coordinates() {
        return this.#coordinates;
      }
      /**
       * Determines whether the key is part of a multi-action.
       * @returns `true` when in a multi-action; otherwise `false`.
       */
      isInMultiAction() {
        return this.#source.payload.isInMultiAction;
      }
      /**
       * Sets the {@link image} to be display for this action instance.
       *
       * NB: The image can only be set by the plugin when the the user has not specified a custom image.
       * @param image Image to display; this can be either a path to a local file within the plugin's folder, a base64 encoded `string` with the mime type declared (e.g. PNG, JPEG, etc.),
       * or an SVG `string`. When `undefined`, the image from the manifest will be used.
       * @param options Additional options that define where and how the image should be rendered.
       * @returns `Promise` resolved when the request to set the {@link image} has been sent to Stream Deck.
       */
      setImage(image, options) {
        return connection.send({
          event: "setImage",
          context: this.id,
          payload: {
            image,
            ...options
          }
        });
      }
      /**
       * Sets the current {@link state} of this action instance; only applies to actions that have multiple states defined within the manifest.
       * @param state State to set; this be either 0, or 1.
       * @returns `Promise` resolved when the request to set the state of an action instance has been sent to Stream Deck.
       */
      setState(state) {
        return connection.send({
          event: "setState",
          context: this.id,
          payload: {
            state
          }
        });
      }
      /**
       * Sets the {@link title} displayed for this action instance.
       *
       * NB: The title can only be set by the plugin when the the user has not specified a custom title.
       * @param title Title to display; when `undefined` the title within the manifest will be used.
       * @param options Additional options that define where and how the title should be rendered.
       * @returns `Promise` resolved when the request to set the {@link title} has been sent to Stream Deck.
       */
      setTitle(title, options) {
        return connection.send({
          event: "setTitle",
          context: this.id,
          payload: {
            title,
            ...options
          }
        });
      }
      /**
       * Shows a temporary alert (i.e. warning), in the form of an exclamation mark in a yellow triangle, on the key.
       * @returns `Promise` resolved when the request to show an alert has been sent to Stream Deck.
       */
      showAlert() {
        return connection.send({
          event: "showAlert",
          context: this.id
        });
      }
      /**
       * Temporarily shows an "OK" (i.e. success), in the form of a check-mark in a green circle, on this action instance.
       * Used to provide visual feedback when an action successfully
       * executed.
       * @returns `Promise` resolved when the request to show an "OK" has been sent to Stream Deck.
       */
      showOk() {
        return connection.send({
          event: "showOk",
          context: this.id
        });
      }
      /**
       * @inheritdoc
       */
      toJSON() {
        return {
          ...super.toJSON(),
          coordinates: this.coordinates,
          isInMultiAction: this.isInMultiAction()
        };
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/neo-infobar.js
var NeoInfobarAction;
var init_neo_infobar = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/neo-infobar.js"() {
    init_connection();
    init_action_base();
    NeoInfobarAction = class extends ActionBase {
      /**
       * Private backing field for the coordinates.
       */
      #coordinates;
      /**
       * Initializes a new instance of the {@see NeoInfobarAction} class.
       * @param source Source of the action.
       */
      constructor(source) {
        super(source);
        if (source.payload.controller !== "Neo") {
          throw new Error("Unable to create NeoInfobarAction; source event controller is not 'Neo'");
        }
        this.#coordinates = Object.freeze(source.payload.coordinates);
      }
      /**
       * Coordinates of the Infobar.
       * @returns The coordinates.
       */
      get coordinates() {
        return this.#coordinates;
      }
      /**
       * Sets the feedback for the current layout associated with this action instance, allowing for the visual items to be
       * updated. Layouts are a powerful way to provide dynamic information to users, and can be assigned in the manifest,
       * or dynamically via `setFeedbackLayout`.
       *
       * The `feedback` payload defines which items within the layout will be updated, and are identified by their property
       * name (defined as the `key` in the layout's definition). The values can either be a complete new definition, a `string`
       * for layout item types of `text` and `pixmap`, or a `number` for layout item types of `bar` and `gbar`.
       * @param feedback Object containing information about the layout items to be updated.
       * @returns `Promise` resolved when the request to set the `feedback` has been sent to Stream Deck.
       */
      setFeedback(feedback) {
        return connection.send({
          event: "setFeedback",
          context: this.id,
          payload: feedback
        });
      }
      /**
       * Sets the layout associated with this action instance. The layout must be a path to a local layout JSON file within
       * the plugin's folder. Use in conjunction with `setFeedback` to update the layout's current items' settings.
       * @param layout Relative path to the layout file.
       * @returns `Promise` resolved when the new layout has been sent to Stream Deck.
       */
      setFeedbackLayout(layout) {
        return connection.send({
          event: "setFeedbackLayout",
          context: this.id,
          payload: {
            layout
          }
        });
      }
      /**
       * @inheritdoc
       */
      toJSON() {
        return {
          ...super.toJSON(),
          coordinates: this.coordinates
        };
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/service.js
var manifest2, ActionService, actionService;
var init_service = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/service.js"() {
    init_dist();
    init_connection();
    init_action_event();
    init_manifest();
    init_settings();
    init_ui3();
    init_cache();
    init_config();
    init_context();
    init_dial();
    init_key();
    init_neo_infobar();
    init_store();
    manifest2 = new Lazy(() => getManifest());
    ActionService = class extends ReadOnlyActionStore {
      /**
       * Initializes a new instance of the {@link ActionService} class.
       */
      constructor() {
        super();
        connection.prependListener("willAppear", (ev) => {
          const action2 = this.#createAction(ev);
          actionStore.set(action2);
          if (!actionConfig.useLegacySettingsBehavior) {
            settingsCache.set(ev.context, ev.payload.settings);
          }
        });
        connection.prependListener("didReceiveSettings", (ev) => {
          if (!actionConfig.useLegacySettingsBehavior) {
            settingsCache.set(ev.context, ev.payload.settings);
          }
        });
        connection.prependListener("willDisappear", (ev) => {
          actionStore.delete(ev.context);
          settingsCache.delete(ev.context);
        });
      }
      /**
       * Occurs when the user presses a dial (Stream Deck +).
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDialDown(listener) {
        return connection.disposableOn("dialDown", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2?.isDial()) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the user rotates a dial (Stream Deck +).
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDialRotate(listener) {
        return connection.disposableOn("dialRotate", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2?.isDial()) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the user releases a pressed dial (Stream Deck +).
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDialUp(listener) {
        return connection.disposableOn("dialUp", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2?.isDial()) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the resources are updated within the property inspector.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDidReceiveResources(listener) {
        return connection.disposableOn("didReceiveResources", (ev) => {
          if (ev.id !== void 0) {
            return;
          }
          const action2 = actionStore.getActionById(ev.context);
          if (action2) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the user presses a action down.
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onKeyDown(listener) {
        return connection.disposableOn("keyDown", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2?.isKey()) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the user releases a pressed action.
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onKeyUp(listener) {
        return connection.disposableOn("keyUp", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2?.isKey()) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the user updates an action's title settings in the Stream Deck application.
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onTitleParametersDidChange(listener) {
        return connection.disposableOn("titleParametersDidChange", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when the user taps the touchscreen (Stream Deck +).
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onTouchTap(listener) {
        return connection.disposableOn("touchTap", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2?.isDial()) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when an action appears on the Stream Deck due to the user navigating to another page, profile, folder, etc. This also occurs during startup if the action is on the "front
       * page". An action refers to _all_ types of actions, e.g. keys, dials,
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onWillAppear(listener) {
        return connection.disposableOn("willAppear", (ev) => {
          const action2 = actionStore.getActionById(ev.context);
          if (action2) {
            listener(new ActionEvent(action2, ev));
          }
        });
      }
      /**
       * Occurs when an action disappears from the Stream Deck due to the user navigating to another page, profile, folder, etc. An action refers to _all_ types of actions, e.g. keys,
       * dials, touchscreens, pedals, etc.
       * @template T The type of settings associated with the action.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onWillDisappear(listener) {
        return connection.disposableOn("willDisappear", (ev) => listener(new ActionEvent(new ActionContext(ev), ev)));
      }
      /**
       * Registers the action with the Stream Deck, routing all events associated with the {@link SingletonAction.manifestId} to the specified {@link action}.
       * @param action The action to register.
       * @example
       * ＠action({ UUID: "com.elgato.test.action" })
       * class MyCustomAction extends SingletonAction {
       *     export function onKeyDown(ev: KeyDownEvent) {
       *         // Do some awesome thing.
       *     }
       * }
       *
       * streamDeck.actions.registerAction(new MyCustomAction());
       */
      registerAction(action2) {
        if (action2.manifestId === void 0) {
          throw new Error("The action's manifestId cannot be undefined.");
        }
        if (manifest2.value !== null && !manifest2.value.Actions.some((a) => a.UUID === action2.manifestId)) {
          throw new Error(`The action's manifestId was not found within the manifest: ${action2.manifestId}`);
        }
        const { manifestId } = action2;
        const route = (fn, listener) => {
          const boundedListener = listener?.bind(action2);
          if (boundedListener === void 0) {
            return;
          }
          fn.bind(action2)(async (ev) => {
            if (ev.action.manifestId == manifestId) {
              await boundedListener(ev);
            }
          });
        };
        route(this.onDialDown, action2.onDialDown);
        route(this.onDialUp, action2.onDialUp);
        route(this.onDialRotate, action2.onDialRotate);
        route(ui.onSendToPlugin, action2.onSendToPlugin);
        route(this.onDidReceiveResources, action2.onDidReceiveResources);
        route(settings.onDidReceiveSettings, action2.onDidReceiveSettings);
        route(this.onKeyDown, action2.onKeyDown);
        route(this.onKeyUp, action2.onKeyUp);
        route(ui.onDidAppear, action2.onPropertyInspectorDidAppear);
        route(ui.onDidDisappear, action2.onPropertyInspectorDidDisappear);
        route(this.onTitleParametersDidChange, action2.onTitleParametersDidChange);
        route(this.onTouchTap, action2.onTouchTap);
        route(this.onWillAppear, action2.onWillAppear);
        route(this.onWillDisappear, action2.onWillDisappear);
      }
      /**
       * Creates an instance of an action from its associated controller.
       * @param ev Event that contains the controller.
       * @returns The action instance.
       */
      #createAction(ev) {
        switch (ev.payload.controller) {
          case "Encoder":
            return new DialAction(ev);
          case "Neo":
            return new NeoInfobarAction(ev);
          default:
            return new KeyAction(ev);
        }
      }
    };
    actionService = new ActionService();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/device.js
var Device;
var init_device3 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/device.js"() {
    init_store();
    init_connection();
    Device = class {
      /**
       * Private backing field for {@link Device.isConnected}.
       */
      #isConnected = false;
      /**
       * Private backing field for the device's information.
       */
      #info;
      /**
       * Unique identifier of the device.
       */
      id;
      /**
       * Initializes a new instance of the {@link Device} class.
       * @param id Device identifier.
       * @param info Information about the device.
       * @param isConnected Determines whether the device is connected.
       */
      constructor(id, info, isConnected) {
        this.id = id;
        this.#info = info;
        this.#isConnected = isConnected;
        connection.prependListener("deviceDidConnect", (ev) => {
          if (ev.device === this.id) {
            this.#info = ev.deviceInfo;
            this.#isConnected = true;
          }
        });
        connection.prependListener("deviceDidChange", (ev) => {
          if (ev.device === this.id) {
            this.#info = ev.deviceInfo;
          }
        });
        connection.prependListener("deviceDidDisconnect", (ev) => {
          if (ev.device === this.id) {
            this.#isConnected = false;
          }
        });
      }
      /**
       * Actions currently visible on the device.
       * @returns Collection of visible actions.
       */
      get actions() {
        return actionStore.filter((a) => a.device.id === this.id);
      }
      /**
       * Determines whether the device is currently connected.
       * @returns `true` when the device is connected; otherwise `false`.
       */
      get isConnected() {
        return this.#isConnected;
      }
      /**
       * Name of the device, as specified by the user in the Stream Deck application.
       * @returns Name of the device.
       */
      get name() {
        return this.#info.name;
      }
      /**
       * Number of action slots, excluding dials / touchscreens, available to the device.
       * @returns Size of the device.
       */
      get size() {
        return this.#info.size;
      }
      /**
       * Type of the device that was connected, e.g. Stream Deck +, Stream Deck Pedal, etc. See {@link DeviceType}.
       * @returns Type of the device.
       */
      get type() {
        return this.#info.type;
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/service.js
var DeviceService, deviceService;
var init_service2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/service.js"() {
    init_connection();
    init_device_event();
    init_validation();
    init_device3();
    init_store2();
    DeviceService = class extends ReadOnlyDeviceStore {
      /**
       * Initializes a new instance of the {@link DeviceService}.
       */
      constructor() {
        super();
        connection.once("connected", (info) => {
          info.devices.forEach((dev) => deviceStore.set(new Device(dev.id, dev, false)));
        });
        connection.on("deviceDidConnect", ({ device: id, deviceInfo }) => {
          if (!deviceStore.getDeviceById(id)) {
            deviceStore.set(new Device(id, deviceInfo, true));
          }
        });
        connection.on("deviceDidChange", ({ device: id, deviceInfo }) => {
          if (!deviceStore.getDeviceById(id)) {
            deviceStore.set(new Device(id, deviceInfo, false));
          }
        });
      }
      /**
       * Occurs when a Stream Deck device changed, for example its name or size.
       *
       * Available from Stream Deck 7.0.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDeviceDidChange(listener) {
        requiresVersion(7, connection.version, "onDeviceDidChange");
        return connection.disposableOn("deviceDidChange", (ev) => listener(new DeviceEvent(ev, this.getDeviceById(ev.device))));
      }
      /**
       * Occurs when a Stream Deck device is connected. See also {@link DeviceService.onDeviceDidConnect}.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDeviceDidConnect(listener) {
        return connection.disposableOn("deviceDidConnect", (ev) => listener(new DeviceEvent(ev, this.getDeviceById(ev.device))));
      }
      /**
       * Occurs when a Stream Deck device is disconnected. See also {@link DeviceService.onDeviceDidDisconnect}.
       * @param listener Function to be invoked when the event occurs.
       * @returns A disposable that, when disposed, removes the listener.
       */
      onDeviceDidDisconnect(listener) {
        return connection.disposableOn("deviceDidDisconnect", (ev) => listener(new DeviceEvent(ev, this.getDeviceById(ev.device))));
      }
    };
    deviceService = new DeviceService();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/i18n.js
import fs2 from "node:fs";
import path4 from "node:path";
function fileSystemLocaleProvider(language) {
  const filePath = path4.join(process.cwd(), `${language}.json`);
  if (!fs2.existsSync(filePath)) {
    return null;
  }
  try {
    const contents = fs2.readFileSync(filePath, { flag: "r" })?.toString();
    return parseLocalizations(contents);
  } catch (err) {
    logger.error(`Failed to load translations from ${filePath}`, err);
    return null;
  }
}
function parseLocalizations(contents) {
  const json2 = JSON.parse(contents);
  if (json2 !== void 0 && json2 !== null && typeof json2 === "object" && "Localization" in json2) {
    return json2["Localization"];
  }
  throw new TypeError(`Translations must be a JSON object nested under a property named "Localization"`);
}
var init_i18n3 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/i18n.js"() {
    init_logging2();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/profiles.js
var profiles_exports = {};
__export(profiles_exports, {
  switchToProfile: () => switchToProfile
});
function switchToProfile(deviceId, profile, page) {
  if (page !== void 0) {
    requiresVersion(6.5, connection.version, "Switching to a profile page");
  }
  return connection.send({
    event: "switchToProfile",
    context: connection.registrationParameters.pluginUUID,
    device: deviceId,
    payload: {
      page,
      profile
    }
  });
}
var init_profiles = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/profiles.js"() {
    init_connection();
    init_validation();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/system.js
var system_exports = {};
__export(system_exports, {
  onApplicationDidLaunch: () => onApplicationDidLaunch,
  onApplicationDidTerminate: () => onApplicationDidTerminate,
  onDidReceiveDeepLink: () => onDidReceiveDeepLink,
  onSystemDidWakeUp: () => onSystemDidWakeUp,
  openUrl: () => openUrl
});
function onApplicationDidLaunch(listener) {
  return connection.disposableOn("applicationDidLaunch", (ev) => listener(new ApplicationEvent(ev)));
}
function onApplicationDidTerminate(listener) {
  return connection.disposableOn("applicationDidTerminate", (ev) => listener(new ApplicationEvent(ev)));
}
function onDidReceiveDeepLink(listener) {
  requiresVersion(6.5, connection.version, "Receiving deep-link messages");
  return connection.disposableOn("didReceiveDeepLink", (ev) => listener(new DidReceiveDeepLinkEvent(ev)));
}
function onSystemDidWakeUp(listener) {
  return connection.disposableOn("systemDidWakeUp", (ev) => listener(new Event(ev)));
}
function openUrl(url2) {
  return connection.send({
    event: "openUrl",
    payload: {
      url: url2
    }
  });
}
var init_system2 = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/system.js"() {
    init_connection();
    init_application_event();
    init_event();
    init_events2();
    init_validation();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/decorators.js
function action(definition) {
  const manifestId = definition.UUID;
  return function(target, context) {
    return class extends target {
      /**
       * The universally-unique value that identifies the action within the manifest.
       */
      manifestId = manifestId;
    };
  };
}
var init_decorators = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/decorators.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/singleton-action.js
var SingletonAction;
var init_singleton_action = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/singleton-action.js"() {
    init_store();
    SingletonAction = class {
      /**
       * The universally-unique value that identifies the action within the manifest.
       */
      manifestId;
      /**
       * Gets the visible actions with the `manifestId` that match this instance's.
       * @returns The visible actions.
       */
      get actions() {
        return actionStore.filter((a) => a.manifestId === this.manifestId);
      }
    };
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/index.js
var init_actions = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/actions/index.js"() {
    init_decorators();
    init_singleton_action();
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/index.js
var init_devices = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/devices/index.js"() {
  }
});

// happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/index.js
var plugin_exports = {};
__export(plugin_exports, {
  BarSubType: () => BarSubType,
  DeviceType: () => DeviceType,
  SingletonAction: () => SingletonAction,
  Target: () => Target,
  action: () => action,
  default: () => plugin_default,
  streamDeck: () => streamDeck
});
var i18n, streamDeck, plugin_default;
var init_plugin = __esm({
  "happ-toggle/tools/node_modules/@elgato/streamdeck/dist/plugin/index.js"() {
    init_i18n();
    init_service();
    init_connection();
    init_service2();
    init_i18n3();
    init_logging2();
    init_profiles();
    init_settings();
    init_system2();
    init_ui3();
    init_api2();
    init_actions();
    init_devices();
    streamDeck = {
      /**
       * Namespace for event listeners and functionality relating to Stream Deck actions.
       * @returns Actions namespace.
       */
      get actions() {
        return actionService;
      },
      /**
       * Namespace for interacting with Stream Deck devices.
       * @returns Devices namespace.
       */
      get devices() {
        return deviceService;
      },
      /**
       * Internalization provider, responsible for managing localizations and translating resources.
       * @returns Internalization provider.
       */
      get i18n() {
        return i18n ??= new I18nProvider(this.info.application.language, fileSystemLocaleProvider);
      },
      /**
       * Registration and application information provided by Stream Deck during initialization.
       * @returns Registration information.
       */
      get info() {
        return connection.registrationParameters.info;
      },
      /**
       * Logger responsible for capturing log messages.
       * @returns The logger.
       */
      get logger() {
        return logger;
      },
      /**
       * Namespace for Stream Deck profiles.
       * @returns Profiles namespace.
       */
      get profiles() {
        return profiles_exports;
      },
      /**
       * Namespace for persisting settings within Stream Deck.
       * @returns Settings namespace.
       */
      get settings() {
        return settings;
      },
      /**
       * Namespace for interacting with, and receiving events from, the system the plugin is running on.
       * @returns System namespace.
       */
      get system() {
        return system_exports;
      },
      /**
       * Namespace for interacting with UI (property inspector) associated with the plugin.
       * @returns UI namespace.
       */
      get ui() {
        return ui;
      },
      /**
       * Connects the plugin to the Stream Deck.
       */
      async connect() {
        validateSettingsBehavior();
        await connection.connect();
      }
    };
    plugin_default = streamDeck;
  }
});

// happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/plugin.js
var require_plugin = __commonJS({
  "happ-toggle/builds/stability-1.12.4/com.llwhite.happtoggle.sdPlugin/plugin.js"() {
    var net = __require("net");
    var crypto = __require("crypto");
    var fs3 = __require("fs");
    var path5 = __require("path");
    var os = __require("os");
    var { execFile } = __require("child_process");
    var createSDKAdapter = require_sdk();
    var { runSpeedTest } = require_speedtest();
    var makeWindowToggle = require_happ_window();
    var DIR = __dirname;
    var DATA_DIR = path5.join(process.env.APPDATA || os.homedir(), "HappToggle", "com.llwhite.happtoggle");
    var LOG = path5.join(DATA_DIR, "plugin.log");
    function log(...a) {
      try {
        fs3.mkdirSync(DATA_DIR, { recursive: true });
        const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${a.join(" ")}
`;
        if (fs3.existsSync(LOG) && fs3.statSync(LOG).size > 200 * 1024) fs3.writeFileSync(LOG, "");
        fs3.appendFileSync(LOG, line);
      } catch (_) {
      }
    }
    var toggleKeepingTray = makeWindowToggle(log);
    var DEFAULTS = {
      deeplink: "happ://toggle_without_ui",
      pollMs: 3e3,
      fastPollMs: 700,
      fastPollMaxMs: 12e3,
      detect: { proxy: true, adapter: true, process: false },
      proxyMatch: "127\\.0\\.0\\.1|localhost",
      adapterRegex: "happ|wintun|sing-?box|xray",
      processNames: ["xray", "sing-box"],
      speedServer: "https://speed.cloudflare.com",
      speedProxy: "auto",
      // 'auto' — взять системный прокси Windows, '' — без прокси, либо URL (http://127.0.0.1:10808, socks5h://127.0.0.1:10808)
      speedStreams: 4,
      longPressMs: 600
    };
    function loadConfig() {
      let config2 = { ...DEFAULTS, detect: { ...DEFAULTS.detect } };
      for (const file2 of [path5.join(DIR, "config.json"), path5.join(DATA_DIR, "user-config.json")]) {
        const name = path5.basename(file2);
        if (!fs3.existsSync(file2)) continue;
        try {
          const user = JSON.parse(fs3.readFileSync(file2, "utf8"));
          config2 = { ...config2, ...user, detect: { ...config2.detect, ...user.detect || {} } };
        } catch (_) {
          log("config error: cannot read or parse", name, "; using previous defaults");
        }
      }
      return config2;
    }
    var cfg = loadConfig();
    var PS_SCRIPT = `
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
          "powershell.exe",
          ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", PS_SCRIPT],
          { windowsHide: true, timeout: 15e3, maxBuffer: 4 * 1024 * 1024 },
          (err, stdout) => {
            if (err) return reject(err);
            try {
              const j = JSON.parse(stdout.trim());
              j.adapters = [].concat(j.adapters || []);
              j.processes = [].concat(j.processes || []);
              resolve(j);
            } catch (e) {
              reject(new Error("bad probe output"));
            }
          }
        );
      });
    }
    function evaluate(p) {
      const s = { proxy: false, adapter: false, process: false };
      if (cfg.detect.proxy && p.proxyEnable === 1) {
        s.proxy = !cfg.proxyMatch || new RegExp(cfg.proxyMatch, "i").test(p.proxyServer || "");
      }
      if (cfg.detect.adapter && cfg.adapterRegex) {
        const re = new RegExp(cfg.adapterRegex, "i");
        s.adapter = p.adapters.some((a) => re.test(a));
      }
      if (cfg.detect.process) {
        const names = cfg.processNames.map((n) => n.toLowerCase());
        s.process = p.processes.some((n) => names.includes(String(n).toLowerCase()));
      }
      return { signals: s, connected: s.proxy || s.adapter || s.process };
    }
    function proxyUrlFromSystem(p) {
      if (!p || p.proxyEnable !== 1 || !p.proxyServer) return "";
      let srv = String(p.proxyServer);
      let scheme = "http";
      if (srv.includes("=")) {
        const parts = Object.fromEntries(srv.split(";").map((x) => x.split("=")));
        if (parts.https) srv = parts.https;
        else if (parts.http) srv = parts.http;
        else if (parts.socks) {
          srv = parts.socks;
          scheme = "socks5h";
        } else return "";
      }
      if (!/^\w+:\/\//.test(srv)) srv = `${scheme}://${srv}`;
      return srv;
    }
    async function resolveSpeedProxy(fresh) {
      if (cfg.speedProxy && cfg.speedProxy !== "auto") return cfg.speedProxy;
      if (cfg.speedProxy === "") return "";
      try {
        const p = fresh || await probe();
        if (cfg.proxyMatch && !new RegExp(cfg.proxyMatch, "i").test(p.proxyServer || "")) return "";
        return proxyUrlFromSystem(p);
      } catch (_) {
        throw new Error("Cannot determine the Happ proxy. Test cancelled to avoid using a different route.");
      }
    }
    if (process.argv.includes("--speed")) {
      (async () => {
        const proxy = await resolveSpeedProxy();
        console.log("proxy:", proxy ? "(enabled)" : "(none)");
        const r = await runSpeedTest(
          {
            provider: process.argv.includes("--provider") ? process.argv[process.argv.indexOf("--provider") + 1] : "yandex",
            server: cfg.speedServer,
            proxy,
            streams: cfg.speedStreams,
            seconds: Number(process.argv[process.argv.indexOf("--speed") + 1]) || 6
          },
          (ph) => console.log("phase:", ph)
        );
        console.log(JSON.stringify(r, null, 2));
      })().catch((e) => {
        console.error("speed test failed:", e.message);
        process.exitCode = 1;
      });
      return;
    }
    if (process.argv.includes("--diag")) {
      probe().then((p) => {
        const ev = evaluate(p);
        console.warn("Review adapter/process names before sharing this diagnostic output. Proxy addresses are omitted.");
        console.log(JSON.stringify({ evaluation: ev, raw: { ...p, proxyServer: p.proxyServer ? "(configured)" : "" } }, null, 2));
      }).catch((e) => {
        console.error("probe failed:", e.message);
        process.exitCode = 1;
      });
      return;
    }
    var { PROVIDERS, DEFAULT_DISPLAY, normalizeDisplay, animationMode, renderKey, renderScreen, setTranslator } = require_display();
    var args = process.argv.slice(2);
    var argv = (name) => {
      const i = args.indexOf(name);
      return i >= 0 ? args[i + 1] : void 0;
    };
    var PORT = Number(argv("-port"));
    var UUID = argv("-pluginUUID");
    var REGISTER = argv("-registerEvent");
    var ACTION_TOGGLE = "com.llwhite.happtoggle.toggle";
    var ACTION_SPEED = "com.llwhite.happtoggle.speed";
    var DEFAULT_SETTINGS = {
      icons: {},
      speedAuto: false,
      speedDelaySec: 3,
      speedSeconds: 6,
      displaySec: 10,
      speedProvider: "yandex",
      speedDisplayMode: "combined",
      transparentScreen: false,
      hideTestServer: false,
      ...DEFAULT_DISPLAY
    };
    var contexts = /* @__PURE__ */ new Map();
    var deviceScreens = /* @__PURE__ */ new Map();
    var ws;
    var state = "pending";
    var pending = null;
    var timer = null;
    var polling = false;
    var speedRunning = false;
    var activeSpeedRun = null;
    var animationTimer = null;
    var animationFrame = Date.now();
    function mergeSettings(s) {
      const m = normalizeDisplay({ ...DEFAULT_SETTINGS, ...s || {} });
      m.icons = { ...s && s.icons ? s.icons : {} };
      delete m.language;
      if (!PROVIDERS.includes(m.speedProvider)) m.speedProvider = "yandex";
      return m;
    }
    function screenSnapshot(info) {
      return info.controller === "Neo" ? deviceScreens.get(info.device) : null;
    }
    function animates(info) {
      const snapshot = screenSnapshot(info);
      return animationMode(info.settings, snapshot ? snapshot.speed : info.speed);
    }
    function renderCtx(context) {
      const info = contexts.get(context);
      if (!info || !ws) return;
      const screen = info.controller === "Encoder" || info.controller === "Neo";
      const image = screen ? renderScreen(info, state, screenSnapshot(info), animationFrame) : renderKey(info, state, animationFrame);
      if (image !== info.lastImage) {
        info.lastImage = image;
        ws.sendJSON(screen ? { event: "setFeedback", context, payload: { screen: image } } : { event: "setImage", context, payload: { image, target: 0 } });
      }
      scheduleAnimation();
    }
    function scheduleAnimation() {
      const running = [...contexts.values()].some(animates);
      if (!running) {
        clearTimeout(animationTimer);
        animationTimer = null;
        return;
      }
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
        if (info.controller === "Neo" && info.device === device) renderCtx(context);
      }
    }
    function renderSpeed(context) {
      const info = contexts.get(context);
      if (!info) return;
      deviceScreens.set(info.device, {
        owner: context,
        provider: info.settings.speedProvider,
        speed: { ...info.speed, timer: null }
      });
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
          if (info.controller === "Encoder" || info.controller === "Neo") clearSpeedDisplay(context);
        }
      }
      if (s === "off" || s === "unknown") {
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
      if (info.controller !== "Keypad" || display.phase || !display.result && !display.error || !(sec > 0)) return;
      display.timer = setTimeout(() => {
        if (contexts.get(context) === info && info.speed === display) {
          clearSpeedDisplay(context);
          renderCtx(context);
        }
      }, Math.min(3600, sec) * 1e3);
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
      const delay = Math.max(0, Math.min(60, Number(info.settings.speedDelaySec) || 0)) * 1e3;
      log("auto speed test in", delay, "ms");
      info.autoTimer = setTimeout(() => {
        info.autoTimer = null;
        if (contexts.get(context) === info && state === "on" && info.settings.speedAuto) startSpeedTest(context);
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
      ws.sendJSON({ event: "setSettings", context, payload: info.settings });
      renderCtx(context);
    }
    async function startSpeedTest(context) {
      if (activeSpeedRun) {
        cancelActiveSpeedTest();
        return;
      }
      const info = contexts.get(context);
      if (!info || info.controller === "Neo" || speedRunning) return;
      for (const entry of contexts.values()) cancelAutoSpeed(entry);
      speedRunning = true;
      cfg = loadConfig();
      clearSpeedDisplay(context);
      const display = info.speed;
      const controller = new AbortController();
      const run = { controller, context, info, display };
      activeSpeedRun = run;
      const active = () => !controller.signal.aborted && activeSpeedRun === run && contexts.get(context) === info && info.speed === display;
      display.phase = "ping";
      renderSpeed(context);
      try {
        const proxy = await resolveSpeedProxy();
        if (controller.signal.aborted) return;
        log("speed test start, provider=", info.settings.speedProvider, "proxy=", proxy ? "enabled" : "none");
        let lastUpdate = -Infinity;
        const res = await runSpeedTest(
          {
            provider: info.settings.speedProvider,
            server: cfg.speedServer,
            proxy,
            streams: cfg.speedStreams,
            seconds: Math.max(3, Math.min(20, Number(info.settings.speedSeconds) || 6)),
            signal: controller.signal
          },
          (ph) => {
            if (active()) {
              display.phase = ph;
              lastUpdate = -Infinity;
              renderSpeed(context);
            }
          },
          (partial3) => {
            if (!active()) return;
            display.partial = { ...display.partial || {}, ...partial3 };
            if (Date.now() - lastUpdate >= 500 || partial3.pingMs != null && lastUpdate === -Infinity) {
              lastUpdate = Date.now();
              renderSpeed(context);
            }
          }
        );
        log("speed result:", JSON.stringify(res));
        if (active()) {
          display.phase = null;
          display.result = res;
        }
      } catch (e) {
        if (controller.signal.aborted || e.name === "AbortError") log("speed test cancelled");
        else {
          log("speed test error:", e.message);
          if (active()) {
            display.phase = null;
            display.error = true;
            ws.sendJSON({ event: "showAlert", context });
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
            setState(connected ? "on" : "off");
            if (connected) scheduleAutoSpeed(ctx);
          } else if (Date.now() > pending.until) {
            log("toggle did not change detected state; check config / run --diag");
            pending = null;
            setState(connected ? "on" : "off");
          }
        } else {
          const next = connected ? "on" : "off";
          if (next !== state) setState(next);
        }
      } catch (e) {
        log("probe error:", e.message);
        if (!pending) setState("unknown");
      } finally {
        polling = false;
        schedule();
      }
    }
    function schedule() {
      clearTimeout(timer);
      timer = null;
      if (contexts.size === 0) return;
      timer = setTimeout(() => {
        timer = null;
        tick();
      }, pending ? cfg.fastPollMs : cfg.pollMs);
    }
    function toggle(context) {
      if (pending) return;
      cancelActiveSpeedTest();
      cfg = loadConfig();
      for (const [c, info] of contexts) {
        cancelAutoSpeed(info);
        clearSpeedDisplay(c);
      }
      pending = { prevConnected: state === "on", until: Date.now() + cfg.fastPollMaxMs, ctx: context };
      setState("pending");
      toggleKeepingTray(cfg.deeplink).catch((e) => log("toggle window error:", e.message));
      clearTimeout(timer);
      timer = setTimeout(tick, cfg.fastPollMs);
    }
    function onMessage(text) {
      const m = JSON.parse(text);
      switch (m.event) {
        case "willAppear": {
          const previous = contexts.get(m.context);
          if (previous) {
            if (activeSpeedRun && activeSpeedRun.context === m.context) cancelActiveSpeedTest();
            cancelAutoSpeed(previous);
            clearSpeedDisplay(m.context);
            clearTimeout(previous.hold && previous.hold.t);
          }
          contexts.set(m.context, {
            action: m.action,
            controller: m.payload && m.payload.controller || "Keypad",
            device: m.device || "",
            settings: mergeSettings(m.payload && m.payload.settings),
            speed: { phase: null, partial: null, result: null, error: false, timer: null },
            hold: null,
            autoTimer: null
          });
          const controller = contexts.get(m.context).controller;
          if (controller === "Neo") {
            ws.sendJSON({ event: "setFeedbackLayout", context: m.context, payload: { layout: "layouts/neo.json" } });
          }
          renderCtx(m.context);
          if (!timer && !polling) tick();
          else schedule();
          break;
        }
        case "willDisappear": {
          if (activeSpeedRun && activeSpeedRun.context === m.context) cancelActiveSpeedTest();
          const info = contexts.get(m.context);
          if (info) {
            cancelAutoSpeed(info);
            clearSpeedDisplay(m.context);
            clearTimeout(info.hold && info.hold.t);
          }
          contexts.delete(m.context);
          scheduleAnimation();
          if (contexts.size === 0) {
            clearTimeout(timer);
            timer = null;
          }
          break;
        }
        case "didReceiveSettings": {
          const info = contexts.get(m.context);
          if (info) {
            const settings2 = mergeSettings(m.payload && m.payload.settings);
            if (settings2.speedProvider !== info.settings.speedProvider || settings2.speedSeconds !== info.settings.speedSeconds) {
              if (activeSpeedRun && activeSpeedRun.context === m.context) cancelActiveSpeedTest();
              cancelAutoSpeed(info);
              clearDeviceSpeed(m.context);
              clearSpeedDisplay(m.context);
            }
            const expiryChanged = Number(settings2.displaySec) !== Number(info.settings.displaySec);
            info.settings = settings2;
            if (expiryChanged) scheduleResultExpiry(m.context);
            if (!info.settings.speedAuto) cancelAutoSpeed(info);
            renderCtx(m.context);
          }
          break;
        }
        case "keyDown": {
          const info = contexts.get(m.context);
          if (!info || info.controller !== "Keypad" || info.hold) break;
          const hold = { fired: false, t: null };
          info.hold = hold;
          if (info.action === ACTION_SPEED && activeSpeedRun) {
            hold.fired = true;
            cancelActiveSpeedTest();
            break;
          }
          hold.t = setTimeout(() => {
            if (contexts.get(m.context) !== info || info.hold !== hold) return;
            hold.fired = true;
            if (info.action === ACTION_SPEED) cycleProvider(m.context, 1);
            else startSpeedTest(m.context);
          }, cfg.longPressMs);
          break;
        }
        case "keyUp": {
          const info = contexts.get(m.context);
          if (!info || info.controller !== "Keypad" || !info.hold) break;
          clearTimeout(info.hold.t);
          const fired = info.hold.fired;
          info.hold = null;
          if (!fired) {
            if (info.action === ACTION_SPEED) startSpeedTest(m.context);
            else toggle(m.context);
          }
          break;
        }
        case "dialRotate": {
          const info = contexts.get(m.context);
          if (!info || info.action !== ACTION_SPEED || info.controller !== "Encoder") break;
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
        case "dialDown":
        case "dialUp":
        case "dialPress": {
          const info = contexts.get(m.context);
          if (!info || info.action !== ACTION_SPEED || info.controller !== "Encoder") break;
          const pressed = m.event === "dialPress" ? !!(m.payload && m.payload.pressed) : m.event === "dialDown";
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
        case "deviceDidDisconnect":
          deviceScreens.delete(m.device);
          renderNeo(m.device);
          break;
        case "touchTap": {
          const info = contexts.get(m.context);
          if (info && info.action === ACTION_SPEED && info.controller === "Encoder" && m.payload && !m.payload.hold) toggle(m.context);
          break;
        }
        default:
          break;
      }
    }
    if (!PORT || !UUID || !REGISTER) {
      console.error("Started by Stream Deck. Diagnostics: node plugin.js --diag | node plugin.js --speed");
      process.exit(1);
    }
    Promise.resolve().then(() => (init_plugin(), plugin_exports)).then((sdk) => {
      ws = createSDKAdapter(sdk, { actionIds: [ACTION_TOGGLE, ACTION_SPEED], onMessage, log });
      setTranslator((key) => ws.translate(key));
      return ws.connect();
    }).catch(() => {
      log("Stream Deck SDK initialization failed");
      process.exitCode = 1;
    });
  }
});
export default require_plugin();
/*! Bundled license information:

@elgato/schemas/dist/streamdeck/plugins/index.mjs:
  (**!
   * @author Elgato
   * @module elgato/streamdeck
   * @license MIT
   * @copyright Copyright (c) Corsair Memory Inc.
   *)
*/
