import React, { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import useBarStore from '@/store/useBarStore'
import RecipeCard from '@/components/RecipeCard'
import {
  CATS,
  DEMO_IDS,
  makeName,
  newCustomId
} from '@/data/categories'
import { planGenerate, recipeKey } from '@/utils/bar'
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
  const {
    inv,
    custom,
    toggle,
    setMany,
    addCustom,
    removeCustom,
    setCreativeRecipes
  } = useBarStore()

  const [keyword, setKeyword] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [shown, setShown] = useState<Scored[]>([])

  const names = useMemo(() => makeName(custom), [custom])
  const selectedCount = useMemo(() => Object.keys(inv).length, [inv])
  const kw = keyword.replace(/\s+/g, '').toLowerCase()

  const onSearchInput: CommonEventFunction<{ value: string }> = (e) => {
    setKeyword(e.detail.value)
  }

  const noMatch = useMemo(() => {
    if (!kw) return false
    return CATS.every((cat) => {
      const bm = cat.items.some(([, name]) =>
        name.replace(/\s+/g, '').toLowerCase().includes(kw)
      )
      const cm = (custom[cat.id] || []).some(([, name]) =>
        name.replace(/\s+/g, '').toLowerCase().includes(kw)
      )
      return !bm && !cm
    })
  }, [kw, custom])

  const toggleCollapse = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const fillDemo = () => {
    setMany(DEMO_IDS, true)
    Taro.showToast({ title: '已填入常见酒柜', icon: 'none' })
  }

  const clearAll = () => {
    setMany(Object.keys(inv), false)
    setResult(null)
    setShown([])
  }

  const addFromSearch = (catId: string) => {
    const name = keyword.trim()
    if (!name) return
    const cat = CATS.find((c) => c.id === catId)
    addCustom(catId, newCustomId(catId), name)
    setKeyword('')
    Taro.showToast({
      title: `已添加到「${cat?.name || '原料'}」`,
      icon: 'none'
    })
  }

  const removeCustomItem = (cat: string, id: string) => {
    removeCustom(cat, id)
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
      Taro.showToast({ title: '先勾选家里现有的酒料吧～', icon: 'none' })
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
        .boundingClientRect((rect) => {
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
        <Text className={styles.heroTitle}>我的酒柜</Text>
        <Text className={styles.heroSub}>
          勾选家里现有的材料，生成今晚就能调的酒单
        </Text>
        <View className={styles.heroStat}>
          <Text className={styles.heroStatNum}>{selectedCount}</Text>
          <Text className={styles.heroStatLabel}>样已选材料</Text>
        </View>
      </View>

      {/* 搜索 + 快捷操作 */}
      <View className={styles.toolbar}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索原料，如：金酒、薄荷、可乐'
            value={keyword}
            onInput={onSearchInput}
            confirmType='search'
          />
        </View>
        <View className={styles.quickRow}>
          <Text className={styles.quickBtn} onClick={fillDemo}>
            一键填入常见酒柜
          </Text>
          <Text className={classnames(styles.quickBtn, styles.quickGhost)} onClick={clearAll}>
            清空
          </Text>
        </View>
      </View>

      {/* 分类勾选 */}
      <View className={styles.catList}>
        {CATS.map((cat) => {
          const isCollapsed = !kw && collapsed[cat.id]
          const builtinMatches = kw
            ? cat.items.filter(([, name]) =>
                name.replace(/\s+/g, '').toLowerCase().includes(kw)
              )
            : cat.items
          const customMatches = kw
            ? (custom[cat.id] || []).filter(([, name]) =>
                name.replace(/\s+/g, '').toLowerCase().includes(kw)
              )
            : custom[cat.id] || []
          if (kw && !builtinMatches.length && !customMatches.length) {
            return null
          }
          const catSelected = cat.items.filter(([id]) => inv[id]).length +
            customMatches.filter(([id]) => inv[id]).length

          return (
            <View key={cat.id} className={styles.catCard}>
              <View
                className={styles.catHeader}
                onClick={() => toggleCollapse(cat.id)}
              >
                <View className={styles.catTitleBox}>
                  <Text className={styles.catName}>{cat.name}</Text>
                  <Text className={styles.catHint}>{cat.hint}</Text>
                </View>
                <View className={styles.catRight}>
                  <Text className={styles.catCount}>{catSelected}</Text>
                  <Text
                    className={classnames(
                      styles.chevron,
                      isCollapsed && styles.chevronDown
                    )}
                  >
                    ⌃
                  </Text>
                </View>
              </View>

              {!isCollapsed && (
                <View className={styles.catBody}>
                  <View className={styles.chipWrap}>
                    {builtinMatches.map(([id, name]) => (
                      <Text
                        key={id}
                        className={classnames(
                          styles.chip,
                          inv[id] && styles.chipActive
                        )}
                        onClick={() => toggle(id)}
                      >
                        {name}
                      </Text>
                    ))}
                    {customMatches.map(([id, name]) => (
                      <View
                        key={id}
                        className={classnames(
                          styles.chip,
                          styles.chipCustom,
                          inv[id] && styles.chipActive
                        )}
                        onClick={() => toggle(id)}
                      >
                        <Text>{name}</Text>
                        <Text
                          className={styles.chipDel}
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCustomItem(cat.id, id)
                          }}
                        >
                          ×
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )
        })}
        {noMatch && (
          <View className={styles.addBox}>
            <Text className={styles.addTitle}>
              没有找到「{keyword.trim()}」
            </Text>
            <Text className={styles.addHint}>
              可将其新增为自定义原料，请选择所属类别
            </Text>
            <View className={styles.addCatWrap}>
              {CATS.map((cat) => (
                <Text
                  key={cat.id}
                  className={styles.addCatChip}
                  onClick={() => addFromSearch(cat.id)}
                >
                  {cat.name}
                </Text>
              ))}
            </View>
          </View>
        )}
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
