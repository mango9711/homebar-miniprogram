import type { Rating } from '@/types'

/** 风味标签配色（背景色，文字统一用深墨色） */
export const TAG_COLORS: Record<string, string> = {
  清爽: '#cdeae2',
  薄荷: '#d3efda',
  酸甜: '#f1e2a8',
  果香: '#f6d2b3',
  甜润: '#f6d0df',
  苦甜: '#f0c3bb',
  草本: '#cfe8cd',
  浓郁: '#ddd0ef',
  气泡: '#c7e0f2',
  咖啡: '#e6d1ba',
  奶香: '#f3e6cf',
  莓果: '#f0c7df',
  椰香: '#ebe0c2',
  坚果: '#e8d0b1',
  干冽: '#d4dde8',
  微酸: '#dfe8b5',
  辛香: '#ecc4ae',
  花香: '#e7d4f2'
}

export const TAG_TEXT_COLOR = '#33403a'

export const RATING_META: Record<
  Rating,
  { label: string; emoji: string; color: string; bg: string }
> = {
  recommend: { label: '推荐', emoji: '👍', color: '#214e3a', bg: '#dcebe2' },
  average: { label: '一般', emoji: '😐', color: '#8a6a24', bg: '#f3e8c8' },
  bad: { label: '不太行', emoji: '👎', color: '#8a3a30', bg: '#f2d4cf' }
}
