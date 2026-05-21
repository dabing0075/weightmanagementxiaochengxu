import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Network } from '@/network'
import { RefreshCw } from 'lucide-react-taro'
import './index.css'

interface StatsData {
  weight: {
    average: number
    max: { value: number; date: string }
    min: { value: number; date: string }
    stdDev: number
  }
  waist: {
    average: number
    max: { value: number; date: string }
    min: { value: number; date: string }
    stdDev: number
  }
  bmi: {
    current: number
    status: string
  }
  bodyFat: {
    current: number
    status: string
  }
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await Network.request({ url: '/api/records/stats/detail' })
      if (res.data) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadStats()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const getBmiStatus = (bmi: number) => {
    if (bmi < 18.5) return { label: '偏瘦', color: 'warning' }
    if (bmi < 24) return { label: '正常', color: 'success' }
    if (bmi < 28) return { label: '超重', color: 'warning' }
    return { label: '肥胖', color: 'danger' }
  }

  const getBodyFatStatus = (bodyFat: number) => {
    if (bodyFat < 15) return { label: '偏瘦', color: 'warning' }
    if (bodyFat < 25) return { label: '健康', color: 'success' }
    return { label: '偏高', color: 'warning' }
  }

  return (
    <View className="page-container">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">统计分析</Text>
        <View className="header-right" onClick={handleRefresh}>
          <RefreshCw 
            size={20} 
            color="#6B7280" 
            className={isRefreshing ? 'rotate-animation' : ''}
          />
        </View>
      </View>

      <View className="main-content">
        {/* 体重统计卡片 */}
        <View className="stats-card">
          <Text className="stats-card-title">体重统计</Text>
          <View className="stats-grid">
            <View className="stat-item">
              <Text className="stat-label">平均值</Text>
              <Text className="stat-value">{stats?.weight.average.toFixed(1) || '--'}kg</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">最大值</Text>
              <Text className="stat-value">{stats?.weight.max.value.toFixed(1) || '--'}kg</Text>
              <Text className="stat-date">{stats?.weight.max.date || '--'}</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">最小值</Text>
              <Text className="stat-value">{stats?.weight.min.value.toFixed(1) || '--'}kg</Text>
              <Text className="stat-date">{stats?.weight.min.date || '--'}</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">标准差</Text>
              <Text className="stat-value">{stats?.weight.stdDev.toFixed(1) || '--'}kg</Text>
            </View>
          </View>
        </View>

        {/* 腰围统计卡片 */}
        <View className="stats-card">
          <Text className="stats-card-title">腰围统计</Text>
          <View className="stats-grid">
            <View className="stat-item">
              <Text className="stat-label">平均值</Text>
              <Text className="stat-value">{stats?.waist.average.toFixed(1) || '--'}cm</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">最大值</Text>
              <Text className="stat-value">{stats?.waist.max.value.toFixed(1) || '--'}cm</Text>
              <Text className="stat-date">{stats?.waist.max.date || '--'}</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">最小值</Text>
              <Text className="stat-value">{stats?.waist.min.value.toFixed(1) || '--'}cm</Text>
              <Text className="stat-date">{stats?.waist.min.date || '--'}</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-label">标准差</Text>
              <Text className="stat-value">{stats?.waist.stdDev.toFixed(1) || '--'}cm</Text>
            </View>
          </View>
        </View>

        {/* BMI 变化趋势 */}
        <View className="stats-card">
          <Text className="stats-card-title">BMI 变化趋势</Text>
          <View className="bmi-status">
            <Text className="bmi-label">当前 BMI</Text>
            <Text className="bmi-value">{stats?.bmi.current.toFixed(1) || '--'}</Text>
            <Text className={`bmi-badge bmi-badge-${getBmiStatus(stats?.bmi.current || 0).color}`}>
              {getBmiStatus(stats?.bmi.current || 0).label}
            </Text>
          </View>
          <View className="bmi-scale">
            <View className="bmi-scale-item bmi-scale-thin"><Text className="bmi-scale-label">&lt;18.5</Text></View>
            <View className="bmi-scale-item bmi-scale-normal"><Text className="bmi-scale-label">18.5-24</Text></View>
            <View className="bmi-scale-item bmi-scale-overweight"><Text className="bmi-scale-label">24-28</Text></View>
            <View className="bmi-scale-item bmi-scale-obese"><Text className="bmi-scale-label">&gt;28</Text></View>
          </View>
          <View className="bmi-legend">
            <Text className="bmi-legend-item">偏瘦</Text>
            <Text className="bmi-legend-item">正常</Text>
            <Text className="bmi-legend-item">超重</Text>
            <Text className="bmi-legend-item">肥胖</Text>
          </View>
        </View>

        {/* 体脂率变化趋势 */}
        <View className="stats-card">
          <Text className="stats-card-title">体脂率变化趋势</Text>
          <View className="bmi-status">
            <Text className="bmi-label">当前体脂率</Text>
            <Text className="bmi-value">{stats?.bodyFat.current.toFixed(1) || '--'}%</Text>
            <Text className={`bmi-badge bmi-badge-${getBodyFatStatus(stats?.bodyFat.current || 0).color}`}>
              {getBodyFatStatus(stats?.bodyFat.current || 0).label}
            </Text>
          </View>
          <View className="health-range">
            <Text className="health-range-text">健康范围：15%-25%</Text>
          </View>
        </View>

        {/* 健康建议卡片 */}
        <View className="suggestion-card">
          <Text className="suggestion-title">健康建议</Text>
          <View className="suggestion-list">
            <View className="suggestion-item">
              <Text className="suggestion-dot">•</Text>
              <Text className="suggestion-text">体重呈下降趋势，继续保持！</Text>
            </View>
            <View className="suggestion-item">
              <Text className="suggestion-dot">•</Text>
              <Text className="suggestion-text">BMI 在正常范围，保持健康饮食</Text>
            </View>
            <View className="suggestion-item">
              <Text className="suggestion-dot">•</Text>
              <Text className="suggestion-text">腰围目标 65cm，还需努力</Text>
            </View>
            <View className="suggestion-item">
              <Text className="suggestion-dot">•</Text>
              <Text className="suggestion-text">每天保持充足水分摄入</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
