import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { History, CircleCheck } from 'lucide-react-taro'

interface WeightRecord {
  id: string
  record_date: string
  weight: string
  waist?: string
  note?: string
}

export default function CheckinPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [note, setNote] = useState('')
  const [todayRecord, setTodayRecord] = useState<WeightRecord | null>(null)
  const [recentRecords, setRecentRecords] = useState<WeightRecord[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    fetchTodayRecord()
    fetchRecentRecords()
  })

  const fetchTodayRecord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await Network.request({
        url: `/api/records/today?date=${today}`,
        method: 'GET'
      })
      console.log('今日记录:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        setTodayRecord(res.data.data)
        setWeight(res.data.data.weight || '')
        setWaist(res.data.data.waist || '')
        setNote(res.data.data.note || '')
      }
    } catch (error) {
      console.error('获取今日记录失败:', error)
    }
  }

  const fetchRecentRecords = async () => {
    try {
      const res = await Network.request({
        url: '/api/records/recent?days=7',
        method: 'GET'
      })
      console.log('最近记录:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        setRecentRecords(res.data.data)
      }
    } catch (error) {
      console.error('获取最近记录失败:', error)
    }
  }

  const handleDateChange = () => {
    Taro.showActionSheet({
      itemList: ['今天', '昨天', '前天', '选择日期'],
      success: (res) => {
        const today = new Date()
        if (res.tapIndex === 0) {
          setSelectedDate(today.toISOString().split('T')[0])
        } else if (res.tapIndex === 1) {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          setSelectedDate(yesterday.toISOString().split('T')[0])
        } else if (res.tapIndex === 2) {
          const dayBefore = new Date(today)
          dayBefore.setDate(dayBefore.getDate() - 2)
          setSelectedDate(dayBefore.toISOString().split('T')[0])
        } else if (res.tapIndex === 3) {
          // 可以集成日期选择器组件
          Taro.showToast({ title: '日期选择功能开发中', icon: 'none' })
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!weight) {
      Taro.showToast({ title: '请输入体重', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/records',
        method: 'POST',
        data: {
          record_date: selectedDate,
          weight: parseFloat(weight),
          waist: waist ? parseFloat(waist) : null,
          note: note || null
        }
      })
      console.log('提交结果:', res.data)
      
      if (res.data?.code === 200) {
        Taro.showToast({ title: '打卡成功', icon: 'success' })
        setWeight('')
        setWaist('')
        setNote('')
        fetchTodayRecord()
        fetchRecentRecords()
      }
    } catch (error) {
      console.error('打卡失败:', error)
      Taro.showToast({ title: '打卡失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[date.getDay()]
    return `${month}月${day}日 周${weekDay}`
  }

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0]
  }

  return (
    <View className="checkin-page">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">记录数据</Text>
        <View className="header-right" onClick={() => Taro.switchTab({ url: '/pages/data/index' })}>
          <History size={20} color="#6B7280" />
        </View>
      </View>

      {/* 主内容区域 */}
      <View className="main-content">
        {/* 今日打卡状态提示 */}
        <View className="checkin-status-card">
          <View className="checkin-status-icon">
            <CircleCheck size={20} color="#3C8D6E" />
          </View>
          <Text className="checkin-status-title">
            {todayRecord ? '今日已打卡' : '今日未打卡'}
          </Text>
        </View>

        {/* 打卡表单卡片 */}
        <View className="checkin-form-card">
          {/* 日期选择 */}
          <View className="form-item">
            <Text className="form-label">日期</Text>
            <View className="date-selector" onClick={handleDateChange}>
              <Text className="date-text">{formatDate(selectedDate)}</Text>
            </View>
          </View>

          {/* 体重输入 */}
          <View className="form-item">
            <Text className="form-label">体重</Text>
            <View className="input-wrapper">
              <input
                type="digit"
                className="form-input"
                placeholder="请输入体重"
                value={weight}
                onInput={(e: any) => setWeight(e.detail.value)}
              />
              <Text className="input-unit">kg</Text>
            </View>
          </View>

          {/* 腰围输入 */}
          <View className="form-item">
            <Text className="form-label">腰围</Text>
            <View className="input-wrapper">
              <input
                type="digit"
                className="form-input"
                placeholder="请输入腰围（选填）"
                value={waist}
                onInput={(e: any) => setWaist(e.detail.value)}
              />
              <Text className="input-unit">cm</Text>
            </View>
          </View>

          {/* 备注输入 */}
          <View className="form-item">
            <Text className="form-label">备注</Text>
            <View className="textarea-wrapper">
              <textarea
                className="form-textarea"
                placeholder="记录今天的心情或状态（选填）"
                value={note}
                onInput={(e: any) => setNote(e.detail.value)}
                maxLength={100}
              />
              <Text className="textarea-count">{note.length}/100</Text>
            </View>
          </View>

          {/* 提交按钮 */}
          <View 
            className={`submit-button ${loading ? 'submit-button-disabled' : ''}`}
            onClick={loading ? undefined : handleSubmit}
          >
            <Text className="submit-button-text">
              {loading ? '提交中...' : '提交打卡'}
            </Text>
          </View>
        </View>

        {/* 最近7天打卡记录 */}
        <View className="recent-section">
          <Text className="section-title">最近7天记录</Text>
          
          <View className="recent-list">
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => (
                <View key={record.id} className="recent-item">
                  <View className="recent-left">
                    <Text className="recent-date">{formatDate(record.record_date)}</Text>
                    {isToday(record.record_date) && (
                      <View className="recent-badge">
                        <Text className="recent-badge-text">今天</Text>
                      </View>
                    )}
                  </View>
                  <View className="recent-right">
                    <Text className="recent-weight">{record.weight}kg</Text>
                    {record.waist && (
                      <Text className="recent-waist">{record.waist}cm</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View className="recent-empty">
                <Text className="recent-empty-text">暂无记录，开始打卡吧</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
