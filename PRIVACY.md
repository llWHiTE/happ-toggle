# Privacy — Happ Toggle 1.12

Publisher: Alexey Storozhilov, [GitHub profile](https://github.com/llWHiTE).

## Publisher data collection

The plugin implements no publisher-operated analytics, account system, crash upload or automatic updater. It does not send browsing history or custom icons to the publisher. This does **not** mean that it makes no network requests or inspects no local data.

## Local inspection and storage

VPN detection reads Windows proxy enable/server settings, active network-adapter names/descriptions and running process names. Process names are collected during the probe even when process-based detection is disabled. These signals are evaluated locally. To restore Happ's window state, the plugin inspects Happ's process/window identity, visibility and minimized state; it does not inspect process memory.

Action settings and cropped 144×144 PNG custom icons are stored through Stream Deck over the local WebSocket connection. Source images are read locally, not uploaded by the plugin. Stream Deck profile export/sync behavior is outside this plugin's implementation.

The shipped `config.json` supplies immutable defaults. In the SDK3 update, optional `user-config.json` overrides and `plugin.log` are stored in `%APPDATA%\HappToggle\<plugin UUID>\`, separate from distributed files. Action settings remain in Stream Deck. The official SDK handles local Stream Deck communication; Marketplace installation/licensing is managed by Stream Deck, not a publisher account system. A manually entered proxy URL can contain credentials in plaintext, and curl receives proxy configuration as process arguments. Do not put credentials in distributed config files or support reports. Diagnostic commands omit proxy URLs, but adapter/process names should still be reviewed before sharing.

`plugin.log` records timestamps, operations/errors and speed results/server identity locally. It is cleared before a subsequent append when its existing size exceeds 200 KiB; there is no fixed time-retention policy. Deleting the log is a local user action, not a remote deletion service.

## Third-party speed-test traffic

Tests start manually or after connecting when the user explicitly enables auto-test. They send synthetic data, not user files. Service operators can observe the connection's source/exit IP and normal request metadata.

- **Yandex:** `yandex.ru/internet/api/v0/get-probes`, followed by selected HTTPS probes on `yandex.net` and its subdomains. Yandex Origin/Referer and a browser-like User-Agent are used.
- **Cloudflare:** `speed.cloudflare.com/__down` and `/__up` by default. `speedServer` can change this base URL, so a custom configuration can contact a different host.
- **Speedtest.net:** `www.speedtest.net/api/js/servers`, then numeric-server hosts under `prod.hosts.ooklaserver.net:8080` for latency/download/upload.

Uploads use random synthetic payloads (50 MiB Yandex, 16 MiB Cloudflare, 32 MiB Speedtest.net per repeated measurement request); endpoint checks can send one byte. Parallel/repeated requests can consume much more than one payload. Downloads are discarded. Certificate verification is not disabled; a configured proxy can see routing metadata and receives proxy authentication when used.

Synthetic upload files are created in the OS temporary directory. Cleanup is attempted after testing, but a crash or failed deletion may leave such files behind.

Opening `happ://toggle_without_ui` invokes the locally installed Happ application. Happ's own traffic and third-party services' privacy policies are outside this plugin's control.

## Contact

Use the publisher's GitHub profile above. No private reporting channel or response-time commitment is established. Do not publish personal diagnostics or credentials in public issues.
