# Changelog

This history is reconstructed from retained build manifests/README files and the project's recorded development changes. Early builds were local packages, not tagged public GitHub releases. Dates are omitted where not evidenced. The earliest retained unsuffixed package identifies itself as **1.1.1.0**; a separate 1.0 release is not evidenced. Package filenames and manifest versions were not always aligned.

## 1.12.4 (local stability build)

- Keep English as the sole active localization resource for all application locales; remove the current Russian resource and safely ignore obsolete per-action language settings without dropping other settings.
- Repair the test fixtures for the official SDK and asynchronous inspector resources. Add deterministic transfer-accounting tests, real curl tests against a loopback-only HTTP fixture, and a single offline test runner.
- Report HTTP phase-average goodput for all services: received download bytes or fully acknowledged upload bytes divided by one actual monotonic phase duration. Include connection/HTTP waits and late final-transfer completion time; remove Cloudflare's individual-sample percentile calculation.
- Reject unacknowledged timed-out uploads, invalid sizes/metrics, and HTML/JSON download pages. Preserve explicit proxy/direct routing, cancellation and temporary-file cleanup.
- Fix curl startup with no AbortSignal, connection/status monitoring for a standalone Speed Test key, and SDK feedback-layout recovery after a transient failure.
- Preserve the user-confirmed 1.12.3 Happ window behavior without changing the toggle helper. VPN-server selection remains outside the plugin's controls; dial/key service selection changes only the speed-test provider.
- Record separate offline, native-window, loopback-curl, public-endpoint and packaging checks in the local release's VALIDATION.json. A public smoke result is not a line-capacity guarantee; new physical-device verification and Marketplace approval are not claimed.

## 1.12.3 (local window-state build)

- Snapshot the existing Happ Qt main window with EnumWindows, including hidden windows. Preserve visible/tray/minimized states when switching the connection.
- If a deeplink reveals a previously hidden window, send one normal WM_CLOSE so Happ's own close-to-tray handler synchronizes its Qt/tray state. Restore a taskbar-minimized window with SC_MINIMIZE instead of sending it to tray.
- Validate the process, creation time and window identity before restoration; stop after the first request. Do not use SW_HIDE, focus manipulation or a repeated hide loop. A brief deeplink-induced window flash can still occur.
- Add unit tests and an isolated native Windows window fixture covering close-to-tray, manual reopening, visible and minimized states. No real VPN toggle was performed during automated verification.

## 1.12.2 (local tray-fix build)

- Remove external PowerShell window-state polling and repeated SW_HIDE/SW_MINIMIZE after the Happ toggle deeplink. Leave Qt window/tray visibility under Happ's control so the plugin does not interfere with reopening the server-selection window.
- Keep the existing happ://toggle_without_ui command, connection polling, button settings and server selection unchanged.
- Add regression tests for a single deeplink invocation with no external window management. Live tray reopening still requires verification with Happ.

## 1.12.1

- Use Stream Deck's built-in localization resources for manifest metadata, property inspector text and rendered errors/speed units.
- Follow the application's language via the official SDK and property-inspector registration information; English fallback for untranslated locales.
- Remove the per-action language selector and embedded language dictionaries. Existing icons, provider, appearance and timing settings are retained.
- Keep English and Russian resources in root `en.json` / `ru.json` files, with custom strings under `Localization`. Russian is selected only when supplied as the application's locale; it is not currently listed as an official Stream Deck UI language.
- Add real SDK locale-provider/rendering tests and inspector tests covering fallback, regional locales and asynchronous settings delivery.
- Address Marketplace localization feedback; approval of the resubmission remains pending.

## 1.12.0

- Bahnschrift as the default number/interface font; explicit alternatives preserved.
- Adaptive icon/number placement with screen latency enabled or disabled.
- Extra placeholder/arrow spacing for Arial and Segoe UI.
- Connection-link status symbol for screens; former power symbol selectable.
- Optional delayed speed test after a confirmed VPN connection initiated from a dial hold or screen tap.
- Author Alexey Storozhilov and GitHub links in plugin settings/manifest.
- Animation updates limited to 10 per second; original Marketplace icon, cover and gallery materials.
- Public namespace `com.llwhite.happtoggle`; compatibility namespace `com.user.happtoggle` retained separately.
- Safer diagnostic output, proxy-address redaction and a supported-deeplink allowlist.
- MIT license, public change history and stable-release documentation.
- SDK3 release update: replace the custom WebSocket transport with the official `@elgato/streamdeck` SDK; bundled ESM entry, key/dial/Neo event adapter, immutable packaged defaults and separate writable user configuration/logs.

The owner reported successful manual tests of v1.12 before the SDK transport update. That report is not evidence that the new SDK integration or Marketplace DRM has been tested on hardware. See `VALIDATION.json` for actual build/validation status. Maker Console must process and accept the new installer before DRM acceptance can be claimed.

## 1.11

- Remove outer icon frames, VPN ON/OFF text and written test-phase labels.
- Smooth breathing VPN symbol; subtle gauge and measurement-symbol motion.
- Idle screen animation with retained results; enlarged gauge when service labels are hidden.
- Remove precision selection; always choose number precision automatically.
- Font/style rendering improvements; optional HTTP latency on screens.
- Keep a key result until the next test (`displaySec = 0`).

## 1.10

- Configurable number fonts/styles, speed units and independent unit-label visibility.
- Combined and large-by-phase layouts across supported displays.
- Independent idle/test animation settings, enabled by default.
- Live in-test measurements retained; no setting to hide measured speed.

## 1.9

- Stream Deck Neo Infobar display following controls on the same device.
- Transparent screen-background option and hidden service/server labels.
- Long dial press toggles VPN; short dial press retains test behavior.

## 1.8

- Stream Deck+ dial service selection, test controls and touch-screen feedback.
- VPN status and connection-test measurements on the touch strip.
- Per-control provider selection and cancellation when changing the active test's provider.

## 1.7

- Repeat press cancels an active speed test.
- Cancelable curl work and cleanup through AbortController.

## 1.6

- More consistent parallel-transfer byte/time accounting and endpoint validation.
- Explicit proxy/direct routing; prevent environment or user curl configuration from silently changing the route.
- Missing reliable measurements reported as errors rather than invented zero results.

## 1.5

- Yandex becomes the default test service.
- Remove the unsuccessful OpenSpeedTest option; migrate its saved selection to Yandex.

## 1.4

- Display redesign and an experimental OpenSpeedTest provider, subsequently removed.

## 1.3

- Status labels/layout refinements.
- Attempt to restore Happ's hidden/minimized window state after the deeplink.

## 1.2

- Russian/English settings and selectable measurement services.
- Improvements to test-provider behavior and proxy routing.

## Earliest retained baseline — 1.1.1.0

- Happ VPN toggling through `happ://toggle_without_ui`.
- Locally detected connection status and configurable status icons.
- Optional speed test after connecting, long-press test and a separate test action.
