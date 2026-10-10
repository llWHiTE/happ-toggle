# Publication checklist

## Prepared

- Public namespace `com.llwhite.happtoggle`; compatibility build keeps `com.user.happtoggle`.
- Author/organization: **Alexey Storozhilov**.
- MIT license, CHANGELOG/HISTORY, privacy/security/third-party and AI disclosures.
- SDK3 source using official `@elgato/streamdeck` 3.0.2 and a bundled-ESM build tool.
- Original **288×288 PNG** icon, **1920×960 PNG** cover and four gallery images, **1280×640 PNG** GitHub social preview; SVG sources and native Windows artwork renderer.
- English/Russian descriptions and suggested search terms in `listing/`.

## Build status

SDK3 bundling and official CLI 1.10.2 validate/pack pass for both namespaces. The release includes MIT and runtime dependency licenses. `VALIDATION.json` records local checks; `PUBLICATION.json` records the verified GitHub publication separately. Maker Console SDK/DRM acceptance remains unverified.

## Reproduce the package

1. Install pinned tooling and run `tools/build-plugin.cjs` for each namespace. It bundles the official SDK and generates runtime dependency notices. No npm installation is required on users' machines.
2. Run the local adapter test, JS/inspector/JSON checks, then official `streamdeck validate` and `streamdeck pack`. Include MIT and dependency notices. Exclude logs, user configuration, development source and node_modules from the installer.
3. Verify ZIP integrity and SHA-256; rebuild the source and publication archives without secrets or private settings. Preserve all original preview assets.
4. The owner previously tested v1.12 functionality. Briefly recheck installation, settings, key/dial/Neo controls after this SDK-boundary change. This is a new integration, not an already hardware-tested revision.

## Marketplace

1. Keep SDKVersion 3, the official Node SDK, immutable public UUID and minimum Stream Deck 7.6 (Neo). Never read the manifest from application code or edit distributed files at runtime. Use Stream Deck action settings and the separate user-data directory.
2. Upload the **public** official installer in Maker Console. DRM is applied there; check **SDK Compatibility** and **DRM protection** after processing. Local validate/pack cannot prove these checks pass. Do not manually modify the protected download afterward.
3. Use the descriptions, marketplace icon, cover and at least three gallery PNGs; four are supplied. Media are code-rendered illustrations with sample values, not hardware photographs or benchmarks.
4. Repository: https://github.com/llWHiTE/happ-toggle ; privacy: https://github.com/llWHiTE/happ-toggle/blob/main/PRIVACY.md ; support: https://github.com/llWHiTE/happ-toggle/issues . Use the publication report to confirm the source commit and release assets.
5. Review service terms, rights and Elgato's AI policy. AI assistance is disclosed; preparation does not guarantee eligibility or approval. No Marketplace submission is automated here.

## Stable GitHub update

The user authorized stable publication. After package verification, check the remote branch SHA/account; commit without overwriting other work. Preserve the original prerelease commit as `v1.12.0-preview`, keep old assets under preview names, and update the v1.12.0 tag/release with new packages, MIT, history and checksums. Do not rewrite main history or silently delete the previous package.

Publishing tools accept `GH_TOKEN` only from the process environment. Never store or print it. Revoke the token shared in chat after publication. If it no longer authenticates, leave a complete local kit and report the remote update as blocked. GitHub social preview remains a manual repository setting.

## Official references

- https://docs.elgato.com/guidelines/products
- https://docs.elgato.com/guidelines/stream-deck/plugins
- https://docs.elgato.com/streamdeck/sdk/introduction/distribution
- https://docs.elgato.com/streamdeck/sdk/guides/neo-infobar
- https://docs.elgato.com/streamdeck/cli/commands/pack
