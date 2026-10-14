import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { planGenerate, scoreRecipes, recipeKey } from '@/utils/bar'
import { buildTasteProfile, mainBase, scoreTaste } from '@/utils/taste'
import { setLogLevel } from '@/utils/logger'
import { RECIPES } from '@/data/recipes'
import type { Recipe, TasteProfile } from '@/types'
import { fullInv, invOf, byId, recs, names } from './fixtures'

// 单元测试期间静默应用日志
setLogLevel('warn')

test('scoreRecipes：缺料数 = 非可选材料数', () => {
  const scored = scoreRecipes({})
  assert.equal(scored.length, RECIPES.length)
  const mojito = scored.find((s) => s.recipe.id === 'mojito')!
  const required = mojito.recipe.ingredients.filter((i) => !i.optional).length
  assert.equal(mojito.missing.length, required)
  assert.ok(mojito.missing.includes('white_rum'))
})

test('scoreRecipes：满库存时莫吉托可调', () => {
  const mojito = scoreRecipes(fullInv()).find((s) => s.recipe.id === 'mojito')!
  assert.equal(mojito.score, 0)
})

test('planGenerate：空库存 → empty 模式，无卡片但有近邻', () => {
  const res = planGenerate({}, {}, names)
  assert.equal(res.mode, 'empty')
  assert.equal(res.cards.length, 0)
  assert.ok(res.near.length > 0)
})

test('planGenerate：冷启动按 pop 排序且无个性化理由', () => {
  const res = planGenerate(fullInv(), {}, names)
  assert.notEqual(res.mode, 'empty')
  const pops = res.cards.slice(0, 10).map((c) => c.recipe.pop || 0)
  for (let i = 1; i < pops.length; i += 1) {
    assert.ok(pops[i] <= pops[i - 1], `第 ${i + 1} 位 pop 不应高于前一位`)
  }
  assert.ok(res.cards.every((c) => !c.reasons))
})

test('planGenerate：学习后前 3 席含回归款与探索款，且基酒互不相同', () => {
  const records = recs([
    ['mojito', 'recommend', 1],
    ['gin_tonic', 'recommend', 2],
    ['tom_collins', 'recommend', 3]
  ])
  const profile = buildTasteProfile(records, {}, {})
  const res = planGenerate(fullInv(), {}, names, profile)
  const top3 = res.cards.slice(0, 3)

  assert.equal(top3.length, 3)
  const keys = top3.map((c) => recipeKey(c.recipe))
  // 含"做过"的回归款
  assert.ok(keys.some((k) => profile.madeKeys.includes(k)))
  // 含"没喝过"的探索款
  assert.ok(keys.some((k) => !profile.madeKeys.includes(k)))
  // 最好的好评款进前三
  assert.ok(keys.some((k) => profile.likedKeys.includes(k)))
  // 主基酒互不相同（候选充足时）
  const bases = top3.map((c) => mainBase(c.recipe)).filter((b): b is string => !!b)
  assert.equal(new Set(bases).size, bases.length)
  // 个性化理由已生成
  assert.ok(top3.every((c) => c.reasons && c.reasons.length > 0))
})

test('planGenerate：全部做过（无探索款）时优雅退化', () => {
  const allMade: TasteProfile = {
    tags: { 酸甜: 1 },
    strengths: [0, 0, 1, 0],
    bases: {},
    madeKeys: RECIPES.map((r) => r.id),
    likedKeys: ['mojito'],
    dislikedKeys: [],
    samples: RECIPES.length
  }
  const res = planGenerate(fullInv(), {}, names, allMade)
  assert.ok(res.cards.length >= 3)
  assert.equal(res.cards.slice(0, 3).length, 3)
})

test('planGenerate：待补齐清单按「缺料少 → 口味契合」排序', () => {
  const inv = invOf(['gin', 'tonic', 'whiskey', 'lemon', 'simple', 'white_rum', 'lime', 'mint', 'soda'])
  const records = recs([
    ['mojito', 'recommend', 1],
    ['gin_tonic', 'recommend', 2],
    ['tom_collins', 'recommend', 3]
  ])
  const profile = buildTasteProfile(records, {}, {})
  const res = planGenerate(inv, {}, names, profile)
  for (let i = 1; i < res.near.length; i += 1) {
    assert.ok(res.near[i].score >= res.near[i - 1].score, '缺料数应单调不减')
    if (res.near[i].score === res.near[i - 1].score) {
      const prev = scoreTaste(res.near[i - 1].recipe, profile).score
      const cur = scoreTaste(res.near[i].recipe, profile).score
      assert.ok(cur <= prev + 1e-9, '同缺料数时应按口味分降序')
    }
  }
})

test('回归：好评老歌进入前列（固化用例③调参结论）', () => {
  const records = recs([
    ['mojito', 'recommend', 1],
    ['gin_tonic', 'recommend', 2],
    ['tom_collins', 'recommend', 3]
  ])
  const profile = buildTasteProfile(records, {}, {})
  const res = planGenerate(fullInv(), {}, names, profile)
  const rankOf = (id: string) => res.cards.findIndex((c) => c.recipe.id === id) + 1
  assert.ok(
    rankOf('gin_tonic') > 0 && rankOf('gin_tonic') <= 5,
    `金汤力应在前 5，实际 #${rankOf('gin_tonic')}`
  )
  assert.ok(
    rankOf('mojito') > 0 && rankOf('mojito') <= 3,
    `莫吉托应在前 3，实际 #${rankOf('mojito')}`
  )
})

test('recipeKey：经典用 id，创意用材料签名', () => {
  assert.equal(recipeKey(byId('mojito')), 'mojito')
  const creative: Recipe = { ...byId('mojito'), creative: true }
  assert.ok(recipeKey(creative).startsWith('cre_'))
})
