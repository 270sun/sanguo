<#
.SYNOPSIS
  通过本地 ComfyUI (127.0.0.1:8188) 的 SDXL Base 模型为三国主题游戏批量生成 7 张沉浸式背景 CG。
  覆盖 public/img/bg/ 下的占位图。

.PRECONDITION
  - 已运行 D:\AI\ComfyUI_windows_portable\run_nvidia_gpu(_fast_fp16_accumulation).bat
  - 端口 8188 alive
  - models/checkpoints/sd_xl_base_1.0.safetensors 存在
#>

param(
  [string]$ComfyUrl = 'http://127.0.0.1:8188',
  [string]$Ckpt = 'sd_xl_base_1.0.safetensors',
  [int]$Steps = 30,
  [double]$Cfg = 7.0,
  [string]$Sampler = 'dpmpp_2m',
  [string]$Scheduler = 'karras',
  [int]$Width = 1024,
  [int]$Height = 1024,
  [string]$OutDir = 'public\img\bg'
)

$ErrorActionPreference = 'Stop'

# -------- 7 张图的中英文 prompt（统一画风：水墨 + 写实光影）--------
$BASE_STYLE = "ancient chinese ink wash painting style fused with cinematic realism, " +
              "atmospheric volumetric lighting, soft golden hour light, " +
              "Three Kingdoms era China (Han dynasty), highly detailed, intricate textures, " +
              "muted earthy palette with vermillion accents, mist and incense smoke, " +
              "subtle gold leaf rim light, masterpiece, ultra high quality, 8k"

$NEG = "modern, futuristic, neon, anime, cartoon, low quality, blurry, watermark, signature, " +
       "text, letters, frame, border, ugly, deformed, photo of a person, selfie, bad anatomy, " +
       "extra fingers, bad hands"

$IMAGES = @(
  @{
    name = 'study'
    prompt = "interior of an ancient Chinese lord's study chamber at dusk, " +
             "low wooden desk in center foreground with brush stand, ink stone, scroll, jade seal, " +
             "small bronze incense burner emitting thin smoke, " +
             "warm candlelight illuminating dark lacquered wood, " +
             "background hint of vermillion pillars and silk hanging scrolls of misty mountains, " +
             "shallow depth of field, cinematic wide composition, " + $BASE_STYLE
  },
  @{
    name = 'city'
    prompt = "panoramic aerial view of an ancient Chinese capital city during autumn dusk, " +
             "vermillion palaces with curved golden tiled roofs, stone city walls and watchtowers, " +
             "busy market streets with paper lanterns, distant misty mountains, " +
             "warm sunset lighting, ink wash brush strokes blended with photoreal architecture, " + $BASE_STYLE
  },
  @{
    name = 'heroes'
    prompt = "interior of an ancient Chinese war council hall at night, " +
             "rows of empty ornate hardwood chairs flanking a wide aisle, " +
             "tall vermillion lacquer pillars, silk military banners hanging from the rafters, " +
             "ceremonial polearms on display racks against the wall, " +
             "warm candlelight from bronze braziers, " +
             "deep cinematic perspective, no people, " + $BASE_STYLE
  },
  @{
    name = 'battle'
    prompt = "vast misty battlefield plain at sunrise, " +
             "rolling banners and forest of spears in distant silhouette through dawn fog, " +
             "abandoned cavalry helmet and broken arrows in foreground, " +
             "burning campfires far horizon, smoke and dust rising, " +
             "desaturated cold blue-gray palette with warm orange ember accents, " +
             "epic widescreen composition, no clear human figures, " + $BASE_STYLE
  },
  @{
    name = 'map'
    prompt = "overhead view of a vast hand-painted ancient Chinese map of the Three Kingdoms era " +
             "spread across a low wooden table, " +
             "weathered yellow rice paper with mountains, rivers and city markers in black ink and red vermillion seal, " +
             "small bronze figurines of generals placed on territories, " +
             "candle flame at the edge casting warm light and long shadows, " +
             "cinematic top-down still life, " + $BASE_STYLE
  },
  @{
    name = 'profile'
    prompt = "an elegant empty throne hall of an ancient Chinese lord, " +
             "tall vermillion dragon-carved throne on a raised stone dais, " +
             "two rows of ornate columns with golden dragon reliefs, " +
             "burning bronze incense braziers, " +
             "shafts of golden light pouring in through high windows onto polished stone floor, " +
             "majestic, awe-inspiring, no people, " + $BASE_STYLE
  },
  @{
    name = 'chronicle'
    prompt = "extreme close-up of an open ancient Chinese bamboo slip scroll and silk historical book " +
             "spread on a dark wooden desk, " +
             "calligraphy brush, ink stone and red seal beside, " +
             "warm single candle light casting deep shadows, " +
             "dust particles floating in the beam, " +
             "shallow depth of field, ink wash atmosphere, " + $BASE_STYLE
  }
)

