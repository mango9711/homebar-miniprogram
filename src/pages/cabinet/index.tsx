import React, { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import useBarStore from '@/store/useBarStore'
import { CATS, DEMO_IDS, newCustomId } from '@/data/categories'
import styles from './index.module.scss'

// 在微信小程序里，不需要对底部进行额外的 tabBar 偏移
// 因为小程序的 tabBar 是原生的，不占据 Webview 内部的高度
const IS_H5 = process.env.TARO_ENV === 'h5'
const h5BottomStyle = IS_H5
  ? {
      paddingBottom:
        'calc(var(--taro-tabbar-height, 50px) + env(safe-area-inset-bottom) + 24rpx)'
    }
  : {}

function CabinetPage() {
  const { inv, custom, toggle, setMany, addCustom, removeCustom } = useBarStore()

  const [keyword, setKeyword] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

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
    if (!selectedCount) {
      Taro.showToast({ title: '酒柜已经是空的', icon: 'none' })
      return
    }
    Taro.showModal({
      title: '清空酒柜库存？',
      content: '将取消全部已勾选的原料，且无法恢复',
      confirmText: '清空',
      confirmColor: '#d25546',
      cancelText: '再想想'
    })
      .then((res) => {
        if (res.confirm) {
          setMany(Object.keys(inv), false)
          Taro.showToast({ title: '已清空', icon: 'none' })
        }
      })
      .catch((e) => {
        console.error('[Cabinet] showModal failed:', e)
      })
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

  const goBar = () => {
    Taro.switchTab({ url: '/pages/bar/index' })
  }

  const generateAndGo = () => {
    if (!selectedCount) {
      Taro.showModal({
        title: '酒柜还是空的',
        content: '请先勾选家里现有的材料，再生成调酒清单',
        confirmText: '知道了',
        showCancel: false
      }).catch((e) => {
        console.error('[Cabinet] showModal failed:', e)
      })
      return
    }
    Taro.setStorageSync('should_generate_cocktails', '1')
    goBar()
  }

  return (
    <View className={styles.page} style={h5BottomStyle}>
      {/* 顶部 Hero */}
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>我的酒柜</Text>
        <Text className={styles.heroSub}>
          维护家里现有的原料库存，Bar 会自动据此推荐今晚能调的酒
        </Text>
        <View className={styles.heroRow}>
          <View className={styles.heroStat}>
            <Text className={styles.heroStatNum}>{selectedCount}</Text>
            <Text className={styles.heroStatLabel}>样已备材料</Text>
          </View>
        </View>
      </View>

      {/* 搜索 + 快捷操作 */}
      <View className={styles.toolbar}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索或新增原料'
            value={keyword}
            onInput={onSearchInput}
            confirmType='search'
          />
        </View>
        <View className={styles.quickRow}>
          <Text className={styles.quickBtn} onClick={fillDemo}>
            一键填入常见酒柜
          </Text>
          <Text
            className={classnames(styles.quickBtn, styles.quickGhost)}
            onClick={clearAll}
          >
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
          const catSelected =
            cat.items.filter(([id]) => inv[id]).length +
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

      <Text className={styles.tip}>
        库存会保存在本机，下次打开无需重新设置
      </Text>

      {/* 生成按钮 */}
      <View className={styles.generateBar} style={h5BottomStyle}>
        <Text className={styles.generateBtn} onClick={generateAndGo}>
          生成调酒清单
        </Text>
      </View>
    </View>
  )
}

export default CabinetPage