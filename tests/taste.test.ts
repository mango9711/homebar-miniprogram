import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { buildTasteProfile, scoreTaste, mainBase } from '@/utils/taste'
import { setLogLevel } from '@/utils/logger'
import type { Recipe, TasteProfile } from '@/types'
import { byId, recs } from './fixtures'

// 单元测试期间静默应用日志
setLogLevel('warn')

const round = (n: number) => Math.round(n * 1000) / 1000

function profileOf(partial: Partial<TasteProfile>): TasteProfile {
  return {
    tags: {},
    strengths: [0, 0, 0, 0],
    bases: {},
    madeKeys: [],
    likedKeys: [],
    dislikedKeys: [],
    averageKeys: [],
    samples: 0,
    ...partial
  }
}

test('空输入 → 冷启动画像（全 0）', () => {
  const p = buildTasteProfile({}, {}, {})
  assert.equal(p.samples, 0)
  assert.deepEqual(p.tags, {})
  assert.deepEqual(p.madeKeys, [])
  assert.deepEqual(p.likedKeys, [])
})

test('好评 → 标签为正向；差评 → 标签为负向', () => {
  const up = buildTasteProfile(recs([['mojito', 'recommend', 1]]), {}, {})
  assert.ok(up.tags['清爽'] > 0)
  assert.ok(up.tags['薄荷'] > 0)

  const down = buildTasteProfile(recs([['mojito', 'bad', 1]]), {}, {})
  assert.ok(down.tags['清爽'] < 0)
})

test('likedKeys 只包含明确好评的配方', () => {
  const p = buildTasteProfile(
    recs([
      ['mojito', 'recommend', 1],
      ['gin_tonic', 'bad', 2]
    ]),
    {},
    {}
  )
  assert.deepEqual(p.likedKeys, ['mojito'])
  assert.deepEqual(p.madeKeys.sort(), ['gin_tonic', 'mojito'])
})

test('归一化：标签与度数的最大绝对值均为 1', () => {
  const p = buildTasteProfile(recs([['mojito', 'recommend', 1]]), {}, {})
  const maxTag = Math.max(...Object.values(p.tags).map((v) => Math.abs(v)))
  const maxStr = Math.max(...p.strengths.map((v) => Math.abs(v)))
  assert.ok(Math.abs(maxTag - 1) < 1e-9)
  assert.ok(Math.abs(maxStr - 1) < 1e-9)
})

test('问卷先验：注入标签与度数偏好', () => {
  const p = buildTasteProfile({}, { tone: 'sour', strength: 'light' }, {})
  assert.ok(p.tags['酸甜'] > 0)
  assert.ok(p.tags['微酸'] > 0)
  assert.ok(p.strengths[0] > 0 && p.strengths[1] > 0)
  assert.equal(p.strengths[2], 0)
})

test('时间衰减：越新的行为权重越大', () => {
  // 同一「清爽」标签：新近的好评应压过早先的差评
  const newerGood = buildTasteProfile(
    recs([
      ['margarita', 'bad', 1],
      ['mojito', 'recommend', 2]
    ]),
    {},
    {}
  )
  assert.ok(newerGood.tags['清爽'] > 0)

  const newerBad = buildTasteProfile(
    recs([
      ['mojito', 'recommend', 1],
      ['margarita', 'bad', 2]
    ]),
    {},
    {}
  )
  assert.ok(newerBad.tags['清爽'] < 0)
})

test('scoreTaste：基酒只算正向偏好，负向不加不减', () => {
  const mojito = byId('mojito')
  const neg = scoreTaste(mojito, profileOf({ bases: { white_rum: -1 }, samples: 1 }))
  const zero = scoreTaste(mojito, profileOf({ samples: 1 }))
  const pos = scoreTaste(mojito, profileOf({ bases: { white_rum: 1 }, samples: 1 }))
  assert.equal(round(neg.score), round(zero.score))
  assert.ok(pos.score > zero.score)
})

