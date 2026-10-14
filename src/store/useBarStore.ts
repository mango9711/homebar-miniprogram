import Taro from '@tarojs/taro'
import { create } from 'zustand'
import type {
  MadeRecord,
  Recipe,
  UserProfile
} from '@/types'
import { CATEGORY_IDS } from '@/data/categories'
import { buildSnapshot, recipeKey } from '@/utils/bar'

type Inv = Record<string, boolean>
type Custom = Record<string, Array<[string, string]>>

const INV_KEY = 'homebar-inv-v1'
const CUSTOM_KEY = 'homebar-custom-v1'
const CREATIVE_KEY = 'homebar-creative-v1'
const RECORDS_KEY = 'homebar-records-v1'
const PROFILE_KEY = 'homebar-profile-v1'
const QUIZ_KEY = 'homebar-quiz-v1'
const VIEWS_KEY = 'homebar-views-v1'

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key)
    if (!raw) return fallback
    if (typeof raw === 'string') return JSON.parse(raw) as T
    return raw as T
  } catch (e) {
    console.error(`[Store] read ${key} failed:`, e)
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    Taro.setStorageSync(key, JSON.stringify(value))
  } catch (e) {
    console.error(`[Store] write ${key} failed:`, e)
  }
}

function emptyCustom(): Custom {
  const c: Custom = {}
  CATEGORY_IDS.forEach((id) => {
    c[id] = []
  })
  return c
}

const defaultProfile: UserProfile = { nickname: '调酒师', avatar: '' }

interface BarState {
  inv: Inv
  custom: Custom
  creativeRecipes: Recipe[]
  records: Record<string, MadeRecord>
  profile: UserProfile
  /** 口味问卷答卷，作为口味画像的冷启动先验 */
  quizAnswers: Record<string, string>
  /** 配方详情浏览计数：key → 次数，作为隐式正反馈 */
  views: Record<string, number>

  toggle: (id: string) => void
  setMany: (ids: string[], on: boolean) => void
  addCustom: (cat: string, id: string, name: string) => void
  removeCustom: (cat: string, id: string) => void
  setCreativeRecipes: (rs: Recipe[]) => void
  saveRecord: (
    recipe: Recipe,
    rating: MadeRecord['rating'],
    note: string,
    photos?: string[]
  ) => void
  deleteRecord: (key: string) => void
  setProfile: (patch: Partial<UserProfile>) => void
  saveQuiz: (answers: Record<string, string>) => void
  bumpView: (key: string) => void
}

const useBarStore = create<BarState>((set, get) => ({
  inv: readJSON<Inv>(INV_KEY, {}),
  custom: readJSON<Custom>(CUSTOM_KEY, emptyCustom()),
  creativeRecipes: readJSON<Recipe[]>(CREATIVE_KEY, []),
  records: readJSON<Record<string, MadeRecord>>(RECORDS_KEY, {}),
  profile: readJSON<UserProfile>(PROFILE_KEY, defaultProfile),
  quizAnswers: readJSON<Record<string, string>>(QUIZ_KEY, {}),
  views: readJSON<Record<string, number>>(VIEWS_KEY, {}),

  toggle: (id) => {
    const { inv } = get()
    const next = { ...inv, [id]: !inv[id] }
    if (!next[id]) delete next[id]
    writeJSON(INV_KEY, next)
    set({ inv: next })
  },

  setMany: (ids, on) => {
    const next = { ...get().inv }
    ids.forEach((id) => {
      if (on) next[id] = true
      else delete next[id]
    })
    writeJSON(INV_KEY, next)
    set({ inv: next })
  },

  addCustom: (cat, id, name) => {
    const custom = { ...get().custom }
    custom[cat] = [...(custom[cat] || []), [id, name]]
    writeJSON(CUSTOM_KEY, custom)
    const inv = { ...get().inv, [id]: true }
    writeJSON(INV_KEY, inv)
    set({ custom, inv })
  },

  removeCustom: (cat, id) => {
    const custom = { ...get().custom }
    custom[cat] = (custom[cat] || []).filter((pair) => pair[0] !== id)
    writeJSON(CUSTOM_KEY, custom)
    const inv = { ...get().inv }
    delete inv[id]
    writeJSON(INV_KEY, inv)
    set({ custom, inv })
  },

  setCreativeRecipes: (rs) => {
    writeJSON(CREATIVE_KEY, rs)
    set({ creativeRecipes: rs })
  },

  saveRecord: (recipe, rating, note, photos) => {
    const key = recipeKey(recipe)
    const now = Date.now()
    const prev = get().records[key]
    const record: MadeRecord = {
      key,
      rating,
      note: note.trim(),
      photos: photos ?? prev?.photos,
      snapshot: buildSnapshot(recipe),
      createdAt: prev ? prev.createdAt : now,
      updatedAt: now
    }
    const records = { ...get().records, [key]: record }
    writeJSON(RECORDS_KEY, records)
    set({ records })
    console.info('[Store] record saved:', key)
  },

  deleteRecord: (key) => {
    const records = { ...get().records }
    delete records[key]
    writeJSON(RECORDS_KEY, records)
    set({ records })
    console.info('[Store] record deleted:', key)
  },

  setProfile: (patch) => {
    const profile = { ...get().profile, ...patch }
    writeJSON(PROFILE_KEY, profile)
    set({ profile })
  },

  saveQuiz: (answers) => {
    writeJSON(QUIZ_KEY, answers)
    set({ quizAnswers: answers })
  },

  bumpView: (key) => {
    if (!key) return
    const views = { ...get().views, [key]: (get().views[key] || 0) + 1 }
    writeJSON(VIEWS_KEY, views)
    set({ views })
  }
}))

export default useBarStore
