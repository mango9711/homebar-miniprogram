import type { Category } from '@/types'

export const CATS: Category[] = [
  {
    id: 'base',
    name: '基酒',
    hint: '烈酒底子，决定酒感',
    items: [
      ['vodka', '伏特加'], ['gin', '金酒'], ['white_rum', '白朗姆酒'],
      ['dark_rum', '黑朗姆酒'], ['tequila', '龙舌兰'], ['whiskey', '威士忌'],
      ['brandy', '白兰地'], ['baijiu', '白酒'], ['wine', '葡萄酒'],
      ['prosecco', '起泡葡萄酒']
    ]
  },
  {
    id: 'liqueur',
    name: '利口酒',
    hint: '负责风味与甜香',
    items: [
      ['cointreau', '橙味利口酒（君度）'], ['campari', '金巴利'],
      ['aperol', '阿佩罗'], ['sweet_vermouth', '甜苦艾酒'],
      ['dry_vermouth', '干苦艾酒'], ['kahlua', '咖啡利口酒'],
      ['baileys', '奶油利口酒（百利甜）'], ['malibu', '椰子利口酒'],
      ['peach', '水蜜桃利口酒'], ['amaretto', '杏仁利口酒'],
      ['blue_curacao', '蓝橙利口酒']
    ]
  },
  {
    id: 'syrup',
    name: '糖浆 / 甜味',
    hint: '平衡酸甜的关键',
    items: [
      ['simple', '单糖浆'], ['grenadine', '红石榴糖浆'], ['honey', '蜂蜜'],
      ['elderflower', '接骨木花风味糖浆'], ['passionfruit', '百香果风味糖浆']
    ]
  },
  {
    id: 'mixer',
    name: '果汁 · 软饮',
    hint: '调配口感与气泡',
    items: [
      ['lemon', '柠檬汁'], ['lime', '青柠汁'], ['orange', '橙汁'],
      ['cranberry', '蔓越莓汁'], ['pineapple', '菠萝汁'],
      ['grapefruit', '西柚汁'], ['cola', '可乐'], ['ginger_ale', '干姜水'],
      ['tonic', '汤力水'], ['soda', '苏打水'], ['coconut', '椰奶'],
      ['cream', '淡奶油 / 牛奶']
    ]
  },
  {
    id: 'extra',
    name: '新鲜配料',
    hint: '提香装饰',
    items: [
      ['mint', '新鲜薄荷叶'], ['lemon_fresh', '新鲜柠檬（果片 / 果皮）']
    ]
  }
]

export const CATEGORY_IDS = CATS.map((c) => c.id)

/** 内置原料 id → 中文名 */
export const BUILTIN_NAME: Record<string, string> = {}
CATS.forEach((c) => {
  c.items.forEach(([id, name]) => {
    BUILTIN_NAME[id] = name
  })
})

/** 一键填入的「常见家庭酒柜」 */
export const DEMO_IDS = [
  'vodka', 'gin', 'white_rum', 'dark_rum', 'tequila', 'whiskey',
  'cointreau', 'kahlua', 'simple', 'grenadine', 'lime', 'lemon',
  'orange', 'cranberry', 'pineapple', 'cola', 'ginger_ale', 'tonic',
  'soda', 'mint'
]

export const STRENGTH_LABELS = [
  '无酒精 · 畅饮',
  '低度 · 小酌',
  '中度 · 微醺',
  '高度 · 浓烈'
]

/** 合并内置名 + 自定义原料名 */
export function makeName(
  custom: Record<string, Array<[string, string]>>
): Record<string, string> {
  const map: Record<string, string> = { ...BUILTIN_NAME }
  CATEGORY_IDS.forEach((cat) => {
    (custom[cat] || []).forEach(([id, name]) => {
      if (id && name) map[id] = name
    })
  })
  return map
}

export function newCustomId(cat: string): string {
  const rand = Math.floor(Math.random() * 1e6).toString(36)
  return `cu_${cat}_${Date.now().toString(36)}_${rand}`
}

export function isCustomId(id: string): boolean {
  return id.indexOf('cu_') === 0
}
