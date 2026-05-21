import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { Scale, Ruler, Activity, Percent, FileText, Target, Bell, CircleCheck } from 'lucide-react-taro'
import './index.css'

interface UserInfo {
  id: string
  nickname: string
  height?: string
  target_weight?: string
  target_waist?: string
}

interface WeightRecord {
  id: string
  record_date: string
  weight: string
  waist?: string
}

interface HealthStats {
  currentWeight: number
  currentWaist: number
  bmi: number
  bodyFatRate: number
  bmiLevel: string
  bodyFatLevel: string
}

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [todayRecord, setTodayRecord] = useState<WeightRecord | null>(null)
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<WeightRecord[]>([])

  useDidShow(() => {
    fetchData()
  })

  const fetchData = async () => {
    try {
      // 获取用户信息
      const userRes = await Network.request({
        url: '/api/user/profile',
        method: 'GET'
      })
      console.log('用户信息:', userRes.data)
      
      if (userRes.data?.code === 200 && userRes.data?.data) {
        setUserInfo(userRes.data.data)
      }

      // 获取今日记录
      const today = new Date().toISOString().split('T')[0]
      const todayRes = await Network.request({
        url: `/api/records/today?date=${today}`,
        method: 'GET'
      })
      console.log('今日记录:', todayRes.data)
      
      if (todayRes.data?.code === 200 && todayRes.data?.data) {
        setTodayRecord(todayRes.data.data)
      }

      // 获取健康统计
      const statsRes = await Network.request({
        url: '/api/records/stats',
        method: 'GET'
      })
      console.log('健康统计:', statsRes.data)
      
      if (statsRes.data?.code === 200 && statsRes.data?.data) {
        setHealthStats(statsRes.data.data)
      }

      // 获取最近7天记录
      const recentRes = await Network.request({
        url: '/api/records/recent?days=7',
        method: 'GET'
      })
      console.log('最近记录:', recentRes.data)
      
      if (recentRes.data?.code === 200 && recentRes.data?.data) {
        setRecentRecords(recentRes.data.data)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    }
  }

  const goToCheckin = () => {
    Taro.switchTab({ url: '/pages/checkin/index' })
  }

  const goToData = () => {
    Taro.switchTab({ url: '/pages/data/index' })
  }

  const goToProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' })
  }


  // 计算距离目标的差值
  const getWeightDiff = () => {
    if (!healthStats?.currentWeight || !userInfo?.target_weight) return null
    const diff = healthStats.currentWeight - parseFloat(userInfo.target_weight)
    return diff > 0 ? `差 ${diff.toFixed(1)}kg` : `已达标 ${Math.abs(diff).toFixed(1)}kg`
  }

  return (
    <View className="home-page">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">健康管理</Text>
        <View className="header-right">
          <Bell size={26} color="#6B7280" />
        </View>
      </View>

      {/* 主内容区域 */}
      <View className="main-content">
        {/* 今日打卡状态提示 */}
        <View className="checkin-status-card">
          <View className="checkin-status-left">
            <View className="checkin-status-icon">
              <CircleCheck size={26} color="#3C8D6E" />
            </View>
            <View className="checkin-status-text">
              <Text className="checkin-status-title">
                {todayRecord ? '今日已打卡' : '今日未打卡'}
              </Text>
              <Text className="checkin-status-desc">坚持就是胜利，继续保持！</Text>
            </View>
          </View>
          <View className="checkin-button" onClick={goToCheckin}>
            <Text className="checkin-button-text">打卡</Text>
          </View>
        </View>

        {/* 健康指标概览 */}
        <View className="health-metrics-section">
          <View className="section-header">
            <Text className="section-title">健康指标</Text>
            <Text className="section-link" onClick={goToData}>查看全部</Text>
          </View>
          
          <View className="metrics-grid">
            {/* 体重卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-primary">
                  <Scale size={24} color="#F26B3A" />
                </View>
                <Text className="metric-label">体重</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.currentWeight?.toFixed(1) || '--'}
                <Text className="metric-unit">kg</Text>
              </Text>
              <View className="metric-extra">
                <Text className="metric-target">目标 {userInfo?.target_weight || 65}kg</Text>
                {getWeightDiff() && (
                  <Text className={getWeightDiff()?.includes('差') ? 'metric-diff metric-diff-warning' : 'metric-diff metric-diff-success'}>
                    {getWeightDiff()}
                  </Text>
                )}
              </View>
            </View>

            {/* 腰围卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-success">
                  <Ruler size={24} color="#3C8D6E" />
                </View>
                <Text className="metric-label">腰围</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.currentWaist?.toFixed(0) || '--'}
                <Text className="metric-unit">cm</Text>
              </Text>
              <View className="metric-extra">
                <Text className="metric-status metric-status-success">正常范围</Text>
              </View>
            </View>

            {/* BMI卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-primary">
                  <Activity size={24} color="#F26B3A" />
                </View>
                <Text className="metric-label">BMI</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.bmi?.toFixed(1) || '--'}
              </Text>
              <View className="metric-extra">
                <View className={`metric-badge metric-badge-${healthStats?.bmiLevel === '正常' ? 'success' : 'warning'}`}>
                  <Text className="metric-badge-text">{healthStats?.bmiLevel || '--'}</Text>
                </View>
              </View>
            </View>

            {/* 体脂率卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-warning">
                  <Percent size={24} color="#F59E0B" />
                </View>
                <Text className="metric-label">体脂率</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.bodyFatRate?.toFixed(1) || '--'}
                <Text className="metric-unit">%</Text>
              </Text>
              <View className="metric-extra">
                <Text className="metric-status metric-status-success">正常 15-20%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 近7天体重趋势图表 */}
        <View className="trend-section">
          <View className="section-header">
            <Text className="section-title">体重趋势</Text>
            <Text className="section-subtitle">近7天</Text>
          </View>
          
          <View className="trend-card">
            <View className="trend-chart">
              {recentRecords.length >= 2 ? (
                <svg viewBox="0 0 320 100" className="trend-svg">
                  {/* 网格线 */}
                  <line x1="0" y1="25" x2="320" y2="25" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="0" y1="50" x2="320" y2="50" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="0" y1="75" x2="320" y2="75" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  
                  {/* 渐变定义 */}
                  <defs>
                    <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F26B3A" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#F26B3A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* 折线区域填充 */}
                  <path d="M0,60 L53,55 L106,58 L159,50 L212,45 L265,48 L320,40 L320,100 L0,100 Z" 
                    fill="url(#weightGradient)" opacity="0.3"
                  />
                  
                  {/* 折线 */}
                  <path d="M0,60 L53,55 L106,58 L159,50 L212,45 L265,48 L320,40" 
                    stroke="#F26B3A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  />
                  
                  {/* 数据点 */}
                  <circle cx="0" cy="60" r="4" fill="#F26B3A" />
                  <circle cx="53" cy="55" r="4" fill="#F26B3A" />
                  <circle cx="106" cy="58" r="4" fill="#F26B3A" />
                  <circle cx="159" cy="50" r="4" fill="#F26B3A" />
                  <circle cx="212" cy="45" r="4" fill="#F26B3A" />
                  <circle cx="265" cy="48" r="4" fill="#F26B3A" />
                  <circle cx="320" cy="40" r="5" fill="#F26B3A" stroke="#fff" strokeWidth="2" />
                </svg>
              ) : (
                <View className="trend-empty">
                  <Text className="trend-empty-text">暂无数据，开始记录吧</Text>
                </View>
              )}
              
              {/* 当前值标注 */}
              {healthStats?.currentWeight && (
                <View className="trend-current-value">
                  <Text className="trend-current-text">{healthStats.currentWeight.toFixed(1)}kg</Text>
                </View>
              )}
            </View>
            
            {/* 日期标签 */}
            <View className="trend-labels">
              {['周一', '周二', '周三', '周四', '周五', '周六', '今天'].map((day, index) => (
                <Text key={index} className={`trend-label ${index === 6 ? 'trend-label-active' : ''}`}>{day}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* 快速操作区 */}
        <View className="quick-actions-section">
          <Text className="section-title">快速操作</Text>
          
          <View className="quick-actions-grid">
            {/* 一键打卡 */}
            <View className="quick-action-item" onClick={goToCheckin}>
              <View className="quick-action-icon quick-action-icon-primary">
                <CircleCheck size={28} color="#F26B3A" />
              </View>
              <Text className="quick-action-label">一键打卡</Text>
            </View>

            {/* 详细数据 */}
            <View className="quick-action-item" onClick={goToData}>
              <View className="quick-action-icon quick-action-icon-success">
                <FileText size={28} color="#3C8D6E" />
              </View>
              <Text className="quick-action-label">详细数据</Text>
            </View>

            {/* 设置目标 */}
            <View className="quick-action-item" onClick={goToProfile}>
              <View className="quick-action-icon quick-action-icon-warning">
                <Target size={28} color="#F59E0B" />
              </View>
              <Text className="quick-action-label">设置目标</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
