# Changelog

This history is reconstructed from retained build manifests/README files and the project's recorded development changes. Early builds were local packages, not tagged public GitHub releases. Dates are omitted where not evidenced. The earliest retained unsuffixed package identifies itself as **1.1.1.0**; a separate 1.0 release is not evidenced. Package filenames and manifest versions were not always aligned.

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
