param([Parameter(Mandatory=$true)][string]$Directory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore, WindowsBase
$culture = [System.Globalization.CultureInfo]::InvariantCulture

function Number($value, $fallback = 0) {
  if ([string]::IsNullOrWhiteSpace($value)) { return [double]$fallback }
  return [double]::Parse($value, $culture)
}
function Brush($value) {
  if (!$value -or $value -eq 'none') { return $null }
  return ([System.Windows.Media.BrushConverter]::new()).ConvertFromString($value)
}
function Pen($style) {
  $brush = Brush $style['stroke']
  if (!$brush) { return $null }
  $pen = [System.Windows.Media.Pen]::new($brush, (Number $style['stroke-width'] 1))
  if ($style['stroke-linecap'] -eq 'round') {
    $pen.StartLineCap = $pen.EndLineCap = [System.Windows.Media.PenLineCap]::Round
    $pen.LineJoin = [System.Windows.Media.PenLineJoin]::Round
  }
  if ($style['stroke-dasharray']) {
    $values = [System.Collections.Generic.List[double]]::new()
    foreach ($n in ($style['stroke-dasharray'] -split '[ ,]+')) { $values.Add((Number $n) / $pen.Thickness) }
    $pen.DashStyle = [System.Windows.Media.DashStyle]::new($values, 0)
  }
  return $pen
}
function Transform($value) {
  $matrix = [System.Windows.Media.Matrix]::Identity
  foreach ($part in [regex]::Matches($value, '(translate|scale|rotate)\(([^)]+)\)')) {
    $v = @($part.Groups[2].Value -split '[ ,]+' | ForEach-Object { Number $_ })
    $operation = [System.Windows.Media.Matrix]::Identity
    switch ($part.Groups[1].Value) {
      translate { $operation.Translate($v[0], $(if ($v.Length -gt 1) { $v[1] } else { 0 })) }
      scale { $operation.Scale($v[0], $(if ($v.Length -gt 1) { $v[1] } else { $v[0] })) }
      rotate { if ($v.Length -gt 2) { $operation.RotateAt($v[0], $v[1], $v[2]) } else { $operation.Rotate($v[0]) } }
    }
    $matrix.Prepend($operation)
  }
  return [System.Windows.Media.MatrixTransform]::new($matrix)
}
function Draw-Node($node, $dc, $parent) {
  if ($node -isnot [System.Xml.XmlElement]) { return }
  $style = @{}
  foreach ($key in $parent.Keys) { $style[$key] = $parent[$key] }
  foreach ($key in @('fill','stroke','stroke-width','stroke-linecap','stroke-dasharray','font-family','font-size','font-style','font-weight','text-anchor')) {
    if ($node.HasAttribute($key)) { $style[$key] = $node.GetAttribute($key) }
  }
  $pushed = 0
  if ($node.HasAttribute('opacity')) { $dc.PushOpacity((Number $node.GetAttribute('opacity') 1)); $pushed++ }
  if ($node.HasAttribute('transform')) { $dc.PushTransform((Transform $node.GetAttribute('transform'))); $pushed++ }
  $fill = Brush $style['fill']
  $pen = Pen $style
  switch ($node.LocalName) {
    svg {
      $box = @($node.GetAttribute('viewBox') -split '[ ,]+' | ForEach-Object { Number $_ })
      $w = Number $node.GetAttribute('width')
      $h = Number $node.GetAttribute('height')
      $sx = $w / $box[2]; $sy = $h / $box[3]
      $matrix = [System.Windows.Media.Matrix]::new($sx, 0, 0, $sy,
        (Number $node.GetAttribute('x')) - $box[0] * $sx, (Number $node.GetAttribute('y')) - $box[1] * $sy)
      $dc.PushTransform([System.Windows.Media.MatrixTransform]::new($matrix)); $pushed++
      $dc.PushClip([System.Windows.Media.RectangleGeometry]::new([System.Windows.Rect]::new($box[0], $box[1], $box[2], $box[3]))); $pushed++
      foreach ($child in $node.ChildNodes) { Draw-Node $child $dc $style }
    }
    g { foreach ($child in $node.ChildNodes) { Draw-Node $child $dc $style } }
    rect {
      $r = [System.Windows.Rect]::new((Number $node.GetAttribute('x')), (Number $node.GetAttribute('y')),
        (Number $node.GetAttribute('width')), (Number $node.GetAttribute('height')))
      $rx = Number $node.GetAttribute('rx')
      $dc.DrawRoundedRectangle($fill, $pen, $r, $rx, $rx)
    }
    circle {
      $center = [System.Windows.Point]::new((Number $node.GetAttribute('cx')), (Number $node.GetAttribute('cy')))
      $r = Number $node.GetAttribute('r')
      $dc.DrawEllipse($fill, $pen, $center, $r, $r)
    }
    path { $dc.DrawGeometry($fill, $pen, [System.Windows.Media.Geometry]::Parse($node.GetAttribute('d'))) }
    text {
      $fontStyle = if ($style['font-style'] -eq 'italic') { [System.Windows.FontStyles]::Italic } else { [System.Windows.FontStyles]::Normal }
      $weight = switch ([string]$style['font-weight']) { '700' { [System.Windows.FontWeights]::Bold } '600' { [System.Windows.FontWeights]::SemiBold } default { [System.Windows.FontWeights]::Normal } }
      $typeface = [System.Windows.Media.Typeface]::new([System.Windows.Media.FontFamily]::new($style['font-family']),
        $fontStyle, $weight, [System.Windows.FontStretches]::Normal)
      $formatted = [System.Windows.Media.FormattedText]::new($node.InnerText, $culture, [System.Windows.FlowDirection]::LeftToRight,
        $typeface, (Number $style['font-size'] 12), $fill)
      $x = Number $node.GetAttribute('x')
      if ($style['text-anchor'] -eq 'middle') { $x -= $formatted.WidthIncludingTrailingWhitespace / 2 }
      elseif ($style['text-anchor'] -eq 'end') { $x -= $formatted.WidthIncludingTrailingWhitespace }
      $dc.DrawText($formatted, [System.Windows.Point]::new($x, (Number $node.GetAttribute('y')) - $formatted.Baseline))
    }
    default { throw "Unsupported generated SVG element: $($node.LocalName)" }
  }
  for ($i = 0; $i -lt $pushed; $i++) { $dc.Pop() }
}

foreach ($file in Get-ChildItem -LiteralPath $Directory -Filter '*.svg') {
  $settings = [System.Xml.XmlReaderSettings]::new()
  $settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
  $settings.XmlResolver = $null
  $reader = [System.Xml.XmlReader]::Create($file.FullName, $settings)
  $doc = [System.Xml.XmlDocument]::new(); $doc.XmlResolver = $null
  try { $doc.Load($reader) } finally { $reader.Dispose() }
  $root = $doc.DocumentElement
  $w = [int](Number $root.GetAttribute('width')); $h = [int](Number $root.GetAttribute('height'))
  $visual = [System.Windows.Media.DrawingVisual]::new()
  $dc = $visual.RenderOpen()
  try { Draw-Node $root $dc @{ fill='#000000'; stroke='none'; 'font-family'='Bahnschrift'; 'font-size'='12' } } finally { $dc.Close() }
  $bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($w, $h, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
  $bitmap.Render($visual)
  $encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
  $destination = [System.IO.Path]::ChangeExtension($file.FullName, '.png')
  $stream = [System.IO.File]::Create($destination)
  try { $encoder.Save($stream) } finally { $stream.Dispose() }
  Write-Output "Created $($file.BaseName).png ($w x $h)"
}
