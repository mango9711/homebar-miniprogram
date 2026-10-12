import React, { useMemo, useState } from 'react'
import { View, Text, Textarea, Image } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import classnames from 'classnames'
import useBarStore from '@/store/useBarStore'
import { RECIPES } from '@/data/recipes'
import { STRENGTH_LABELS, makeName } from '@/data/categories'
import {
  TAG_COLORS,
  TAG_TEXT_COLOR,
  RATING_META
} from '@/data/tagColors'
import {
  garnishFor,
  ingredientTitle,
  ingsMlPerCup,
  recipeKey,
  scaleAmount
} from '@/utils/bar'
import { pickPhotos, MAX_PHOTOS } from '@/utils/image'
import type { Rating, Recipe as RecipeType } from '@/types'
import styles from './index.module.scss'

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6] // 仍保留常量但不用于 UI 渲染

function resolveRecipe(
  id: string,
  creative: boolean,
  creativeRecipes: RecipeType[],
  snapshots: Record<string, { snapshot: RecipeType }>
): RecipeType | null {
  if (creative) {
    const found = creativeRecipes.find((r) => recipeKey(r) === id)
    if (found) return found
  }
  const builtin = RECIPES.find((r) => r.id === id)
  if (builtin) return builtin
  return snapshots[id] ? snapshots[id].snapshot : null
}