# -------- SDXL workflow JSON builder --------
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

# -------- queue + poll + download --------
function Invoke-ComfyOne {
  param([string]$Name, [string]$Pos)
  $seed = Get-Random -Maximum 2147483647
  $body = New-Workflow -Pos $Pos -Neg $NEG -Seed $seed -FilenamePrefix "sg_$Name"

  Write-Host "[$Name] queue (seed=$seed)..." -ForegroundColor Cyan
  $r = Invoke-RestMethod -Uri "$ComfyUrl/prompt" -Method Post -ContentType 'application/json' -Body $body
  $promptId = $r.prompt_id
  Write-Host "[$Name] prompt_id=$promptId; polling..." -ForegroundColor DarkCyan

  $deadline = (Get-Date).AddMinutes(3)
  $outs = $null
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 1200
    try {
      $h = Invoke-RestMethod -Uri "$ComfyUrl/history/$promptId" -Method Get
      if ($h.$promptId -and $h.$promptId.outputs) {
        $outs = $h.$promptId.outputs
        break
      }
    } catch { }
  }
  if (-not $outs) { throw "[$Name] poll timeout" }

  # outputs.<nodeId>.images[0] = { filename, subfolder, type }
  $img = $null
  foreach ($k in $outs.PSObject.Properties.Name) {
    if ($outs.$k.images) { $img = $outs.$k.images[0]; break }
  }
  if (-not $img) { throw "[$Name] no images in outputs" }

  $viewUrl = "$ComfyUrl/view?filename=$([uri]::EscapeDataString($img.filename))&subfolder=$([uri]::EscapeDataString($img.subfolder))&type=$($img.type)"
  $outPath = Join-Path $OutDir "$Name.png"
  if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
  Invoke-WebRequest -Uri $viewUrl -OutFile $outPath -TimeoutSec 60
  $len = (Get-Item $outPath).Length
  $hash = (Get-FileHash $outPath -Algorithm MD5).Hash
  Write-Host "[$Name] OK -> $outPath ($len B, MD5=$hash)" -ForegroundColor Green
  return @{ name = $Name; path = $outPath; len = $len; hash = $hash }
}

# -------- main --------
Write-Host "ComfyUI endpoint: $ComfyUrl" -ForegroundColor Yellow
$probe = Invoke-RestMethod -Uri "$ComfyUrl/system_stats" -Method Get -TimeoutSec 5
Write-Host ("Device: " + $probe.devices[0].name) -ForegroundColor Yellow

$results = @()
foreach ($img in $IMAGES) {
  $r = Invoke-ComfyOne -Name $img.name -Pos $img.prompt
  $results += $r
}

Write-Host "`n==== SUMMARY ====" -ForegroundColor Yellow
$results | ForEach-Object { "{0,-10}  {1,8} B  md5={2}" -f $_.name, $_.len, $_.hash } | Write-Host
$distinct = ($results | ForEach-Object { $_.hash } | Sort-Object -Unique).Count
$color = if ($distinct -eq $results.Count) { 'Green' } else { 'Red' }
Write-Host "Distinct hashes: $distinct / $($results.Count)" -ForegroundColor $color
