#!/usr/bin/env node
/**
 * 三国 · 卧龙吟 资源出图脚本
 *
 *   - 直连本地 ComfyUI (http://127.0.0.1:8188) 的 HTTP API
 *   - 用 SDXL Base 1.0 跑国风水墨风格
 *   - 武将头像 / 建筑底图 / 事件横幅 / 全局背景 一站式生成
 *   - 产物落到 public/img/...  对应 aiImage.js 的命名约定
 *
 * 用法:
 *   node scripts/gen-assets.mjs                 # 全部出图
 *   node scripts/gen-assets.mjs heroes          # 仅武将
 *   node scripts/gen-assets.mjs buildings       # 仅建筑
 *   node scripts/gen-assets.mjs events bg       # 多选
 *   node scripts/gen-assets.mjs hero:guanyu     # 单个指定
 *
 * 依赖: 仅 Node 18+ 内置 fetch / fs/promises  (零额外依赖)
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

/* ============================================================
 *  ComfyUI 连接配置
 * ============================================================ */
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188'
const CKPT = 'sd_xl_base_1.0.safetensors'
const CLIENT_ID = 'sanguo-batch-' + Date.now()

/* ============================================================
 *  风格化 Prompt 前后缀  ——  统一国风水墨基调
 * ============================================================ */
const STYLE_POS =
  'detailed oil painting portrait, semi-realistic chinese historical figure, ' +
  'three kingdoms era China han dynasty, dramatic chiaroscuro lighting, ' +
  'intricate facial details, weathered armor texture, cinematic concept art, ' +
  'artstation trending, by Greg Rutkowski and Wang Ximeng, single character, centered composition'

const STYLE_NEG =
  'flat vector art, MBE illustration, thick outline, cartoon, anime, chibi, ' +
  'multiple people, two people, twins, duplicate, mirrored, side by side, diptych, ' +
  'picture frame, framed painting, painting on wall, gallery, museum display, ' +
  'watermark, signature, text, logo, caption, border, ' +
  'low quality, blurry, ugly, deformed, mutated, extra limbs, bad anatomy, bad hands, ' +
  'modern clothes, western clothing, suit, tie, glasses'

/* ============================================================
 *  ICON 风格预设  ——  小尺寸单物件，深色底，烫金质感
 *  专门给 192x192 图标位用，跟 STYLE_POS 互斥（互斥很重要：
 *  画 portrait 的 prompt 给 icon 用会出整个人物）
 * ============================================================ */
const ICON_POS =
  'single centered object, clear silhouette, game ui icon style, ' +
  'isolated on plain dark background, no frame, no decorative border, ' +
  'three kingdoms chinese ancient era aesthetic, ornate but readable, ' +
  'rich painterly rendering, dramatic rim light, gold leaf accent, ' +
  'symmetric composition, high contrast, no people, no characters'

const ICON_NEG =
  'multiple objects, scattered items, two of the same, duplicate, mirrored, ' +
  'human, person, character, face, body parts, ' +
  'text, letters, watermark, signature, logo, caption, label, words, asian characters, ' +
  'photograph, photo, photorealistic skin, modern, contemporary, ' +
  'low quality, blurry, ugly, deformed, cluttered background, busy background, ' +
  'multiple panels, grid layout, collage, ornate frame, decorative border, ' +
  'art deco frame, geometric pattern overlay'

/* ============================================================
 *  12 个武将  ——  逐人 prompt（突出身份/兵器/性格）
 * ============================================================ */
