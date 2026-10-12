import React, { useMemo, useState } from 'react'
import { View, Text, Image, Input, Button } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import useBarStore from '@/store/useBarStore'
import { makeName } from '@/data/categories'
import { RATING_META } from '@/data/tagColors'
import type { MadeRecord, Rating } from '@/types'
import styles from './index.module.scss'

function MePage() {
  const { records, profile, custom, setProfile, deleteRecord } = useBarStore()
  const names = useMemo(() => makeName(custom), [custom])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingName, setEditingName] = useState(false)

  const recordList = useMemo(
    () => Object.values(records).sort((a, b) => b.updatedAt - a.updatedAt),
    [records]
  )

  const recordsByDate = useMemo(() => {
    const map: Record<string, MadeRecord> = {}
    recordList.forEach((r) => {
      const dateStr = dayjs(r.updatedAt).format('YYYY-MM-DD')
      // 如果当天还没记录，或者已有记录没图而当前记录有图，就替换（优先展示有图的）
      if (!map[dateStr] || (!map[dateStr].photos?.length && r.photos?.length)) {
        map[dateStr] = r
      }
    })
    return map
  }, [recordList])
  const recommendCount = recordList.filter(
    (r) => r.rating === 'recommend'
  ).length

  const onChooseAvatar = async (e: any) => {
    const avatarUrl = e.detail.avatarUrl
    if (!avatarUrl) return

    // 直接保存到本地，完全不走云开发
    Taro.saveFile({ tempFilePath: avatarUrl })
      .then((saved) => {
        setProfile({ avatar: saved.savedFilePath })
      })
      .catch((err) => {
        console.warn('[Me] saveFile failed, use temp path:', err)
        setProfile({ avatar: avatarUrl })
      })
  }

  const onNameBlur = (e: any) => {
    const nickname = e.detail.value.trim()
    if (!nickname) return
    setProfile({ nickname })
    setEditingName(false)
  }

  const openEditName = () => {
    setEditingName(true)
  }

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const removeRecord = (record: MadeRecord) => {
    Taro.showModal({
      title: '删除这条调酒记录？',
      content: '将同时删除评分与心得，且无法恢复',
      confirmText: '删除',
      confirmColor: '#d25546',
      cancelText: '再想想'
    })
      .then((res) => {
        if (res.confirm) {
          deleteRecord(record.key)
          Taro.showToast({ title: '已删除', icon: 'none' })
        }
      })
      .catch((e) => {
        console.error('[Me] showModal failed:', e)
      })
  }

  const goCabinet = () => {
    Taro.switchTab({ url: '/pages/cabinet/index' })
  }

  const goCalendar = () => {
    Taro.navigateTo({ url: '/subpages/calendar/index' })
  }

  return (
    <View className={styles.page}>
      {/* 个人信息卡 */}
      <View className={styles.profileCard}>
        <Button className={styles.avatarBtn} openType="chooseAvatar" onChooseAvatar={onChooseAvatar}>
          {profile.avatar ? (
            <Image
              className={styles.avatar}
              src={profile.avatar}
              mode='aspectFill'
              onError={(e) => console.error('[Me] avatar load error:', e)}
            />
          ) : (
            <Text className={styles.avatarFallback}>
              {profile.nickname.slice(0, 1)}
            </Text>
          )}
        </Button>
        <View className={styles.profileInfo}>
          <View className={styles.nameRow}>
            <Text className={styles.nickname}>{profile.nickname}</Text>
            <View className={styles.editIconWrapper} onClick={openEditName}>
              <View className={styles.editIconPen}></View>
            </View>
          </View>
          <Text className={styles.drinkCount}>调过 {recordList.length} 杯</Text>
        </View>
      </View>

      {/* 调酒详情标题及入口 */}
      <View className={styles.listHeader}>
        <Text className={styles.listTitle}>调酒详情</Text>
        <View className={styles.calendarMore} onClick={goCalendar}>
          <Text>调酒日历</Text>
          <Text className={styles.moreIcon}>&gt;</Text>
        </View>
      </View>

      {recordList.length === 0 ? (
        <View className={styles.emptyBox}>
          <Text className={styles.emptyEmoji}>🍸</Text>
          <Text className={styles.emptyText}>还没有调酒记录</Text>
          <Text className={styles.emptyHint}>
            去「酒柜」维护好库存，就能调出第一杯了
          </Text>
          <Text className={styles.emptyBtn} onClick={goCabinet}>
            去备料
          </Text>
        </View>
      ) : (
        recordList.map((record) => {
          const { snapshot } = record
          const isOpen = !!expanded[record.key]
          const ratingMeta: Rating | undefined = record.rating
          return (
            <View key={record.key} className={styles.recordCard}>
              <View className={styles.recordHead}>
                <Text className={styles.recordName}>{snapshot.name}</Text>
              </View>

              <View className={styles.recordMeta}>
                {ratingMeta ? (
                  <Text
                    className={styles.ratingPill}
                    style={{
                      backgroundColor: RATING_META[ratingMeta].bg,
                      color: RATING_META[ratingMeta].color
                    }}
                  >
                    {RATING_META[ratingMeta].emoji}{' '}
                    {RATING_META[ratingMeta].label}
                  </Text>
                ) : (
                  <Text className={styles.ratingPill}>未评分</Text>
                )}
                <Text className={styles.date}>
                  {dayjs(record.updatedAt).format('YYYY-MM-DD')}
                </Text>
              </View>

              {record.note ? (
                <Text className={styles.note}>{record.note}</Text>
              ) : null}

              {record.photos && record.photos.length > 0 && (
                <View className={styles.photoGrid}>
                  {record.photos.map((photo, idx) => (
                    <Image
                      key={idx}
                      className={styles.photoItem}
                      src={photo}
                      mode='aspectFill'
                      onClick={() =>
                        Taro.previewImage({
                          urls: record.photos as string[],
                          current: photo
                        })
                      }
                    />
                  ))}
                </View>
              )}

              <Text
                className={styles.expandBtn}
                onClick={() => toggleExpand(record.key)}
              >
                {isOpen ? '收起配方 ⌃' : '展开配方 ⌄'}
              </Text>

              {isOpen && (
                <View className={styles.snapshotBox}>
                  <View className={styles.snapSection}>
                    {snapshot.ingredients.map((ing) => (
                      <View key={ing.item} className={styles.snapIng}>
                        <Text className={styles.snapIngName}>
                          {names[ing.item] || ing.item}
                          {ing.optional ? (
                            <Text className={styles.snapOptional}>
                              （可选）
                            </Text>
                          ) : null}
                        </Text>
                        <Text className={styles.snapIngAmount}>
                          {ing.amount}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {snapshot.garnish ? (
                    <Text className={styles.snapGarnish}>
                      装饰：{snapshot.garnish}
                    </Text>
                  ) : null}
                  <View className={styles.snapSteps}>
                    {snapshot.steps.map((step, idx) => (
                      <View key={idx} className={styles.snapStep}>
                        <Text className={styles.snapStepNo}>{idx + 1}</Text>
                        <Text className={styles.snapStepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View
                className={styles.deleteBtn}
                onClick={() => removeRecord(record)}
              >
                <View className={styles.deleteIconLid}></View>
                <View className={styles.deleteIconBin}></View>
              </View>
            </View>
          )
        })
      )}

      {/* 编辑昵称弹层 */}
      {editingName && (
        <View className={styles.mask} onClick={() => setEditingName(false)}>
          <View
            className={styles.nameModal}
            onClick={(e) => e.stopPropagation()}
          >
            <Text className={styles.nameModalTitle}>编辑昵称</Text>
            <Input
              type="nickname"
              className={styles.nameModalInput}
              placeholder='给自己起个调酒名号'
              maxlength={20}
              onBlur={onNameBlur}
            />
            <Text className={styles.nameHint}>请在上方输入或选择微信昵称，完成后点击空白处保存</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default MePage
