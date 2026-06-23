<#
.SYNOPSIS
  通过本地 ComfyUI 生成 6 张三国主题"案上器物"图，纯黑背景便于后续 rembg 抠透明。
  落到 public/img/items/<name>_raw.png，再由 strip_bg.py 抠成 <name>.png 透明。
#>

param(
  [string]$ComfyUrl = 'http://127.0.0.1:8188',
  [string]$Ckpt = 'sd_xl_base_1.0.safetensors',
  [int]$Steps = 28,
  [double]$Cfg = 7.5,
  [string]$Sampler = 'dpmpp_2m',
  [string]$Scheduler = 'karras',
  [int]$Width = 768,
  [int]$Height = 768,
  [string]$OutDir = 'public\img\items'
)

$ErrorActionPreference = 'Stop'

$BASE = "single object centered on pure black background, no other elements, no text, no border, " +
        "ancient chinese Three Kingdoms era artifact, museum quality studio shot, " +
        "dramatic side lighting from upper left, soft golden rim light, " +
        "ultra detailed materials, intricate engraving, photorealistic, octane render, 8k"

$NEG = "person, character, hand, finger, face, landscape, scenery, background details, " +
       "table, desk, floor, wall, text, watermark, logo, low quality, blurry, jpeg artifacts, " +
       "white background, gray background, multiple objects"

$ITEMS = @(
  @{ name = 'city';      prompt = "miniature gilded bronze model of an ancient Chinese walled city with curved-roof palaces and watchtowers, intricate filigree details, vermillion red and gold accents, " + $BASE },
  @{ name = 'heroes';    prompt = "ornate ancient Chinese general's iron helmet with red horsehair plume, dragon engravings, two crossed bronze ji halberds behind it, dark patinated metal with golden filigree, " + $BASE },
  @{ name = 'battle';    prompt = "rolled-up vermillion red silk war banner on a black lacquered wooden pole, ornate golden tassels, ancient chinese calligraphy character glowing faintly on the cloth, " + $BASE },
  @{ name = 'map';       prompt = "rolled-up aged parchment scroll map tied with crimson silk ribbon, weathered yellow paper, hint of black ink mountains visible at edges, red wax seal stamp on top, " + $BASE },
  @{ name = 'profile';   prompt = "imperial chinese jade royal seal stamp, square base of carved white jade with golden dragon coiled on top as handle, sitting on small black wooden stand, deep red ink visible on stamp face, " + $BASE },
  @{ name = 'chronicle'; prompt = "partially unrolled ancient chinese bamboo slip scroll with calligraphy ink writing, bound by red silk cords, weathered green bamboo, lying at slight angle, " + $BASE }
)

function New-Workflow {
  param([string]$Pos, [string]$Neg, [int]$Seed, [string]$FilenamePrefix)
  $wf = @{
    "3" = @{ class_type = "CheckpointLoaderSimple"; inputs = @{ ckpt_name = $Ckpt } }
    "4" = @{ class_type = "CLIPTextEncode";        inputs = @{ text = $Pos; clip = @("3", 1) } }
    "5" = @{ class_type = "CLIPTextEncode";        inputs = @{ text = $Neg; clip = @("3", 1) } }
    "6" = @{ class_type = "EmptyLatentImage";      inputs = @{ width = $Width; height = $Height; batch_size = 1 } }
    "7" = @{ class_type = "KSampler"; inputs = @{
        seed = $Seed; steps = $Steps; cfg = $Cfg; sampler_name = $Sampler; scheduler = $Scheduler;
        denoise = 1.0; model = @("3", 0); positive = @("4", 0); negative = @("5", 0); latent_image = @("6", 0)
    } }
    "8" = @{ class_type = "VAEDecode"; inputs = @{ samples = @("7", 0); vae = @("3", 2) } }
    "9" = @{ class_type = "SaveImage"; inputs = @{ filename_prefix = $FilenamePrefix; images = @("8", 0) } }
  }
  return @{ prompt = $wf } | ConvertTo-Json -Depth 12
}

function Invoke-ComfyOne {
  param([string]$Name, [string]$Pos)
  $seed = Get-Random -Maximum 2147483647
  $body = New-Workflow -Pos $Pos -Neg $NEG -Seed $seed -FilenamePrefix "sg_item_$Name"

  Write-Host "[$Name] queue (seed=$seed)..." -ForegroundColor Cyan
  $r = Invoke-RestMethod -Uri "$ComfyUrl/prompt" -Method Post -ContentType 'application/json' -Body $body
  $promptId = $r.prompt_id

  $deadline = (Get-Date).AddMinutes(3)
  $outs = $null
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 1200
    try {
      $h = Invoke-RestMethod -Uri "$ComfyUrl/history/$promptId" -Method Get
      if ($h.$promptId -and $h.$promptId.outputs) { $outs = $h.$promptId.outputs; break }
    } catch { }
  }
  if (-not $outs) { throw "[$Name] poll timeout" }

  $img = $null
  foreach ($k in $outs.PSObject.Properties.Name) {
    if ($outs.$k.images) { $img = $outs.$k.images[0]; break }
  }
  if (-not $img) { throw "[$Name] no images" }

  $viewUrl = "$ComfyUrl/view?filename=$([uri]::EscapeDataString($img.filename))&subfolder=$([uri]::EscapeDataString($img.subfolder))&type=$($img.type)"
  if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
  $outPath = Join-Path $OutDir "$Name`_raw.png"
  Invoke-WebRequest -Uri $viewUrl -OutFile $outPath -TimeoutSec 60
  $hash = (Get-FileHash $outPath -Algorithm MD5).Hash
  Write-Host "[$Name] OK -> $outPath (md5=$hash)" -ForegroundColor Green
  return @{ name = $Name; path = $outPath; hash = $hash }
}

Write-Host "ComfyUI: $ComfyUrl" -ForegroundColor Yellow
$probe = Invoke-RestMethod -Uri "$ComfyUrl/system_stats" -Method Get -TimeoutSec 5
Write-Host ("Device: " + $probe.devices[0].name) -ForegroundColor Yellow

$results = @()
foreach ($it in $ITEMS) { $results += Invoke-ComfyOne -Name $it.name -Pos $it.prompt }

Write-Host "`n==== SUMMARY ====" -ForegroundColor Yellow
$results | ForEach-Object { "{0,-12} md5={1}" -f $_.name, $_.hash } | Write-Host
$distinct = ($results | ForEach-Object { $_.hash } | Sort-Object -Unique).Count
$color = if ($distinct -eq $results.Count) { 'Green' } else { 'Red' }
Write-Host "Distinct hashes: $distinct / $($results.Count)" -ForegroundColor $color