const HEROES = [
  { id: 'lvbu',      prompt: 'portrait of Lu Bu the flying general, intimidating warlord, red phoenix headpiece, halberd Fang Tian Hua Ji, fierce eyes, golden armor with dragon motif' },
  { id: 'zhuge',     prompt: 'portrait of Zhuge Liang the sleeping dragon strategist, feather fan in hand, taoist robes, calm wise face, long beard, scroll on bamboo desk' },
  { id: 'guanyu',    prompt: 'portrait of Guan Yu the saint of war, long flowing beard, green robe, crescent moon blade Qinglong Yanyue Dao, red face, noble warrior' },
  { id: 'zhaoyun',   prompt: 'portrait of Zhao Yun the dragon of changshan, silver armor, white horse, long spear, handsome young general, calm determination' },
  { id: 'sima',      prompt: 'portrait of Sima Yi the wolf-gazing strategist, dark scholar robes, cunning narrow eyes, thin beard, holding bamboo slips' },
  { id: 'zhouyu',    prompt: 'portrait of Zhou Yu the handsome general of wu, refined young commander, dark blue robe, sword at waist, scholarly elegance, war fan' },
  { id: 'zhangfei',  prompt: 'portrait of Zhang Fei the tiger warrior, thick black beard, fierce wide eyes, snake spear Zhangba She Mao, bronze armor, roaring stance' },
  { id: 'dianwei',   prompt: 'portrait of Dian Wei the ancient evil-come bodyguard, muscular warrior, twin halberds, leather armor, scarred face, loyal expression' },
  { id: 'lusu',      prompt: 'portrait of Lu Su the wu strategist, gentle scholar holding scroll, blue silk robe, kind smile, beard slightly grey, lake background' },
  { id: 'wangping',  prompt: 'portrait of Wang Ping the shu officer, common soldier turned captain, simple iron helmet, modest leather armor, mountain ranger' },
  { id: 'caoren',    prompt: 'portrait of Cao Ren the wei defender, sturdy fortress general, heavy armor, square jaw, holding tower shield, calm professional' },
  { id: 'chenggong', prompt: 'portrait of Cheng Pu the veteran wu general, elderly experienced warrior, grey beard, weathered face, traditional armor' }
]

/* ============================================================
 *  9 栋建筑  ——  场景插画风格
 * ============================================================ */
const BUILDINGS = [
  { key: 'lordHall',   prompt: 'grand chinese palace hall, red lacquer pillars, golden dragon roof, throne room, lord audience, lanterns, banners' },
  { key: 'farm',       prompt: 'ancient chinese rice paddy fields, peasants with hoes, terraced farmland, water buffalo, distant mountains, harvest season' },
  { key: 'market',     prompt: 'bustling ancient chinese street market, silk banners, vendors, food stalls, lanterns, busy crowd, tang dynasty style' },
  { key: 'lumber',     prompt: 'pine forest with woodcutters, log piles, axes, sawmill, misty mountains, traditional chinese landscape' },
  { key: 'barrack',    prompt: 'ancient chinese military barracks, soldiers training, spear racks, watchtowers, war banners, stone fortress' },
  { key: 'academy',    prompt: 'confucian scholars academy, bamboo scrolls, ink stones, students reading, traditional pavilion, plum blossoms' },
  { key: 'inn',        prompt: 'ancient chinese inn at night, red lanterns, wooden balcony, travelers drinking wine, jianghu atmosphere' },
  { key: 'strategist', prompt: 'wartime strategist tent, war map on table, candles, weiqi go board, bamboo slips, oil lamp' },
  { key: 'workshop',   prompt: 'blacksmith forge workshop, glowing iron, hammer and anvil, sparks flying, sword crafting, smoke' }
]

/* ============================================================
 *  7 类事件横幅  ——  统一 2:1 横构图
 * ============================================================ */
const EVENTS = [
  { type: 'disaster', prompt: 'ancient chinese village struck by storm, dark clouds, lightning, flooding, dramatic disaster scene' },
  { type: 'crime',    prompt: 'shadowy figures at night in ancient chinese alley, hooded bandits, lanterns flickering, suspicious deal' },
  { type: 'envoy',    prompt: 'imperial envoy procession in chinese palace, ceremonial banners, kneeling ministers, golden throne hall' },
  { type: 'market',   prompt: 'bustling ancient chinese marketplace daytime, silk merchants, jade vendors, lively trading, abundant goods' },
  { type: 'history',  prompt: 'ancient chinese bamboo scroll unrolled on desk, calligraphy brush, ink stone, scholar studying history' },
  { type: 'culture',  prompt: 'moonlit chinese garden, scholar playing guqin under pavilion, plum blossoms, serene poetic atmosphere' },
  { type: 'gossip',   prompt: 'ancient chinese teahouse interior, storytellers, gossiping patrons, warm lantern light, wooden tables' }
]

