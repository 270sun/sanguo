export const FACTIONS = {
  player:    { key: 'player',   name: '主公',   shortName: '我',   color: '#e9b14a', isPlayer: true },
  bandits:   { key: 'bandits',  name: '黄巾余党', shortName: '黄巾', color: '#7d8a4a' },
  caocao:    { key: 'caocao',   name: '曹操',   shortName: '曹',   color: '#5a6f9c' },
  liubei:    { key: 'liubei',   name: '刘备',   shortName: '刘',   color: '#86c46b' },
  sunce:     { key: 'sunce',    name: '孙策',   shortName: '孙',   color: '#3aa6a0' },
  yuanshao:  { key: 'yuanshao', name: '袁绍',   shortName: '袁',   color: '#a55d8a' },
  lvbu:      { key: 'lvbu',     name: '吕布',   shortName: '吕',   color: '#a83a2e' }
}

export const INITIAL_WORLD = {
  luoyang:   { owner: 'player',   power: 0   },
  yuzhou:    { owner: 'bandits',  power: 150 },
  yanzhou:   { owner: 'caocao',   power: 180 },
  qingzhou:  { owner: 'bandits',  power: 170 },
  jizhou:    { owner: 'yuanshao', power: 320 },
  xuzhou:    { owner: 'bandits',  power: 200 },
  jingzhou:  { owner: 'liubei',   power: 260 },
  yangzhou:  { owner: 'sunce',    power: 280 },
  youzhou:   { owner: 'yuanshao', power: 240 },
  bingzhou:  { owner: 'lvbu',     power: 300 },
  liangzhou: { owner: 'bandits',  power: 220 },
  yizhou:    { owner: 'liubei',   power: 260 },
  jiaozhou:  { owner: 'bandits',  power: 180 }
}

export const FACTION_AI = {
  caocao:    { aggression: 0.55, prefers: ['yanzhou', 'yuzhou', 'xuzhou', 'qingzhou'] },
  liubei:    { aggression: 0.35, prefers: ['jingzhou', 'yizhou', 'yuzhou'] },
  sunce:     { aggression: 0.45, prefers: ['yangzhou', 'jingzhou', 'jiaozhou'] },
  yuanshao:  { aggression: 0.50, prefers: ['jizhou', 'youzhou', 'bingzhou'] },
  lvbu:      { aggression: 0.65, prefers: ['bingzhou', 'yanzhou', 'xuzhou'] },
  bandits:   { aggression: 0.10, prefers: [] }
}

export function ownerOf(world, id) {
  return (world && world[id] && world[id].owner) || 'bandits'
}

export function factionOf(key) {
  return FACTIONS[key] || FACTIONS.bandits
}

export function isPlayerOwned(world, id) {
  return ownerOf(world, id) === 'player'
}

const NEIGHBORS = {
  luoyang:   ['yuzhou', 'yanzhou', 'jizhou', 'bingzhou'],
  yuzhou:    ['luoyang', 'yanzhou', 'jingzhou', 'xuzhou'],
  yanzhou:   ['luoyang', 'yuzhou', 'jizhou', 'qingzhou', 'xuzhou'],
  qingzhou:  ['yanzhou', 'jizhou', 'xuzhou'],
  jizhou:    ['luoyang', 'yanzhou', 'qingzhou', 'youzhou', 'bingzhou'],
  xuzhou:    ['yuzhou', 'yanzhou', 'qingzhou', 'yangzhou'],
  jingzhou:  ['yuzhou', 'yizhou', 'yangzhou', 'jiaozhou'],
  yangzhou:  ['xuzhou', 'jingzhou', 'jiaozhou'],
  youzhou:   ['jizhou', 'bingzhou'],
  bingzhou:  ['luoyang', 'jizhou', 'youzhou', 'liangzhou'],
  liangzhou: ['bingzhou', 'yizhou'],
  yizhou:    ['jingzhou', 'liangzhou'],
  jiaozhou:  ['jingzhou', 'yangzhou']
}

export function neighborsOf(id) {
  return NEIGHBORS[id] || []
}