function RecipePage() {
  const router = getCurrentInstance().router
  const id = router?.params.id || ''
  const isCreative = router?.params.creative === '1'

  const { inv, custom, creativeRecipes, records, profile, saveRecord } =
    useBarStore()
  const names = useMemo(() => makeName(custom), [custom])

  const recipe = useMemo(
    () => resolveRecipe(id, isCreative, creativeRecipes, records),
    [id, isCreative, creativeRecipes, records]
  )

  const [servings, setServings] = useState(1)
  const [doneSteps, setDoneSteps] = useState<Record<number, boolean>>({})
  const [showForm, setShowForm] = useState(false)
  const [draftRating, setDraftRating] = useState<Rating>('recommend')
  const [draftNote, setDraftNote] = useState('')
  const [draftPhotos, setDraftPhotos] = useState<string[]>([])
  const [picking, setPicking] = useState(false)

  const key = recipe ? recipeKey(recipe) : ''
  const savedRecord = key ? records[key] : undefined
  const perCup = recipe ? ingsMlPerCup(recipe.ingredients) : 0
  const doneCount = Object.values(doneSteps).filter(Boolean).length

  const toggleStep = (idx: number) => {
    setDoneSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const openForm = () => {
    setDraftRating(savedRecord?.rating || 'recommend')
    setDraftNote(savedRecord?.note || '')
    setDraftPhotos(savedRecord?.photos ? [...savedRecord.photos] : [])
    setShowForm(true)
  }

  const onNoteInput: CommonEventFunction<{ value: string }> = (e) => {
    setDraftNote(e.detail.value.slice(0, 600))
  }

  const choosePhotos = () => {
    if (picking) return
    const remain = MAX_PHOTOS - draftPhotos.length
    if (remain <= 0) {
      Taro.showToast({ title: `最多上传 ${MAX_PHOTOS} 张`, icon: 'none' })
      return
    }
    setPicking(true)
    Taro.showLoading({ title: '处理图片…', mask: true })
    pickPhotos(remain)
      .then((photos) => {
        if (photos.length) {
          setDraftPhotos((prev) => [...prev, ...photos].slice(0, MAX_PHOTOS))
        }
      })
      .catch((e) => {
        console.error('[Recipe] choose photos failed:', e)
      })
      .finally(() => {
        setPicking(false)
        Taro.hideLoading()
      })
  }

  const removePhoto = (idx: number) => {
    setDraftPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  const previewPhoto = (urls: string[], current: string) => {
    Taro.previewImage({ urls, current })
  }

  const submit = () => {
    if (!recipe) return
    saveRecord(recipe, draftRating, draftNote, draftPhotos)
    setShowForm(false)
    Taro.showToast({ title: '已记录', icon: 'success' })
  }

  if (!recipe) {
    return (
      <View className={styles.page}>
        <View className={styles.notFound}>
          <Text className={styles.notFoundText}>
            未找到该配方，可能是较早生成的创意特调
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      {/* 标题卡 */}
      <View className={styles.hero}>
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
        <Text className={styles.desc}>{recipe.desc}</Text>
      </View>

      {/* 份量与用量 */}
      <View className={styles.section}>
        <View className={styles.sectionHead}>
          <Text className={styles.sectionTitle}>配方用量</Text>
          <View className={styles.stepperBox}>
            <Text 
              className={classnames(styles.stepperBtn, servings <= 1 && styles.stepperBtnDisabled)} 
              onClick={() => servings > 1 && setServings(servings - 1)}
            >-</Text>
            <Text className={styles.stepperValue}>{servings} 杯 <Text className={styles.stepperDesc}>(约{perCup * servings}ml)</Text></Text>
            <Text 
              className={styles.stepperBtn} 
              onClick={() => setServings(servings + 1)}
            >+</Text>
          </View>
        </View>
        <View className={styles.ingList}>
          {recipe.ingredients.map((ing) => (
            <View key={ing.item} className={styles.ingItem}>
              <Text className={styles.ingName}>
                {names[ing.item] || ing.item}
                {ing.optional ? (
                  <Text className={styles.optionalTag}>（可选）</Text>
                ) : null}
              </Text>
              <Text className={styles.ingAmount}>
                {scaleAmount(ing.amount, servings)}
              </Text>
            </View>
          ))}
        </View>
        <View className={styles.garnishBox}>
          <Text className={styles.garnishLabel}>装饰</Text>
          <Text className={styles.garnishText}>
            {garnishFor(recipe, inv)}
          </Text>
        </View>
      </View>

      {/* 步骤 */}
      <View className={styles.section}>
        <View className={styles.sectionHead}>
          <Text className={styles.sectionTitle}>调制步骤</Text>
          <Text className={styles.progress}>
            {doneCount}/{recipe.steps.length}
          </Text>
        </View>
        {recipe.steps.map((step, idx) => (
          <View
            key={idx}
            className={classnames(
              styles.stepItem,
              doneSteps[idx] && styles.stepDone
            )}
            onClick={() => toggleStep(idx)}
          >
            <Text
              className={classnames(
                styles.stepNo,
                doneSteps[idx] && styles.stepNoDone
              )}
            >
              {doneSteps[idx] ? '✓' : idx + 1}
            </Text>
            <Text className={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* 我的记录 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>我的记录</Text>
        {savedRecord ? (
          <View className={styles.recordBox}>
            <View className={styles.recordTop}>
              <Text
                className={styles.ratingPill}
                style={{
                  backgroundColor: savedRecord.rating
                    ? RATING_META[savedRecord.rating].bg
                    : '#efe9db',
                  color: savedRecord.rating
                    ? RATING_META[savedRecord.rating].color
                    : '#4d564d'
                }}
              >
                {savedRecord.rating
                  ? `${RATING_META[savedRecord.rating].emoji} ${RATING_META[savedRecord.rating].label}`
                  : '未评分'}
              </Text>
            </View>
            {savedRecord.note ? (
              <Text className={styles.noteText}>{savedRecord.note}</Text>
            ) : (
              <Text className={styles.noteEmpty}>还没有写心得</Text>
            )}
            {savedRecord.photos && savedRecord.photos.length > 0 && (
              <View className={styles.photoStrip}>
                {savedRecord.photos.map((photo, idx) => (
                  <Image
                    key={idx}
                    className={styles.photoThumb}
                    src={photo}
                    mode='aspectFill'
                    onClick={() =>
                      previewPhoto(savedRecord.photos as string[], photo)
                    }
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text className={styles.noteEmpty}>调过这杯？记录你的评分和心得</Text>
        )}
        <Text className={styles.markBtn} onClick={openForm}>
          {savedRecord ? '编辑记录' : '标记我调过这杯'}
        </Text>
      </View>

      {/* 记录弹层 */}
      {showForm && (
        <View className={styles.mask} onClick={() => setShowForm(false)}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>记录这杯 · {recipe.name}</Text>

            <Text className={styles.modalLabel}>整体评价</Text>
            <View className={styles.ratingRow}>
              {(Object.keys(RATING_META) as Rating[]).map((r) => (
                <Text
                  key={r}
                  className={classnames(
                    styles.ratingOption,
                    draftRating === r && styles.ratingOptionActive
                  )}
                  style={
                    draftRating === r
                      ? {
                          backgroundColor: RATING_META[r].bg,
                          color: RATING_META[r].color,
                          borderColor: RATING_META[r].color
                        }
                      : undefined
                  }
                  onClick={() => setDraftRating(r)}
                >
                  {RATING_META[r].emoji} {RATING_META[r].label}
                </Text>
              ))}
            </View>

            <Text className={styles.modalLabel}>调酒心得（选填）</Text>
            <Textarea
              className={styles.textarea}
              placeholder='记录这次的味道、调整的用量…'
              value={draftNote}
              maxlength={600}
              onInput={onNoteInput}
              autoHeight
            />

            <View className={styles.photoLabelRow}>
              <Text className={styles.modalLabel}>调酒照片（选填）</Text>
              <Text className={styles.photoCount}>
                {draftPhotos.length}/{MAX_PHOTOS}
              </Text>
            </View>
            <View className={styles.photoGrid}>
              {draftPhotos.map((photo, idx) => (
                <View key={idx} className={styles.photoCell}>
                  <Image
                    className={styles.photoImg}
                    src={photo}
                    mode='aspectFill'
                    onClick={() => previewPhoto(draftPhotos, photo)}
                  />
                  <Text
                    className={styles.photoRemove}
                    onClick={() => removePhoto(idx)}
                  >
                    ×
                  </Text>
                </View>
              ))}
              {draftPhotos.length < MAX_PHOTOS && (
                <View className={styles.photoAdd} onClick={choosePhotos}>
                  <Text className={styles.photoAddIcon}>＋</Text>
                  <Text className={styles.photoAddText}>上传照片</Text>
                </View>
              )}
            </View>

            <View className={styles.modalActions}>
              <Text
                className={classnames(styles.modalBtn, styles.modalCancel)}
                onClick={() => setShowForm(false)}
              >
                取消
              </Text>
              <Text
                className={classnames(styles.modalBtn, styles.modalSave)}
                onClick={submit}
              >
                保存记录
              </Text>
            </View>
          </View>
        </View>
      )}

      <Text className={styles.footerHint}>
        {profile.nickname}，适量饮酒，微醺就好
      </Text>
    </View>
  )
}

export default RecipePage