test('scoreTaste：做过降权、没喝过加成与理由文案', () => {
  const mojito = byId('mojito')
  // 仅"做过"（未好评）：应低于"没喝过"
  const madeOnly = scoreTaste(mojito, profileOf({ madeKeys: ['mojito'] }))
  const fresh = scoreTaste(mojito, profileOf({}))
  assert.equal(madeOnly.made, true)
  assert.equal(madeOnly.liked, false)
  assert.deepEqual(madeOnly.reasons, ['你做过，重温一下'])
  assert.equal(fresh.made, false)
  assert.ok(fresh.reasons.includes('没喝过，试个新鲜'))
  assert.ok(fresh.score > madeOnly.score)
})

test('scoreTaste：明确好评的配方获得额外加权', () => {
  const mojito = byId('mojito')
  const liked = scoreTaste(mojito, profileOf({ madeKeys: ['mojito'], likedKeys: ['mojito'] }))
  const madeOnly = scoreTaste(mojito, profileOf({ madeKeys: ['mojito'] }))
  assert.equal(liked.liked, true)
  assert.deepEqual(liked.reasons, ['你上次给了好评'])
  assert.ok(liked.score > madeOnly.score)
  assert.ok(liked.parts.liked > 0)
})

test('scoreTaste：明确差评的配方被直接压制', () => {
  const mojito = byId('mojito')
  const bad = scoreTaste(
    mojito,
    profileOf({ tags: { 清爽: 1, 薄荷: 1, 酸甜: 1 }, madeKeys: ['mojito'], dislikedKeys: ['mojito'] })
  )
  const madeOnly = scoreTaste(mojito, profileOf({ tags: { 清爽: 1, 薄荷: 1, 酸甜: 1 }, madeKeys: ['mojito'] }))
  assert.ok(bad.parts.disliked < 0)
  assert.ok(bad.score < madeOnly.score)
  assert.deepEqual(bad.reasons, ['你上次不太喜欢'])
})

test('scoreTaste：标签契合归一化为「平均契合」（∈[-1,1]）', () => {
  const mojito = byId('mojito') // tags: 清爽 / 薄荷 / 酸甜（3 个）
  const all = scoreTaste(mojito, profileOf({ tags: { 清爽: 1, 薄荷: 1, 酸甜: 1 } }))
  assert.ok(Math.abs(all.parts.tagFit - 1) < 1e-9)
  // 只命中一个 → 平均而非累加
  const one = scoreTaste(mojito, profileOf({ tags: { 清爽: 1 } }))
  assert.ok(Math.abs(one.parts.tagFit - 1 / 3) < 1e-9)
  // 不随标签数膨胀
  assert.ok(Math.abs(all.parts.tagFit) <= 1 + 1e-9)
})

test('scoreTaste：区分「一般」与「未评分」的文案', () => {
  const mojito = byId('mojito')
  const avg = scoreTaste(mojito, profileOf({ madeKeys: ['mojito'], averageKeys: ['mojito'] }))
  assert.deepEqual(avg.reasons, ['你上次觉得一般'])
  const unrated = scoreTaste(mojito, profileOf({ madeKeys: ['mojito'] }))
  assert.deepEqual(unrated.reasons, ['你做过，重温一下'])
})

test('scoreTaste：分数 = 各分项之和', () => {
  const mojito = byId('mojito')
  const s = scoreTaste(
    mojito,
    profileOf({
      tags: { 清爽: 0.8, 薄荷: 0.5, 酸甜: 0.9 },
      strengths: [0, 0.5, 1, 0],
      bases: { white_rum: 0.6 },
      madeKeys: ['mojito'],
      likedKeys: ['mojito'],
      samples: 3
    })
  )
  const sum =
    s.parts.tagFit + s.parts.strFit + s.parts.baseFit + s.parts.novelty + s.parts.liked + s.parts.disliked
  assert.ok(Math.abs(sum - s.score) < 1e-9)
})

test('mainBase：识别主基酒', () => {
  assert.equal(mainBase(byId('mojito')), 'white_rum')
  const mock: Recipe = { ...byId('mojito'), ingredients: [{ item: 'soda', amount: '90ml' }] }
  assert.equal(mainBase(mock), null)
})
