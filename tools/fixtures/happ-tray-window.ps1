$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
public static class HappTrayFixture {
  delegate IntPtr WindowProc(IntPtr h, uint message, IntPtr w, IntPtr l);
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct WindowClass {
    public uint style;
    public WindowProc procedure;
    public int classExtra, windowExtra;
    public IntPtr instance, icon, cursor, background;
    public string menu, name;
  }
  [StructLayout(LayoutKind.Sequential)]
  struct Message {
    public IntPtr hwnd;
    public uint message;
    public UIntPtr wParam;
    public IntPtr lParam;
    public uint time;
    public int x, y;
    public uint privateData;
  }
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern ushort RegisterClass(ref WindowClass c);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr CreateWindowEx(uint ex, string cls, string title, uint style, int x, int y, int w, int h, IntPtr parent, IntPtr menu, IntPtr instance, IntPtr param);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr DefWindowProc(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern bool DestroyWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool PeekMessage(out Message m, IntPtr h, uint first, uint last, uint remove);
  [DllImport("user32.dll")] static extern bool TranslateMessage(ref Message m);
  [DllImport("user32.dll")] static extern IntPtr DispatchMessage(ref Message m);
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr GetModuleHandle(string name);
  static WindowProc proc = Procedure;
  static int closes;
  static IntPtr Procedure(IntPtr h, uint m, IntPtr w, IntPtr l) {
    if (m == 0x0010) { closes++; ShowWindow(h, 0); return IntPtr.Zero; }
    return DefWindowProc(h, m, w, l);
  }
  static void Status(IntPtr h) {
    Console.WriteLine("{\"visible\":" + IsWindowVisible(h).ToString().ToLowerInvariant() +
      ",\"minimized\":" + IsIconic(h).ToString().ToLowerInvariant() + ",\"closes\":" + closes + "}");
    Console.Out.Flush();
  }
  public static void Run() {
    var instance = GetModuleHandle(null);
    var c = new WindowClass { procedure = proc, instance = instance, name = "QtFixtureQWindowIcon" };
    if (RegisterClass(ref c) == 0) throw new Exception("Fixture class registration failed");
    var h = CreateWindowEx(0, c.name, "Happ Fixture (not the VPN app)", 0x00cf0000, 50, 50, 320, 150, IntPtr.Zero, IntPtr.Zero, instance, IntPtr.Zero);
    if (h == IntPtr.Zero) throw new Exception("Fixture window creation failed");
    Console.WriteLine("{\"ready\":true}"); Console.Out.Flush();
    Task<string> input = Task.Run(() => Console.ReadLine());
    try {
      while (true) {
        Message message;
        while (PeekMessage(out message, IntPtr.Zero, 0, 0, 1)) { TranslateMessage(ref message); DispatchMessage(ref message); }
        if (input.IsCompleted) {
          string command = input.Result;
          if (command == null || command == "quit") break;
          if (command == "show") ShowWindow(h, 4);
          else if (command == "hide") ShowWindow(h, 0);
          else if (command == "minimize") ShowWindow(h, 6);
          Status(h);
          input = Task.Run(() => Console.ReadLine());
        }
        Thread.Sleep(5);
      }
    } finally { DestroyWindow(h); }
  }
}
'@
[HappTrayFixture]::Run()