/* ============================================================
 *  UI 小图标  ——  192x192，单物件烫金，对应 src/data + emoji 散点
 *  覆盖：资源 / 导航 Tab / 治理仪表 / 任务 / 流派 / 杂项 / 事件
 * ============================================================ */
const UI_ICONS = {
  res: [
    { id: 'grain',   prompt: 'a single golden wheat sheaf bundle tied with red string, harvest grain icon' },
    { id: 'coin',    prompt: 'a single ancient chinese square-hole bronze copper coin, calligraphy on rim, warm metallic glow' },
    { id: 'wood',    prompt: 'a single stack of fresh-cut pine wood logs, woodgrain rings visible, lumber icon' },
    { id: 'soldier', prompt: 'a single crossed bronze chinese spear and shield, ancient military icon, polished steel' },
    { id: 'ap',      prompt: 'a single glowing taoist talisman with golden lightning rune, energy charge icon, mystical aura' }
  ],
  tab: [
    { id: 'city',    prompt: 'a single tall ancient chinese pagoda tower with red walls and golden roof, isolated city silhouette' },
    { id: 'heroes',  prompt: 'a single chinese ancient general bronze helmet with red horsehair plume, hero crest icon' },
    { id: 'battle',  prompt: 'a single chinese war banner flag waving on a spear, red silk with golden character, battle standard' },
    { id: 'map',     prompt: 'a single rolled ancient chinese map scroll with visible terrain ink drawing, cartography icon' },
    { id: 'profile', prompt: 'a single imperial golden crown of chinese emperor with jade beads, regal lord icon' }
  ],
  gov: [
    { id: 'tech',     prompt: 'a single bronze chinese astronomical armillary sphere, gears and rings, ancient science icon' },
    { id: 'culture',  prompt: 'a single stack of bamboo slip books bound with leather string, classics literature icon' },
    { id: 'security', prompt: 'a single round chinese ancient warrior shield with tiger face boss, polished bronze, defense icon' },
    { id: 'commerce', prompt: 'a single silver yuanbao ingot of chinese sycee currency, boat shaped, wealth commerce icon' }
  ],
  task: [
    { id: 'patrol',  prompt: 'a single chinese ancient round wooden city gate plaque with iron studs, patrol watch icon' },
    { id: 'drill',   prompt: 'a single sharp polished steel chinese dao saber blade in scabbard, military drill icon' },
    { id: 'farm',    prompt: 'a single ancient chinese wooden hoe farming tool with curved blade, agriculture icon' },
    { id: 'logging', prompt: 'a single ancient chinese woodcutter axe with carved wooden handle and iron head, lumber icon' }
  ],
  spec: [
    { id: 'wenzhi',  prompt: 'a single open ancient chinese silk scroll with elegant brushed calligraphy, scholarly civil governance icon' },
    { id: 'wugong',  prompt: 'a single chinese ancient battle hammer mace with bronze head and red tassel, military might icon' },
    { id: 'zonghen', prompt: 'a single chinese feathered war fan of strategist, white goose feathers bamboo handle, scheming icon' }
  ],
  misc: [
    { id: 'seal',    prompt: 'a single carved jade chinese imperial seal with engraved characters and golden dragon top, chop icon' },
    { id: 'scroll',  prompt: 'a single ancient chinese rolled paper scroll tied with red ribbon and wax seal, chronicle icon' },
    { id: 'refresh', prompt: 'a single ancient chinese bronze fortune dice cup with wooden lid, rolling dice icon' },
    { id: 'dismiss', prompt: 'a single chinese ancient red ink calligraphy brush stroke forming an X cross mark, cancel reject icon' }
  ],
  event: [
    { id: 'disaster', prompt: 'a single dramatic lightning bolt over chinese pagoda rooftop, dark storm icon' },
    { id: 'locust',   prompt: 'a single chinese ancient locust insect on dried wheat stalk, pest disaster icon' },
    { id: 'fire',     prompt: 'a single chinese ancient burning red flame above wooden roof, fire disaster icon' },
    { id: 'crime',    prompt: 'a single chinese ancient curved dagger with black hilt and red tassel, banditry icon' },
    { id: 'ninja',    prompt: 'a single black hooded chinese assassin half-mask with single eye, stealth icon' },
    { id: 'envoy',    prompt: 'a single galloping bronze chinese war horse statuette, envoy messenger icon' },
    { id: 'trade',    prompt: 'a single silver chinese trading scale with brass weight pan, commerce trade icon' },
    { id: 'festival', prompt: 'a single round red chinese silk lantern with gold tassel, festival celebration icon' },
    { id: 'history',  prompt: 'a single closed ancient chinese leather-bound history book with gold trim, chronicle icon' },
    { id: 'culture',  prompt: 'a single chinese guqin zither stringed instrument on stand, refined art culture icon' },
    { id: 'gossip',   prompt: 'a single chinese ancient teacup with rising steam in delicate porcelain, teahouse rumor icon' }
  ]
}

