# Happ Toggle 1.12.1

## Built-in Stream Deck localization

- Plugin/action metadata, property inspector labels/help/errors and rendered speed units now use root locale resources (`en.json`, `ru.json`, custom strings under `Localization`).
- Runtime text uses the official `streamDeck.i18n.translate()` API. The property inspector follows `info.application.language` and reads the same locale resources, with English fallback.
- Removed the per-action language selector and embedded translation dictionaries. Previous language overrides are ignored; saved icons, test service, appearance and timing settings are retained.
- Retained SDKVersion 3, the official Elgato Node SDK, existing UUIDs and key/dial/Neo functionality.

English is the fallback for languages without a supplied translation. Russian resources are retained for an application locale of `ru`; Russian is not currently listed as an official Stream Deck UI language.

## Installation

- Public package: `com.llwhite.happtoggle.streamDeckPlugin`.
- Compatibility package for the earlier test UUID: `com.user.happtoggle-1.12.1.streamDeckPlugin`.
- Requirements remain Windows 10/11, Stream Deck 7.6+ and Happ installed separately.

The 1.12.0 release remains unchanged. The repository README and description edited by the owner are preserved.

## Verification and Marketplace

Official SDK localization tests, inspector fallback/settings tests and adapter smoke tests passed. Both installers passed official Elgato CLI 1.10.2 validation and packaging; archive contents, CRC and SHA-256 are verified. No VPN switching, network speed tests or hardware tests were performed by the assistant for this update.

This update addresses Elgato's localization review feedback. The previous Maker Console summary displayed SDK3 compatibility and DRM enabled; approval of this resubmission is not claimed. Upload the new public installer and briefly check the settings and controls on your device.

Original code and artwork remain MIT licensed. Developed with AI assistance. See CHANGELOG.md and VALIDATION.json for details.
