<#
.SYNOPSIS
  生成 5 张地图区域纹理 PNG，作为 SVG <pattern> 填充用。
  中原 / 江南 / 北疆 / 西域 / 南陲，统一中国水墨 + 古地图羊皮卷质感。
#>

param(
  [string]$ComfyUrl = 'http://127.0.0.1:8188',
  [string]$Ckpt = 'sd_xl_base_1.0.safetensors',
  [int]$Steps = 32,
  [double]$Cfg = 7.5,
  [string]$Sampler = 'dpmpp_2m',
  [string]$Scheduler = 'karras',
  [int]$Width = 1024,
  [int]$Height = 1024,
  [string]$OutDir = 'D:\workspace\sanguo\public\img\maps'
)

$ErrorActionPreference = 'Stop'

$BASE = "ancient chinese ink wash landscape painting on aged parchment, " +
        "seamless tileable texture, top-down bird-eye view, no people, no text, " +
        "subtle sepia tones, faded gold and ochre accents, weathered map style, " +
        "delicate brushstroke contours, organic noise, museum quality, masterpiece"

$NEG = "people, person, character, soldier, modern, text, words, letters, " +
       "watermark, logo, signature, sharp digital edges, 3d render, photograph, " +
       "low quality, blurry, jpeg artifacts, frame, border"

$MAPS = @(
  @{ name='zhongyuan'; prompt = "vast central plains of ancient china, rolling loess yellow soil hills, sparse pine groves, winding yellow river meanders, terraced farmland patches, warm golden ochre dominant, " + $BASE },
  @{ name='jiangnan';  prompt = "lush southern china jiangnan watertown region, emerald paddy fields, intricate canal network, scattered bamboo forests, misty river deltas, soft teal and jade green dominant, " + $BASE },
  @{ name='beijiang';  prompt = "harsh northern frontier of ancient china, snow-capped jagged mountains, frozen pine taiga, icy great wall ruins, cold steel grey and pale blue dominant, distant frost mist, " + $BASE },
  @{ name='xiyu';      prompt = "western desert region of ancient china, vast gobi sand dunes, isolated oasis, weathered yellow earth fortress ruins, scattered camel caravan trails, sun-baked sandy yellow and brick red dominant, " + $BASE },
  @{ name='nanchu';    prompt = "southern frontier dense jungle of ancient china, tropical rainforest canopy, twisting muddy rivers, towering misty karst peaks, hidden minority villages, deep emerald and dark olive dominant, exotic plants, " + $BASE }
)

function New-Workflow {
  param([string]$Pos, [string]$Neg, [int]$Seed, [string]$FilenamePrefix)
  $wf = @{
    "3" = @{ class_type = "CheckpointLoaderSimple"; inputs = @{ ckpt_name = $Ckpt } }
    "4" = @{ class_type = "CLIPTextEncode"; inputs = @{ text = $Pos; clip = @("3", 1) } }
    "5" = @{ class_type = "CLIPTextEncode"; inputs = @{ text = $Neg; clip = @("3", 1) } }
    "6" = @{ class_type = "EmptyLatentImage"; inputs = @{ width = $Width; height = $Height; batch_size = 1 } }
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
  $body = New-Workflow -Pos $Pos -Neg $NEG -Seed $seed -FilenamePrefix "sg_map_$Name"

  Write-Host "[$Name] queue (seed=$seed)..." -ForegroundColor Cyan
  $r = Invoke-RestMethod -Uri "$ComfyUrl/prompt" -Method Post -ContentType 'application/json' -Body $body
  $promptId = $r.prompt_id

  $deadline = (Get-Date).AddMinutes(5)
  $outs = $null
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 1500
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
  if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
  $outPath = Join-Path $OutDir "$Name.png"
  Invoke-WebRequest -Uri $viewUrl -OutFile $outPath -TimeoutSec 120
  $hash = (Get-FileHash $outPath -Algorithm MD5).Hash
  Write-Host "[$Name] OK -> $outPath (md5=$hash)" -ForegroundColor Green
  return @{ name = $Name; path = $outPath; hash = $hash }
}

Write-Host "ComfyUI: $ComfyUrl" -ForegroundColor Yellow
$probe = Invoke-RestMethod -Uri "$ComfyUrl/system_stats" -Method Get -TimeoutSec 5
Write-Host ("Device: " + $probe.devices[0].name) -ForegroundColor Yellow
Write-Host ("OutDir: $OutDir") -ForegroundColor Yellow

$results = @()
$skipped = 0
$failed = @()
foreach ($it in $MAPS) {
  $existing = Join-Path $OutDir ($it.name + '.png')
  if (Test-Path $existing) {
    Write-Host "[$($it.name)] SKIP (exists)" -ForegroundColor DarkGray
    $skipped++
    continue
  }
  try {
    $results += Invoke-ComfyOne -Name $it.name -Pos $it.prompt
  } catch {
    Write-Host "[$($it.name)] FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $failed += $it.name
  }
}

Write-Host "`n==== SUMMARY ====" -ForegroundColor Yellow
Write-Host ("Generated: {0} | Skipped: {1} | Failed: {2}" -f $results.Count, $skipped, $failed.Count)
if ($failed.Count -gt 0) { Write-Host ("Failed: " + ($failed -join ', ')) -ForegroundColor Red }
$results | ForEach-Object { "{0,-12} md5={1}" -f $_.name, $_.hash } | Write-Host
if ($results.Count -gt 0) {
  $distinct = ($results | ForEach-Object { $_.hash } | Sort-Object -Unique).Count
  $color = if ($distinct -eq $results.Count) { 'Green' } else { 'Red' }
  Write-Host "Distinct hashes: $distinct / $($results.Count)" -ForegroundColor $color
}
