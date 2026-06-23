/**
 * 武将卡池（约 100 人，覆盖魏蜀吴汉群五势力，按品质分层）
 * quality: common(平民/灰) / rare(良将/蓝) / epic(名将/紫) / legend(神将/金)
 * faction: wei(魏) / shu(蜀) / wu(吴) / han(汉) / qun(群)
 * stats: { wu 武力 / wen 智谋 / tong 统率 }
 * skill: { name, desc, taskBonus: {grain/coin/wood/soldier} }  (任务时额外倍率加成)
 *
 * 设计原则：
 *  - id 与 bonds.js 中的引用保持兼容（lvbu/zhuge/guanyu/zhaoyun/zhangfei/dianwei/sima/zhouyu/lusu/wangping/caoren/chenggong 均保留）
 *  - 每个武将的 stats 大致与三国志正史/演义中的形象呼应
 *  - skill.taskBonus 与 TASKS 的 resKey 对齐（grain/coin/wood/soldier/_all）
 */

const S = (wu, wen, tong) => ({ wu, wen, tong })

export const HERO_POOL = [
  // ============ 神将 legend（10 人，约 1.5% 每张） ============
  { id: 'lvbu',     name: '吕布',   quality: 'legend', faction: 'qun', stats: S(99, 25, 75), skill: { name: '飞将无双', desc: '练兵效率 ×3', taskBonus: { soldier: 3 } } },
  { id: 'zhuge',    name: '诸葛亮', quality: 'legend', faction: 'shu', stats: S(38, 99, 92), skill: { name: '卧龙运筹', desc: '所有任务产出 ×1.5', taskBonus: { _all: 1.5 } } },
  { id: 'caocao',   name: '曹操',   quality: 'legend', faction: 'wei', stats: S(78, 96, 95), skill: { name: '乱世枭雄', desc: '所有任务产出 ×1.4', taskBonus: { _all: 1.4 } } },
  { id: 'liubei',   name: '刘备',   quality: 'legend', faction: 'shu', stats: S(70, 85, 96), skill: { name: '仁德布野', desc: '巡查铜钱 ×2.4', taskBonus: { coin: 2.4 } } },
  { id: 'sunce',    name: '孙策',   quality: 'legend', faction: 'wu',  stats: S(94, 70, 88), skill: { name: '小霸王', desc: '练兵 ×2.4', taskBonus: { soldier: 2.4 } } },
  { id: 'zhouyu',   name: '周瑜',   quality: 'legend', faction: 'wu',  stats: S(78, 95, 89), skill: { name: '美周郎', desc: '巡查铜钱 ×2.2', taskBonus: { coin: 2.2 } } },
  { id: 'sima',     name: '司马懿', quality: 'legend', faction: 'wei', stats: S(60, 96, 91), skill: { name: '鹰视狼顾', desc: '屯田粮草 ×2.0', taskBonus: { grain: 2.0 } } },
  { id: 'guanyu',   name: '关羽',   quality: 'legend', faction: 'shu', stats: S(96, 75, 90), skill: { name: '武圣镇威', desc: '练兵效率 ×2.2', taskBonus: { soldier: 2.2 } } },
  { id: 'zhaoyun',  name: '赵云',   quality: 'legend', faction: 'shu', stats: S(95, 76, 88), skill: { name: '常胜将军', desc: '巡查铜钱 ×2.0', taskBonus: { coin: 2.0 } } },
  { id: 'guojia',   name: '郭嘉',   quality: 'legend', faction: 'wei', stats: S(40, 97, 76), skill: { name: '鬼才奇策', desc: '屯田粮草 ×1.8', taskBonus: { grain: 1.8 } } },

  // ============ 名将 epic（24 人，约 7% 各张） ============
  { id: 'zhangfei', name: '张飞',   quality: 'epic',   faction: 'shu', stats: S(95, 45, 78), skill: { name: '燕人喝', desc: '练兵 ×1.8', taskBonus: { soldier: 1.8 } } },
  { id: 'machao',   name: '马超',   quality: 'epic',   faction: 'shu', stats: S(94, 50, 80), skill: { name: '锦马超', desc: '练兵 ×1.7', taskBonus: { soldier: 1.7 } } },
  { id: 'huangzhong', name: '黄忠', quality: 'epic',   faction: 'shu', stats: S(92, 55, 82), skill: { name: '老当益壮', desc: '巡查铜钱 ×1.6', taskBonus: { coin: 1.6 } } },
  { id: 'weiyan',   name: '魏延',   quality: 'epic',   faction: 'shu', stats: S(89, 65, 80), skill: { name: '反骨之相', desc: '练兵 ×1.6', taskBonus: { soldier: 1.6 } } },
  { id: 'jiangwei', name: '姜维',   quality: 'epic',   faction: 'shu', stats: S(88, 90, 85), skill: { name: '继志北伐', desc: '所有任务产出 ×1.3', taskBonus: { _all: 1.3 } } },
  { id: 'pangtong', name: '庞统',   quality: 'epic',   faction: 'shu', stats: S(35, 95, 80), skill: { name: '凤雏论道', desc: '屯田粮草 ×1.7', taskBonus: { grain: 1.7 } } },
  { id: 'fazheng',  name: '法正',   quality: 'epic',   faction: 'shu', stats: S(40, 92, 78), skill: { name: '奇谋取蜀', desc: '巡查铜钱 ×1.7', taskBonus: { coin: 1.7 } } },
  { id: 'dianwei',  name: '典韦',   quality: 'epic',   faction: 'wei', stats: S(94, 35, 70), skill: { name: '古之恶来', desc: '练兵 ×1.7', taskBonus: { soldier: 1.7 } } },
  { id: 'xuchu',    name: '许褚',   quality: 'epic',   faction: 'wei', stats: S(93, 30, 72), skill: { name: '虎痴', desc: '练兵 ×1.6', taskBonus: { soldier: 1.6 } } },
  { id: 'xiahoudun',name: '夏侯惇', quality: 'epic',   faction: 'wei', stats: S(90, 60, 85), skill: { name: '独眼苍狼', desc: '伐木 ×1.6', taskBonus: { wood: 1.6 } } },
  { id: 'xiahouyuan', name: '夏侯渊', quality: 'epic', faction: 'wei', stats: S(89, 58, 83), skill: { name: '神速妙才', desc: '练兵 ×1.6', taskBonus: { soldier: 1.6 } } },
  { id: 'zhangliao',name: '张辽',   quality: 'epic',   faction: 'wei', stats: S(91, 78, 88), skill: { name: '威震逍遥', desc: '练兵 ×1.7', taskBonus: { soldier: 1.7 } } },
  { id: 'zhanghe',  name: '张郃',   quality: 'epic',   faction: 'wei', stats: S(88, 70, 82), skill: { name: '巧变之将', desc: '巡查铜钱 ×1.5', taskBonus: { coin: 1.5 } } },
  { id: 'xuhuang',  name: '徐晃',   quality: 'epic',   faction: 'wei', stats: S(89, 70, 84), skill: { name: '周亚夫风', desc: '屯田粮草 ×1.5', taskBonus: { grain: 1.5 } } },
  { id: 'xunyu',    name: '荀彧',   quality: 'epic',   faction: 'wei', stats: S(35, 95, 80), skill: { name: '王佐之才', desc: '屯田粮草 ×1.7', taskBonus: { grain: 1.7 } } },
  { id: 'jiaxu',    name: '贾诩',   quality: 'epic',   faction: 'wei', stats: S(38, 94, 75), skill: { name: '毒士算计', desc: '巡查铜钱 ×1.7', taskBonus: { coin: 1.7 } } },
  { id: 'taishici', name: '太史慈', quality: 'epic',   faction: 'wu',  stats: S(91, 60, 82), skill: { name: '神亭酣斗', desc: '练兵 ×1.6', taskBonus: { soldier: 1.6 } } },
  { id: 'ganning',  name: '甘宁',   quality: 'epic',   faction: 'wu',  stats: S(90, 55, 78), skill: { name: '锦帆贼', desc: '巡查铜钱 ×1.6', taskBonus: { coin: 1.6 } } },
  { id: 'lvmeng',   name: '吕蒙',   quality: 'epic',   faction: 'wu',  stats: S(85, 86, 85), skill: { name: '士别三日', desc: '所有任务产出 ×1.2', taskBonus: { _all: 1.2 } } },
  { id: 'luxun',    name: '陆逊',   quality: 'epic',   faction: 'wu',  stats: S(70, 93, 88), skill: { name: '夷陵烈火', desc: '屯田粮草 ×1.7', taskBonus: { grain: 1.7 } } },
  { id: 'huanggai', name: '黄盖',   quality: 'epic',   faction: 'wu',  stats: S(85, 60, 80), skill: { name: '苦肉献策', desc: '伐木 ×1.7', taskBonus: { wood: 1.7 } } },
  { id: 'zhouyu_jr',name: '小乔',   quality: 'epic',   faction: 'wu',  stats: S(30, 80, 50), skill: { name: '江东双姝', desc: '巡查铜钱 ×1.5', taskBonus: { coin: 1.5 } } },
  { id: 'huatuo',   name: '华佗',   quality: 'epic',   faction: 'qun', stats: S(25, 90, 60), skill: { name: '神医妙手', desc: '所有任务产出 ×1.15', taskBonus: { _all: 1.15 } } },
  { id: 'diaochan', name: '貂蝉',   quality: 'epic',   faction: 'han', stats: S(30, 88, 55), skill: { name: '连环计', desc: '巡查铜钱 ×1.8', taskBonus: { coin: 1.8 } } },

  // ============ 良将 rare（30 人，约 20% 共享） ============
  { id: 'guanping', name: '关平',   quality: 'rare',   faction: 'shu', stats: S(82, 60, 76), skill: { name: '忠勇随父', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'liaohua',  name: '廖化',   quality: 'rare',   faction: 'shu', stats: S(75, 60, 72), skill: { name: '蜀中无大将', desc: '屯田 ×1.4', taskBonus: { grain: 1.4 } } },
  { id: 'mengda',   name: '孟达',   quality: 'rare',   faction: 'shu', stats: S(76, 75, 70), skill: { name: '叛降之徒', desc: '巡查 ×1.4', taskBonus: { coin: 1.4 } } },
  { id: 'majiale',  name: '马岱',   quality: 'rare',   faction: 'shu', stats: S(82, 65, 72), skill: { name: '斩魏延', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'wangping', name: '王平',   quality: 'rare',   faction: 'shu', stats: S(80, 68, 78), skill: { name: '识地利', desc: '伐木 ×1.5', taskBonus: { wood: 1.5 } } },
  { id: 'jianyong', name: '简雍',   quality: 'rare',   faction: 'shu', stats: S(35, 80, 60), skill: { name: '说客之能', desc: '巡查 ×1.4', taskBonus: { coin: 1.4 } } },
  { id: 'sunqian',  name: '孙乾',   quality: 'rare',   faction: 'shu', stats: S(40, 78, 62), skill: { name: '外交无双', desc: '屯田 ×1.3', taskBonus: { grain: 1.3 } } },
  { id: 'caoren',   name: '曹仁',   quality: 'rare',   faction: 'wei', stats: S(82, 68, 86), skill: { name: '守城之将', desc: '屯田粮草 ×1.5', taskBonus: { grain: 1.5 } } },
  { id: 'caohong',  name: '曹洪',   quality: 'rare',   faction: 'wei', stats: S(78, 60, 75), skill: { name: '舍命救主', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'caoxiu',   name: '曹休',   quality: 'rare',   faction: 'wei', stats: S(80, 70, 78), skill: { name: '千里驹', desc: '练兵 ×1.3', taskBonus: { soldier: 1.3 } } },
  { id: 'lidian',   name: '李典',   quality: 'rare',   faction: 'wei', stats: S(76, 75, 74), skill: { name: '雅好书生', desc: '巡查 ×1.4', taskBonus: { coin: 1.4 } } },
  { id: 'yujin',    name: '于禁',   quality: 'rare',   faction: 'wei', stats: S(82, 65, 80), skill: { name: '法不容情', desc: '屯田 ×1.4', taskBonus: { grain: 1.4 } } },
  { id: 'yueyi',    name: '乐进',   quality: 'rare',   faction: 'wei', stats: S(80, 60, 72), skill: { name: '先登破阵', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'mancong',  name: '满宠',   quality: 'rare',   faction: 'wei', stats: S(65, 80, 76), skill: { name: '执法峻急', desc: '巡查 ×1.5', taskBonus: { coin: 1.5 } } },
  { id: 'chenggong',name: '程昱',   quality: 'rare',   faction: 'wei', stats: S(40, 84, 70), skill: { name: '智深险绝', desc: '屯田 ×1.5', taskBonus: { grain: 1.5 } } },
  { id: 'liushaoshou',name: '刘晔', quality: 'rare',   faction: 'wei', stats: S(40, 82, 65), skill: { name: '宗室军师', desc: '伐木 ×1.5', taskBonus: { wood: 1.5 } } },
  { id: 'lusu',     name: '鲁肃',   quality: 'rare',   faction: 'wu',  stats: S(50, 88, 80), skill: { name: '榻上策', desc: '屯田粮草 ×1.5', taskBonus: { grain: 1.5 } } },
  { id: 'zhouyou',  name: '周泰',   quality: 'rare',   faction: 'wu',  stats: S(85, 50, 75), skill: { name: '满身刀痕', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'chengpu',  name: '程普',   quality: 'rare',   faction: 'wu',  stats: S(80, 70, 80), skill: { name: '江表虎臣', desc: '巡查 ×1.3', taskBonus: { coin: 1.3 } } },
  { id: 'hanke',    name: '韩当',   quality: 'rare',   faction: 'wu',  stats: S(78, 60, 74), skill: { name: '老成持重', desc: '屯田 ×1.4', taskBonus: { grain: 1.4 } } },
  { id: 'jiangqin', name: '蒋钦',   quality: 'rare',   faction: 'wu',  stats: S(76, 60, 70), skill: { name: '水军督', desc: '伐木 ×1.4', taskBonus: { wood: 1.4 } } },
  { id: 'dingfeng', name: '丁奉',   quality: 'rare',   faction: 'wu',  stats: S(82, 70, 78), skill: { name: '雪中奋短兵', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'xushen',   name: '徐盛',   quality: 'rare',   faction: 'wu',  stats: S(80, 65, 76), skill: { name: '雄毅善守', desc: '伐木 ×1.4', taskBonus: { wood: 1.4 } } },
  { id: 'zhugejin', name: '诸葛瑾', quality: 'rare',   faction: 'wu',  stats: S(35, 82, 70), skill: { name: '兄弟分仕', desc: '屯田 ×1.5', taskBonus: { grain: 1.5 } } },
  { id: 'panzhang', name: '潘璋',   quality: 'rare',   faction: 'wu',  stats: S(81, 50, 70), skill: { name: '擒关羽', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'huaxiong', name: '华雄',   quality: 'rare',   faction: 'qun', stats: S(88, 30, 65), skill: { name: '凉州悍将', desc: '练兵 ×1.5', taskBonus: { soldier: 1.5 } } },
  { id: 'yanliang', name: '颜良',   quality: 'rare',   faction: 'qun', stats: S(90, 35, 68), skill: { name: '河北名将', desc: '练兵 ×1.5', taskBonus: { soldier: 1.5 } } },
  { id: 'wenchou',  name: '文丑',   quality: 'rare',   faction: 'qun', stats: S(89, 36, 67), skill: { name: '河北双雄', desc: '练兵 ×1.5', taskBonus: { soldier: 1.5 } } },
  { id: 'yuanshao', name: '袁绍',   quality: 'rare',   faction: 'qun', stats: S(60, 70, 80), skill: { name: '四世三公', desc: '巡查 ×1.5', taskBonus: { coin: 1.5 } } },
  { id: 'dongzhuo', name: '董卓',   quality: 'rare',   faction: 'qun', stats: S(85, 50, 72), skill: { name: '虎狼之心', desc: '巡查 ×1.6', taskBonus: { coin: 1.6 } } },

  // ============ 平民 common（36 人，约 60% 共享） ============
  { id: 'liubang',   name: '刘琦',   quality: 'common', faction: 'shu', stats: S(40, 55, 50), skill: { name: '上屋抽梯', desc: '屯田 ×1.2', taskBonus: { grain: 1.2 } } },
  { id: 'mizhu',     name: '糜竺',   quality: 'common', faction: 'shu', stats: S(35, 70, 60), skill: { name: '徐州富商', desc: '巡查 ×1.3', taskBonus: { coin: 1.3 } } },
  { id: 'wuyi',      name: '吴懿',   quality: 'common', faction: 'shu', stats: S(75, 60, 72), skill: { name: '蜀地宗室', desc: '练兵 ×1.2', taskBonus: { soldier: 1.2 } } },
  { id: 'fuxi',      name: '伏羲老兵', quality: 'common', faction: 'shu', stats: S(60, 50, 55), skill: { name: '老卒', desc: '屯田 ×1.15', taskBonus: { grain: 1.15 } } },
  { id: 'zhangyi',   name: '张翼',   quality: 'common', faction: 'shu', stats: S(72, 60, 70), skill: { name: '蜀汉宿将', desc: '伐木 ×1.2', taskBonus: { wood: 1.2 } } },
  { id: 'zhangni',   name: '张嶷',   quality: 'common', faction: 'shu', stats: S(74, 65, 70), skill: { name: '南中威望', desc: '练兵 ×1.2', taskBonus: { soldier: 1.2 } } },
  { id: 'mafu',      name: '马忠',   quality: 'common', faction: 'shu', stats: S(70, 60, 68), skill: { name: '镇南将军', desc: '屯田 ×1.2', taskBonus: { grain: 1.2 } } },
  { id: 'lufeng',    name: '吕凯',   quality: 'common', faction: 'shu', stats: S(50, 70, 60), skill: { name: '南中地图', desc: '伐木 ×1.3', taskBonus: { wood: 1.3 } } },
  { id: 'liyan',     name: '李严',   quality: 'common', faction: 'shu', stats: S(70, 75, 72), skill: { name: '托孤大臣', desc: '屯田 ×1.3', taskBonus: { grain: 1.3 } } },
  { id: 'gaoxiang',  name: '高翔',   quality: 'common', faction: 'shu', stats: S(68, 55, 62), skill: { name: '老将', desc: '练兵 ×1.15', taskBonus: { soldier: 1.15 } } },
  { id: 'mengyou',   name: '孟优',   quality: 'common', faction: 'shu', stats: S(65, 45, 58), skill: { name: '南蛮副帅', desc: '伐木 ×1.2', taskBonus: { wood: 1.2 } } },
  { id: 'caorenmin', name: '曹植',   quality: 'common', faction: 'wei', stats: S(40, 70, 50), skill: { name: '七步成诗', desc: '巡查 ×1.2', taskBonus: { coin: 1.2 } } },
  { id: 'caopi',     name: '曹丕',   quality: 'common', faction: 'wei', stats: S(60, 80, 75), skill: { name: '魏文帝', desc: '巡查 ×1.4', taskBonus: { coin: 1.4 } } },
  { id: 'caozhang',  name: '曹彰',   quality: 'common', faction: 'wei', stats: S(85, 45, 70), skill: { name: '黄须儿', desc: '练兵 ×1.3', taskBonus: { soldier: 1.3 } } },
  { id: 'caozhen',   name: '曹真',   quality: 'common', faction: 'wei', stats: S(75, 65, 78), skill: { name: '大司马', desc: '屯田 ×1.3', taskBonus: { grain: 1.3 } } },
  { id: 'simashi',   name: '司马师', quality: 'common', faction: 'wei', stats: S(70, 85, 80), skill: { name: '冷血之主', desc: '巡查 ×1.4', taskBonus: { coin: 1.4 } } },
  { id: 'simazhao',  name: '司马昭', quality: 'common', faction: 'wei', stats: S(72, 84, 80), skill: { name: '司马昭之心', desc: '巡查 ×1.4', taskBonus: { coin: 1.4 } } },
  { id: 'zhongyao',  name: '钟繇',   quality: 'common', faction: 'wei', stats: S(35, 80, 65), skill: { name: '楷书之祖', desc: '屯田 ×1.2', taskBonus: { grain: 1.2 } } },
  { id: 'wangxiang', name: '王朗',   quality: 'common', faction: 'wei', stats: S(30, 78, 60), skill: { name: '司徒高论', desc: '巡查 ×1.2', taskBonus: { coin: 1.2 } } },
  { id: 'maojie',    name: '毛玠',   quality: 'common', faction: 'wei', stats: S(40, 75, 62), skill: { name: '清白持身', desc: '屯田 ×1.2', taskBonus: { grain: 1.2 } } },
  { id: 'sunquan',   name: '孙权',   quality: 'common', faction: 'wu',  stats: S(60, 82, 88), skill: { name: '碧眼儿', desc: '巡查 ×1.4', taskBonus: { coin: 1.4 } } },
  { id: 'sunjian',   name: '孙坚',   quality: 'common', faction: 'wu',  stats: S(86, 70, 84), skill: { name: '江东猛虎', desc: '练兵 ×1.4', taskBonus: { soldier: 1.4 } } },
  { id: 'sunshangxiang',name:'孙尚香',quality:'common', faction: 'wu',  stats: S(78, 60, 65), skill: { name: '弓腰姬', desc: '练兵 ×1.3', taskBonus: { soldier: 1.3 } } },
  { id: 'erqiao_da', name: '大乔',   quality: 'common', faction: 'wu',  stats: S(25, 70, 50), skill: { name: '江东国色', desc: '巡查 ×1.3', taskBonus: { coin: 1.3 } } },
  { id: 'zhanghong', name: '张昭',   quality: 'common', faction: 'wu',  stats: S(35, 82, 70), skill: { name: '吴国元勋', desc: '屯田 ×1.3', taskBonus: { grain: 1.3 } } },
  { id: 'zhanggu',   name: '张纮',   quality: 'common', faction: 'wu',  stats: S(40, 80, 68), skill: { name: '江东二张', desc: '屯田 ×1.2', taskBonus: { grain: 1.2 } } },
  { id: 'gulong',    name: '顾雍',   quality: 'common', faction: 'wu',  stats: S(35, 80, 70), skill: { name: '吴国名相', desc: '巡查 ×1.3', taskBonus: { coin: 1.3 } } },
  { id: 'zhuzhi',    name: '朱治',   quality: 'common', faction: 'wu',  stats: S(70, 65, 72), skill: { name: '吴郡太守', desc: '伐木 ×1.2', taskBonus: { wood: 1.2 } } },
  { id: 'zhuran',    name: '朱然',   quality: 'common', faction: 'wu',  stats: S(78, 70, 76), skill: { name: '江陵之守', desc: '练兵 ×1.2', taskBonus: { soldier: 1.2 } } },
  { id: 'lingong',   name: '凌统',   quality: 'common', faction: 'wu',  stats: S(80, 55, 70), skill: { name: '父仇宿将', desc: '练兵 ×1.3', taskBonus: { soldier: 1.3 } } },
  { id: 'huafa',     name: '华歆',   quality: 'common', faction: 'qun', stats: S(35, 75, 60), skill: { name: '管宁割席', desc: '巡查 ×1.2', taskBonus: { coin: 1.2 } } },
  { id: 'guanning',  name: '管宁',   quality: 'common', faction: 'qun', stats: S(30, 80, 55), skill: { name: '辽东高士', desc: '屯田 ×1.2', taskBonus: { grain: 1.2 } } },
  { id: 'zuoci',     name: '左慈',   quality: 'common', faction: 'qun', stats: S(40, 88, 50), skill: { name: '幻术老道', desc: '所有任务产出 ×1.1', taskBonus: { _all: 1.1 } } },
  { id: 'yujishi',   name: '于吉',   quality: 'common', faction: 'qun', stats: S(30, 85, 50), skill: { name: '太平道', desc: '屯田 ×1.3', taskBonus: { grain: 1.3 } } },
  { id: 'gongsunzan',name:'公孙瓒',  quality: 'common', faction: 'qun', stats: S(80, 60, 75), skill: { name: '白马将军', desc: '练兵 ×1.3', taskBonus: { soldier: 1.3 } } },
  { id: 'liuzhang',  name: '刘璋',   quality: 'common', faction: 'qun', stats: S(45, 50, 55), skill: { name: '益州牧', desc: '巡查 ×1.2', taskBonus: { coin: 1.2 } } }
]

export const QUALITY_META = {
  common: { label: '平',   color: '#9aa0a6', glow: 'rgba(154,160,166,.6)', weight: 60 },
  rare:   { label: '良',   color: '#4a90e2', glow: 'rgba(74,144,226,.65)', weight: 25 },
  epic:   { label: '名',   color: '#a35be5', glow: 'rgba(163,91,229,.75)', weight: 12 },
  legend: { label: '神',   color: '#d4af37', glow: 'rgba(212,175,55,.85)', weight: 3 }
}

export const FACTION_META = {
  wei: { label: '魏', color: '#3a5da0' },
  shu: { label: '蜀', color: '#7a1f1a' },
  wu:  { label: '吴', color: '#1f5d4a' },
  han: { label: '汉', color: '#b8862e' },
  qun: { label: '群', color: '#555' }
}

/** 任务定义：分配武将后每秒额外产出 baseGain * (1 + level*0.1) * skillMul */
export const TASKS = {
  patrol:  { key: 'patrol',  label: '巡查', resKey: 'coin',    baseGain: 0.6, desc: '驻防街市，每秒额外铜钱' },
  drill:   { key: 'drill',   label: '练兵', resKey: 'soldier', baseGain: 0.3, desc: '操演武备，每秒额外兵力' },
  farm:    { key: 'farm',    label: '屯田', resKey: 'grain',   baseGain: 0.8, desc: '亲耕劝农，每秒额外粮草' },
  logging: { key: 'logging', label: '伐木', resKey: 'wood',    baseGain: 0.5, desc: '督促林作，每秒额外木材' }
}

export const TASK_LIST = Object.values(TASKS)

/** 按品质权重从卡池随机抽 N 张（允许重复出现同名时下次刷新去重） */
export function rollHeroes(count = 3, excludeIds = []) {
  const totalWeight = Object.values(QUALITY_META).reduce((s, q) => s + q.weight, 0)
  const result = []
  const used = new Set(excludeIds)
  let safety = 80
  while (result.length < count && safety-- > 0) {
    let r = Math.random() * totalWeight
    let quality = 'common'
    for (const [k, v] of Object.entries(QUALITY_META)) {
      if (r < v.weight) { quality = k; break }
      r -= v.weight
    }
    const pool = HERO_POOL.filter((h) => h.quality === quality && !used.has(h.id))
    if (pool.length === 0) continue
    const pick = pool[Math.floor(Math.random() * pool.length)]
    used.add(pick.id)
    result.push({
      ...pick,
      avatar: pick.avatar || avatarOf(pick),
      rollId: pick.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      recruitCost: recruitCostOf(pick)
    })
  }
  return result
}

export function recruitCostOf(hero) {
  const base = { common: 1, rare: 3, epic: 8, legend: 20 }[hero.quality] || 1
  return {
    coin: 200 * base,
    grain: 100 * base,
    ap: { common: 5, rare: 10, epic: 18, legend: 30 }[hero.quality] || 5
  }
}

/**
 * 统一为所有武将派发 avatar 表情符号（保持视觉一致性）：
 *  - 文官（武力 < 50）：⚜
 *  - 女将（名字包含 乔/婵/姬/香 等）：✿
 *  - 神将（legend）：玄 ⚔
 *  - 其余武将：按势力主题分配（魏/蜀/吴/汉/群）
 * 不直接修改 HERO_POOL，由 findHero / rollHeroes 出口处注入。
 */
const FEMALE_HINTS = ['乔', '婵', '貂', '姬', '香']
function avatarOf(h) {
  if (!h) return '？'
  if (FEMALE_HINTS.some((c) => h.name && h.name.includes(c))) return '✿'
  if (h.stats && h.stats.wu < 50) return '⚜'
  if (h.quality === 'legend') return '⚔'
  const map = { wei: '🗡️', shu: '🏹', wu: '⚓', han: '👑', qun: '🐎' }
  return map[h.faction] || '🛡'
}
function withAvatar(h) {
  if (!h) return h
  return h.avatar ? h : { ...h, avatar: avatarOf(h) }
}

export function findHero(id) {
  const h = HERO_POOL.find((x) => x.id === id) || null
  return withAvatar(h)
}
