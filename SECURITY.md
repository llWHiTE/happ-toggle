# Security

Contact [Alexey Storozhilov](https://github.com/llWHiTE) before sharing sensitive details. No private vulnerability-reporting address, response SLA or supported-version policy has been established. Do not put secrets or exploit details in public reports; ask for a private channel first.

## Boundaries

- The plugin invokes Windows PowerShell for local detection and curl for speed tests.
- Only the supported `happ://toggle_without_ui` deeplink is accepted before shell invocation.
- Config files, custom proxy endpoints and imported Stream Deck settings are local trust inputs. Do not import untrusted configuration.
- Proxy credentials may be stored in plaintext and visible to local process inspection.
- Normal diagnostics omit proxy URLs; adapter/process names and external endpoint errors can still be sensitive. Review logs before sharing.
- No publisher telemetry, official Ookla binary, external runtime npm dependency or custom certificate bypass is bundled.

The current release is a preview. Syntax/archive checks are not a security audit, an Elgato certification or a substitute for manual network/device testing. No warranty or security certification is claimed.
