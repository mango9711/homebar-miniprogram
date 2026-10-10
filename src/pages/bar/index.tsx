import React, { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
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
      bottom:
        'calc(var(--taro-tabbar-height, 50px) + env(safe-area-inset-bottom))',
      paddingBottom: '24rpx'
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

  const goCabinet = () => {
    Taro.switchTab({ url: '/pages/cabinet/index' })
  }

  const goQuiz = () => {
    Taro.navigateTo({ url: '/pages/quiz/index' })
  }

  const openRecipe = (data: Scored) => {
    const { recipe } = data
    if (recipe.creative) {
      Taro.navigateTo({
        url: `/pages/recipe/index?id=${recipeKey(recipe)}&creative=1`
      })
    } else {
      Taro.navigateTo({ url: `/pages/recipe/index?id=${recipe.id}` })
    }
  }

  const generate = () => {
    if (!selectedCount) {
      Taro.showModal({
        title: '酒柜还是空的',
        content: '先去「酒柜」勾选家里现有的材料，再回来调酒',
        confirmText: '去酒柜',
        cancelText: '知道了'
      })
        .then((res) => {
          if (res.confirm) goCabinet()
        })
        .catch((e) => {
          console.error('[Bar] showModal failed:', e)
        })
      return
    }
    const r = planGenerate(inv, custom, names)
    if (r.mode === 'creative') {
      setCreativeRecipes(r.cards.map((s) => s.recipe))
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
    <View className={styles.page}>
      {/* 顶部 Hero */}
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>今晚喝什么</Text>
        <Text className={styles.heroSub}>
          可调的品类会随「酒柜」里的原料库存自动更新
        </Text>
        <View className={styles.heroStat}>
          <Text className={styles.heroStatNum}>{makeableCount}</Text>
          <Text className={styles.heroStatLabel}>款经典配方现在就能调</Text>
        </View>
      </View>

      {/* 酒柜库存概览 */}
      <View className={styles.cabinetRow} onClick={goCabinet}>
        <View className={styles.cabinetInfo}>
          <Text className={styles.cabinetTitle}>酒柜库存</Text>
          <Text className={styles.cabinetSub}>
            {selectedCount
              ? `已备 ${selectedCount} 样材料`
              : '还没有备料，点这里去勾选'}
          </Text>
        </View>
        <Text className={styles.cabinetLink}>
          {selectedCount ? '去补货' : '去备料'} &gt;
        </Text>
      </View>

      {/* 口味问卷入口 */}
      <View className={styles.quizCard} onClick={goQuiz}>
        <View className={styles.quizInfo}>
          <Text className={styles.quizTitle}>不知道喝什么？</Text>
          <Text className={styles.quizSub}>
            回答 4 道选择题，帮你挑出最合口味的一杯
          </Text>
        </View>
        <Text className={styles.quizArrow}>&gt;</Text>
      </View>

      {/* 生成按钮 */}
      <View className={styles.generateBar} style={h5BarStyle}>
        <Text className={styles.generateBtn} onClick={generate}>
          生成调酒清单
        </Text>
      </View>

      {/* 结果区 */}
      {result && (
        <View id='results' className={styles.results}>
          <View className={styles.resultHead} id='resultsTitleBox'>
            <View className={styles.resultTitles}>
              <Text className={styles.resultTitle}>{result.title}</Text>
              <Text className={styles.resultSub}>{result.sub}</Text>
            </View>
            {canShuffle && (
              <View className={styles.shufflePill} onClick={shuffle}>
                <Text className={styles.shuffleIcon}>⟳</Text>
                <Text className={styles.shuffleText}>换一换</Text>
              </View>
            )}
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
                      url: `/pages/recipe/index?id=${s.recipe.id}`
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