import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Network } from '@/network'
import { Share2, Download } from 'lucide-react-taro'
import './index.css'

interface TrendRecord {
  record_date: string
  weight: string
  waist: string
}

export default function DataPage() {
  const [activeRange, setActiveRange] = useState('7')
  const [trendData, setTrendData] = useState<TrendRecord[]>([])
  const [weightStats, setWeightStats] = useState({ start: 0, end: 0, change: 0, changePercent: 0 })
  const [waistStats, setWaistStats] = useState({ start: 0, end: 0, change: 0, changePercent: 0 })

  useEffect(() => {
    loadTrendData()
  }, [activeRange])

  const loadTrendData = async () => {
    try {
      const res = await Network.request({ 
        url: '/api/records/trend', 
        data: { days: parseInt(activeRange) } 
      })
      
      console.log('趋势数据:', res)
      
      // 解包数据：后端返回 { code, msg, data: [...] }
      const trendRecords = res.data?.data || res.data || []
      
      if (trendRecords && Array.isArray(trendRecords) && trendRecords.length > 0) {
        setTrendData(trendRecords)
        
        const weights = trendRecords.map((r: TrendRecord) => parseFloat(r.weight))
        const waists = trendRecords.map((r: TrendRecord) => parseFloat(r.waist))
        
        setWeightStats({
          start: weights[0],
          end: weights[weights.length - 1],
          change: weights[weights.length - 1] - weights[0],
          changePercent: ((weights[weights.length - 1] - weights[0]) / weights[0]) * 100
        })
        
        setWaistStats({
          start: waists[0],
          end: waists[waists.length - 1],
          change: waists[waists.length - 1] - waists[0],
          changePercent: ((waists[waists.length - 1] - waists[0]) / waists[0]) * 100
        })
      }
    } catch (error) {
      console.error('加载趋势数据失败:', error)
    }
  }

  const generatePath = (data: number[], min: number, max: number) => {
    if (data.length === 0) return ''
    const range = max - min || 1
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 320
      const y = 100 - ((value - min) / range) * 80
      return `${x},${y}`
    }).join(' L')
    return `M${points}`
  }

  const ranges = [
    { value: '7', label: '近7天' },
    { value: '30', label: '近30天' },
    { value: '90', label: '近90天' },
    { value: '365', label: '全部' }
  ]

  return (
    <View className="page-container">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">趋势分析</Text>
        <View className="header-right">
          <Share2 size={20} color="#6B7280" />
        </View>
      </View>

      <View className="main-content">
        {/* 时间范围选择器 */}
        <View className="range-selector">
          {ranges.map((range) => (
            <View
              key={range.value}
              className={activeRange === range.value ? 'range-item-active' : 'range-item'}
              onClick={() => setActiveRange(range.value)}
            >
              <Text className={activeRange === range.value ? 'range-text-active' : 'range-text'}>
                {range.label}
              </Text>
            </View>
          ))}
        </View>

        {/* 体重趋势图表 */}
        <View className="chart-card">
          <Text className="chart-title">体重趋势</Text>
          <View className="chart-container">
            {trendData.length > 0 ? (
              <svg viewBox="0 0 320 100" className="chart-svg">
                <line x1="0" y1="25" x2="320" y2="25" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="50" x2="320" y2="50" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="75" x2="320" y2="75" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                
                <path 
                  d={generatePath(
                    trendData.map(r => parseFloat(r.weight)),
                    Math.min(...trendData.map(r => parseFloat(r.weight))) - 1,
                    Math.max(...trendData.map(r => parseFloat(r.weight))) + 1
                  )}
                  stroke="#F26B3A"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <View className="chart-empty">
                <Text className="chart-empty-text">暂无数据</Text>
              </View>
            )}
          </View>
          
          {/* 统计摘要 */}
          <View className="stats-summary">
            <View className="stats-item">
              <Text className="stats-label">起始值</Text>
              <Text className="stats-value">{weightStats.start.toFixed(1)}kg</Text>
            </View>
            <View className="stats-item">
              <Text className="stats-label">结束值</Text>
              <Text className="stats-value">{weightStats.end.toFixed(1)}kg</Text>
            </View>
            <View className="stats-item">
              <Text className="stats-label">变化量</Text>
              <Text className={weightStats.change < 0 ? 'stats-change-success' : 'stats-change-warning'}>
                {weightStats.change > 0 ? '+' : ''}{weightStats.change.toFixed(1)}kg
              </Text>
            </View>
            <View className="stats-item">
              <Text className="stats-label">变化率</Text>
              <Text className={weightStats.changePercent < 0 ? 'stats-change-success' : 'stats-change-warning'}>
                {weightStats.changePercent > 0 ? '+' : ''}{weightStats.changePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* 腰围趋势图表 */}
        <View className="chart-card">
          <Text className="chart-title">腰围趋势</Text>
          <View className="chart-container">
            {trendData.length > 0 ? (
              <svg viewBox="0 0 320 100" className="chart-svg">
                <line x1="0" y1="25" x2="320" y2="25" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="50" x2="320" y2="50" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="0" y1="75" x2="320" y2="75" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                
                <path 
                  d={generatePath(
                    trendData.map(r => parseFloat(r.waist)),
                    Math.min(...trendData.map(r => parseFloat(r.waist))) - 1,
                    Math.max(...trendData.map(r => parseFloat(r.waist))) + 1
                  )}
                  stroke="#3C8D6E"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <View className="chart-empty">
                <Text className="chart-empty-text">暂无数据</Text>
              </View>
            )}
          </View>
          
          {/* 统计摘要 */}
          <View className="stats-summary">
            <View className="stats-item">
              <Text className="stats-label">起始值</Text>
              <Text className="stats-value">{waistStats.start.toFixed(1)}cm</Text>
            </View>
            <View className="stats-item">
              <Text className="stats-label">结束值</Text>
              <Text className="stats-value">{waistStats.end.toFixed(1)}cm</Text>
            </View>
            <View className="stats-item">
              <Text className="stats-label">变化量</Text>
              <Text className={waistStats.change < 0 ? 'stats-change-success' : 'stats-change-warning'}>
                {waistStats.change > 0 ? '+' : ''}{waistStats.change.toFixed(1)}cm
              </Text>
            </View>
            <View className="stats-item">
              <Text className="stats-label">变化率</Text>
              <Text className={waistStats.changePercent < 0 ? 'stats-change-success' : 'stats-change-warning'}>
                {waistStats.changePercent > 0 ? '+' : ''}{waistStats.changePercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* 导出按钮 */}
        <View className="export-button">
          <Download size={20} color="#F26B3A" />
          <Text className="export-button-text">导出数据</Text>
        </View>
      </View>
    </View>
  )
}
