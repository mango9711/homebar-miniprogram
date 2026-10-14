/**
 * 推荐系统离线调试工具。
 *
 * 用多组 mock 数据跑 planGenerate，对比「冷启动 / 学到的画像 / 个性化排序」，
 * 方便在调整权重（K_TAG / BONUS_NOVEL / PENALTY_MADE …）时反复验证效果。
 *
 * 运行全部：   npm run rec:demo
 * 只跑一个：   npm run rec:demo -- 3
 * 列出用例：   npm run rec:demo -- --list
 * 查看决策日志：npm run rec:demo -- 3 --log=info   （--log=debug 看逐卡/逐材料）
 */
import { planGenerate } from '@/utils/bar'
import { buildTasteProfile, scoreTaste, mainBase } from '@/utils/taste'
import { setLogLevel } from '@/utils/logger'
import type { LogLevel } from '@/utils/logger'
import { RECIPES } from '@/data/recipes'
import { DEMO_IDS, makeName } from '@/data/categories'
import type { MadeRecord, Rating, Recipe, TasteProfile } from '@/types'

type Inv = Record<string, boolean>
type Custom = Record<string, Array<[string, string]>>

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 常见酒柜之外再补一批，凑成「家底厚」的酒柜 */
const FULL_EXTRA = [
  'campari', 'sweet_vermouth', 'dry_vermouth', 'prosecco', 'aperol',
  'elderflower', 'passionfruit', 'grapefruit', 'baileys', 'kahlua',
  'coconut', 'cream', 'honey', 'lemon_fresh', 'amaretto', 'peach',
  'blue_curacao', 'malibu', 'brandy', 'baijiu', 'wine'
]

const invOf = (ids: string[]): Inv => {
  const inv: Inv = {}
  ids.forEach((id) => {
    inv[id] = true
  })
  return inv
}
const FULL_BAR = invOf(DEMO_IDS.concat(FULL_EXTRA))

const byId = (id: string): Recipe => RECIPES.find((r) => r.id === id)!

/** 用「id + 评级 + 时间」快速造记录 */
function recs(rows: Array<[string, Rating, number]>): Record<string, MadeRecord> {
  const out: Record<string, MadeRecord> = {}
  rows.forEach(([id, rating, day]) => {
    out[id] = { key: id, rating, snapshot: byId(id), createdAt: day, updatedAt: day }
  })
  return out
}

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

interface Scenario {
  name: string
  inv: Inv
  custom?: Custom
  records?: Record<string, MadeRecord>
  quiz?: Record<string, string>
  views?: Record<string, number>
  /** 回归目标：某配方应落在前 N 名内（固化调参结论，防止权重回归） */
  expect?: { id: string; topN: number }
}

const CUSTOM_BAR: Custom = {
  base: [['cu_base_mezcal', '梅斯卡尔']],
  liqueur: [['cu_liq_plum', '梅子利口酒']],
  syrup: [['cu_syr_yuzu', '柚子糖浆']],
  mixer: [],
  extra: []
}

