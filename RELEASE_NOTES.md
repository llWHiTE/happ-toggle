# Happ Toggle 1.12.4

## Stability and trustworthy speed measurements

- Repair the tests for the official Stream Deck SDK and asynchronous property-inspector resources. Add deterministic transfer tests and real curl tests against a loopback-only server.
- Measure HTTP application goodput consistently: received download bytes or fully HTTP-acknowledged upload bytes divided by actual phase wall-clock time. Include connection, TLS, response waits and final-transfer completion time; do not sum stream peaks or use Cloudflare's fast-sample percentile.
- Reject unacknowledged timed-out uploads, malformed transfer metrics, unexpected sizes and HTML/JSON download pages instead of displaying misleading speeds.
- Fix curl startup without an AbortSignal, VPN-status monitoring for a standalone Speed Test key, and screen-layout recovery after a transient SDK error.
- Use English as the sole UI resource for every Stream Deck application locale. Remove the Russian resource and ignore obsolete per-action language settings without losing other saved settings.

## Happ window preservation

This public update also includes the local 1.12.3 window-state fix: an open Happ window stays open, a tray window returns to tray using Happ's own close handler, and a taskbar-minimized window is minimized again. No forced SW_HIDE, repeated hide loop or focus manipulation. A brief deeplink-induced window flash can still occur. The user confirmed this behavior in 1.12.3; the helper is unchanged in 1.12.4.

Dial/key provider selection changes only **Yandex / Cloudflare / Speedtest.net**, never Happ's VPN server. Server selection, subscriptions and account settings are unchanged.

## Installation and Marketplace

- Public/Marketplace installer: **com.llwhite.happtoggle.streamDeckPlugin**, manifest version **1.12.4.0**, SDKVersion 3.
- Requirements: Windows 10/11, Stream Deck 7.6+ and Happ installed separately.
- Update the same UUID to retain existing actions/settings. Do not delete buttons or reinstall Happ.
- The compatibility installer for the earlier test UUID is provided separately; do not upload it to the existing public Marketplace product.
- Upload the public installer as an update to the existing product in Elgato Maker Console. Local CLI validation is not Marketplace/DRM approval; submission is not performed by this release process.

## Verification and limits

88 offline tests passed with no failures/skips, plus SDK resource/adapter checks and an isolated native Windows tray fixture. The offline suite includes actual curl transfers against a server bound only to 127.0.0.1. The public installer passed Elgato CLI 1.10.2 validation/packaging and archive CRC/SHA-256 checks. Separate short smoke runs for all three public services completed over the current resolved Happ proxy without changing the VPN server or connection.

Speed is measured HTTP goodput to the chosen endpoint, not guaranteed link/tariff capacity or continuous traffic monitoring. Providers can differ. MB/s is Mbps divided by eight; latency is HTTP delay, not ICMP ping. New physical-device controls/display checks remain manual. See VALIDATION.json and PACKAGE_CHECK.json for the actual scope.

Older releases/tags/assets, the owner's repository README and repository description are preserved. Original code/artwork remain MIT licensed; developed with AI assistance.
