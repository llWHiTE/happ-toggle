# Happ Toggle 1.12.0 — preview

## Changes

- Adaptive download/upload layouts, icon sizes and spacing with latency on/off.
- Wider arrow/placeholder spacing for Arial and Segoe UI before the first measurement.
- Bahnschrift defaults for numbers and interface text; explicit choices preserved.
- Connection-link screen status icon; original power icon available in settings.
- Dial/screen-triggered VPN connection can schedule an optional delayed speed test.
- Author Alexey Storozhilov and GitHub link in manifest/inspector.
- Animations limited to 10 image updates per second.
- White transparent sidebar artwork; original Marketplace icon, cover and four gallery images.
- Proxy URLs omitted from diagnostics; safer errors; supported deeplink allowlist.

## Installers

- Public namespace: `com.llwhite.happtoggle.streamDeckPlugin`.
- Compatibility namespace: `com.user.happtoggle-1.12.streamDeckPlugin`, for earlier test keys.

Public actions are a new installation, not an in-place migration from the old test UUID. Windows 10/11 and Stream Deck 7.6+ are required.

## Verification and remaining steps

Source/inspector syntax, JSON, artwork dimensions and local archive integrity were checked. Official Elgato CLI 1.10.2 validation and packaging passed. Real VPN/speed/device tests were not run. Marketplace submission was not performed. The owner's GitHub account is authenticated; see the release page for publication state.

Gallery images are renderer-generated UI previews with illustrative measurements, not hardware captures or benchmarks. Human review, manual testing, license choice and Marketplace review remain required before stable Marketplace publication. AI assistance is disclosed.