const SCENARIOS: Scenario[] = [
  {
    name: '① 冷启动 · 满仓（无记录/问卷）',
    inv: FULL_BAR
  },
  {
    name: '② 仅答卷 · 酸爽/低度/气泡/草本',
    inv: FULL_BAR,
    quiz: { tone: 'sour', strength: 'light', sparkle: 'yes', flavor: 'herbal' }
  },
  {
    name: '③ 清爽派 · 好评莫吉托 + 金汤力 + 汤姆柯林斯',
    inv: FULL_BAR,
    records: recs([
      ['mojito', 'recommend', 1],
      ['gin_tonic', 'recommend', 2],
      ['tom_collins', 'recommend', 3]
    ]),
    // 调参结论：LIKED_BONUS 加权后，好评的老歌都应进入前 5
    expect: { id: 'gin_tonic', topN: 5 }
  },
  {
    name: '④ 甜润派 · 好评椰林/白俄 + 差评莫吉托',
    inv: FULL_BAR,
    records: recs([
      ['pina_colada', 'recommend', 1],
      ['white_russian', 'recommend', 2],
      ['tequila_sunrise', 'recommend', 3],
      ['mojito', 'bad', 4]
    ])
  },
  {
    name: '⑤ 踩雷多 · 浓郁/高度系连续差评',
    inv: FULL_BAR,
    records: recs([
      ['long_island', 'bad', 1],
      ['negroni', 'bad', 2],
      ['old_fashioned', 'bad', 3],
      ['manhattan', 'bad', 4],
      ['b52', 'bad', 5],
      ['margarita', 'recommend', 6]
    ])
  },
  {
    name: '⑥ 重度用户 · 大部分经典都做过',
    inv: FULL_BAR,
    records: recs([
      ['mojito', 'recommend', 1],
      ['daiquiri', 'recommend', 2],
      ['margarita', 'recommend', 3],
      ['tom_collins', 'recommend', 4],
      ['gin_tonic', 'recommend', 5],
      ['aperol_spritz', 'recommend', 6],
      ['whiskey_sour', 'average', 7],
      ['moscow_mule', 'average', 8],
      ['cosmo', 'average', 9],
      ['long_island', 'bad', 10],
      ['pina_colada', 'bad', 11],
      ['old_fashioned', 'bad', 12],
      ['negroni', 'bad', 13],
      ['black_russian', 'bad', 14],
      ['white_russian', 'bad', 15],
      ['b52', 'bad', 16]
    ])
  },
  {
    name: '⑦ 空酒柜 · 无库存',
    inv: {},
    quiz: { tone: 'sour' }
  },
  {
    name: '⑧ 含自定义材料 · 创意特调',
    inv: invOf(['tequila', 'lime', 'simple', 'soda', 'cu_base_mezcal', 'cu_liq_plum', 'cu_syr_yuzu']),
    custom: CUSTOM_BAR
  },
  {
    name: '⑨ 问卷全「都行」· 应无信号',
    inv: FULL_BAR,
    quiz: { tone: 'any', strength: 'any', sparkle: 'any', flavor: 'any' }
  },
  {
    name: '⑩ 只爱低度 · 好评 S1 + 差评 S3',
    inv: FULL_BAR,
    records: recs([
      ['mojito', 'recommend', 1],
      ['aperol_spritz', 'recommend', 2],
      ['sea_breeze', 'recommend', 3],
      ['old_fashioned', 'bad', 4],
      ['negroni', 'bad', 5]
    ]),
    quiz: { strength: 'light' }
  }
]

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------

const f2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2)
const pad = (s: string, n: number) => s.padEnd(n, '　')

function printProfile(p: TasteProfile) {
  const entries = Object.entries(p.tags)
  const pos = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const neg = entries.filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]).slice(0, 5)
  console.log(`画像: 样本 ${p.samples} 条行为`)
  console.log(`  正向标签: ${pos.map(([k, v]) => `${k} ${f2(v)}`).join('  ') || '—'}`)
  console.log(`  负向标签: ${neg.map(([k, v]) => `${k} ${f2(v)}`).join('  ') || '—'}`)
  console.log(`  度数偏好[0-3]: [${p.strengths.map(f2).join(', ')}]`)
}

