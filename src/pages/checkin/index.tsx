import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Network } from '@/network'
import { Check, Calendar, History } from 'lucide-react-taro'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import './index.css'

interface TodayRecord {
  id: string
  weight: string
  waist: string
  record_date: string
}

interface RecentRecord {
  record_date: string
  weight: string
  waist: string
}

export default function CheckinPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [note, setNote] = useState('')
  const [todayRecord, setTodayRecord] = useState<TodayRecord | null>(null)
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [todayRes, recentRes] = await Promise.all([
        Network.request({ url: '/api/records/today', data: { date: today } }),
        Network.request({ url: '/api/records/recent', data: { days: 7 } })
      ])

      console.log('今日记录响应:', todayRes)
      console.log('最近记录响应:', recentRes)

      if (todayRes.data?.data) {
        setTodayRecord(todayRes.data.data)
        setWeight(todayRes.data.data.weight || '')
        setWaist(todayRes.data.data.waist || '')
      }

      if (recentRes.data?.data && Array.isArray(recentRes.data.data)) {
        setRecentRecords(recentRes.data.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleSubmit = async () => {
    if (!weight) {
      Taro.showToast({ title: '请输入体重', icon: 'none' })
      return
    }
    if (!waist) {
      Taro.showToast({ title: '请输入腰围', icon: 'none' })
      return
    }

    try {
      await Network.request({
        url: '/api/records',
        method: 'POST',
        data: {
          record_date: selectedDate,
          weight,
          waist,
          note
        }
      })

      Taro.showToast({ title: '打卡成功！', icon: 'success' })
      
      // 重新加载数据
      loadData()
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '提交失败', icon: 'error' })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return { date: `${date.getMonth() + 1}月${date.getDate()}日`, label: '今天' }
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return { date: `${date.getMonth() + 1}月${date.getDate()}日`, label: '昨天' }
    } else {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return { 
        date: `${date.getMonth() + 1}月${date.getDate()}日`, 
        label: weekDays[date.getDay()] 
      }
    }
  }

  return (
    <View className="page-container">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">记录数据</Text>
        <View 
          className="header-right"
          onClick={() => Taro.switchTab({ url: '/pages/data/index' })}
        >
          <History size={20} color="#6B7280" />
        </View>
      </View>

      <View className="main-content">
        {/* 今日打卡状态提示 */}
        <View className="checkin-tip">
          <View className="checkin-tip-icon">
            <Check size={20} color="#3C8D6E" />
          </View>
          <View className="checkin-tip-content">
            <Text className="checkin-tip-title">
              {todayRecord ? '今日已打卡' : '今日未打卡'}
            </Text>
            <Text className="checkin-tip-subtitle">坚持就是胜利，继续保持！</Text>
          </View>
        </View>

        {/* 打卡表单卡片 */}
        <View className="form-card">
          {/* 日期选择 */}
          <View className="form-item">
            <Text className="form-label">打卡日期</Text>
            <View className="input-wrapper">
              <Input 
                type="text"
                placeholder="选择日期"
                value={selectedDate}
                onInput={(e) => setSelectedDate(e.detail.value)}
                className="input-field"
              />
              <View className="input-icon">
                <Calendar size={20} color="#6B7280" />
              </View>
            </View>
            <Text className="form-hint">可选择历史日期补录数据</Text>
          </View>

          {/* 体重输入 */}
          <View className="form-item">
            <Text className="form-label">体重</Text>
            <View className="input-wrapper">
              <Input 
                type="digit"
                placeholder="请输入体重"
                value={weight}
                onInput={(e) => setWeight(e.detail.value)}
                className="input-field"
              />
              <Text className="input-unit">kg</Text>
            </View>
          </View>

          {/* 腰围输入 */}
          <View className="form-item">
            <Text className="form-label">腰围</Text>
            <View className="input-wrapper">
              <Input 
                type="digit"
                placeholder="请输入腰围"
                value={waist}
                onInput={(e) => setWaist(e.detail.value)}
                className="input-field"
              />
              <Text className="input-unit">cm</Text>
            </View>
          </View>

          {/* 备注输入 */}
          <View className="form-item">
            <Text className="form-label">
              备注 <Text className="form-label-optional">(可选)</Text>
            </Text>
            <Textarea 
              placeholder="记录今天的感受或变化..."
              maxlength={100}
              value={note}
              onInput={(e) => setNote(e.detail.value)}
              className="textarea-field"
            />
            <View className="textarea-count">
              <Text className="textarea-count-text">{note.length}/100</Text>
            </View>
          </View>

          {/* 提交按钮 */}
          <View className="submit-button" onClick={handleSubmit}>
            <Check size={20} color="#ffffff" />
            <Text className="submit-button-text">提交打卡</Text>
          </View>
        </View>

        {/* 最近7天打卡记录 */}
        <View className="recent-section">
          <View className="recent-header">
            <Text className="recent-title">最近7天记录</Text>
            <Text 
              className="recent-link"
              onClick={() => Taro.switchTab({ url: '/pages/data/index' })}
            >
              查看全部
            </Text>
          </View>
          
          <View className="recent-list">
            {Array.isArray(recentRecords) && recentRecords.length > 0 ? (
              recentRecords.map((record, index) => {
                const { date, label } = formatDate(record.record_date)
                return (
                  <View 
                    key={record.record_date}
                    className={index < recentRecords.length - 1 ? 'recent-item recent-item-border' : 'recent-item'}
                  >
                    <View className="recent-item-left">
                      <Text className="recent-item-date">{date}</Text>
                      <Text className="recent-item-label">{label}</Text>
                    </View>
                    <View className="recent-item-right">
                      <Text className="recent-item-value">
                        {record.weight}<Text className="recent-item-unit">kg</Text>
                      </Text>
                      <Text className="recent-item-value">
                        {record.waist}<Text className="recent-item-unit">cm</Text>
                      </Text>
                    </View>
                  </View>
                )
              })
            ) : (
              <View className="recent-empty">
                <Text className="recent-empty-text">暂无打卡记录</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
