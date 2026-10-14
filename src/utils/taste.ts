import type { MadeRecord, Recipe, TasteProfile } from '@/types'
import { RECIPES } from '@/data/recipes'
import { QUIZ_QUESTIONS } from '@/data/quiz'
import { logger } from '@/utils/logger'

// ---------------------------------------------------------------------------
// 口味画像：把用户的行为（做完并评级、浏览）与问卷答卷，折算成一张偏好向量，
// 用于给「用现有库存能调」的配方做个性化排序。全部在本地完成，无需后端。
// ---------------------------------------------------------------------------

/** 各类行为折算成画像的权重增量 */
const RATING_DELTA = {
  recommend: 2,
  average: 0.5,
  bad: -2,
  /** 记录过但没评级：默认偏好 */
  made: 0.5,
  /** 打开过配方详情：隐式弱正反馈 */
  open: 0.2
}

/** 时间衰减：越久远的行为影响越小 */
const DECAY = 0.95
/** 问卷「都行」以外选项作为冷启动先验的强度 */
const SEED = 1.0

// 排序权重
const K_TAG = 1.0
const K_STRENGTH = 0.6
const K_BASE = 0.4
/** 做过的配方轻微降权（目标：不重复，但不埋没心头好） */
const PENALTY_MADE = -0.3
/** 没喝过的配方加成（目标：发现新品；已下调以让好评老歌更靠前） */
const BONUS_NOVEL = 0.4
/** 明确好评过的配方额外加权（让"心头好"稳定靠前） */
const LIKED_BONUS = 1.7
/** 明确差评过的配方直接压制（即使标签契合也不重复推荐） */
const DISLIKED_PENALTY = -1.5

/** 参与基酒偏好统计的材料（与创意生成器的基酒集合保持一致，额外含起泡酒） */
const BASE_SPIRITS = [
  'vodka', 'gin', 'white_rum', 'dark_rum', 'tequila',
  'whiskey', 'brandy', 'baijiu', 'wine', 'prosecco'
]

/** 稳定配方键（与 bar.ts 的 recipeKey 一致；此处独立实现以避免循环依赖） */
function tasteKey(r: Recipe): string {
  if (r.key) return r.key
  if (!r.creative) return r.id
  const sig = r.ingredients
    .map((i) => i.item)
    .sort()
    .join('-')
  return `cre_${sig}`
}

/** 除以最大绝对值并夹到 [-1, 1]，让画像不受「喝得多」影响 */
function normalize(map: Record<string, number>) {
  let max = 0
  Object.keys(map).forEach((k) => {
    max = Math.max(max, Math.abs(map[k]))
  })
  if (!max) return
  Object.keys(map).forEach((k) => {
    map[k] = Math.max(-1, Math.min(1, map[k] / max))
  })
}

function normalizeArr(arr: number[]) {
  let max = 0
  arr.forEach((v) => {
    max = Math.max(max, Math.abs(v))
  })
  if (!max) return
  for (let i = 0; i < arr.length; i += 1) {
    arr[i] = Math.max(-1, Math.min(1, arr[i] / max))
  }
}

interface TasteEvent {
  delta: number
  recipe: Recipe
  ts: number
}

/**
 * 从记录、问卷答卷与浏览计数派生口味画像。
 * 无任何样本时返回全 0 画像，排序会自然退回原有的 pop 规则。
 */
export function buildTasteProfile(
  records: Record<string, MadeRecord>,
  quizAnswers: Record<string, string> = {},
  views: Record<string, number> = {}
): TasteProfile {
  const events: TasteEvent[] = []

  Object.values(records).forEach((rec) => {
    const delta = rec.rating ? RATING_DELTA[rec.rating] : RATING_DELTA.made
    events.push({ delta, recipe: rec.snapshot, ts: rec.updatedAt })
  })

  Object.keys(views).forEach((key) => {
    const recipe = RECIPES.find((r) => r.id === key)
    const count = views[key] || 0
    if (!recipe || count <= 0) return
    events.push({ delta: RATING_DELTA.open * Math.min(count, 3), recipe, ts: 0 })
  })

  events.sort((a, b) => a.ts - b.ts)

  const tags: Record<string, number> = {}
  const strengths = [0, 0, 0, 0]
  const bases: Record<string, number> = {}
  const n = events.length

  events.forEach((ev, i) => {
    const w = ev.delta * Math.pow(DECAY, n - 1 - i)
    ev.recipe.tags.forEach((t) => {
      tags[t] = (tags[t] || 0) + w
    })
    strengths[ev.recipe.strength] += w
    ev.recipe.ingredients.forEach((ing) => {
      if (BASE_SPIRITS.indexOf(ing.item) !== -1) {
        bases[ing.item] = (bases[ing.item] || 0) + w
      }
    })
  })

  // 问卷先验
  QUIZ_QUESTIONS.forEach((q) => {
    const opt = q.options.find((o) => o.id === quizAnswers[q.id])
    if (!opt || opt.id === 'any') return
    ;(opt.tags || []).forEach((t) => {
      tags[t] = (tags[t] || 0) + SEED
    })
    ;(opt.excludeTags || []).forEach((t) => {
      tags[t] = (tags[t] || 0) - SEED
    })
    ;(opt.strengths || []).forEach((s) => {
      strengths[s] += SEED
    })
  })

  normalize(tags)
  normalize(bases)
  normalizeArr(strengths)

  const madeKeys = Object.keys(records)
  const likedKeys = madeKeys.filter((k) => records[k].rating === 'recommend')
  const dislikedKeys = madeKeys.filter((k) => records[k].rating === 'bad')

  logger.info(
    'taste:profile',
    `画像构建完成：样本 ${n} 条行为，好评 ${likedKeys.length} 款，差评 ${dislikedKeys.length} 款`,
    { tags, strengths, bases, madeKeys, likedKeys, dislikedKeys }
  )

  return {
    tags,
    strengths: strengths as [number, number, number, number],
    bases,
    madeKeys,
    likedKeys,
    dislikedKeys,
    samples: n
  }
}

