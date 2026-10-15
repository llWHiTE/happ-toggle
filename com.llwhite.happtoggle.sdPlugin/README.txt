Happ Toggle 1.12.4 — Stream Deck plugin for Windows 10/11
Requires Stream Deck 7.6 or later.
Author: Alexey Storozhilov — https://github.com/llWHiTE
License: MIT. Bundled runtime notices: THIRD_PARTY_LICENSES.txt.

WHAT CHANGED IN 1.12.4
  English is the only UI resource, regardless of the Stream Deck locale.
  Existing icon, provider, appearance and timing settings are retained;
  the obsolete per-action language setting is ignored.
  Speed tests use received/acknowledged bytes divided by actual phase time.
  Timed-out uploads are not counted as successful delivery. Cloudflare uses
  phase-average goodput, not a percentile of individual request speeds.
  Fix cancellation monitoring for a standalone Speed Test key, curl startup
  without an AbortSignal, and recovery after a temporary SDK layout failure.
  Tests cover the SDK adapter, inspector, controls, cancellation, transfer
  accounting, real curl on localhost, and an isolated Windows tray fixture.
  Happ window preservation is unchanged from the confirmed 1.12.3 behavior.

INSTALLATION
  Open the supplied .streamDeckPlugin installer in Stream Deck.
  The local stability update is built as com.llwhite.happtoggle, version
  1.12.4.0. Updating the same UUID retains existing actions and settings.
  The compatibility source UUID com.user.happtoggle is a different plugin;
  actions belonging to that UUID do not automatically migrate between UUIDs.
  Do not remove existing buttons or reinstall Happ to apply this update.
  The plugin does not install or update itself automatically.

CONTROLS
  Happ VPN key:
    Short press toggles Happ. Hold starts a speed test.
  Speed Test key:
    Short press starts a test on release. Press during a test to cancel.
    Hold an idle key to cycle Yandex / Cloudflare / Speedtest.net.
  Stream Deck+ dial:
    Rotate in either direction to select the speed-test service.
    Short press starts/cancels a test on release.
    Hold or tap the touch screen to toggle Happ VPN.
    Holding and rotating does not select a service or trigger a test/toggle
    on release. The default hold threshold is 0.6 seconds.
  Stream Deck Neo:
    Place Speed Test on Infobar and on a regular key on the same device.
    Infobar displays status, progress and results; the key controls the test.
    Tests from another device are not mirrored to this Infobar.

  Test-service selection is NOT Happ VPN-server selection. The plugin does
  not list, select or change Happ servers, subscriptions or account settings.
  There is one active speed test at a time. Provider changes, cancellation,
  connection-state changes and disappearance of the initiating action clear
  stale work/results as applicable. Each key/dial saves its own provider.

APPEARANCE AND RESULTS
  Choose combined download/upload values or a large current-phase view.
  Both speeds are shown in the completed result. Screen results remain until
  the next test, provider change or VPN-state change; restarting resets them.
  Keys have a configurable result duration or "Until the next test".
  Mbps is decimal megabits per second. MB/s is Mbps divided by eight.
  Units and service/server labels can be hidden independently of numbers.
  Screens offer an optional transparent background and HTTP latency display.
  Choose Segoe UI, Arial, Consolas or Bahnschrift (default), and regular,
  semibold, bold or italic numbers. Fonts must be installed in Windows;
  the renderer determines the fallback if a selected font is unavailable.
  Custom status icons can be replaced/reset independently.
  Idle/test animations are independently switchable. Animation is limited
  to 10 frames per second and does not start extra network measurements.
  Values update as transfers finish, not on every packet. Before data is
  available the display shows placeholders, not invented zero speeds.
  This is an on-demand speed test, not continuous traffic monitoring.

