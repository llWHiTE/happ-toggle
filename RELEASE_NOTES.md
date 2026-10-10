# Happ Toggle 1.12.0

## Changes

- Adaptive download/upload layouts, icon sizes and spacing with screen latency on/off.
- Wider arrow/placeholder spacing for Arial and Segoe UI; Bahnschrift defaults.
- Connection-link screen status icon; original power icon available in settings.
- Dial/screen-triggered VPN connection can schedule an optional delayed speed test.
- Author Alexey Storozhilov and GitHub links in manifest/inspector.
- Animations limited to 10 image updates per second.
- Original Marketplace icon, cover and four illustrative gallery images.
- Proxy addresses omitted from diagnostics, safer errors and deeplink allowlist.
- MIT open-source license, [changelog](CHANGELOG.md) and [project history](HISTORY.md).

## SDK3 Marketplace update

The previous package used SDKVersion 2 and a hand-written WebSocket client. Marketplace reported SDK Compatibility and DRM protection failures. The update uses SDKVersion 3 and the official `@elgato/streamdeck` 3.0.2 SDK, with a bundled ESM entry and public action APIs for keys, dials and Neo. Advanced user overrides and logs move to `%APPDATA%\HappToggle\<plugin UUID>\`, leaving distributed files unchanged.

The SDK3 runtime is bundled and both namespaces pass official Elgato CLI 1.10.2 validate/pack. A local adapter smoke test also passes. The main installer contains the SDK3 update; older SDK2 assets are preserved with `-preview` names. Original code, documentation and artwork are MIT licensed. Consult `VALIDATION.json` for checks and `PUBLICATION.json` for publication state.

## Installers

- Public namespace: `com.llwhite.happtoggle.streamDeckPlugin`.
- Compatibility namespace: `com.user.happtoggle-1.12.streamDeckPlugin`, for earlier test keys.

Public actions are a new installation, not an in-place migration from the old test UUID. Windows 10/11 and Stream Deck 7.6+ are required.

## Verification

The owner reported successful manual tests of v1.12 before the SDK update. The assistant did not repeat network/device tests. The SDK adapter smoke test uses local stubs only; it is not a test of SDK registration against Stream Deck, hardware behavior or DRM. Official CLI 1.10.2 validation/packaging was repeated successfully for both new SDK3 packages. Source/inspector syntax, JSON, dependency-license inclusion, installer contents, archive integrity and checksums are verified.

Briefly check key/dial/Neo behavior after installation, then upload the new public package in Maker Console. Only successful Maker Console processing can confirm SDK Compatibility and DRM protection. Marketplace approval is not claimed. Gallery images contain sample values, not hardware captures or benchmarks. AI assistance is disclosed.
