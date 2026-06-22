/**
 * 随机事件 / 历史事件库
 * 每条事件结构：
 *   - key: 唯一标识
 *   - type: 'disaster'(天灾) | 'crime'(盗匪) | 'envoy'(外使) | 'market'(集市) | 'history'(史事) | 'culture'(风物) | 'gossip'(逸闻)
 *   - icon / title / quote(古文引/古风副标题)
 *   - desc: 描述（白话，会显示）
 *   - condition(game): 是否可触发（可选，默认 true）
 *   - choices: [{ key, label, desc, run(game) -> {msg, deltas?, lore?} }]
 *   - lore: { title, text } 可选历史背景延伸阅读
 *   - weight: 抽中权重（默认 10）
 */

/** 安全调整资源 */
function adj(game, deltas = {}) {
  for (const k in deltas) {
    if (k === 'morale') {
      game.policy.morale = Math.max(0, Math.min(100, game.policy.morale + deltas[k]))
    } else if (k === 'tech' || k === 'culture' || k === 'security' || k === 'commerce') {
      game.governance[k] = Math.max(0, Math.min(100, (game.governance[k] || 0) + deltas[k]))
    } else if (game.resources[k] != null) {
      game.resources[k] = Math.max(0, game.resources[k] + deltas[k])
    }
  }
}

