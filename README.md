# Happ Toggle

![Happ Toggle](media/cover.png)

Happ VPN control and measured connection speed for **Elgato Stream Deck**, **Stream Deck+** and **Stream Deck Neo** on Windows.

## Requirements and installation

- Windows 10/11 and Stream Deck 7.6 or later.
- [Happ](https://github.com/Happ-proxy/happ-desktop), installed separately, supporting `happ://toggle_without_ui`.
- Windows `curl.exe` and `powershell.exe`. The official Elgato Node SDK is bundled in the SDK3 installer; users do not install npm packages.

Download the installer from [GitHub Releases](https://github.com/llWHiTE/happ-toggle/releases) and double-click it. Add **Happ VPN** or **Speed Test** from **Happ Toggle** in Stream Deck. Use `com.llwhite.happtoggle.streamDeckPlugin` for the SDK3 public build. Files with `-preview` in their names preserve the older SDK2 build and do not contain the Marketplace compatibility update.

For Stream Deck+, place **Speed Test** on a dial. For Neo, place it on **Infobar** and on a regular key; Infobar is display-only and follows tests on the same device.

## Controls

| Control | Action |
|---|---|
| VPN key: short press | Toggle Happ VPN |
| VPN key: hold | Start/cancel speed test |
| Speed Test key: short press | Start a test; press again to cancel |
| Idle Speed Test key: hold | Cycle Yandex / Cloudflare / Speedtest.net |
| Dial: rotate | Select test service |
| Dial: short press | Start/cancel on release |
| Dial: hold, or tap its screen | Toggle Happ VPN |

Enable **Test speed after connecting** on the VPN key or dial and choose the delay. A confirmed connection following that control's toggle schedules its test. It is not periodic background testing.

## Display

- Download/upload values update as measurements arrive; optional HTTP latency on screens.
- Latency enabled/disabled changes number/icon sizes and placement.
- Bahnschrift by default; other explicit font choices available.
- Connection-link screen status icon; former power symbol selectable.
- Combined or large-by-phase layout; Mbps/MB/s and optional units.
- Hidden service names, transparent screen fill, independent idle/test animations.
- Key results can be kept **until the next test**. Screen results remain until replaced or invalidated by a connection/service change.

These are **test services**, not Happ VPN servers. This is a connection test, **not live traffic monitoring**. Latency is HTTP latency after connection setup, **not ICMP ping**. The unofficial Speedtest.net endpoint method is not Ookla's engine; results need not match a browser. Tests can consume substantial data.

## Configuration, privacy and support

Normal settings are stored by Stream Deck. For advanced overrides, create `%APPDATA%\HappToggle\com.llwhite.happtoggle\user-config.json`; copy only the settings you need from the shipped `config.json`. Logs are written to that user-data directory. Do not modify distributed files: Marketplace DRM requires them to remain unchanged. The compatibility build uses its own `com.user.happtoggle` user-data directory.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md) and [third-party notices](THIRD_PARTY_NOTICES.md). No publisher telemetry is implemented. Review diagnostics before sharing; never include tokens, credentials or private proxy configuration.

## License and history

[MIT License](LICENSE), Copyright (c) 2026 Alexey Storozhilov. Original project code, documentation and artwork are covered; dependency licenses, trademarks and Windows fonts retain their own terms.

[CHANGELOG.md](CHANGELOG.md) records retained builds; [HISTORY.md](HISTORY.md) explains the project's development. Early local-build history is reconstructed, not presented as invented GitHub commits.

## Русский

Happ Toggle переключает Happ VPN и замеряет загрузку, отдачу и HTTP-задержку. Крутилка выбирает сервис; короткое нажатие запускает/отменяет тест, удержание и касание экрана переключают VPN. Автозамер настраивается для VPN-кнопки или крутилки. Neo отображает тесты того же устройства. Требуются Windows 10/11, Stream Deck 7.6+ и Happ. Проект открыт под MIT; история — в CHANGELOG/HISTORY. SDK3-сборка и официальная CLI-проверка/упаковка пройдены; новый основной установщик включает исправление совместимости. Прежние SDK2-вложения сохраняются с пометкой preview. 
