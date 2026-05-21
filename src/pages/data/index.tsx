import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { Download, Share2 } from 'lucide-react-taro'
import './index.css'

interface TrendData {
  date: string
  weight: number
  waist: number
}

interface TrendResponse {
  weightData: TrendData[]
  waistData: TrendData[]
  weightStats: {
    startValue: number
    endValue: number
    change: number
    changePercent: number
  }
  waistStats: {
    startValue: number
    endValue: number
    change: number
    changePercent: number
  }
}

export default function DataPage() {
  const [timeRange, setTimeRange] = useState('7')
  const [trendData, setTrendData] = useState<TrendResponse | null>(null)

  useDidShow(() => {
    fetchTrendData()
  })

  const fetchTrendData = async () => {
    try {
      const res = await Network.request({
        url: `/api/records/trend?days=${timeRange}`,
        method: 'GET'
      })
      console.log('趋势数据:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        setTrendData(res.data.data)
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error)
    }
  }

  const handleTimeRangeChange = (days: string) => {
    setTimeRange(days)
    setTimeout(() => {
      fetchTrendData()
    }, 100)
  }

  const handleExport = () => {
    Taro.showToast({ title: '数据导出中...', icon: 'loading' })
    setTimeout(() => {
      Taro.showToast({ title: '导出成功', icon: 'success' })
    }, 1500)
  }

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true
    })
  }

  // 生成图表路径
  const generateChartPath = (data: TrendData[], field: 'weight' | 'waist', height: number = 120) => {
    if (data.length < 2) return { path: '', area: '' }
    
    const values = data.map(d => d[field]).filter(v => v !== null && v !== undefined)
    if (values.length < 2) return { path: '', area: '' }
    
    const minVal = Math.min(...values) - 1
    const maxVal = Math.max(...values) + 1
    const range = maxVal - minVal || 1
    const width = 320
    const padding = 10
    
    const points = data.map((d, i) => {
      const val = d[field]
      if (val === null || val === undefined) return null
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding)
      return { x, y }
    }).filter(Boolean) as { x: number; y: number }[]
    
    if (points.length < 2) return { path: '', area: '' }
    
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    
    return { path: pathD, area: areaD, points, minVal, maxVal }
  }

  const weightChart = trendData?.weightData ? generateChartPath(trendData.weightData, 'weight') : null
  const waistChart = trendData?.waistData ? generateChartPath(trendData.waistData, 'waist') : null

  return (
    <View className="data-page">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">趋势分析</Text>
        <View className="header-right" onClick={handleShare}>
          <Share2 size={20} color="#6B7280" />
        </View>
      </View>

      {/* 主内容区域 */}
      <View className="main-content">
        {/* 时间范围选择器 */}
        <View className="time-range-selector">
          {[
            { label: '近7天', value: '7' },
            { label: '近30天', value: '30' },
            { label: '近90天', value: '90' },
            { label: '全部', value: '365' }
          ].map((item) => (
            <View
              key={item.value}
              className={`time-range-item ${timeRange === item.value ? 'time-range-active' : ''}`}
              onClick={() => handleTimeRangeChange(item.value)}
            >
              <Text className={`time-range-text ${timeRange === item.value ? 'time-range-text-active' : ''}`}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* 体重趋势图表 */}
        <View className="chart-section">
          <View className="section-header">
            <Text className="section-title">体重趋势</Text>
            {trendData?.weightStats && (
              <Text className="section-change">
                {trendData.weightStats.change > 0 ? '+' : ''}{trendData.weightStats.change.toFixed(1)}kg
                ({trendData.weightStats.changePercent > 0 ? '+' : ''}{trendData.weightStats.changePercent.toFixed(1)}%)
              </Text>
            )}
          </View>
          
          <View className="chart-card">
            <View className="chart-container">
              {weightChart && weightChart.path ? (
                <svg viewBox="0 0 320 120" className="chart-svg">
                  {/* 网格线 */}
                  <line x1="10" y1="30" x2="310" y2="30" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="10" y1="60" x2="310" y2="60" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="10" y1="90" x2="310" y2="90" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  
                  {/* Y轴刻度 */}
                  <text x="10" y="28" fontSize="10" fill="#6B7280">
                    {weightChart.maxVal?.toFixed(0) || ''}
                  </text>
                  <text x="10" y="58" fontSize="10" fill="#6B7280">
                    {weightChart.maxVal && weightChart.minVal ? ((weightChart.maxVal + weightChart.minVal) / 2).toFixed(0) : ''}
                  </text>
                  <text x="10" y="88" fontSize="10" fill="#6B7280">
                    {weightChart.minVal?.toFixed(0) || ''}
                  </text>
                  
                  {/* 渐变定义 */}
                  <defs>
                    <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F26B3A" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#F26B3A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* 区域填充 */}
                  <path d={weightChart.area} fill="url(#weightGradient)" opacity="0.3" />
                  
                  {/* 折线 */}
                  <path d={weightChart.path} stroke="#F26B3A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* 数据点 */}
                  {weightChart.points?.map((point, index) => (
                    <circle 
                      key={index} 
                      cx={point.x} 
                      cy={point.y} 
                      r={index === weightChart.points.length - 1 ? 5 : 4} 
                      fill="#F26B3A"
                      stroke={index === weightChart.points.length - 1 ? "#fff" : "none"}
                      strokeWidth={2}
                    />
                  ))}
                </svg>
              ) : (
                <View className="chart-empty">
                  <Text className="chart-empty-text">暂无数据</Text>
                </View>
              )}
            </View>
            
            {/* 统计摘要 */}
            {trendData?.weightStats && (
              <View className="chart-stats">
                <View className="stat-item">
                  <Text className="stat-label">起始值</Text>
                  <Text className="stat-value">{trendData.weightStats.startValue.toFixed(1)}kg</Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-label">结束值</Text>
                  <Text className="stat-value">{trendData.weightStats.endValue.toFixed(1)}kg</Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-label">变化量</Text>
                  <Text className={`stat-value ${trendData.weightStats.change > 0 ? 'stat-value-warning' : 'stat-value-success'}`}>
                    {trendData.weightStats.change > 0 ? '+' : ''}{trendData.weightStats.change.toFixed(1)}kg
                  </Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-label">变化率</Text>
                  <Text className={`stat-value ${trendData.weightStats.changePercent > 0 ? 'stat-value-warning' : 'stat-value-success'}`}>
                    {trendData.weightStats.changePercent > 0 ? '+' : ''}{trendData.weightStats.changePercent.toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 腰围趋势图表 */}
        <View className="chart-section">
          <View className="section-header">
            <Text className="section-title">腰围趋势</Text>
            {trendData?.waistStats && (
              <Text className="section-change">
                {trendData.waistStats.change > 0 ? '+' : ''}{trendData.waistStats.change.toFixed(1)}cm
                ({trendData.waistStats.changePercent > 0 ? '+' : ''}{trendData.waistStats.changePercent.toFixed(1)}%)
              </Text>
            )}
          </View>
          
          <View className="chart-card">
            <View className="chart-container">
              {waistChart && waistChart.path ? (
                <svg viewBox="0 0 320 120" className="chart-svg">
                  {/* 网格线 */}
                  <line x1="10" y1="30" x2="310" y2="30" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="10" y1="60" x2="310" y2="60" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="10" y1="90" x2="310" y2="90" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                  
                  {/* Y轴刻度 */}
                  <text x="10" y="28" fontSize="10" fill="#6B7280">
                    {waistChart.maxVal?.toFixed(0) || ''}
                  </text>
                  <text x="10" y="58" fontSize="10" fill="#6B7280">
                    {waistChart.maxVal && waistChart.minVal ? ((waistChart.maxVal + waistChart.minVal) / 2).toFixed(0) : ''}
                  </text>
                  <text x="10" y="88" fontSize="10" fill="#6B7280">
                    {waistChart.minVal?.toFixed(0) || ''}
                  </text>
                  
                  {/* 渐变定义 */}
                  <defs>
                    <linearGradient id="waistGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3C8D6E" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3C8D6E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* 区域填充 */}
                  <path d={waistChart.area} fill="url(#waistGradient)" opacity="0.3" />
                  
                  {/* 折线 */}
                  <path d={waistChart.path} stroke="#3C8D6E" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* 数据点 */}
                  {waistChart.points?.map((point, index) => (
                    <circle 
                      key={index} 
                      cx={point.x} 
                      cy={point.y} 
                      r={index === waistChart.points.length - 1 ? 5 : 4} 
                      fill="#3C8D6E"
                      stroke={index === waistChart.points.length - 1 ? "#fff" : "none"}
                      strokeWidth={2}
                    />
                  ))}
                </svg>
              ) : (
                <View className="chart-empty">
                  <Text className="chart-empty-text">暂无数据</Text>
                </View>
              )}
            </View>
            
            {/* 统计摘要 */}
            {trendData?.waistStats && (
              <View className="chart-stats">
                <View className="stat-item">
                  <Text className="stat-label">起始值</Text>
                  <Text className="stat-value">{trendData.waistStats.startValue.toFixed(1)}cm</Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-label">结束值</Text>
                  <Text className="stat-value">{trendData.waistStats.endValue.toFixed(1)}cm</Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-label">变化量</Text>
                  <Text className={`stat-value ${trendData.waistStats.change > 0 ? 'stat-value-warning' : 'stat-value-success'}`}>
                    {trendData.waistStats.change > 0 ? '+' : ''}{trendData.waistStats.change.toFixed(1)}cm
                  </Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-label">变化率</Text>
                  <Text className={`stat-value ${trendData.waistStats.changePercent > 0 ? 'stat-value-warning' : 'stat-value-success'}`}>
                    {trendData.waistStats.changePercent > 0 ? '+' : ''}{trendData.waistStats.changePercent.toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 数据导出按钮 */}
        <View className="export-button" onClick={handleExport}>
          <Download size={20} color="#F26B3A" />
          <Text className="export-button-text">导出数据 (CSV)</Text>
        </View>
      </View>
    </View>
  )
}