WHAT THE SPEED NUMBERS MEAN
  All three services measure HTTP application goodput on the selected route:
    download Mbps = received HTTP bytes * 8 / actual phase seconds / 1,000,000
    upload Mbps   = acknowledged HTTP bytes * 8 / actual phase seconds / 1,000,000
  Parallel streams share one monotonic wall-clock duration. Their individual
  peak rates are not summed. Connection, TLS and HTTP-response waits during
  the phase are included. Discovery and preflight transfers are excluded.
  A final request can extend beyond the configured phase duration within a
  bounded timeout; its full elapsed time remains in the denominator.
  Upload counts only complete HTTP-successful requests. A timeout, including
  one after sending a body, is not proof of server acknowledgement. Such a
  phase fails rather than displaying an inflated or invented upload rate.
  A download timeout may count bytes actually received with HTTP 200; invalid
  sizes, failed HTTP status, HTML/JSON error pages and malformed metrics fail.
  Cloudflare uses one stream; Yandex and Speedtest.net use the configured
  stream count (four by default). Cloudflare has one bounded HTTP-429 fallback
  to a smaller download, not unlimited retries.
  Yandex uses its advertised HTTPS probes. Speedtest.net probes up to four
  candidate hosts and validates download/upload before measuring.
  Latency is HTTP response delay after connection/proxy/TLS preparation,
  not ICMP ping and not a full connection-establishment measurement.

  These numbers describe the chosen endpoint, route and test interval. They
  are not guaranteed tariff speed, physical link capacity or proof of VPN
  coverage for every application. Services use different destinations and
  limits, so their results can differ. This is not the official Ookla engine
  or the browser service's complete measurement algorithm. No correction
  coefficient is applied to make low results look faster.
  For more stable comparisons use the same route and nearby times; try
  10–15 seconds if short tests cannot collect enough acknowledged data.
  Repeated tests can consume substantial traffic.

ROUTING AND CANCELLATION
  curl receives an explicit proxy or explicit direct routing. User .curlrc
  and proxy-bypass environment settings cannot silently override that choice.
  When automatic Happ-proxy detection fails, the test is cancelled instead
  of silently using a different route. Explicit direct configuration remains
  available. AbortSignal cancels running curl work and temporary upload files
  are cleaned up on completion, cancellation and errors.

HAPP WINDOW BEHAVIOR
  Before happ://toggle_without_ui, the plugin snapshots the existing main
  window. An open window stays open. If Happ was in tray and the deeplink
  reveals it, one normal WM_CLOSE asks Happ's own close-to-tray handler to
  restore the tray state. A taskbar-minimized window is minimized again.
  No forced SW_HIDE, repeated hide loop or focus manipulation is used.
  Window/process identity is checked before restoration. Unknown or replaced
  windows are not sent close/minimize messages. Rapid toggles are serialized.
  A brief window flash caused by Happ's deeplink handling can still occur.
  The user confirmed state preservation in 1.12.3; this implementation is
  unchanged. The new installer still needs a physical-device regression check.

CONFIGURATION AND DIAGNOSTICS
  Packaged config.json contains defaults and should not be edited in place.
  Overrides/logs live in:
    %APPDATA%\HappToggle\<plugin UUID>\
  For this local installer, <plugin UUID> is com.llwhite.happtoggle.
  Optional user-config.json accepts overrides such as speedProxy ("auto",
  "" for direct, or a proxy URL), speedServer (Cloudflare), speedStreams,
  VPN detection hints and longPressMs. Keep private configuration out of
  shared archives. Proxy credentials are redacted from diagnostic errors.
  With Node.js available, the built runtime supports --diag and --speed 3
  with --provider yandex, cloudflare or speedtest. A speed command uses traffic.

VALIDATION AND REMAINING MANUAL CHECKS
  The release folder's VALIDATION.json records the actual build checks,
  local curl/native tests and separate public-endpoint smoke results.
  Offline tests do not connect to Happ, change VPN servers or toggle VPN.
  Public service availability at one moment is not a maximum-speed guarantee.
  After installing, check short/long presses, dial rotation/tap, cancellation,
  Neo results, units/fonts and reconnect behavior on the physical Stream Deck.
  Verify Happ remains open/minimized/in tray as before. No Marketplace/DRM
  approval or physical-device validation is implied by local CLI validation.
