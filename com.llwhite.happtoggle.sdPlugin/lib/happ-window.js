'use strict';
const { exec, execFile } = require('child_process');

const API = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class HappToggleWindow {
  public delegate bool WindowCallback(IntPtr h, IntPtr p);
  [DllImport("user32.dll")] public static extern bool EnumWindows(WindowCallback callback, IntPtr p);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int count);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int count);
  [DllImport("user32.dll", SetLastError = true)] public static extern bool PostMessage(IntPtr h, uint message, IntPtr wParam, IntPtr lParam);
  public static bool IsMainWindow(IntPtr h, uint pid) {
    uint owner;
    GetWindowThreadProcessId(h, out owner);
    if (!IsWindow(h) || owner != pid) return false;
    var cls = new StringBuilder(256);
    var title = new StringBuilder(256);
    GetClassName(h, cls, cls.Capacity);
    GetWindowText(h, title, title.Capacity);
    return cls.ToString().StartsWith("Qt") && cls.ToString().EndsWith("QWindowIcon") &&
      (title.ToString() == "Happ" || title.ToString().StartsWith("Happ "));
  }
}
'@
function Test-HappProcess($p) {
  return ($p -and $p.ProcessName -eq 'Happ' -and $p.Path -and
    [IO.Path]::GetFileName($p.Path) -eq 'Happ.exe' -and
    [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($p.Path)) -eq 'Happ')
}
`;

const SNAPSHOT = `${API}
$apps = @(Get-Process -Name Happ -ErrorAction SilentlyContinue | Where-Object { Test-HappProcess $_ })
if ($apps.Count -ne 1) { Write-Output 'unavailable'; exit }
$p = $apps[0]
$matches = New-Object 'System.Collections.Generic.List[System.IntPtr]'
$callback = [HappToggleWindow+WindowCallback]{param($h, $unused)
  if ([HappToggleWindow]::IsMainWindow($h, $p.Id)) { $matches.Add($h) }
  return $true
}
[void][HappToggleWindow]::EnumWindows($callback, [IntPtr]::Zero)
if ($matches.Count -ne 1) { Write-Output 'unavailable'; exit }
$h = $matches[0]
$state = if ([HappToggleWindow]::IsIconic($h)) { 'minimized' }
  elseif ([HappToggleWindow]::IsWindowVisible($h)) { 'visible' } else { 'tray' }
Write-Output "$($p.Id)|$($h.ToInt64())|$($p.StartTime.ToUniversalTime().Ticks)|$state"
`;

function restoreScript(snapshot) {
  const { pid, handle, started, state } = snapshot;
  const message = state === 'tray' ? '0x0010' : '0x0112'; // WM_CLOSE / WM_SYSCOMMAND
  const parameter = state === 'tray' ? '0' : '0xF020'; // SC_MINIMIZE
  return `${API}
$h = [IntPtr]::new([long]${handle})
$deadline = [Diagnostics.Stopwatch]::StartNew()
while ($deadline.ElapsedMilliseconds -lt 1800) {
  $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
  if (-not (Test-HappProcess $p) -or
      $p.StartTime.ToUniversalTime().Ticks.ToString() -ne '${started}' -or
      -not [HappToggleWindow]::IsMainWindow($h, ${pid})) { Write-Output 'stale'; exit }
  if ([HappToggleWindow]::IsWindowVisible($h) -and
      (${state === 'tray' ? '$true' : '-not [HappToggleWindow]::IsIconic($h)'})) {
    # Let Happ handle its own close/minimize event; never force native visibility.
    if (-not [HappToggleWindow]::PostMessage($h, ${message}, [IntPtr]${parameter}, [IntPtr]::Zero)) {
      throw 'Window state request failed'
    }
    Write-Output 'requested'
    exit
  }
  Start-Sleep -Milliseconds 40
}
Write-Output 'unchanged'
`;
}

module.exports = function makeToggle(log, commands = { exec, execFile }) {
  const ps = (script) => new Promise((resolve) => {
    commands.execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 6000, maxBuffer: 4096 }, (err, stdout) => {
        if (err) { log('window helper error:', err.message); resolve(null); }
        else resolve(String(stdout || '').trim());
      });
  });

  async function toggleKeepingTray(deeplink) {
    const output = await ps(SNAPSHOT);
    const match = output && output.match(/^([1-9]\d{0,9})\|([1-9]\d{0,15})\|([1-9]\d{0,18})\|(tray|minimized|visible)$/);
    const snapshot = match ? { pid: match[1], handle: match[2], started: match[3], state: match[4] } : null;
    const launched = await new Promise((resolve) => {
      commands.exec(`start "" "${deeplink}"`, { windowsHide: true }, (err) => {
        if (err) log('deeplink error:', err.message);
        resolve(!err);
      });
    });
    if (launched && snapshot && snapshot.state !== 'visible') {
      const result = await ps(restoreScript(snapshot));
      if (result === 'stale') log('window state skipped: Happ window changed');
    } else if (launched && !snapshot) {
      log('window state unavailable; Happ visibility left unchanged by plugin');
    }
  }

  let previous = Promise.resolve();
  return function enqueueToggle(deeplink) {
    if (deeplink !== 'happ://toggle_without_ui') return Promise.reject(new Error('Unsupported Happ deeplink'));
    // A second toggle must snapshot the state after the first restoration, not during it.
    const next = previous.then(() => toggleKeepingTray(deeplink));
    previous = next.catch(() => {});
    return next;
  };
};
