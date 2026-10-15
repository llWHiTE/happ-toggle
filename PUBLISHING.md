# Publication checklist — 1.12.4

## Source and localization

- Public UUID `com.llwhite.happtoggle`, manifest version `1.12.4.0`, SDKVersion 3, official `@elgato/streamdeck` 3.0.2 and bundled ESM entry.
- `en.json` is the sole active locale resource. SDK rendering and the inspector fall back to English for every application locale; there is no per-action language selector.
- Keep existing settings and confirmed Happ window preservation. Service selection is speed-test provider selection, not Happ VPN-server selection.

## Reproduce from public source

Install pinned development dependencies without running lifecycle scripts:

```bash
npm --prefix tools ci --ignore-scripts
```

Run the complete offline suite (includes real curl against 127.0.0.1 only):

```bash
npm --prefix tools test
```

Run the isolated native window fixture on Windows; it does not control Happ:

```bash
npm --prefix tools run test:native
```

Build the runtime and bundled dependency licenses:

```bash
node tools/build-plugin.cjs com.llwhite.happtoggle.sdPlugin
```

Validate using the pinned CLI/local schemas:

```bash
node tools/node_modules/@elgato/cli/bin/streamdeck.mjs validate com.llwhite.happtoggle.sdPlugin --no-update-check
```

Package a new installer into a new output directory:

```bash
node tools/node_modules/@elgato/cli/bin/streamdeck.mjs pack com.llwhite.happtoggle.sdPlugin --no-update-check --output dist
```

Do not bypass validation or overwrite an existing release. Dependency notices and MIT LICENSE accompany the installer. Exclude source outside the bundle, node_modules, logs, private user configuration and source maps. Verify ZIP CRC and SHA-256. Elgato CLI normally strips `Nodejs.Debug=disabled` while packing; all other manifest contents must match the validated source. Do not change installed distributed files at runtime.

## Elgato update

Upload **com.llwhite.happtoggle.streamDeckPlugin**, version **1.12.4.0**, to the existing public product in Maker Console. Retain its UUID. Do not upload the separate `com.user.happtoggle` compatibility package. The public installer used for GitHub and Elgato is byte-identical.

English is the only UI language in this build. Release notes explain HTTP goodput, stability fixes and window-state preservation. Physical key/dial/touch/Neo and install/update checks remain manual. Local CLI validation is not product-review or DRM approval; this workflow does not submit to Marketplace.

Descriptions/media are in `listing/` and `media/`. They are illustrations with sample values, not benchmarks. Keep AI-assistance disclosure and third-party rights notices. Older tool scripts may target earlier release directories; do not execute those scripts as the 1.12.4 publication workflow.

## GitHub publication

Create a new `v1.12.4` release/tag. Do not replace older releases, assets or tags, or force-push main. Preserve the owner's README and repository description. Check the remote branch immediately before pushing. Use the authenticated GitHub CLI without storing or printing credentials.

`VALIDATION.json` records actual checks; `PACKAGE_CHECK.json` records the verified public installer. Release assets include the public/compatibility installers, source archive, validation/package reports, release notes and SHA256SUMS.txt. A local publication receipt records verified GitHub asset digests after publication; archive hashes can vary across rebuilds even when functional source is unchanged.

## Official references

- https://docs.elgato.com/streamdeck/sdk/guides/i18n/
- https://docs.elgato.com/streamdeck/sdk/introduction/distribution
- https://docs.elgato.com/streamdeck/sdk/guides/neo-infobar
- https://docs.elgato.com/streamdeck/cli/commands/pack
- https://docs.elgato.com/guidelines/products
