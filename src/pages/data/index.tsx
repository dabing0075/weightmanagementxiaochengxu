import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'

interface WeightRecord {
  id: string
  record_date: string
  weight: string
  waist?: string
}

interface TrendData {
  records: WeightRecord[]
  summary: {
    startWeight: number
    endWeight: number
    change: number
    changePercent: number
  }
}

export default function DataPage() {
  const [timeRange, setTimeRange] = useState('7')
  const [weightTrend, setWeightTrend] = useState<TrendData | null>(null)
  const [waistTrend, setWaistTrend] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    fetchTrendData()
  })

  const fetchTrendData = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/records/trend?days=${timeRange}`,
        method: 'GET'
      })
      
      if (res.data?.code === 200 && res.data?.data) {
        setWeightTrend(res.data.data.weight)
        setWaistTrend(res.data.data.waist)
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRangeChange = (days: string) => {
    setTimeRange(days)
    setTimeout(() => fetchTrendData(), 100)
  }

  const renderChart = (records: WeightRecord[], type: 'weight' | 'waist') => {
    if (!records || records.length === 0) {
      return (
        <View className="h-48 flex items-center justify-center">
          <Text className="text-sm text-muted-foreground">暂无数据</Text>
        </View>
      )
    }

    const values = records.map(r => parseFloat(type === 'weight' ? r.weight : (r.waist || '0')))
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1

    // 计算折线路径
    const chartHeight = 180
    const chartWidth = 300
    const padding = 20
    const pointGap = (chartWidth - padding * 2) / (records.length - 1 || 1)

    const points = records.map((record, index) => {
      const value = parseFloat(type === 'weight' ? record.weight : (record.waist || '0'))
      const x = padding + index * pointGap
      const y = chartHeight - padding - ((value - minVal) / range) * (chartHeight - padding * 2)
      return { x, y, value, date: record.record_date }
    })

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    return (
      <View className="relative">
        <View className="h-48 flex items-end">
          {/* Y轴刻度 */}
          <View className="w-12 h-full flex flex-col justify-between py-2 pr-2">
            <Text className="text-xs text-muted-foreground text-right">{maxVal.toFixed(1)}</Text>
            <Text className="text-xs text-muted-foreground text-right">{((maxVal + minVal) / 2).toFixed(1)}</Text>
            <Text className="text-xs text-muted-foreground text-right">{minVal.toFixed(1)}</Text>
          </View>
          
          {/* 图表区域 */}
          <View className="flex-1 h-full relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
              {/* 网格线 */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#E4DED2" strokeWidth="1" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#E4DED2" strokeWidth="1" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#E4DED2" strokeWidth="1" />
              
              {/* 折线 */}
              <path d={pathD} fill="none" stroke="#F26B3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* 数据点 */}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#F26B3A" />
              ))}
            </svg>
          </View>
        </View>
        
        {/* X轴日期 */}
        <View className="flex justify-around mt-2 px-12">
          {records.slice(0, Math.min(7, records.length)).map((record, index) => (
            <Text key={index} className="text-xs text-muted-foreground">
              {record.record_date.slice(5)}
            </Text>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-background p-4">
      {/* 时间范围选择 */}
      <View className="flex gap-2 mb-4">
        {['7', '30', '90', 'all'].map((days) => (
          <Button
            key={days}
            size="sm"
            variant={timeRange === days ? 'default' : 'outline'}
            className={`flex-1 ${timeRange === days ? 'bg-primary text-white' : ''}`}
            onClick={() => handleRangeChange(days)}
          >
            {days === 'all' ? '全部' : `近${days}天`}
          </Button>
        ))}
      </View>

      {/* 体重趋势 */}
      <Card className="bg-surface shadow-card mb-4">
        <CardHeader>
          <View className="flex items-center justify-between">
            <CardTitle className="text-base">体重趋势</CardTitle>
            {weightTrend?.summary && (
              <View className="text-right">
                <Text className={`text-xs ${weightTrend.summary.change < 0 ? 'text-success' : 'text-destructive'}`}>
                  {weightTrend.summary.change > 0 ? '+' : ''}{weightTrend.summary.change.toFixed(1)}kg
                </Text>
              </View>
            )}
          </View>
        </CardHeader>
        <CardContent>
          {loading ? (
            <View className="h-48 flex items-center justify-center">
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            renderChart(weightTrend?.records || [], 'weight')
          )}
          
          {weightTrend?.summary && (
            <View className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-outline-variant">
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">起始</Text>
                <Text className="text-sm font-semibold">{weightTrend.summary.startWeight}kg</Text>
              </View>
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">当前</Text>
                <Text className="text-sm font-semibold">{weightTrend.summary.endWeight}kg</Text>
              </View>
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">变化</Text>
                <Text className={`text-sm font-semibold ${weightTrend.summary.change < 0 ? 'text-success' : 'text-destructive'}`}>
                  {weightTrend.summary.change > 0 ? '+' : ''}{weightTrend.summary.change.toFixed(1)}kg
                </Text>
              </View>
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">变化率</Text>
                <Text className={`text-sm font-semibold ${weightTrend.summary.changePercent < 0 ? 'text-success' : 'text-destructive'}`}>
                  {weightTrend.summary.changePercent > 0 ? '+' : ''}{weightTrend.summary.changePercent.toFixed(1)}%
                </Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* 腰围趋势 */}
      <Card className="bg-surface shadow-card">
        <CardHeader>
          <View className="flex items-center justify-between">
            <CardTitle className="text-base">腰围趋势</CardTitle>
            {waistTrend?.summary && (
              <View className="text-right">
                <Text className={`text-xs ${waistTrend.summary.change < 0 ? 'text-success' : 'text-destructive'}`}>
                  {waistTrend.summary.change > 0 ? '+' : ''}{waistTrend.summary.change.toFixed(1)}cm
                </Text>
              </View>
            )}
          </View>
        </CardHeader>
        <CardContent>
          {loading ? (
            <View className="h-48 flex items-center justify-center">
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            renderChart(waistTrend?.records || [], 'waist')
          )}
          
          {waistTrend?.summary && (
            <View className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-outline-variant">
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">起始</Text>
                <Text className="text-sm font-semibold">{waistTrend.summary.startWeight}cm</Text>
              </View>
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">当前</Text>
                <Text className="text-sm font-semibold">{waistTrend.summary.endWeight}cm</Text>
              </View>
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">变化</Text>
                <Text className={`text-sm font-semibold ${waistTrend.summary.change < 0 ? 'text-success' : 'text-destructive'}`}>
                  {waistTrend.summary.change > 0 ? '+' : ''}{waistTrend.summary.change.toFixed(1)}cm
                </Text>
              </View>
              <View className="text-center">
                <Text className="text-xs text-muted-foreground block">变化率</Text>
                <Text className={`text-sm font-semibold ${waistTrend.summary.changePercent < 0 ? 'text-success' : 'text-destructive'}`}>
                  {waistTrend.summary.changePercent > 0 ? '+' : ''}{waistTrend.summary.changePercent.toFixed(1)}%
                </Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  )
}
