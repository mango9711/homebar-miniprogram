import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import type { Scored } from '@/types'
import { STRENGTH_LABELS } from '@/data/categories'
import { TAG_COLORS, TAG_TEXT_COLOR } from '@/data/tagColors'
import styles from './index.module.scss'

interface RecipeCardProps {
  data: Scored
  index: number
  names: Record<string, string>
  onOpen: () => void
}

function RecipeCard({ data, index, names, onOpen }: RecipeCardProps) {
  const { recipe, missing, score } = data
  const isCreative = !!recipe.creative

  let badgeText = '✓ 材料齐全'
  let badgeClass = styles.badgeOk
  if (isCreative) {
    badgeText = '✦ 创意特调'
    badgeClass = styles.badgeCreative
  } else if (score > 0) {
    badgeText = `还差 ${score} 样`
    badgeClass = styles.badgeNear
  }

  return (
    <View className={styles.card} onClick={onOpen}>
      <View className={styles.top}>
        <Text className={styles.index}>
          {String(index + 1).padStart(2, '0')}
        </Text>
        <Text className={classnames(styles.badge, badgeClass)}>
          {badgeText}
        </Text>
      </View>

      <View className={styles.titleRow}>
        <Text className={styles.name}>{recipe.name}</Text>
        {recipe.en ? <Text className={styles.en}>{recipe.en}</Text> : null}
      </View>

      <View className={styles.metaRow}>
        <Text className={styles.meta}>{recipe.glass}</Text>
        <Text className={styles.metaDot}>·</Text>
        <Text className={styles.meta}>{recipe.method}</Text>
        <Text className={styles.metaDot}>·</Text>
        <Text className={styles.meta}>
          {STRENGTH_LABELS[recipe.strength]}
        </Text>
      </View>

      <View className={styles.tagRow}>
        {recipe.tags.map((tag) => (
          <Text
            key={tag}
            className={styles.tag}
            style={{
              backgroundColor: TAG_COLORS[tag] || '#e8e8e8',
              color: TAG_TEXT_COLOR
            }}
          >
            {tag}
          </Text>
        ))}
      </View>

      {data.reasons && data.reasons.length > 0 && (
        <View className={styles.reasonRow}>
          {data.reasons.map((reason) => (
            <Text key={reason} className={styles.reason}>
              ✧ {reason}
            </Text>
          ))}
        </View>
      )}

      <Text className={styles.desc}>{recipe.desc}</Text>

      <View className={styles.ingRow}>
        {recipe.ingredients.map((ing) => {
          const isMissing = missing.indexOf(ing.item) !== -1
          const stateClass = isMissing
            ? styles.ingMissing
            : ing.optional
              ? styles.ingOptional
              : styles.ingOk
          const prefix = isMissing ? '缺 · ' : ing.optional ? '可选 · ' : ''
          return (
            <Text key={ing.item} className={classnames(styles.ing, stateClass)}>
              {prefix}
              {names[ing.item] || ing.item}
            </Text>
          )
        })}
      </View>

      <View className={styles.footer}>
        <Text className={styles.openBtn}>查看完整配方 →</Text>
      </View>
    </View>
  )
}

export default RecipeCard
