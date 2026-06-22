export const SEASONS = [
  {
    key: 'spring',
    label: '春',
    color: '#86c46b',
    rates: { grain: 1.10, coin: 1.00, wood: 1.05, soldier: 1.00 },
    powerMul: 1.00,
    eventBias: { good: 1.20, bad: 0.85 },
    flavor: '春耕之时，粮草丰收，万物复苏。'
  },
  {
    key: 'summer',
    label: '夏',
    color: '#e9b14a',
    rates: { grain: 1.00, coin: 1.15, wood: 1.00, soldier: 1.05 },
    powerMul: 1.05,
    eventBias: { good: 1.05, bad: 1.10 },
    flavor: '炎夏酷暑，商贾繁忙，亦多瘟疫。'
  },
  {
    key: 'autumn',
    label: '秋',
    color: '#c46b3e',
    rates: { grain: 1.25, coin: 1.05, wood: 1.10, soldier: 1.00 },
    powerMul: 1.10,
    eventBias: { good: 1.10, bad: 1.00 },
    flavor: '秋收时节，粮丰国强，正是用兵之机。'
  },
  {
    key: 'winter',
    label: '冬',
    color: '#7aa6c7',
    rates: { grain: 0.55, coin: 0.90, wood: 0.85, soldier: 0.80 },
    powerMul: 1.20,
    eventBias: { good: 0.85, bad: 1.25 },
    flavor: '严冬来袭，粮草消耗倍增，但将士同仇敌忾，战力大增。'
  }
]

export const SEASON_LEN_SEC = 5 * 60

export function seasonOfElapsed(totalSec) {
  const cycle = Math.floor(totalSec / SEASON_LEN_SEC)
  const idx = cycle % 4
  return SEASONS[idx]
}

export function seasonProgressOfElapsed(totalSec) {
  const inCur = totalSec % SEASON_LEN_SEC
  return Math.min(1, inCur / SEASON_LEN_SEC)
}

export function yearOfElapsed(totalSec) {
  return 184 + Math.floor(totalSec / (SEASON_LEN_SEC * 4))
}

export function dayOfElapsed(totalSec) {
  const inCycle = totalSec % SEASON_LEN_SEC
  return 1 + Math.floor((inCycle / SEASON_LEN_SEC) * 30)
}

export function buffSummary(season) {
  const parts = []
  for (const k of ['grain', 'coin', 'wood', 'soldier']) {
    const v = season.rates[k]
    if (v === 1) continue
    const sign = v > 1 ? '+' : ''
    const pct = Math.round((v - 1) * 100)
    const name = { grain: '粮', coin: '钱', wood: '木', soldier: '兵' }[k]
    parts.push(`${name}${sign}${pct}%`)
  }
  if (season.powerMul !== 1) {
    parts.push(`战力+${Math.round((season.powerMul - 1) * 100)}%`)
  }
  return parts.join(' · ')
}
