# Project history

Happ Toggle is an independent Windows integration by [Alexey Storozhilov](https://github.com/llWHiTE), developed with AI assistance. Its purpose is deliberately narrow: control Happ VPN, show detected connection status and run useful on-demand connection tests from Stream Deck. It is not a traffic-monitoring service or a VPN-server manager.

## From a toggle to a useful status action

The working integration point is Happ's `happ://toggle_without_ui` deeplink. The plugin does not implement Happ's VPN engine. Connection state is inferred locally from configurable Windows proxy, adapter and process signals, rather than assuming that a successful button press means a successful connection. It attempts to preserve Happ's prior window state after toggling.

Custom images, localization, a long-press speed test and an optional delayed test after a confirmed connection were added without removing the ordinary short-press VPN toggle.

## Reliable measurements rather than extra metrics

Provider work addressed zero downloads, low upload results, endpoint failures and proxy-route ambiguity. Transfer totals are measured over an elapsed interval; missing trustworthy data is an error rather than a fabricated result. Curl receives an explicit proxy or explicit direct-route selection. Latency is an HTTP measurement, not ICMP ping.

Yandex became the default. Cloudflare and the unofficial Speedtest.net endpoint method remain alternatives. OpenSpeedTest was tried and removed. These choices are measurement services, not Happ VPN servers. Tests send synthetic data and can consume substantial traffic; continuous background speed testing was intentionally not added.

## Keys, dials and Neo

Repeat-press cancellation and provider selection came before Stream Deck+ dial/touch support. Controls keep their own settings. A dial's short press starts or cancels a test; holding it or touching its screen toggles VPN. Stream Deck Neo Infobar is display-only and follows tests initiated on that same device.

Display refinements focused on readable live numbers: combined or phase-focused layouts, optional units and screen latency, transparent screen fill, selected fonts/styles and retained results. Large frames, written VPN states and phase labels were removed. Subtle symbol animations remain independently switchable and enabled by default, capped at 10 updates per second. Bahnschrift and a connection-link screen symbol became the defaults.

## Public distribution and open source

The public repository is [llWHiTE/happ-toggle](https://github.com/llWHiTE/happ-toggle). Public builds use `com.llwhite.happtoggle`; previous local/test builds used `com.user.happtoggle`. These are separate installations, not an automatic action/settings migration.

The initial public v1.12.0 was a GitHub prerelease. The owner subsequently reported that manual tests had passed and requested an MIT-licensed stable release with this history. Original code, documentation and project artwork are now offered under MIT; third-party dependencies, brands and system fonts retain their own terms.

Marketplace then rejected the initial package's SDK Compatibility and DRM protection checks. The release update replaces its hand-written WebSocket boundary with the official Elgato Node SDK, uses SDKVersion 3 and separates mutable user data from distributed files. Existing VPN/test/rendering logic is reused rather than redesigned. Local CLI packaging and successful Maker Console DRM processing are different checks; neither this history nor a license implies Marketplace approval.

## Evidence and limits

[CHANGELOG.md](CHANGELOG.md) records the retained early builds through 1.12. Their history is reconstructed from package metadata/readmes and recorded changes, not invented GitHub commits. No dates or unobserved 1.0 release are assigned. Gallery images are code-rendered illustrations, not hardware screenshots or speed benchmarks. The owner's earlier manual-test report predates the SDK migration; current validation state is recorded separately in `VALIDATION.json`.
