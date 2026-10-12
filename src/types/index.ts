export type Rating = 'recommend' | 'average' | 'bad'

export interface Ingredient {
  item: string
  amount: string
  optional?: boolean
}

export interface Recipe {
  id: string
  name: string
  en?: string
  pop?: number
  glass: string
  method: string
  /** 0 无酒精 / 1 低度 / 2 中度 / 3 高度 */
  strength: 0 | 1 | 2 | 3
  tags: string[]
  desc: string
  ingredients: Ingredient[]
  garnish?: string
  steps: string[]
  /** true = 由创意生成器即兴产出 */
  creative?: boolean
  /** 记录/快照用的稳定唯一键 */
  key?: string
}

export interface Category {
  id: string
  name: string
  hint: string
  items: Array<[string, string]>
}

export interface Scored {
  recipe: Recipe
  missing: string[]
  score: number
}

export interface MadeRecord {
  key: string
  rating?: Rating
  note?: string
  /** 调酒照片（data URL，最多 9 张） */
  photos?: string[]
  snapshot: Recipe
  createdAt: number
  updatedAt: number
}

export interface UserProfile {
  nickname: string
  avatar: string
  openid?: string
}

export type GenerateMode = 'perfect' | 'creative' | 'mixed' | 'empty'

export interface GenerateResult {
  mode: GenerateMode
  title: string
  sub: string
  cards: Scored[]
  near: Scored[]
}
