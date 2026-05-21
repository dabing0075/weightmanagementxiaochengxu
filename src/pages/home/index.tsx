import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Network } from '@/network'
import {
  Bell,
  Check,
  Scale,
  Ruler,
  Activity,
  Percent,
  FileText,
  Target
} from 'lucide-react-taro'
import './index.css'

interface UserInfo {
  id: string
  nickname: string
  gender: string
  height: string
  target_weight: string
  target_waist: string
}

interface TodayRecord {
  id: string
  weight: string
  waist: string
  record_date: string
}

interface HealthStats {
  currentWeight: number
  currentWaist: number
  bmi: number
  bodyFatRate: number
  bmiLevel: string
  bodyFatLevel: string
}

interface RecentRecord {
  record_date: string
  weight: string
  waist: string
}

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [todayRecord, setTodayRecord] = useState<TodayRecord | null>(null)
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userRes, todayRes, statsRes, recentRes] = await Promise.all([
        Network.request({ url: '/api/user/profile' }),
        Network.request({ url: '/api/records/today', data: { date: new Date().toISOString().split('T')[0] } }),
        Network.request({ url: '/api/records/stats' }),
        Network.request({ url: '/api/records/recent', data: { days: 7 } })
      ])

      console.log('用户信息:', userRes)
      console.log('今日记录:', todayRes)
      console.log('健康统计:', statsRes)
      console.log('最近记录:', recentRes)

      if (userRes.data?.data) setUserInfo(userRes.data.data)
      if (todayRes.data?.data) setTodayRecord(todayRes.data.data)
      if (statsRes.data?.data) setHealthStats(statsRes.data.data)
      if (recentRes.data?.data && Array.isArray(recentRes.data.data)) setRecentRecords(recentRes.data.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const getBmiColor = (level: string) => {
    const colors: Record<string, string> = {
      '偏瘦': '#F59E0B',
      '正常': '#3C8D6E',
      '超重': '#F59E0B',
      '肥胖': '#EF4444'
    }
    return colors[level] || '#6B7280'
  }

  const getBodyFatColor = (level: string) => {
    const colors: Record<string, string> = {
      '偏低': '#F59E0B',
      '正常': '#3C8D6E',
      '偏高': '#F59E0B',
      '过高': '#EF4444'
    }
    return colors[level] || '#6B7280'
  }

  const generateTrendPath = () => {
    if (!Array.isArray(recentRecords) || recentRecords.length === 0) return ''
    
    const weights = recentRecords.map(r => parseFloat(r.weight))
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const range = maxWeight - minWeight || 1
    
    const points = recentRecords.map((record, index) => {
      const x = (index / (recentRecords.length - 1)) * 320
      const y = 100 - ((parseFloat(record.weight) - minWeight) / range) * 80
      return `${x},${y}`
    }).join(' L')
    
    return `M${points}`
  }

  const weightDiff = userInfo && healthStats && healthStats.currentWeight
    ? (healthStats.currentWeight - parseFloat(userInfo.target_weight)).toFixed(1)
    : '0'

  return (
    <View className="page-container">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">健康管理</Text>
        <View className="header-right">
          <Bell size={20} color="#6B7280" />
        </View>
      </View>

      <View className="main-content">
        {/* 今日打卡状态提示 */}
        <View className="checkin-status-card">
          <View className="checkin-status-left">
            <View className="checkin-icon">
              <Check size={20} color="#3C8D6E" />
            </View>
            <View>
              <Text className="checkin-title">{todayRecord ? '今日已打卡' : '今日未打卡'}</Text>
              <Text className="checkin-subtitle">坚持就是胜利，继续保持！</Text>
            </View>
          </View>
          <View 
            className="checkin-button"
            onClick={() => Taro.switchTab({ url: '/pages/checkin/index' })}
          >
            <Text className="checkin-button-text">打卡</Text>
          </View>
        </View>

        {/* 健康指标概览 */}
        <View className="section">
          <View className="section-header">
            <Text className="section-title">健康指标</Text>
            <Text 
              className="section-link"
              onClick={() => Taro.switchTab({ url: '/pages/data/index' })}
            >
              查看全部
            </Text>
          </View>
          
          <View className="metrics-grid">
            {/* 体重卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-primary">
                  <Scale size={16} color="#F26B3A" />
                </View>
                <Text className="metric-label">体重</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.currentWeight || '--'}
                <Text className="metric-unit">kg</Text>
              </Text>
              <View className="metric-footer">
                <Text className="metric-target">目标 {userInfo?.target_weight || '--'}kg</Text>
                <Text className="metric-diff">差 {Math.abs(parseFloat(weightDiff))}kg</Text>
              </View>
            </View>

            {/* 腰围卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-success">
                  <Ruler size={16} color="#3C8D6E" />
                </View>
                <Text className="metric-label">腰围</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.currentWaist || '--'}
                <Text className="metric-unit">cm</Text>
              </Text>
              <View className="metric-footer">
                <Text className="metric-status metric-status-success">正常范围</Text>
              </View>
            </View>

            {/* BMI卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-primary">
                  <Activity size={16} color="#F26B3A" />
                </View>
                <Text className="metric-label">BMI</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.bmi ? healthStats.bmi.toFixed(1) : '--'}
              </Text>
              <View className="metric-footer">
                <View 
                  className="metric-badge"
                  style={{ backgroundColor: `${getBmiColor(healthStats?.bmiLevel || '')}15` }}
                >
                  <Text 
                    className="metric-badge-text"
                    style={{ color: getBmiColor(healthStats?.bmiLevel || '') }}
                  >
                    {healthStats?.bmiLevel || '--'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 体脂率卡片 */}
            <View className="metric-card">
              <View className="metric-header">
                <View className="metric-icon metric-icon-warning">
                  <Percent size={16} color="#F59E0B" />
                </View>
                <Text className="metric-label">体脂率</Text>
              </View>
              <Text className="metric-value">
                {healthStats?.bodyFatRate ? healthStats.bodyFatRate.toFixed(1) : '--'}
                <Text className="metric-unit">%</Text>
              </Text>
              <View className="metric-footer">
                <Text 
                  className="metric-status"
                  style={{ color: getBodyFatColor(healthStats?.bodyFatLevel || '') }}
                >
                  正常 15-20%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 近7天体重趋势图表 */}
        <View className="section">
          <View className="section-header">
            <Text className="section-title">体重趋势</Text>
            <Text className="section-subtitle">近7天</Text>
          </View>
          
          <View className="trend-card">
            <View className="trend-chart">
              {recentRecords.length > 0 ? (
                <svg viewBox="0 0 320 100" className="trend-svg">
                  {/* 网格线 */}
                  <line x1="0" y1="25" x2="320" y2="25" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="0" y1="50" x2="320" y2="50" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="0" y1="75" x2="320" y2="75" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  
                  {/* 折线区域填充 */}
                  <path 
                    d={`${generateTrendPath()} L320,100 L0,100 Z`}
                    fill="url(#gradient)"
                    opacity="0.3"
                  />
                  
                  {/* 折线 */}
                  <path 
                    d={generateTrendPath()}
                    stroke="#F26B3A"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* 数据点 */}
                  {Array.isArray(recentRecords) && recentRecords.map((record, index) => {
                    const weights = recentRecords.map(r => parseFloat(r.weight))
                    const minWeight = Math.min(...weights)
                    const maxWeight = Math.max(...weights)
                    const range = maxWeight - minWeight || 1
                    const x = (index / (recentRecords.length - 1)) * 320
                    const y = 100 - ((parseFloat(record.weight) - minWeight) / range) * 80
                    const isLast = index === recentRecords.length - 1
                    
                    return (
                      <circle 
                        key={index}
                        cx={x}
                        cy={y}
                        r={isLast ? 5 : 4}
                        fill="#F26B3A"
                        stroke={isLast ? '#fff' : undefined}
                        strokeWidth={isLast ? 2 : 0}
                      />
                    )
                  })}
                  
                  {/* 渐变定义 */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F26B3A" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#F26B3A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <View className="trend-empty">
                  <Text className="trend-empty-text">暂无数据</Text>
                </View>
              )}
              
              {/* 当前值标注 */}
              {healthStats && (
                <View className="trend-label">
                  <Text className="trend-label-text">{healthStats.currentWeight}kg</Text>
                </View>
              )}
            </View>
            
            {/* 日期标签 */}
            <View className="trend-dates">
              {['周一', '周二', '周三', '周四', '周五', '周六', '今天'].map((day, index) => (
                <Text 
                  key={index}
                  className={index === 6 ? 'trend-date-active' : 'trend-date'}
                >
                  {day}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* 快速操作区 */}
        <View className="section">
          <Text className="section-title">快速操作</Text>
          
          <View className="quick-actions">
            <View 
              className="quick-action"
              onClick={() => Taro.switchTab({ url: '/pages/checkin/index' })}
            >
              <View className="quick-action-icon quick-action-icon-primary">
                <Check size={24} color="#F26B3A" />
              </View>
              <Text className="quick-action-text">一键打卡</Text>
            </View>

            <View 
              className="quick-action"
              onClick={() => Taro.switchTab({ url: '/pages/data/index' })}
            >
              <View className="quick-action-icon quick-action-icon-success">
                <FileText size={24} color="#3C8D6E" />
              </View>
              <Text className="quick-action-text">详细数据</Text>
            </View>

            <View 
              className="quick-action"
              onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
            >
              <View className="quick-action-icon quick-action-icon-warning">
                <Target size={24} color="#F59E0B" />
              </View>
              <Text className="quick-action-text">设置目标</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
