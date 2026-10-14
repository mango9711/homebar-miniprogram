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
  /** 可解释的个性化理由（如「因为 清爽」） */
  reasons?: string[]
}

/** 由行为（评级/浏览）与问卷派生的口味画像，所有维度归一化到 [-1, 1] */
export interface TasteProfile {
  /** 风味标签偏好 */
  tags: Record<string, number>
  /** 四档酒精度各自的偏好：0 无酒精 / 1 低度 / 2 中度 / 3 高度 */
  strengths: [number, number, number, number]
  /** 主基酒偏好 */
  bases: Record<string, number>
  /** 做过的配方 key，用于「不重复」降权 */
  madeKeys: string[]
  /** 明确打了好评（recommend）的配方 key，用于回归位优选 */
  likedKeys: string[]
  /** 明确打了差评（bad）的配方 key，用于直接压制、避免重复推荐 */
  dislikedKeys: string[]
  /** 打了「一般」（average）的配方 key，用于区分"一般"与"未评分" */
  averageKeys: string[]
  /** 有效行为样本数，0 表示冷启动 */
  samples: number
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
