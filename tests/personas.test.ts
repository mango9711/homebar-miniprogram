/**
 * 用户群体覆盖：不同口味偏好 / 行为强度 / 边缘场景下，推荐结果应符合直觉。
 * 断言尽量用"方向性"（靠前、更多、不崩），而非精确名次，避免权重微调即挂。
 */
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { planGenerate, recipeKey } from '@/utils/bar'
import { buildTasteProfile, scoreTaste, mainBase } from '@/utils/taste'
import { setLogLevel } from '@/utils/logger'
import { makeName } from '@/data/categories'
import type { Rating, Recipe, Scored } from '@/types'
import { fullInv, invOf, byId, recs, names, makeableIds, makeableByTag } from './fixtures'

setLogLevel('warn')

type Row = [string, Rating, number]
const rowsOf = (ids: string[], rating: Rating = 'recommend'): Row[] =>
  ids.map((id, i) => [id, rating, i + 1])

/** 只取"满酒柜确实能调"的若干候选 */
function pickMakeable(candidates: string[], k: number): string[] {
  const ok = new Set(makeableIds())
  return candidates.filter((id) => ok.has(id)).slice(0, k)
}

function run(
  records: Record<string, any>,
  quiz: Record<string, string> = {},
  views: Record<string, number> = {}
) {
  const profile = buildTasteProfile(records, quiz, views)
  const res = planGenerate(fullInv(), {}, names, profile)
  return { profile, res }
}

const top = (res: { cards: Scored[] }, n: number): Recipe[] =>
  res.cards.slice(0, n).map((c) => c.recipe)
const countIn = (res: { cards: Scored[] }, n: number, pred: (r: Recipe) => boolean) =>
  top(res, n).filter(pred).length

// ---------------------------------------------------------------------------
// 口味偏好群体（按标签）
// ---------------------------------------------------------------------------

const TAG_PERSONAS: Array<[string, string]> = [
  ['甜润', '甜食党'],
  ['果香', '果味党'],
  ['苦甜', '苦味党'],
  ['清爽', '清爽党'],
  ['草本', '草本党'],
  ['气泡', '气泡党']
]

TAG_PERSONAS.forEach(([tag, label]) => {
  test(`用户群体：${label}（好评「${tag}」系）→ 该风味靠前`, () => {
    const ids = makeableByTag(tag).slice(0, 3)
    assert.ok(ids.length >= 3, `满酒柜下可调的「${tag}」系不足 3 款`)
    const { res } = run(recs(rowsOf(ids)))
    const hit = countIn(res, 6, (r) => r.tags.indexOf(tag) !== -1)
    assert.ok(hit >= 2, `前 6 中「${tag}」系应 >= 2，实际 ${hit}`)
  })
})

// ---------------------------------------------------------------------------
// 酒精度偏好群体
// ---------------------------------------------------------------------------

test('用户群体：低度党（好评低度 + 问卷低度）→ 低度酒靠前', () => {
  const ids = pickMakeable(
    ['mojito', 'sea_breeze', 'aperol_spritz', 'tequila_sunrise', 'hugo_spritz', 'sex_beach'],
    3
  )
  assert.ok(ids.length >= 3)
  const { res } = run(recs(rowsOf(ids)), { strength: 'light' })
  const low = countIn(res, 6, (r) => r.strength <= 1)
  assert.ok(low >= 4, `前 6 中低度(S≤1)应 >= 4，实际 ${low}`)
})

test('用户群体：高度党（好评高度 + 问卷高度）→ 高度酒靠前', () => {
  const ids = pickMakeable(
    ['old_fashioned', 'negroni', 'manhattan', 'martini', 'long_island', 'b52'],
    4
  )
  assert.ok(ids.length >= 3)
  const { res } = run(recs(rowsOf(ids)), { strength: 'strong' })
  const strong = countIn(res, 6, (r) => r.strength === 3)
  assert.ok(strong >= 3, `前 6 中高度(S3)应 >= 3，实际 ${strong}`)
})

// ---------------------------------------------------------------------------
// 行为强度群体
// ---------------------------------------------------------------------------

test('用户群体：老好人（全部 average）→ 不崩且无明确好评', () => {
  const ids = makeableIds().slice(0, 5)
  const { profile, res } = run(recs(rowsOf(ids, 'average')))
  assert.equal(profile.likedKeys.length, 0)
  assert.deepEqual(profile.madeKeys.sort(), [...ids].sort())
  assert.ok(res.cards.length >= 3)
  assert.ok(top(res, 3).length === 3)
  assert.ok(res.cards.slice(0, 3).every((c) => c.reasons && c.reasons.length > 0))
})

test('用户群体：苛刻用户（连续差评）→ 差评款沉底、好评款靠前', () => {
  const ids = pickMakeable(
    ['long_island', 'negroni', 'old_fashioned', 'manhattan', 'b52', 'white_russian'],
    6
  )
  assert.ok(ids.length >= 3)
  const { res } = run(recs([...rowsOf(ids, 'bad'), ['margarita', 'recommend', 99]]))
  const top5 = top(res, 5).map((r) => r.id)
  ids.forEach((id) =>
    assert.ok(!top5.includes(id), `差评款 ${byId(id).name} 不应进前 5`)
  )
  const rankMarg = res.cards.findIndex((c) => c.recipe.id === 'margarita') + 1
  assert.ok(rankMarg >= 1 && rankMarg <= 3, `好评的玛格丽特应在前 3，实际 #${rankMarg}`)
})