/* ============================================================
 *  Workflow 模板  (SDXL Base, 标准 6 节点链路)
 *
 *   3 KSampler  ──┐
 *   4 CheckpointLoader  ──→  6 CLIPTextEncode(pos) ─┐
 *                      └──→  7 CLIPTextEncode(neg) ─┤
 *   5 EmptyLatentImage ──→  3 KSampler ──→ 8 VAEDecode ──→ 9 SaveImage
 * ============================================================ */
function buildWorkflow({ pos, neg, width, height, seed, steps = 28 }) {
  return {
    '3': {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg: 7.5,
        sampler_name: 'dpmpp_2m',
        scheduler: 'karras',
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0]
      }
    },
    '4': {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: CKPT }
    },
    '5': {
      class_type: 'EmptyLatentImage',
      inputs: { width, height, batch_size: 1 }
    },
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: { text: pos, clip: ['4', 1] }
    },
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: { text: neg, clip: ['4', 1] }
    },
    '8': {
      class_type: 'VAEDecode',
      inputs: { samples: ['3', 0], vae: ['4', 2] }
    },
    '9': {
      class_type: 'SaveImage',
      inputs: { filename_prefix: 'sanguo', images: ['8', 0] }
    }
  }
}

/* ============================================================
 *  API 调用工具
 * ============================================================ */