export const EVENTS = [
  // ========== 天灾类 ==========
  {
    key: 'drought',
    type: 'disaster',
    icon: '☀️',
    title: '旱魃为虐',
    quote: '赤地千里，井涸禾枯',
    desc: '骄阳数月不雨，田畴龟裂。郡内百姓望天而泣，恳请主公定夺。',
    weight: 12,
    choices: [
      {
        key: 'relief',
        label: '开仓赈济',
        desc: '动用粮草救济灾民，民心大增',
        run: (game) => {
          const cost = Math.min(game.resources.grain, 200)
          adj(game, { grain: -cost, morale: +8, culture: +2 })
          return { msg: `开仓 ${cost} 粮，民心 +8`, deltas: { grain: -cost, morale: 8 } }
        }
      },
      {
        key: 'tax',
        label: '加征赋税',
        desc: '从灾民身上加征，得钱粮但民心暴跌',
        run: (game) => {
          adj(game, { coin: +150, morale: -12, security: -5 })
          return { msg: '加征得铜钱 +150 但民心 -12', deltas: { coin: 150, morale: -12 } }
        }
      },
      {
        key: 'pray',
        label: '设坛祈雨',
        desc: '消耗精力主持祭祀，文化与民心略增',
        run: (game) => {
          adj(game, { culture: +5, morale: +3 })
          game.ap.cur = Math.max(0, game.ap.cur - 10)
          return { msg: '祈雨成礼，文化 +5 民心 +3' }
        }
      }
    ],
    lore: {
      title: '汉末灾异',
      text: '《后汉书·五行志》载灵帝光和元年(178)三月，京师大旱，民流亡道。汉人视灾异为天谴，常促君主下罪己诏。'
    }
  },
  {
    key: 'locust',
    type: 'disaster',
    icon: '🦗',
    title: '蝗虫蔽日',
    quote: '飞蝗蔽日，所过禾稼为之一空',
    desc: '蝗群自北方而来，铺天盖地。如不速治，仓廪将空。',
    weight: 10,
    choices: [
      {
        key: 'burn',
        label: '焚田驱蝗',
        desc: '以火攻之，损失部分粮草但保住田亩',
        run: (game) => {
          adj(game, { grain: -100, wood: -30, security: +2 })
          return { msg: '焚田驱蝗，粮草 -100 木材 -30' }
        }
      },
      {
        key: 'capture',
        label: '悬赏捕蝗',
        desc: '出铜钱悬赏百姓捕蝗，皆大欢喜',
        run: (game) => {
          adj(game, { coin: -150, morale: +5 })
          return { msg: '悬赏 150 铜钱，民心 +5' }
        }
      }
    ]
  },
  {
    key: 'fire',
    type: 'disaster',
    icon: '🔥',
    title: '城内失火',
    quote: '夜半火起，照彻半城',
    desc: '一处粮仓突起大火！城中百姓惊慌奔走。',
    weight: 12,
    condition: (game) => (game.governance.security || 0) < 70,
    choices: [
      {
        key: 'rescue',
        label: '调民救火',
        desc: '组织全民救火，损耗精力但保住粮仓',
        run: (game) => {
          adj(game, { grain: -50, morale: +4 })
          game.ap.cur = Math.max(0, game.ap.cur - 15)
          return { msg: '及时扑灭，损 50 粮草' }
        }
      },
      {
        key: 'leave',
        label: '听天由命',
        desc: '不救则失去大量粮草与民心',
        run: (game) => {
          adj(game, { grain: -200, morale: -8, security: -5 })
          return { msg: '粮仓焚毁，粮草 -200 民心 -8' }
        }
      }
    ],
    lore: {
      title: '坊市治安',
      text: '汉末城市以"鼓更"巡夜，由游徼、亭长执法；治安低下时偷盗与失火率显著上升，曹魏时即立"火禁"。'
    }
  },
  // ========== 盗匪类 ==========
  {
    key: 'bandits',
    type: 'crime',
    icon: '🗡️',
    title: '山贼劫商',
    quote: '黑山贼起，劫掠州县',
    desc: '一伙山贼袭击了城外商队，掳走铜钱与粮草。',
    weight: 10,
    condition: (game) => (game.governance.security || 0) < 60,
    choices: [
      {
        key: 'dispatch',
        label: '派将剿匪',
        desc: '出兵清剿，得声望但耗兵力',
        run: (game) => {
          adj(game, { soldier: -30, reputation: +5, security: +8 })
          return { msg: '剿匪成功，声望 +5 治安 +8' }
        }
      },
      {
        key: 'bribe',
        label: '破财消灾',
        desc: '献金请贼莫扰，息事宁人',
        run: (game) => {
          adj(game, { coin: -120, morale: -3 })
          return { msg: '献金 120，得片刻安宁' }
        }
      },
      {
        key: 'ignore',
        label: '坐视不理',
        desc: '不管，治安进一步恶化',
        run: (game) => {
          adj(game, { security: -8, commerce: -3 })
          return { msg: '商道不通，治安 -8 商业 -3' }
        }
      }
    ]
  },
  {
    key: 'theft',
    type: 'crime',
    icon: '🥷',
    title: '府库失窃',
    quote: '夜入府库，盗去金帛',
    desc: '内贼勾结外盗，从府库盗走铜钱若干。',
    weight: 8,
    condition: (game) => (game.governance.security || 0) < 50,
    choices: [
      {
        key: 'investigate',
        label: '严查内奸',
        desc: '彻查衙门，治安回升',
        run: (game) => {
          adj(game, { coin: -50, security: +10 })
          return { msg: '查处内奸，治安 +10' }
        }
      },
      {
        key: 'cover',
        label: '隐瞒不报',
        desc: '当作没发生，民心暗暗下降',
        run: (game) => {
          adj(game, { coin: -100, morale: -3 })
          return { msg: '不了了之，铜钱 -100' }
        }
      }
    ]
  },
  // ========== 外使类 ==========
  {
    key: 'qiangEnvoy',
    type: 'envoy',
    icon: '🐎',
    title: '羌使来朝',
    quote: '西羌遣使，奉马百匹',
    desc: '西羌族遣使来朝，献上骏马一队，欲与我结好。',
    weight: 8,
    choices: [
      {
        key: 'welcome',
        label: '隆重接见',
        desc: '盛宴款待，得兵力与声望',
        run: (game) => {
          adj(game, { coin: -100, soldier: +50, reputation: +8, culture: +3 })
          return { msg: '羌马入营，兵力 +50 声望 +8' }
        }
      },
      {
        key: 'refuse',
        label: '拒之门外',
        desc: '羌使不悦，结下宿怨',
        run: (game) => {
          adj(game, { reputation: -3, security: -5 })
          return { msg: '羌使悻悻而去，治安 -5' }
        }
      }
    ],
    lore: {
      title: '汉末羌患',
      text: '东汉羌乱百余年，凉州十室九空；马腾、韩遂皆借羌势割据，董卓亦以并州羌胡兵骄横朝堂。'
    }
  },
  {
    key: 'merchant',
    type: 'envoy',
    icon: '💼',
    title: '巨贾求见',
    quote: '糜竺巨富，举家相投',
    desc: '一位巨富商人来到府衙，欲投资本城商业。',
    weight: 9,
    choices: [
      {
        key: 'accept',
        label: '欣然接纳',
        desc: '得铜钱与商业值',
        run: (game) => {
          adj(game, { coin: +300, commerce: +10 })
          return { msg: '铜钱 +300 商业 +10' }
        }
      },
      {
        key: 'tax',
        label: '加征商税',
        desc: '直接强征，得更多铜钱但商业骤降',
        run: (game) => {
          adj(game, { coin: +500, commerce: -15, morale: -3 })
          return { msg: '强征铜钱 +500 商业 -15' }
        }
      }
    ]
  },
  // ========== 集市类 ==========
  {
    key: 'fair',
    type: 'market',
    icon: '🎪',
    title: '春日集市',
    quote: '四方商旅，云集郡治',
    desc: '春日集市开张，珍奇货物云集，主公可亲临采买。',
    weight: 9,
    choices: [
      {
        key: 'buyGrain',
        label: '收购粮草',
        desc: '600 铜钱换 300 粮草',
        run: (game) => {
          if (game.resources.coin < 600) return { msg: '铜钱不足' }
          adj(game, { coin: -600, grain: +300 })
          return { msg: '采得粮草 +300' }
        }
      },
      {
        key: 'buyJade',
        label: '购买玉石',
        desc: '800 铜钱换 1 块玉石碎片',
        run: (game) => {
          if (game.resources.coin < 800) return { msg: '铜钱不足' }
          adj(game, { coin: -800, jadeShard: +1 })
          return { msg: '玉石碎片 +1' }
        }
      },
      {
        key: 'sellWood',
        label: '出售木材',
        desc: '200 木材换 320 铜钱',
        run: (game) => {
          if (game.resources.wood < 200) return { msg: '木材不足' }
          adj(game, { wood: -200, coin: +320 })
          return { msg: '售木得铜钱 +320' }
        }
      }
    ]
  },
  // ========== 风物/逸闻 ==========
  {
    key: 'goodHarvest',
    type: 'culture',
    icon: '🌾',
    title: '岁丰登饶',
    quote: '岁登民丰，颂声在野',
    desc: '风调雨顺，今岁大丰收，百姓欢腾。',
    weight: 6,
    condition: (game) => game.policy.morale > 70,
    choices: [
      {
        key: 'celebrate',
        label: '举办庆典',
        desc: '与民同乐，多方提升',
        run: (game) => {
          adj(game, { coin: -100, morale: +6, culture: +5, grain: +200 })
          return { msg: '盛事告成：民心 +6 文化 +5' }
        }
      }
    ]
  },
  {
    key: 'wiseHermit',
    type: 'culture',
    icon: '🧙',
    title: '隐士现踪',
    quote: '南阳卧龙，未出茅庐',
    desc: '探子来报，附近山中有隐士贤者出没。',
    weight: 7,
    choices: [
      {
        key: 'visit',
        label: '三顾茅庐',
        desc: '亲自求贤，得声望与文化',
        run: (game) => {
          adj(game, { reputation: +5, culture: +6 })
          game.ap.cur = Math.max(0, game.ap.cur - 12)
          return { msg: '诚意感动隐士，声望 +5 文化 +6' }
        }
      },
      {
        key: 'send',
        label: '遣使邀请',
        desc: '派使代请，效果一般',
        run: (game) => {
          adj(game, { reputation: +2, culture: +2 })
          return { msg: '隐士勉强应诺' }
        }
      },
      {
        key: 'ignore',
        label: '不予理会',
        desc: '错失贤才',
        run: () => ({ msg: '隐士飘然远去' })
      }
    ]
  },
  // ========== 历史大事件 ==========
  {
    key: 'yellowTurban',
    type: 'history',
    icon: '🟡',
    title: '黄巾余党',
    quote: '苍天已死，黄天当立',
    desc: '黄巾残党流窜至境内，号召贫民起事。',
    weight: 5,
    choices: [
      {
        key: 'crush',
        label: '出兵镇压',
        desc: '武力解决，声望大涨但损耗',
        run: (game) => {
          adj(game, { soldier: -60, coin: -100, reputation: +10, security: +12 })
          return { msg: '平乱告捷，声望 +10 治安 +12' }
        }
      },
      {
        key: 'pacify',
        label: '招安收编',
        desc: '收为己用，得兵力但伤治安',
        run: (game) => {
          adj(game, { grain: -120, soldier: +80, security: -5 })
          return { msg: '收编得兵 +80' }
        }
      }
    ],
    lore: {
      title: '黄巾起义',
      text: '中平元年(184)张角兄弟以太平道起事，连陷青、徐、幽、冀、荆、扬七州，三国乱世由此发端。'
    }
  },
  {
    key: 'imperialEdict',
    type: 'history',
    icon: '📜',
    title: '汉帝诏书',
    quote: '奉天子以令不臣',
    desc: '汉帝遣使持节而来，诏令主公进献粮草以资王室。',
    weight: 6,
    choices: [
      {
        key: 'comply',
        label: '奉诏进献',
        desc: '尊奉朝廷，得大量声望',
        run: (game) => {
          adj(game, { grain: -150, coin: -100, reputation: +15, culture: +5 })
          return { msg: '声望 +15 文化 +5' }
        }
      },
      {
        key: 'refuse',
        label: '托词推辞',
        desc: '不奉诏，朝野侧目',
        run: (game) => {
          adj(game, { reputation: -8, morale: -3 })
          return { msg: '失天下口实，声望 -8' }
        }
      }
    ],
    lore: {
      title: '挟天子以令诸侯',
      text: '建安元年(196)曹操迎汉献帝都许，从此号令诸侯名正言顺，此为荀彧"奉主上以从民望"之策。'
    }
  }
]

export const EVENT_MAP = EVENTS.reduce((m, e) => {
  m[e.key] = e
  return m
}, {})

/** 按权重随机抽取一条可触发的事件 */
export function rollEvent(game) {
  const pool = EVENTS.filter((e) => !e.condition || e.condition(game))
  if (pool.length === 0) return null
  const totalW = pool.reduce((s, e) => s + (e.weight || 10), 0)
  let r = Math.random() * totalW
  for (const e of pool) {
    const w = e.weight || 10
    if (r < w) return e
    r -= w
  }
  return pool[0]
}

export default EVENTS