function runOne(s: Scenario) {
  const custom = s.custom || {}
  const records = s.records || {}
  const names = makeName(custom)
  const profile = buildTasteProfile(records, s.quiz || {}, s.views || {})
  const res = planGenerate(s.inv, custom, names, profile)
  const signal = profile.samples > 0 || Object.keys(profile.tags).length > 0

  console.log(`\n===== ${s.name} =====`)
  console.log(
    `酒柜 ${Object.keys(s.inv).length} 项 | 记录 ${Object.keys(records).length} 条 | ` +
      `mode=${res.mode} | 可调 ${res.cards.length} 款`
  )
  console.log(`标题: ${res.title}`)
  if (signal) printProfile(profile)

  const top = res.cards.slice(0, 6)
  if (!top.length) {
    console.log('无可调配方，近邻（补齐即可解锁）:')
    res.near.forEach((n) =>
      console.log(`  · ${n.recipe.name}  还差: ${n.missing.map((id) => names[id] || id).join('、')}`)
    )
    return
  }

  top.forEach((c, i) => {
    let mark = ''
    let bd = ''
    if (signal) {
      const t = scoreTaste(c.recipe, profile)
      if (t.made && t.liked) mark = ' ★回归位·好评'
      else if (t.made && t.tagFit > 0) mark = ' ★回归位'
      else if (!t.made && t.tagFit > 0) mark = ' ☆探索位'
      if (t.made) mark = `${mark} [做过]`
      const p = t.parts
      bd =
        ` 拆解(标签${f2(p.tagFit)}/度${f2(p.strFit)}/基${f2(p.baseFit)}/` +
        `新${f2(p.novelty)}/好${f2(p.liked)}/差${f2(p.disliked)})=${f2(t.score)}`
    }
    const base = mainBase(c.recipe) || '—'
    const reasons = c.reasons && c.reasons.length ? `  ← ${c.reasons.join(' / ')}` : ''
    console.log(
      `  ${String(i + 1).padStart(2, '0')} ${pad(c.recipe.name, 7)} ` +
        `S${c.recipe.strength} 底:${pad(base, 12)} 缺${c.missing.length}${mark}${reasons}`
    )
    if (bd) console.log(`      ${bd}`)
  })

  // 回归目标校验（固化调参结论）
  if (s.expect) {
    const rank = res.cards.findIndex((c) => c.recipe.id === s.expect!.id) + 1
    const ok = rank > 0 && rank <= s.expect.topN
    console.log(
      `  ${ok ? '✅' : '❌'} 目标：${byId(s.expect.id).name} 名次 #${rank || '-'}` +
        `（要求 ≤ #${s.expect.topN}）`
    )
  }

  const madeIds = Object.keys(records)
  if (madeIds.length) {
    const ranks = madeIds
      .map((id) => ({ id, idx: res.cards.findIndex((c) => c.recipe.id === id) }))
      .sort((a, b) => a.idx - b.idx)
      .slice(0, 8)
      .map((r) => `${byId(r.id).name}#${r.idx + 1}`)
    console.log(`  做过的落点: ${ranks.join('  ')}`)
  }
}

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--list')) {
    SCENARIOS.forEach((s, i) => console.log(`${i + 1}. ${s.name}`))
    return
  }

  // 日志级别：默认 warn 让对比表干净；加 --log=info / --log=debug 可看决策与逐卡日志
  const logArg = args.find((a) => a.startsWith('--log='))
  const level = (logArg ? logArg.split('=')[1] : args.includes('--debug') ? 'debug' : 'warn') as LogLevel
  setLogLevel(level)

  const nums = args.filter((a) => !a.startsWith('--'))
  const picked = nums.length
    ? nums.map((n) => SCENARIOS[Number(n) - 1]).filter(Boolean)
    : SCENARIOS
  if (!picked.length) {
    console.log(`未找到用例 ${nums.join(',')}，用 --list 查看全部`)
    return
  }
  console.log(`推荐系统离线调试 · planGenerate 排序结果（日志级别 ${level}）`)
  picked.forEach(runOne)
  console.log(
    '\n（★ 回归位 = 做过且好评的最高分款（无好评时取"做过且合口"款）；☆ 探索位 = 没喝过且合口的款）'
  )
  console.log('（拆解顺序：标签/度数/基酒/新鲜度/好评/差评；`--log=info` 可查看调度与多样化决策日志）')
}

main()
