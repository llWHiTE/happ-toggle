'use strict';
const { exec, execFile } = require('child_process');

const API = String.raw`
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class HappToggleWindow {
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int command);
}
'@ -ErrorAction Stop
`;

const SNAPSHOT = `${API}
$p = Get-Process -Name Happ -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -and [IO.Path]::GetFileName($_.Path) -eq 'Happ.exe' -and
    [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($_.Path)) -eq 'Happ' } | Select-Object -First 1
if ($p) {
  $h = $p.MainWindowHandle
  $state = if ($h -eq [IntPtr]::Zero -or -not [HappToggleWindow]::IsWindowVisible($h)) { 'hidden' }
    elseif ([HappToggleWindow]::IsIconic($h)) { 'minimized' } else { 'visible' }
  Write-Output "$($p.Id)|$state"
}`;

function restoreScript(pid, state) {
  const command = state === 'hidden' ? 0 : 6; // SW_HIDE / SW_MINIMIZE
  return `${API}
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 200
  $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
  if (-not $p -or $p.ProcessName -ne 'Happ' -or -not $p.Path -or
      [IO.Path]::GetFileName($p.Path) -ne 'Happ.exe' -or
      [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($p.Path)) -ne 'Happ') { break }
  $h = $p.MainWindowHandle
  if ($h -ne [IntPtr]::Zero -and [HappToggleWindow]::IsWindowVisible($h)) {
    if (${command} -eq 0 -or -not [HappToggleWindow]::IsIconic($h)) {
      [void][HappToggleWindow]::ShowWindowAsync($h, ${command})
    }
  }
}`;
}

module.exports = function makeToggle(log, commands = { exec, execFile }) {
  const ps = (script, timeout, callback) => commands.execFile('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { windowsHide: true, timeout, maxBuffer: 4096 }, callback);

  return async function toggleKeepingTray(deeplink) {
    if (deeplink !== 'happ://toggle_without_ui') throw new Error('Unsupported Happ deeplink');
    const snapshot = await new Promise((resolve) => {
      ps(SNAPSHOT, 5000, (err, stdout) => {
        if (err) { log('window snapshot error:', err.message); return resolve(null); }
        const match = String(stdout || '').trim().match(/^(\d+)\|(hidden|minimized|visible)$/);
        resolve(match ? { pid: Number(match[1]), state: match[2] } : null);
      });
    });
    commands.exec(`start "" "${deeplink}"`, { windowsHide: true }, (err) => {
      if (err) log('deeplink error:', err.message);
    });
    if (snapshot && snapshot.state !== 'visible') {
      ps(restoreScript(snapshot.pid, snapshot.state), 7000, (err) => {
        if (err) log('window restore error:', err.message);
      });
    }
  };
};