/** 打分拆解，便于日志排查与测试断言 */
export interface ScoreParts {
  /** 标签契合贡献 */
  tagFit: number
  /** 度数契合贡献 */
  strFit: number
  /** 基酒契合贡献（只含正向） */
  baseFit: number
  /** 新鲜度：做过为负、没喝过为正 */
  novelty: number
  /** 好评加权 */
  liked: number
  /** 差评压制（<= 0） */
  disliked: number
}

export interface TasteScore {
  score: number
  reasons: string[]
  /** 是否做过 */
  made: boolean
  /** 是否明确打了好评 */
  liked: boolean
  /** 标签契合度（> 0 表示合口味） */
  tagFit: number
  /** 各分项贡献 */
  parts: ScoreParts
}

/** 配方的主基酒（用于多样性重排），无基酒则为 null */
export function mainBase(recipe: Recipe): string | null {
  const hit = recipe.ingredients.find((i) => BASE_SPIRITS.indexOf(i.item) !== -1)
  const base = hit ? hit.item : null
  logger.debug('taste:mainBase', `${recipe.name} → ${base || '无基酒'}`)
  return base
}

/** 结合画像给单款配方打分，并给出可解释理由 */
export function scoreTaste(recipe: Recipe, profile: TasteProfile): TasteScore {
  // —— 标签契合 ——
  let tagFit = 0
  const hits: string[] = []
  recipe.tags.forEach((t) => {
    const w = profile.tags[t] || 0
    tagFit += w
    if (w > 0) hits.push(t)
  })

  // —— 度数契合 ——
  const strFit = profile.strengths[recipe.strength] || 0

  // —— 基酒契合：只算正向偏好 ——
  // 避免"白朗姆底的好评款"被其他白朗姆差评拖累（负向归因太粗）
  let baseFit = 0
  recipe.ingredients.forEach((ing) => {
    const w = Math.max(0, profile.bases[ing.item] || 0)
    if (w > 0) {
      baseFit += w
      logger.debug('taste:baseFit', `${recipe.name} 基酒 ${ing.item} +${w.toFixed(2)}`)
    }
  })

  // —— 新鲜度 / 好评 / 差评 ——
  const key = tasteKey(recipe)
  const made = profile.madeKeys.indexOf(key) !== -1
  const liked = profile.likedKeys.indexOf(key) !== -1
  const disliked = profile.dislikedKeys.indexOf(key) !== -1
  const novelty = made ? PENALTY_MADE : BONUS_NOVEL
  const likedBonus = liked ? LIKED_BONUS : 0
  const dislikedPenalty = disliked ? DISLIKED_PENALTY : 0

  const score =
    K_TAG * tagFit +
    K_STRENGTH * strFit +
    K_BASE * baseFit +
    novelty +
    likedBonus +
    dislikedPenalty

  const parts: ScoreParts = {
    tagFit: K_TAG * tagFit,
    strFit: K_STRENGTH * strFit,
    baseFit: K_BASE * baseFit,
    novelty,
    liked: likedBonus,
    disliked: dislikedPenalty
  }

  logger.debug('taste:novelty', `${recipe.name} ${made ? '做过' : '没喝过'} → ${novelty}`)
  if (liked) logger.debug('taste:liked', `${recipe.name} 好评加权 +${likedBonus}`)
  if (disliked) logger.debug('taste:disliked', `${recipe.name} 差评压制 ${dislikedPenalty}`)
  logger.debug('taste:score', `${recipe.name} = ${score.toFixed(2)}`, { ...parts, made, liked })

  hits.sort((a, b) => (profile.tags[b] || 0) - (profile.tags[a] || 0))

  const reasons: string[] = []
  if (made) {
    if (disliked) reasons.push('你上次不太喜欢')
    else if (liked) reasons.push('你上次给了好评')
    else reasons.push('你做过，重温一下')
  } else {
    if (hits[0]) reasons.push(`因为 ${hits[0]}`)
    reasons.push('没喝过，试个新鲜')
  }

  return {
    score,
    reasons: reasons.slice(0, 2),
    made,
    liked,
    tagFit,
    parts
  }
}
