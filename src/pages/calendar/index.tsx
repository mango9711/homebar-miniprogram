import React, { useMemo, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import useBarStore from '@/store/useBarStore'
import type { MadeRecord } from '@/types'
import styles from './index.module.scss'

function CalendarPage() {
  const { records } = useBarStore()

  const recordList = useMemo(
    () => Object.values(records).sort((a, b) => b.updatedAt - a.updatedAt),
    [records]
  )

  const recordsByDate = useMemo(() => {
    const map: Record<string, MadeRecord> = {}
    recordList.forEach((r) => {
      const dateStr = dayjs(r.updatedAt).format('YYYY-MM-DD')
      if (!map[dateStr] || (!map[dateStr].photos?.length && r.photos?.length)) {
        map[dateStr] = r
      }
    })
    return map
  }, [recordList])

  // 计算需要展示的月份列表（从最早的一条记录到当前月份）
  const monthList = useMemo(() => {
    let startMonth = dayjs().startOf('month')
    if (recordList.length > 0) {
      const earliestRecord = recordList[recordList.length - 1]
      startMonth = dayjs(earliestRecord.updatedAt).startOf('month')
    }
    
    const currentMonth = dayjs().startOf('month')
    const months: dayjs.Dayjs[] = []
    
    let iter = startMonth
    while (iter.isBefore(currentMonth) || iter.isSame(currentMonth, 'month')) {
      months.push(iter)
      iter = iter.add(1, 'month')
    }
    
    return months
  }, [recordList])

  useEffect(() => {
    // 页面加载后自动滚动到底部
    setTimeout(() => {
      Taro.pageScrollTo({
        scrollTop: 99999,
        duration: 0
      })
    }, 100)
  }, [])

  const renderCalendarGrid = (month: dayjs.Dayjs) => {
    const startOfMonth = month.startOf('month')
    const daysInMonth = month.daysInMonth()
    const startDayOfWeek = startOfMonth.day() // 0 = Sun
    
    const isCurrentMonth = month.isSame(dayjs(), 'month')
    const currentDay = dayjs().date()
    
    // 如果是当月，我们只需要渲染到当前天所在的行即可，不需要渲染整月的行数
    // 计算当前天在日历网格中的索引 (0-based)
    const currentDayIndex = startDayOfWeek + currentDay - 1
    // 计算需要渲染的总格子数（向上取整到整周）
    const totalCellsToRender = isCurrentMonth 
      ? Math.ceil((currentDayIndex + 1) / 7) * 7 
      : startDayOfWeek + daysInMonth
      
    // 计算实际需要渲染的“未来天数”空白格子，以补齐当前周
    const futureEmptyCellsCount = isCurrentMonth
      ? totalCellsToRender - (startDayOfWeek + currentDay)
      : 0

    const blanks = Array.from({ length: startDayOfWeek }).map((_, i) => (
      <View key={`blank-${i}`} className={styles.calCellEmpty} />
    ))

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayNum = i + 1
      if (isCurrentMonth && dayNum > currentDay) {
        return null // 先不在这里渲染未来天数，后面统一用 futureBlanks 补齐整周
      }

      const date = startOfMonth.add(i, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const record = recordsByDate[dateStr]
      const isToday = dateStr === dayjs().format('YYYY-MM-DD')

      const handleCellClick = () => {
        if (record) {
          const isCreative = record.key.startsWith('cre_')
          Taro.navigateTo({
            url: `/pages/recipe/index?id=${record.key}&creative=${isCreative ? '1' : '0'}`
          })
        }
      }

      let content = <Text className={classnames(styles.calDateNum, isToday && styles.calDateToday)}>{dayNum}</Text>

      if (record) {
        const photo = record.photos?.[0]
        if (photo) {
          content = (
            <View className={styles.calPhotoWrapper} onClick={handleCellClick}>
              <Image src={photo} mode='aspectFill' className={styles.calPhoto} />
              <Text className={styles.calDateOverlay}>{dayNum}</Text>
            </View>
          )
        } else {
          content = (
            <View className={styles.calIconWrapper} onClick={handleCellClick}>
              <Text className={styles.calIcon}>🍸</Text>
              <Text className={styles.calDateOverlayIcon}>{dayNum}</Text>
            </View>
          )
        }
      }

      return (
        <View key={dateStr} className={styles.calCell}>
          {content}
        </View>
      )
    })
    
    const futureBlanks = Array.from({ length: futureEmptyCellsCount }).map((_, i) => (
      <View key={`future-blank-${i}`} className={styles.calCellEmpty} />
    ))

    return (
      <View className={styles.calendarGrid}>
        {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
          <Text key={d} className={styles.calWeekDay}>{d}</Text>
        ))}
        {blanks}
        {days}
        {futureBlanks}
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.monthListContainer}>
        {monthList.map((month) => (
          <View key={month.format('YYYY-MM')} className={styles.monthBlock}>
            <View className={styles.fullCalendarHead}>
              <Text className={styles.fullCalendarTitle}>{month.format('YYYY年M月')}</Text>
            </View>
            {renderCalendarGrid(month)}
          </View>
        ))}
      </View>
    </View>
  )
}

export default CalendarPage
