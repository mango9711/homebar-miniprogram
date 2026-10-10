import React, { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import useBarStore from '@/store/useBarStore'
import RecipeCard from '@/components/RecipeCard'
import { makeName } from '@/data/categories'
import { QUIZ_QUESTIONS, describeAnswers } from '@/data/quiz'
import { matchByQuiz } from '@/utils/bar'
import type { Scored } from '@/types'
import styles from './index.module.scss'

const TOTAL = QUIZ_QUESTIONS.length
const MAX_CARDS = 6
const MAX_HINTS = 3

function QuizPage() {
  const { inv, custom } = useBarStore()
  const names = useMemo(() => makeName(custom), [custom])

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)

  // 结果直接由「答卷 + 当前库存」推导，库存变化时会自动重算
  const ranked = useMemo(
    () => (finished ? matchByQuiz(answers, inv) : []),
    [finished, answers, inv]
  )
  const ready = useMemo(() => ranked.filter((r) => r.score === 0), [ranked])
  const near = useMemo(() => ranked.filter((r) => r.score > 0), [ranked])

  const cards = ready.slice(0, MAX_CARDS)
  const hints = (ready.length ? near : ranked).slice(0, MAX_HINTS)
  const hasInv = Object.keys(inv).length > 0
  const path = useMemo(() => describeAnswers(answers), [answers])

  const question = QUIZ_QUESTIONS[step]

  const choose = (optionId: string) => {
    const next = { ...answers, [question.id]: optionId }
    setAnswers(next)
    if (step + 1 < TOTAL) {
      setStep(step + 1)
      return
    }
    setFinished(true)
    Taro.pageScrollTo({ scrollTop: 0, duration: 200 }).catch((e) => {
      console.error('[Quiz] scroll failed:', e)
    })
  }

  const back = () => {
    if (finished) {
      setFinished(false)
      setStep(TOTAL - 1)
      return
    }
    if (step > 0) setStep(step - 1)
  }

  const restart = () => {
    setAnswers({})
    setStep(0)
    setFinished(false)
    Taro.pageScrollTo({ scrollTop: 0, duration: 200 }).catch((e) => {
      console.error('[Quiz] scroll failed:', e)
    })
  }

  const goCabinet = () => {
    Taro.switchTab({ url: '/pages/cabinet/index' })
  }

  const openRecipe = (data: Scored) => {
    Taro.navigateTo({ url: `/pages/recipe/index?id=${data.recipe.id}` })
  }

  const missText = (missing: string[]) => {
    const head = missing
      .slice(0, 3)
      .map((id) => names[id] || id)
      .join('、')
    return missing.length > 3 ? `${head} 等 ${missing.length} 样` : head
  }

  return (
    <View className={styles.page}>
      {!finished ? (
        <View className={styles.quizWrap}>
          {/* 进度 */}
          <View className={styles.progressRow}>
            <Text className={styles.progressText}>
              第 {step + 1} 题 / 共 {TOTAL} 题
            </Text>
          </View>
          <View className={styles.progressTrack}>
            <View
              className={styles.progressFill}
              style={{ width: `${(step / TOTAL) * 100}%` }}
            />
          </View>

          {/* 题目 */}
          <View className={styles.question}>
            <Text className={styles.qTitle}>{question.title}</Text>
            <Text className={styles.qHint}>{question.hint}</Text>
          </View>

          {/* 选项 */}
          <View className={styles.options}>
            {question.options.map((opt) => (
              <View
                key={opt.id}
                className={classnames(
                  styles.option,
                  answers[question.id] === opt.id && styles.optionActive
                )}
                onClick={() => choose(opt.id)}
              >
                <Text className={styles.optionLabel}>{opt.label}</Text>
                <Text className={styles.optionSub}>{opt.sub}</Text>
              </View>
            ))}
          </View>

          {step > 0 && (
            <View className={styles.quizFooter}>
              <Text className={styles.backLink} onClick={back}>
                ← 上一题
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View className={styles.result}>
          {/* 决策路径 */}
          <View className={styles.resultHero}>
            <Text className={styles.resultTitle}>
              {ready.length ? '按你的口味，这几杯最对味' : '按你的口味，现有库存还差一点'}
            </Text>
            <Text className={styles.resultSub}>
              {ready.length
                ? `在 ${ready.length} 款用现有库存就能调出的酒里，按契合度排了序`
                : '下面几款和你的口味最接近，补上标出的材料就能调'}
            </Text>
            {path.length > 0 && (
              <View className={styles.pathRow}>
                {path.map((p) => (
                  <Text key={p} className={styles.pathChip}>
                    {p}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* 空酒柜提醒 */}
          {!hasInv && (
            <View className={styles.invNotice} onClick={goCabinet}>
              <View className={styles.invNoticeInfo}>
                <Text className={styles.invNoticeTitle}>酒柜还是空的</Text>
                <Text className={styles.invNoticeSub}>
                  先去勾选家里现有的材料，推荐会更准
                </Text>
              </View>
              <Text className={styles.invNoticeLink}>去备料 &gt;</Text>
            </View>
          )}

          {/* 推荐酒单 */}
          {cards.map((data, idx) => (
            <RecipeCard
              key={data.recipe.id}
              data={data}
              index={idx}
              names={names}
              onOpen={() => openRecipe(data)}
            />
          ))}

          {/* 还差一点的 */}
          {hints.length > 0 && (
            <View className={styles.hintCard}>
              <Text className={styles.hintTitle}>
                {ready.length ? '想换换口味？补齐这些就能解锁' : '补齐这些材料就能解锁'}
              </Text>
              {hints.map((s) => (
                <View
                  key={s.recipe.id}
                  className={styles.hintRow}
                  onClick={() => openRecipe(s)}
                >
                  <Text className={styles.hintName}>{s.recipe.name}</Text>
                  <Text className={styles.hintMiss}>
                    还差：{missText(s.missing)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View className={styles.resultActions}>
            <Text className={styles.againBtn} onClick={restart}>
              重新回答一遍
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default QuizPage