Add-Type -AssemblyName System.Drawing
$plugin = Get-ChildItem (Join-Path $PSScriptRoot '..') -Directory -Filter '*.sdPlugin' | Select-Object -First 1
$root = Join-Path $plugin.FullName 'imgs'
$sizes = @{
  'action.png' = 20; 'action@2x.png' = 40
  'category.png' = 28; 'category@2x.png' = 56
  'key.png' = 72; 'key@2x.png' = 144
  'plugin.png' = 256; 'plugin@2x.png' = 512
}

foreach ($entry in $sizes.GetEnumerator()) {
  $size = [int]$entry.Value
  $image = [System.Drawing.Bitmap]::new($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($image)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.ScaleTransform($size / 144.0, $size / 144.0)
  $color = if ($entry.Key -match '^(action|category)') { '#ffffff' } else { '#34d399' }
  $signal = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($color), 6.0)
  $signal.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $signal.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawArc($signal, 25, 25, 94, 94, -45, 270)
  $g.DrawLine($signal, 72, 18, 72, 66)
  $image.Save((Join-Path $root $entry.Key), [System.Drawing.Imaging.ImageFormat]::Png)
  $signal.Dispose()
  $g.Dispose(); $image.Dispose()
}
