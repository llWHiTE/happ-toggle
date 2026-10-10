# Security

Contact [Alexey Storozhilov](https://github.com/llWHiTE) before sharing sensitive details. No private vulnerability-reporting address, response SLA or supported-version policy has been established. Do not put secrets or exploit details in public reports; ask for a private channel first.

## Boundaries

- The plugin invokes Windows PowerShell for local detection and curl for speed tests.
- Only the supported `happ://toggle_without_ui` deeplink is accepted before shell invocation.
- Config files, custom proxy endpoints and imported Stream Deck settings are local trust inputs. Do not import untrusted configuration.
- Proxy credentials may be stored in plaintext and visible to local process inspection.
- Normal diagnostics omit proxy URLs; adapter/process names and external endpoint errors can still be sensitive. Review logs before sharing.
- No publisher telemetry, official Ookla binary or custom certificate bypass is bundled. The SDK3 runtime includes the official Elgato Node SDK and bundled dependencies; retain their license notices.
- Do not modify distributed files in a DRM-protected installation. Advanced overrides and logs belong in the separate user-data directory.

Original project code is MIT licensed. The owner reported successful manual tests before the SDK migration; the new integration still requires build/device verification. Syntax, smoke-test and archive checks are not a security audit or Elgato certification. No warranty or security certification is claimed.
