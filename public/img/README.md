# 三国经营游戏 — 图片素材方案说明（AI 生图版）

> 本项目当前**默认使用 AI 实时文生图**作为所有视觉素材的来源，无需手动下载任何文件。
>
> 接口：`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image`
> 所有 prompt 统一在 [src/utils/aiImage.js](../../src/utils/aiImage.js) 中维护。

---

## 接入位置

| 类别 | 调用位置 | 出图尺寸 | 兜底策略 |
| --- | --- | --- | --- |
| 武将立绘 | `HeroesView.vue` 的 `<img :src="heroImage(id)">` | `square_hd` | `<img @error>` → emoji 头像 |
| 事件横幅 | `EventModal.vue` 的 `<img :src="eventImage(type)">` | `landscape_16_9` | `<img @error>` → SVG + 渐变 |
| 全局背景 | `main.css` 的 `#app::before { background-image: url(...) }` | `landscape_16_9` | 加载失败时 body 渐变可见 |
| 建筑（备用） | `aiImage.js` 已写好 `buildingImage(key)`，目前 CityView 仍用 SVG | `square` | 直接 SVG |

---

## 修改风格

如需调整画风，只需修改 [aiImage.js](../../src/utils/aiImage.js) 中的：

1. `STYLE_SUFFIX` —— 全局画风（默认：工笔重彩 + 国风游戏立绘）
2. `HERO_PROMPTS[id]` —— 单个武将的题材描述
3. `EVENT_PROMPTS[type]` —— 单类事件的场景描述
4. `BG_PROMPT` —— 背景大图

修改保存后浏览器刷新即可看到新图（首次请求约 2-5 秒，之后浏览器自动缓存）。

---

## 关于本地手动图片（可选）

如果想用自己的图覆盖 AI 生图：
- 把 `<img :src>` 改回 `/img/heroes/{id}.jpg` 即可启用本地文件
- 子目录 `bg/` `heroes/` `buildings/` `events/` 已就位

---

## 兜底承诺

任何图片加载失败时，页面都会自动切换到 emoji / SVG / CSS 渐变，**不会出现碎图或灰底**。