test('用户群体：明确差评的配方即使合口味也不进前 5', () => {
  const q = makeableByTag('清爽')
  const badId = q[0]
  const likes = q.filter((id) => id !== badId).slice(0, 4)
  assert.ok(likes.length >= 3, '可调且带「清爽」的配方不足')
  const { profile, res } = run(recs([...rowsOf(likes), [badId, 'bad', 99]]))
  assert.ok(profile.dislikedKeys.includes(badId))
  assert.ok(profile.tags['清爽'] > 0, '清爽应为正向偏好')
  assert.ok(
    !top(res, 5).some((r) => r.id === badId),
    `${byId(badId).name} 被打差评后不应进前 5`
  )
})

test('用户群体：只浏览不下单（隐式信号）→ 也有理由且标签正向', () => {
  const { profile, res } = run({}, {}, { margarita: 3, daiquiri: 2 })
  assert.ok(profile.samples > 0)
  assert.ok(profile.tags['酸甜'] > 0)
  assert.ok(res.cards[0].reasons && res.cards[0].reasons.length > 0)
})

test('用户群体：单条记录（冷启动边缘）→ 该好评款进前三', () => {
  const { res } = run(recs([['mojito', 'recommend', 1]]))
  assert.ok(res.cards.length >= 3)
  assert.ok(top(res, 3).some((r) => r.id === 'mojito'))
})

test('用户群体：重度用户（多个好评）→ 前三仍保留探索位', () => {
  const ids = makeableByTag('酸甜').slice(0, 8)
  assert.ok(ids.length >= 5)
  const { profile, res } = run(recs(rowsOf(ids)))
  assert.ok(profile.likedKeys.length >= 5)
  assert.ok(
    res.cards.slice(0, 3).some((c) => !profile.madeKeys.includes(recipeKey(c.recipe))),
    '前三应至少 1 张没喝过'
  )
})

test('用户群体：偏爱同一基酒 → 前三不会全是同一基酒', () => {
  const ids = pickMakeable(
    ['gin_tonic', 'tom_collins', 'elderflower_fizz', 'negroni', 'bees_knees', 'martini'],
    4
  )
  assert.ok(ids.length >= 3)
  const { res } = run(recs(rowsOf(ids)))
  const bases = top(res, 3)
    .map((r) => mainBase(r))
    .filter((b): b is string => !!b)
  // 好评款全是 gin，回归位必然还是 gin；多样性靠探索位兜底，至少不能三张全同
  assert.ok(new Set(bases).size >= 2, `前三不应全是同一基酒，实际 ${bases.join(',')}`)
})

// ---------------------------------------------------------------------------
// 边缘 / 特殊场景
// ---------------------------------------------------------------------------

test('用户群体：问卷全「都行」→ 无信号，回退按热度', () => {
  const { profile, res } = run({}, { tone: 'any', strength: 'any', sparkle: 'any', flavor: 'any' })
  assert.equal(Object.keys(profile.tags).length, 0)
  assert.equal(profile.samples, 0)
  assert.ok(res.cards.every((c) => !c.reasons))
  const pops = res.cards.slice(0, 10).map((c) => c.recipe.pop || 0)
  for (let i = 1; i < pops.length; i += 1) {
    assert.ok(pops[i] <= pops[i - 1], '冷启动应按热度降序')
  }
})

test('用户群体：备料党（材料很少）→ 只出可调款，否则给近邻', () => {
  const res = planGenerate(invOf(['vodka', 'lime', 'simple', 'soda']), {}, names)
  assert.ok(res.cards.every((c) => c.missing.length === 0))
  if (!res.cards.length) assert.ok(res.near.length > 0)
})

test('用户群体：自定义材料用户 → 创意特调命名不重复', () => {
  const custom = {
    base: [['cu_base_mezcal', '梅斯卡尔']] as Array<[string, string]>,
    liqueur: [['cu_liq_plum', '梅子利口酒']] as Array<[string, string]>,
    syrup: [['cu_syr_yuzu', '柚子糖浆']] as Array<[string, string]>,
    mixer: [] as Array<[string, string]>,
    extra: [] as Array<[string, string]>
  }
  const inv = invOf(['tequila', 'lime', 'simple', 'soda', 'cu_base_mezcal', 'cu_liq_plum', 'cu_syr_yuzu'])
  const res = planGenerate(inv, custom, makeName(custom))
  const creative = res.cards.filter((c) => c.recipe.creative).map((c) => c.recipe.name)
  assert.ok(creative.length > 0, '应生成创意特调')
  assert.equal(new Set(creative).size, creative.length, '创意特调名称不应重复')
  creative.forEach((n) =>
    assert.ok(!n.includes('梅斯卡尔梅斯卡尔'), `命名重复：${n}`)
  )
})

// ---------------------------------------------------------------------------
// 不变量（对所有用户都成立）
// ---------------------------------------------------------------------------

test('不变量：结果无重复卡片且全部可调', () => {
  const ids = makeableByTag('清爽').slice(0, 4)
  const { res } = run(recs(rowsOf(ids)))
  const keys = res.cards.map((c) => recipeKey(c.recipe))
  assert.equal(new Set(keys).size, keys.length, '不应出现重复卡片')
  assert.ok(res.cards.every((c) => c.missing.length === 0), '结果应全部可调')
})

test('不变量：第 4 位起严格按画像分数降序（前 3 为策略重排）', () => {
  const ids = makeableByTag('酸甜').slice(0, 4)
  const { profile, res } = run(recs(rowsOf(ids)))
  const scores = res.cards.map((c) => scoreTaste(c.recipe, profile).score)
  for (let i = 4; i < scores.length; i += 1) {
    assert.ok(scores[i] <= scores[i - 1] + 1e-9, `#${i + 1} 分数高于前一位`)
  }
})
