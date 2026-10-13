# Publication checklist — 1.12.1

## Localization update

- Public UUID `com.llwhite.happtoggle`; compatibility UUID `com.user.happtoggle` remains separate.
- SDKVersion 3, official `@elgato/streamdeck` 3.0.2 and bundled ESM entry.
- Root `en.json` and `ru.json` contain localized manifest/action metadata and custom strings under `Localization`.
- Runtime uses `streamDeck.i18n.translate()`. The inspector uses the application's language from registration information and reads the same resources. No per-action language selector remains.
- English fallback is used for untranslated application locales. Russian resources remain for `ru`; Russian is not currently listed as an official Stream Deck UI language.

## Reproduce from public source

```bash
npm --prefix tools ci --ignore-scripts
```

```bash
node tools/build-plugin.cjs com.llwhite.happtoggle.sdPlugin
```

```bash
node tools/test-sdk.cjs com.llwhite.happtoggle.sdPlugin
```

```bash
node tools/test-i18n.cjs com.llwhite.happtoggle.sdPlugin
```

```bash
./tools/node_modules/.bin/streamdeck validate com.llwhite.happtoggle.sdPlugin
```

```bash
./tools/node_modules/.bin/streamdeck pack com.llwhite.happtoggle.sdPlugin --output dist
```

Dependency notices and MIT LICENSE must accompany the installer. Exclude development source, node_modules, logs and user-config.json. Verify ZIP CRC and SHA-256; do not change distributed files at runtime. Application settings and overrides/logs in the separate user-data directory remain unchanged.

## Marketplace resubmission

Upload the new **public** 1.12.1.0 installer in Maker Console. The earlier SDK3 summary displayed SDK compatibility and DRM enabled; product review subsequently requested built-in localization. This update addresses that request. Local checks do not guarantee approval of the resubmission. Briefly check installation, settings and key/dial/Neo controls before sending it for review.

Descriptions and media are in `listing/` and `media/`. Media are illustrations with sample values, not hardware photographs or benchmarks. Review rights and Elgato's AI policy; AI assistance is disclosed. This release process does not submit the product to Marketplace.

## GitHub

Create a new v1.12.1 tag/release, without modifying v1.12.0 or v1.12.0-preview. Preserve the owner's README and repository description. Check the remote branch SHA immediately before pushing; never force-push main or overwrite unreviewed changes. Use existing authenticated GitHub tooling without storing or printing credentials.

Actual local checks and publication state are recorded separately in VALIDATION.json and PUBLICATION.json. SHA256SUMS.txt covers the new installers and release archives.

## Official references

- https://docs.elgato.com/streamdeck/sdk/guides/i18n/
- https://docs.elgato.com/streamdeck/sdk/introduction/distribution
- https://docs.elgato.com/streamdeck/sdk/guides/neo-infobar
- https://docs.elgato.com/streamdeck/cli/commands/pack
- https://docs.elgato.com/guidelines/products
