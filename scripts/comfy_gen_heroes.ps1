<#
.SYNOPSIS
  生成 6 张三国武将立绘 PNG（半身或全身），暗背景 + 鎏金边缘光，置于 public/img/heroes/
  风格统一：中国水墨工笔 + 电影写实光影
#>

param(
  [string]$ComfyUrl = 'http://127.0.0.1:8188',
  [string]$Ckpt = 'sd_xl_base_1.0.safetensors',
  [int]$Steps = 32,
  [double]$Cfg = 7.5,
  [string]$Sampler = 'dpmpp_2m',
  [string]$Scheduler = 'karras',
  [int]$Width = 832,
  [int]$Height = 1152,
  [string]$OutDir = 'public\img\heroes'
)

$ErrorActionPreference = 'Stop'

$BASE = "full body portrait, standing pose, isolated on solid dark obsidian background, " +
        "ancient chinese ink wash painting style fused with cinematic realism, " +
        "dramatic rim lighting from upper left, soft golden volumetric light, " +
        "ultra detailed armor textures, intricate engravings, photorealistic faces, " +
        "octane render, 8k, single character, museum quality, masterpiece"

$NEG = "multiple people, crowd, modern clothing, low quality, blurry, jpeg artifacts, " +
       "text, watermark, logo, signature, deformed face, extra limbs, bad anatomy, " +
       "cartoon, anime, 3d render style, lowres, ugly, bad hands"

$HEROES = @(
  @{ name='lvbu';    prompt = "fierce ancient chinese warlord general Lu Bu, red phoenix-wing helmet plume, dark crimson lacquered armor with golden dragon engravings, holding the legendary Sky-Piercer ji halberd, intense piercing eyes, long black hair flowing, " + $BASE },
  @{ name='zhuge';   prompt = "wise serene ancient chinese strategist Zhuge Liang, white silk robe with cloud embroidery, black scholar's headpiece, holding white feather fan, calm intelligent gaze, thin beard, " + $BASE },
  @{ name='guanyu';  prompt = "ancient chinese legendary general Guan Yu, deep green silk war robe, long flowing magnificent black beard reaching chest, holding crescent-moon Green Dragon Yanyue blade, stern righteous expression, red face, " + $BASE },
  @{ name='zhaoyun'; prompt = "ancient chinese young dashing general Zhao Yun, silver white phoenix-wing armor with blue silk underrobe, holding silver spear, white horse hair plume on helmet, handsome youthful face, calm confident eyes, " + $BASE },
  @{ name='zhangfei';prompt = "ancient chinese fierce burly general Zhang Fei, black iron armor with bronze rivets, thick bristling black beard, tiger eyes wide open, holding eighteen-foot snake spear, dark stormy aura, " + $BASE },
  @{ name='dianwei'; prompt = "ancient chinese mighty bodyguard general Dian Wei, dark leather armor over bare muscular shoulders, holding two iron halberds (paired ji), unkempt wild hair, fierce loyal expression, scars on face, " + $BASE }
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
  $body = New-Workflow -Pos $Pos -Neg $NEG -Seed $seed -FilenamePrefix "sg_hero_$Name"

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
  if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }
  $outPath = Join-Path $OutDir "$Name.png"
  Invoke-WebRequest -Uri $viewUrl -OutFile $outPath -TimeoutSec 120
  $hash = (Get-FileHash $outPath -Algorithm MD5).Hash
  Write-Host "[$Name] OK -> $outPath (md5=$hash)" -ForegroundColor Green
  return @{ name = $Name; path = $outPath; hash = $hash }
}

Write-Host "ComfyUI: $ComfyUrl" -ForegroundColor Yellow
$probe = Invoke-RestMethod -Uri "$ComfyUrl/system_stats" -Method Get -TimeoutSec 5
Write-Host ("Device: " + $probe.devices[0].name) -ForegroundColor Yellow

$results = @()
foreach ($it in $HEROES) { $results += Invoke-ComfyOne -Name $it.name -Pos $it.prompt }

Write-Host "`n==== SUMMARY ====" -ForegroundColor Yellow
$results | ForEach-Object { "{0,-10} md5={1}" -f $_.name, $_.hash } | Write-Host
$distinct = ($results | ForEach-Object { $_.hash } | Sort-Object -Unique).Count
$color = if ($distinct -eq $results.Count) { 'Green' } else { 'Red' }
Write-Host "Distinct hashes: $distinct / $($results.Count)" -ForegroundColor $color
