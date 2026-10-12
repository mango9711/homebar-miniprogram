import React, { useMemo, useState, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import useBarStore from '@/store/useBarStore'
import RecipeCard from '@/components/RecipeCard'
import { makeName } from '@/data/categories'
import { planGenerate, recipeKey, scoreRecipes } from '@/utils/bar'
import type { GenerateResult, Scored } from '@/types'
import styles from './index.module.scss'

function shuffleList<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 在微信小程序里，不需要对底部进行额外的 tabBar 偏移
// 因为小程序的 tabBar 是原生的，不占据 Webview 内部的高度
const IS_H5 = process.env.TARO_ENV === 'h5'
const h5BarStyle = IS_H5
  ? {
      paddingBottom:
        'calc(var(--taro-tabbar-height, 50px) + env(safe-area-inset-bottom) + 48rpx)'
    }
  : {}


function BarPage() {
  const { inv, custom, setCreativeRecipes } = useBarStore()

  const [result, setResult] = useState<GenerateResult | null>(null)
  const [shown, setShown] = useState<Scored[]>([])

  const names = useMemo(() => makeName(custom), [custom])
  const selectedCount = useMemo(() => Object.keys(inv).length, [inv])
  // 可调的经典配方数量随酒柜库存实时变化
  const makeableCount = useMemo(
    () => scoreRecipes(inv).filter((s) => s.score === 0).length,
    [inv]
  )

  const prevInvRef = useRef<string>('')

  useDidShow(() => {
    Taro.removeStorageSync('should_generate_cocktails')
    const currentState = JSON.stringify({ inv, custom })
    if (currentState !== prevInvRef.current || !result) {
      generate()
      prevInvRef.current = currentState
    }
  })

  const goCabinet = () => {
    Taro.switchTab({ url: '/pages/cabinet/index' })
  }

  const goQuiz = () => {
    Taro.navigateTo({ url: '/subpages/quiz/index' })
  }

  const openRecipe = (data: Scored) => {
    const { recipe } = data
    if (recipe.creative) {
      Taro.navigateTo({
        url: `/subpages/recipe/index?id=${recipeKey(recipe)}&creative=1`
      })
    } else {
      Taro.navigateTo({ url: `/subpages/recipe/index?id=${recipe.id}` })
    }
  }

  const generate = () => {
    if (!selectedCount) {
      setResult(null)
      setShown([])
      return
    }
    const r = planGenerate(inv, custom, names)
    const creativeOnly = r.cards.map((s) => s.recipe).filter((r) => r.creative)
    if (creativeOnly.length > 0) {
      setCreativeRecipes(creativeOnly)
    }
    setResult(r)
    setShown(r.cards.slice(0, 3))
    setTimeout(() => {
      Taro.createSelectorQuery()
        .select('#resultsTitleBox')
        .boundingClientRect((res) => {
          const rect = Array.isArray(res) ? res[0] : res
          if (rect) {
            Taro.pageScrollTo({
              scrollTop: rect.top - 20, // 稍微留一点间距
              duration: 300
            }).catch((e) => {
              console.error('[Bar] scroll failed:', e)
            })
          } else {
            // 降级：如果找不到节点，依然滚到底部
            Taro.pageScrollTo({ scrollTop: 9999, duration: 300 })
          }
        })
        .exec()
    }, 100)
  }

  const shuffle = () => {
    if (!result) return
    const pool = result.cards
    const size = shown.length || 3
    const currentKeys = shown
      .map((s) => recipeKey(s.recipe))
      .sort()
      .join('|')

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const next = shuffleList(pool).slice(0, size)
      const nextKeys = next
        .map((s) => recipeKey(s.recipe))
        .sort()
        .join('|')
      if (nextKeys !== currentKeys) {
        setShown(next)
        return
      }
    }
    setShown(shuffleList(pool).slice(0, size))
  }

  const canShuffle = !!result && result.cards.length > shown.length

  return (
    <View className={styles.page} style={h5BarStyle}>
      {!selectedCount && (
        <View className={styles.emptyNotice} onClick={goCabinet}>
          <Text className={styles.emptyNoticeTitle}>当前酒柜没有库存，去补货 &gt;</Text>
        </View>
      )}

      {/* 结果区 */}
      {result && (
        <View id='results' className={styles.results}>
          <View className={styles.resultHead} id='resultsTitleBox'>
            <View className={styles.resultTitles}>
              <Text className={styles.resultTitle}>{result.title}</Text>
              <Text className={styles.resultSub}>{result.sub}</Text>
            </View>
            <View className={styles.actionRow}>
              {canShuffle && (
                <View className={styles.actionPill} onClick={shuffle}>
                  <Text className={styles.actionIcon}>⟳</Text>
                  <Text className={styles.actionText}>换一换</Text>
                </View>
              )}
              <View className={styles.actionPill} onClick={goQuiz}>
                <Text className={styles.actionIcon}>✧</Text>
                <Text className={styles.actionText}>帮我选</Text>
              </View>
            </View>
          </View>

          {shown.map((data, idx) => (
            <RecipeCard
              key={`${data.recipe.id}-${idx}`}
              data={data}
              index={idx}
              names={names}
              onOpen={() => openRecipe(data)}
            />
          ))}

          {result.near.length > 0 && (
            <View className={styles.hintCard}>
              <Text className={styles.hintTitle}>
                想调经典款？补齐这些材料即可解锁
              </Text>
              {result.near.map((s) => (
                <View
                  key={s.recipe.id}
                  className={styles.hintRow}
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/subpages/recipe/index?id=${s.recipe.id}`
                    })
                  }
                >
                  <Text className={styles.hintName}>{s.recipe.name}</Text>
                  <Text className={styles.hintMiss}>
                    还差：
                    {s.missing.map((id) => names[id] || id).join('、')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default BarPage