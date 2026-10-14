/** 测试公用 fixture：酒柜、配方、记录构造。 */
import { scoreRecipes } from '@/utils/bar'
import { RECIPES } from '@/data/recipes'
import { DEMO_IDS, makeName } from '@/data/categories'
import type { MadeRecord, Rating, Recipe } from '@/types'

export type Inv = Record<string, boolean>

/** 常见酒柜 + 一批利口酒/起泡酒，凑成"家底厚"的酒柜 */
const EXTRA = [
  'campari', 'sweet_vermouth', 'dry_vermouth', 'prosecco', 'aperol',
  'elderflower', 'passionfruit', 'grapefruit', 'baileys', 'kahlua',
  'coconut', 'cream', 'honey', 'lemon_fresh', 'amaretto', 'peach',
  'blue_curacao', 'malibu', 'brandy', 'baijiu', 'wine'
]

export function invOf(ids: string[]): Inv {
  const inv: Inv = {}
  ids.forEach((id) => {
    inv[id] = true
  })
  return inv
}

export function fullInv(): Inv {
  return invOf(DEMO_IDS.concat(EXTRA))
}

export const byId = (id: string): Recipe => RECIPES.find((r) => r.id === id)!

/** 用「id + 评级 + 时间」快速造记录 */
export function recs(rows: Array<[string, Rating, number]>): Record<string, MadeRecord> {
  const out: Record<string, MadeRecord> = {}
  rows.forEach(([id, rating, day]) => {
    out[id] = { key: id, rating, snapshot: byId(id), createdAt: day, updatedAt: day }
  })
  return out
}

export const names = makeName({})

/** 满酒柜下能调的配方 id */
export function makeableIds(): string[] {
  return scoreRecipes(fullInv())
    .filter((s) => s.score === 0)
    .map((s) => s.recipe.id)
}

/** 满酒柜下能调、且带某标签的配方 id */
export function makeableByTag(tag: string): string[] {
  const ok = new Set(makeableIds())
  return RECIPES.filter((r) => ok.has(r.id) && r.tags.indexOf(tag) !== -1).map((r) => r.id)
}