async function postPrompt(workflow) {
  const r = await fetch(`${COMFY}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID })
  })
  if (!r.ok) throw new Error(`POST /prompt ${r.status}: ${await r.text()}`)
  const j = await r.json()
  if (!j.prompt_id) throw new Error('no prompt_id in response: ' + JSON.stringify(j))
  return j.prompt_id
}

async function waitForResult(promptId, timeoutMs = 180_000) {
  const start = Date.now()
  let lastLog = 0
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`${COMFY}/history/${promptId}`)
    if (r.ok) {
      const h = await r.json()
      const entry = h[promptId]
      if (entry && entry.outputs) {
        for (const nodeId of Object.keys(entry.outputs)) {
          const out = entry.outputs[nodeId]
          if (out.images && out.images.length) return out.images[0]
        }
      }
    }
    if (Date.now() - lastLog > 5000) {
      process.stdout.write('.')
      lastLog = Date.now()
    }
    await new Promise((res) => setTimeout(res, 800))
  }
  throw new Error(`timeout waiting for ${promptId}`)
}

async function downloadImage(meta, savePath) {
  const u = new URL(`${COMFY}/view`)
  u.searchParams.set('filename', meta.filename)
  u.searchParams.set('subfolder', meta.subfolder || '')
  u.searchParams.set('type', meta.type || 'output')
  const r = await fetch(u)
  if (!r.ok) throw new Error(`GET /view ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  await fs.mkdir(path.dirname(savePath), { recursive: true })
  await fs.writeFile(savePath, buf)
  return buf.length
}

function seedFor(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}

async function genOne({ pos, neg, width, height, seed, outPath, label, steps = 28 }) {
  const t0 = Date.now()
  const wf = buildWorkflow({ pos, neg, width, height, seed, steps })
  const pid = await postPrompt(wf)
  process.stdout.write(`  ${label.padEnd(28)} pid=${pid.slice(0, 8)} `)
  const meta = await waitForResult(pid)
  const bytes = await downloadImage(meta, outPath)
  const ms = Date.now() - t0
  console.log(` OK  ${(bytes / 1024).toFixed(0)}KB  ${(ms / 1000).toFixed(1)}s  -> ${path.relative(ROOT, outPath)}`)
}

/* ============================================================
 *  健康检查 + 任务编排
 * ============================================================ */
async function healthCheck() {
  try {
    const r = await fetch(`${COMFY}/system_stats`, { signal: AbortSignal.timeout(4000) })
    if (!r.ok) throw new Error(`status ${r.status}`)
    const j = await r.json()
    const d = j.devices?.[0]
    console.log(`[OK] ComfyUI ${j.system?.comfyui_version} | ${d?.name || 'unknown GPU'} | VRAM free ${((d?.vram_free || 0) / 1e9).toFixed(1)} GB`)
  } catch (e) {
    console.error(`[X] ComfyUI not reachable at ${COMFY}`)
    console.error(`    ${e.message}`)
    console.error(`    请确认 ComfyUI 已启动 (run_nvidia_gpu_fast_fp16_accumulation.bat)`)
    process.exit(1)
  }
}

async function genHeroes(filter) {
  console.log('\n=== 武将头像 (512x512) ===')
  const offset = Number(process.env.HERO_SEED_OFFSET || 0)
  for (const h of HEROES) {
    if (filter && filter !== h.id) continue
    const pos = `head and shoulders portrait, looking at viewer, ${h.prompt}, ${STYLE_POS}`
    const neg = STYLE_NEG + ', full body, wide shot, landscape, scenery background'
    await genOne({
      pos, neg,
      width: 512, height: 512,
      seed: seedFor('hero:' + h.id + ':' + pos) + offset,
      outPath: path.join(ROOT, 'public/img/heroes', `${h.id}.png`),
      label: `hero/${h.id}`
    })
  }
}

async function genBuildings(filter) {
  console.log('\n=== 建筑底图 (512x512) ===')
  const offset = Number(process.env.BLD_SEED_OFFSET || 0)
  for (const b of BUILDINGS) {
    if (filter && filter !== b.key) continue
    const pos = `${b.prompt}, ${STYLE_POS}, wide establishing shot, no people in foreground`
    const neg = STYLE_NEG + ', character portrait, face close-up, single person centered'
    await genOne({
      pos, neg,
      width: 512, height: 512,
      seed: seedFor('bld:' + b.key + ':' + pos) + offset,
      outPath: path.join(ROOT, 'public/img/buildings', `${b.key}.png`),
      label: `bld/${b.key}`
    })
  }
}

async function genEvents(filter) {
  console.log('\n=== 事件横幅 (896x448, 2:1) ===')
  const offset = Number(process.env.EVT_SEED_OFFSET || 0)
  for (const e of EVENTS) {
    if (filter && filter !== e.type) continue
    const pos = `${e.prompt}, ${STYLE_POS}, cinematic wide banner composition`
    const neg = STYLE_NEG + ', portrait orientation, vertical composition, square'
    await genOne({
      pos, neg,
      width: 896, height: 448,
      seed: seedFor('evt:' + e.type + ':' + pos) + offset,
      outPath: path.join(ROOT, 'public/img/events', `${e.type}.png`),
      label: `evt/${e.type}`
    })
  }
}

async function genBackground() {
  console.log('\n=== 全局背景 (1536x864) ===')
  const offset = Number(process.env.BG_SEED_OFFSET || 0)
  const pos = 'majestic ancient chinese mountains and rivers landscape, mist, ' +
              'distant pagoda, sweeping vista, ' + STYLE_POS
  const neg = STYLE_NEG + ', people, characters, buildings close-up, portrait'
  await genOne({
    pos, neg,
    width: 1536, height: 864,
    seed: seedFor('bg:mountains:' + pos) + offset,
    outPath: path.join(ROOT, 'public/img/bg.png'),
    label: 'bg/mountains'
  })
}

/**
 * 批量生成 7 类 UI 小图标，每张 192x192。
 *  - 每类落在 public/img/ui-<group>/<id>.png
 *  - 用专属 ICON_POS / ICON_NEG，跟人物/场景 prompt 严格隔离
 *  - 支持单组过滤：node gen-assets.mjs icon:res / icon:tab
 *  - 支持单 id 过滤：iconId 命中后只跑该 id（不限组）
 */
async function genIcons(group, iconId) {
  const offset = Number(process.env.ICON_SEED_OFFSET || 0)
  const groups = group ? [group] : Object.keys(UI_ICONS)
  for (const g of groups) {
    const list = UI_ICONS[g]
    if (!list) { console.warn(`[skip] unknown icon group: ${g}`); continue }
    console.log(`\n=== UI 图标·${g} (192x192) ===`)
    for (const it of list) {
      if (iconId && iconId !== it.id) continue
      const pos = `${it.prompt}, ${ICON_POS}`
      const neg = ICON_NEG
      await genOne({
        pos, neg,
        width: 384, height: 384,
        steps: 22, // 小图减步数加速
        seed: seedFor(`icon:${g}:${it.id}:` + pos) + offset,
        outPath: path.join(ROOT, `public/img/ui-${g}`, `${it.id}.png`),
        label: `icon/${g}/${it.id}`
      })
    }
  }
}

/* ============================================================
 *  CLI
 * ============================================================ */
async function main() {
  const args = process.argv.slice(2)
  console.log(`ComfyUI Batch Gen  ->  ${COMFY}`)
  await healthCheck()

  const runAll = args.length === 0
  const targets = new Set(args.map((a) => a.split(':')[0]))
  // 只切首个冒号，保留尾部完整（支持 icon:res:coin）
  const filters = Object.fromEntries(
    args.filter((a) => a.includes(':')).map((a) => {
      const i = a.indexOf(':')
      return [a.slice(0, i), a.slice(i + 1)]
    })
  )

  if (runAll || targets.has('heroes') || targets.has('hero')) {
    await genHeroes(filters.hero)
  }
  if (runAll || targets.has('buildings') || targets.has('building')) {
    await genBuildings(filters.building)
  }
  if (runAll || targets.has('events') || targets.has('event')) {
    await genEvents(filters.event)
  }
  if (runAll || targets.has('bg') || targets.has('background')) {
    await genBackground()
  }
  if (targets.has('icons') || targets.has('icon')) {
    // icons 不进 runAll —— 防止默认全跑时被卷入
    // 用法：node gen-assets.mjs icons             // 全部 7 组
    //      node gen-assets.mjs icons icon:res     // 仅 res 组
    //      node gen-assets.mjs icons icon:res:coin  // 单 id（限组）
    const filt = filters.icon
    if (filt && filt.includes(':')) {
      const [g, id] = filt.split(':')
      await genIcons(g, id)
    } else {
      await genIcons(filt, null)
    }
  }

  console.log('\n[DONE] all assets generated under public/img/')
}

main().catch((e) => {
  console.error('\n[FAIL]', e)
  process.exit(1)
})
