import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { RefreshCw, TrendingDown, TrendingUp, Minus } from 'lucide-react-taro'
import './index.css'

interface DetailedStats {
  weightStats: {
    avg: number
    max: number
    maxDate: string
    min: number
    minDate: string
    stdDev: number
  }
  waistStats: {
    avg: number
    max: number
    maxDate: string
    min: number
    minDate: string
    stdDev: number
  }
  bmiLevel: string
  bmiValue: number
  bodyFatLevel: string
  bodyFatValue: number
  suggestions: string[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useDidShow(() => {
    fetchStats()
  })

  const fetchStats = async () => {
    try {
      const res = await Network.request({
        url: '/api/records/stats/detail',
        method: 'GET'
      })
      console.log('详细统计:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('获取统计失败:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getBmiColor = (level: string) => {
    if (level === '偏瘦') return '#F59E0B'
    if (level === '正常') return '#3C8D6E'
    if (level === '超重') return '#F59E0B'
    return '#EF4444'
  }

  const getBmiPercent = (bmi: number) => {
    // BMI 范围: 15-35
    return Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100))
  }

  const getBodyFatPercent = (bodyFat: number) => {
    // 体脂率范围: 5-35%
    return Math.min(100, Math.max(0, ((bodyFat - 5) / 30) * 100))
  }

  return (
    <View className="stats-page">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">统计分析</Text>
        <View className={`header-right ${refreshing ? 'refreshing' : ''}`} onClick={handleRefresh}>
          <RefreshCw size={28} color="#6B7280" />
        </View>
      </View>

      {/* 主内容区域 */}
      <View className="main-content">
        {/* 体重统计卡片 */}
        <View className="stats-card">
          <Text className="card-title">体重统计</Text>
          
          <View className="stats-grid">
            <View className="stat-box">
              <Text className="stat-label">平均值</Text>
              <Text className="stat-value">{stats?.weightStats?.avg?.toFixed(1) || '--'}kg</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-label">最大值</Text>
              <Text className="stat-value">{stats?.weightStats?.max?.toFixed(1) || '--'}kg</Text>
              <Text className="stat-date">{formatDate(stats?.weightStats?.maxDate || '')}</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-label">最小值</Text>
              <Text className="stat-value">{stats?.weightStats?.min?.toFixed(1) || '--'}kg</Text>
              <Text className="stat-date">{formatDate(stats?.weightStats?.minDate || '')}</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-label">标准差</Text>
              <Text className="stat-value">{stats?.weightStats?.stdDev?.toFixed(2) || '--'}kg</Text>
            </View>
          </View>
        </View>

        {/* 腰围统计卡片 */}
        <View className="stats-card">
          <Text className="card-title">腰围统计</Text>
          
          <View className="stats-grid">
            <View className="stat-box">
              <Text className="stat-label">平均值</Text>
              <Text className="stat-value">{stats?.waistStats?.avg?.toFixed(1) || '--'}cm</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-label">最大值</Text>
              <Text className="stat-value">{stats?.waistStats?.max?.toFixed(1) || '--'}cm</Text>
              <Text className="stat-date">{formatDate(stats?.waistStats?.maxDate || '')}</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-label">最小值</Text>
              <Text className="stat-value">{stats?.waistStats?.min?.toFixed(1) || '--'}cm</Text>
              <Text className="stat-date">{formatDate(stats?.waistStats?.minDate || '')}</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-label">标准差</Text>
              <Text className="stat-value">{stats?.waistStats?.stdDev?.toFixed(2) || '--'}cm</Text>
            </View>
          </View>
        </View>

        {/* BMI变化趋势 */}
        <View className="stats-card">
          <Text className="card-title">BMI变化趋势</Text>
          
          <View className="bmi-current">
            <Text className="bmi-label">当前BMI</Text>
            <Text className="bmi-value">{stats?.bmiValue?.toFixed(1) || '--'}</Text>
            <View className="bmi-badge" style={{ backgroundColor: getBmiColor(stats?.bmiLevel || '') + '20' }}>
              <Text className="bmi-badge-text" style={{ color: getBmiColor(stats?.bmiLevel || '') }}>
                {stats?.bmiLevel || '--'}
              </Text>
            </View>
          </View>
          
          <View className="bmi-scale">
            <View className="bmi-scale-bar">
              <View className="bmi-scale-segment bmi-scale-thin" />
              <View className="bmi-scale-segment bmi-scale-normal" />
              <View className="bmi-scale-segment bmi-scale-overweight" />
              <View className="bmi-scale-segment bmi-scale-obese" />
              <View 
                className="bmi-scale-indicator"
                style={{ left: `${getBmiPercent(stats?.bmiValue || 22)}%` }}
              />
            </View>
            <View className="bmi-scale-labels">
              <Text className="bmi-scale-label">偏瘦</Text>
              <Text className="bmi-scale-label">正常</Text>
              <Text className="bmi-scale-label">超重</Text>
              <Text className="bmi-scale-label">肥胖</Text>
            </View>
          </View>
          
          <View className="bmi-levels">
            <View className="bmi-level-item">
              <View className="bmi-level-dot bmi-level-dot-thin" />
              <Text className="bmi-level-text">偏瘦: &lt;18.5</Text>
            </View>
            <View className="bmi-level-item">
              <View className="bmi-level-dot bmi-level-dot-normal" />
              <Text className="bmi-level-text">正常: 18.5-24</Text>
            </View>
            <View className="bmi-level-item">
              <View className="bmi-level-dot bmi-level-dot-overweight" />
              <Text className="bmi-level-text">超重: 24-28</Text>
            </View>
            <View className="bmi-level-item">
              <View className="bmi-level-dot bmi-level-dot-obese" />
              <Text className="bmi-level-text">肥胖: &gt;28</Text>
            </View>
          </View>
        </View>

        {/* 体脂率变化趋势 */}
        <View className="stats-card">
          <Text className="card-title">体脂率变化趋势</Text>
          
          <View className="bodyfat-current">
            <Text className="bodyfat-label">当前体脂率</Text>
            <Text className="bodyfat-value">{stats?.bodyFatValue?.toFixed(1) || '--'}%</Text>
            <View className="bodyfat-badge">
              <Text className="bodyfat-badge-text">{stats?.bodyFatLevel || '--'}</Text>
            </View>
          </View>
          
          <View className="bodyfat-scale">
            <View className="bodyfat-scale-bar">
              <View className="bodyfat-scale-healthy" />
              <View 
                className="bodyfat-scale-indicator"
                style={{ left: `${getBodyFatPercent(stats?.bodyFatValue || 18)}%` }}
              />
            </View>
            <View className="bodyfat-range">
              <Text className="bodyfat-range-text">健康范围: 15-20%</Text>
            </View>
          </View>
          
          <View className="bodyfat-info">
            <View className="bodyfat-info-item">
              <Text className="bodyfat-info-label">男性健康范围</Text>
              <Text className="bodyfat-info-value">15-20%</Text>
            </View>
            <View className="bodyfat-info-divider" />
            <View className="bodyfat-info-item">
              <Text className="bodyfat-info-label">女性健康范围</Text>
              <Text className="bodyfat-info-value">20-25%</Text>
            </View>
          </View>
        </View>

        {/* 健康建议卡片 */}
        <View className="stats-card suggestions-card">
          <Text className="card-title">健康建议</Text>
          
          <View className="suggestions-list">
            {stats?.suggestions?.map((suggestion, index) => (
              <View key={index} className="suggestion-item">
                <View className="suggestion-icon">
                  <TrendingDown size={22} color="#3C8D6E" />
                </View>
                <Text className="suggestion-text">{suggestion}</Text>
              </View>
            )) || (
              <>
                <View className="suggestion-item">
                  <View className="suggestion-icon">
                    <TrendingDown size={22} color="#3C8D6E" />
                  </View>
                  <Text className="suggestion-text">体重呈下降趋势，继续保持良好的生活习惯</Text>
                </View>
                <View className="suggestion-item">
                  <View className="suggestion-icon">
                    <Minus size={22} color="#3C8D6E" />
                  </View>
                  <Text className="suggestion-text">BMI在正常范围，保持健康饮食和适量运动</Text>
                </View>
                <View className="suggestion-item">
                  <View className="suggestion-icon">
                    <TrendingUp size={22} color="#F59E0B" />
                  </View>
                  <Text className="suggestion-text">腰围接近目标值，继续坚持锻炼</Text>
                </View>
                <View className="suggestion-item">
                  <View className="suggestion-icon">
                    <TrendingDown size={22} color="#3C8D6E" />
                  </View>
                  <Text className="suggestion-text">建议每天饮水2000ml以上，促进新陈代谢</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
