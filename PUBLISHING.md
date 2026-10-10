# Publication checklist

## Prepared locally

- Public plugin namespace `com.llwhite.happtoggle`; compatibility build retains `com.user.happtoggle`.
- Author/organization: **Alexey Storozhilov**, matching the supplied Maker Console profile.
- English and Russian copy in `listing/`; English Marketplace description is 250–1500 characters and begins with unformatted text.
- Original icon **288×288 PNG**; cover and four gallery items **1920×960 PNG**; GitHub social preview **1280×640 PNG**.
- SVG sources, native Windows renderer, source bundle, installer and checksum/validation report.
- Privacy, security, third-party/AI disclosures and manual-test checklist.

## Still required before Marketplace submission

1. Official `streamdeck validate` and `streamdeck pack` passed using `@elgato/cli` 1.10.2. Use the official installer, not the earlier manual ZIP. Re-run validation after code changes. DRM compatibility of the custom WebSocket runtime is not claimed.
2. Test on Windows with Happ, ordinary keys, Stream Deck+ and Neo. Check proxy/direct routes, latency layouts, missing-data placeholders, cancel, auto-test after screen tap/hold, animations, font changes and namespace install behavior.
3. Review code and rights. Decide on a license; none was silently selected. Review test-service terms and privacy claims.
4. Review Elgato's AI policy: disclose assistance; fully AI-created products are ineligible under the published guidelines. This preparation is not a guarantee of acceptance.
5. Review the gallery. It contains genuine code-rendered UI previews with sample numbers, not captured hardware tests. Replace/add real screenshots when available.
6. Upload the public installer in Maker Console with English copy, `marketplace-icon.png`, `cover.png` and at least three gallery PNGs. Four are supplied. Category/search terms are suggestions, not claims about fields offered by the console.
7. Set privacy/support/repository links only after their pages exist. Currently confirmed links: author https://github.com/llWHiTE and Happ https://github.com/Happ-proxy/happ-desktop. The uploader targets `llWHiTE/happ-toggle`; verify its repository, releases and privacy page after upload.
8. Never rename the public UUID after publication. Installing it alongside the old test UUID creates separate actions; reconfigure keys as needed.

## GitHub upload

The user authorized creating a public `llWHiTE/happ-toggle` repository and a preview `v1.12.0` release. Account authentication passed. The upload tool verifies the resulting release and asset count; consult its output and the GitHub release page for actual publication status.

`tools/publish-github.cjs` accepts a token from `GH_TOKEN` in the process environment only. It checks the account, refuses to overwrite an existing repository, uploads only the prepared GitHub folder, and adds a prerelease installer/source/material bundle. It does not save or print a token. Use a token with the required repository permissions; revoke the token shared in chat after the task.

The GitHub social-preview image must be set manually in repository Settings. The uploader does not automate that setting.

## Sources

- https://docs.elgato.com/guidelines/products
- https://docs.elgato.com/guidelines/stream-deck/plugins
- https://docs.elgato.com/streamdeck/sdk/introduction/distribution
- https://docs.elgato.com/streamdeck/cli/commands/pack
