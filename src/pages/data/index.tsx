import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Scale, Ruler, Download, Share2, TrendingDown, TrendingUp } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

interface TrendData {
  date: string
  weight: number
  waist: number
}

interface TrendResponse {
  weightTrend: TrendData[]
  waistTrend: TrendData[]
  weightStats: {
    start: number
    end: number
    change: number
    changePercent: number
  }
  waistStats: {
    start: number
    end: number
    change: number
    changePercent: number
  }
}

export default function DataPage() {
  const [timeRange, setTimeRange] = useState(7)
  const [trendData, setTrendData] = useState<TrendResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const timeOptions = [
    { label: '近7天', value: 7 },
    { label: '近30天', value: 30 },
    { label: '近90天', value: 90 },
    { label: '全部', value: 365 }
  ]

  async function fetchTrendData() {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/health/trend',
        method: 'GET',
        data: { days: timeRange }
      })
      console.log('Trend data response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setTrendData(res.data.data)
      }
    } catch (error) {
      console.error('Fetch trend data error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendData()
  }, [timeRange])

  function formatDate(dateStr: string) {
    return dateStr.slice(5) // MM-DD
  }

  function handleExport() {
    Taro.showToast({ title: '功能开发中', icon: 'none' })
  }

  // 获取图表数据
  const weightData = trendData?.weightTrend || []
  const waistData = trendData?.waistTrend || []

  // 计算范围
  const weights = weightData.map(d => d.weight).filter(w => w > 0)
  const waists = waistData.map(d => d.waist).filter(w => w > 0)
  
  const minWeight = weights.length > 0 ? Math.min(...weights) - 1 : 0
  const maxWeight = weights.length > 0 ? Math.max(...weights) + 1 : 100
  const minWaist = waists.length > 0 ? Math.min(...waists) - 1 : 0
  const maxWaist = waists.length > 0 ? Math.max(...waists) + 1 : 100

  // 生成折线路径
  function generateLinePath(data: number[], min: number, max: number, width: number, height: number) {
    if (data.length === 0) return ''
    
    const range = max - min || 1
    const stepX = width / (data.length - 1 || 1)
    
    const points = data.map((value, index) => {
      const x = index * stepX
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }

  // 生成填充区域路径
  function generateAreaPath(data: number[], min: number, max: number, width: number, height: number) {
    if (data.length === 0) return ''
    
    const range = max - min || 1
    const stepX = width / (data.length - 1 || 1)
    
    const points = data.map((value, index) => {
      const x = index * stepX
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    
    // 闭合路径：从最后一个点到底部，再到第一个点的底部
    return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`
  }

  return (
    <View className="flex flex-col min-h-screen bg-[#F7F4ED]">
      {/* Header */}
      <View className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-[#F7F4ED]">
        <View className="w-10 h-10" />
        <Text className="text-base font-semibold text-[#1E2933]">趋势分析</Text>
        <View className="w-10 h-10 flex items-center justify-center rounded-full">
          <Share2 size={20} color="#6B7280" />
        </View>
      </View>

      {/* Content */}
      <ScrollView scrollY className="flex-1 pb-20">
        {/* 时间范围选择器 */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex flex-row gap-2">
            {timeOptions.map(option => (
              <View
                key={option.value}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center ${
                  timeRange === option.value 
                    ? 'bg-[#F26B3A]' 
                    : 'bg-[#F0EDE6]'
                }`}
                onClick={() => setTimeRange(option.value)}
              >
                <Text
                  className={`text-sm font-medium ${
                    timeRange === option.value ? 'text-white' : 'text-[#6B7280]'
                  }`}
                >
                  {option.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-sm text-[#6B7280]">加载中...</Text>
          </View>
        ) : (
          <>
            {/* 体重趋势卡片 */}
            <View className="px-4 pt-4">
              <Card className="bg-white shadow-md">
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-4">
                    <View className="flex items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-[#F26B3A]/10 flex items-center justify-center">
                        <Scale size={16} color="#F26B3A" />
                      </View>
                      <Text className="text-base font-semibold text-[#1E2933]">体重趋势</Text>
                    </View>
                    <Text className="text-sm text-[#6B7280]">单位: kg</Text>
                  </View>

                  {/* SVG 折线图 */}
                  {weights.length > 0 ? (
                    <View className="relative">
                      <View className="w-full" style={{ height: '200px' }}>
                        <svg width="100%" height="200" viewBox="0 0 350 200" preserveAspectRatio="none">
                          {/* 网格线 */}
                          <line x1="0" y1="50" x2="350" y2="50" stroke="#E4DED2" strokeWidth="1" />
                          <line x1="0" y1="100" x2="350" y2="100" stroke="#E4DED2" strokeWidth="1" />
                          <line x1="0" y1="150" x2="350" y2="150" stroke="#E4DED2" strokeWidth="1" />
                          
                          {/* Y轴刻度 */}
                          <text x="5" y="20" fill="#6B7280" fontSize="10">{maxWeight.toFixed(0)}</text>
                          <text x="5" y="105" fill="#6B7280" fontSize="10">{((maxWeight + minWeight) / 2).toFixed(0)}</text>
                          <text x="5" y="195" fill="#6B7280" fontSize="10">{minWeight.toFixed(0)}</text>
                          
                          {/* 填充区域 */}
                          <path
                            d={generateAreaPath(weights, minWeight, maxWeight, 350, 180)}
                            fill="url(#weightGradient)"
                            opacity="0.3"
                          />
                          
                          {/* 折线 */}
                          <path
                            d={generateLinePath(weights, minWeight, maxWeight, 350, 180)}
                            fill="none"
                            stroke="#F26B3A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          
                          {/* 渐变定义 */}
                          <defs>
                            <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#F26B3A" />
                              <stop offset="100%" stopColor="#F26B3A" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </View>
                      
                      {/* X轴日期标签 */}
                      <View className="flex flex-row justify-between px-2 mt-2">
                        {weightData.filter((_, i) => i % Math.ceil(weightData.length / 5) === 0).slice(0, 5).map((item, index) => (
                          <Text key={index} className="text-xs text-[#6B7280]">
                            {formatDate(item.date)}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View className="py-8 text-center">
                      <Text className="text-sm text-[#6B7280]">暂无数据</Text>
                    </View>
                  )}

                  {/* 统计摘要 */}
                  {trendData?.weightStats && weights.length > 0 && (
                    <View className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[#E4DED2]">
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">起始值</Text>
                        <Text className="text-base font-semibold text-[#1E2933]">
                          {trendData.weightStats.start.toFixed(1)}
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">结束值</Text>
                        <Text className="text-base font-semibold text-[#1E2933]">
                          {trendData.weightStats.end.toFixed(1)}
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">变化量</Text>
                        <View className="flex items-center justify-center gap-1">
                          {trendData.weightStats.change > 0 ? (
                            <TrendingUp size={12} color="#EF4444" />
                          ) : (
                            <TrendingDown size={12} color="#3C8D6E" />
                          )}
                          <Text className={`text-base font-semibold ${
                            trendData.weightStats.change > 0 ? 'text-[#EF4444]' : 'text-[#3C8D6E]'
                          }`}
                          >
                            {trendData.weightStats.change > 0 ? '+' : ''}{trendData.weightStats.change.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">变化率</Text>
                        <Text className={`text-base font-semibold ${
                          trendData.weightStats.changePercent > 0 ? 'text-[#EF4444]' : 'text-[#3C8D6E]'
                        }`}
                        >
                          {trendData.weightStats.changePercent > 0 ? '+' : ''}{trendData.weightStats.changePercent.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  )}
                </CardContent>
              </Card>
            </View>

            {/* 腰围趋势卡片 */}
            <View className="px-4 pt-4">
              <Card className="bg-white shadow-md">
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-4">
                    <View className="flex items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-[#3C8D6E]/10 flex items-center justify-center">
                        <Ruler size={16} color="#3C8D6E" />
                      </View>
                      <Text className="text-base font-semibold text-[#1E2933]">腰围趋势</Text>
                    </View>
                    <Text className="text-sm text-[#6B7280]">单位: cm</Text>
                  </View>

                  {/* SVG 折线图 */}
                  {waists.length > 0 ? (
                    <View className="relative">
                      <View className="w-full" style={{ height: '200px' }}>
                        <svg width="100%" height="200" viewBox="0 0 350 200" preserveAspectRatio="none">
                          {/* 网格线 */}
                          <line x1="0" y1="50" x2="350" y2="50" stroke="#E4DED2" strokeWidth="1" />
                          <line x1="0" y1="100" x2="350" y2="100" stroke="#E4DED2" strokeWidth="1" />
                          <line x1="0" y1="150" x2="350" y2="150" stroke="#E4DED2" strokeWidth="1" />
                          
                          {/* Y轴刻度 */}
                          <text x="5" y="20" fill="#6B7280" fontSize="10">{maxWaist.toFixed(0)}</text>
                          <text x="5" y="105" fill="#6B7280" fontSize="10">{((maxWaist + minWaist) / 2).toFixed(0)}</text>
                          <text x="5" y="195" fill="#6B7280" fontSize="10">{minWaist.toFixed(0)}</text>
                          
                          {/* 填充区域 */}
                          <path
                            d={generateAreaPath(waists, minWaist, maxWaist, 350, 180)}
                            fill="url(#waistGradient)"
                            opacity="0.3"
                          />
                          
                          {/* 折线 */}
                          <path
                            d={generateLinePath(waists, minWaist, maxWaist, 350, 180)}
                            fill="none"
                            stroke="#3C8D6E"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          
                          {/* 渐变定义 */}
                          <defs>
                            <linearGradient id="waistGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3C8D6E" />
                              <stop offset="100%" stopColor="#3C8D6E" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </View>
                      
                      {/* X轴日期标签 */}
                      <View className="flex flex-row justify-between px-2 mt-2">
                        {waistData.filter((_, i) => i % Math.ceil(waistData.length / 5) === 0).slice(0, 5).map((item, index) => (
                          <Text key={index} className="text-xs text-[#6B7280]">
                            {formatDate(item.date)}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View className="py-8 text-center">
                      <Text className="text-sm text-[#6B7280]">暂无数据</Text>
                    </View>
                  )}

                  {/* 统计摘要 */}
                  {trendData?.waistStats && waists.length > 0 && (
                    <View className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[#E4DED2]">
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">起始值</Text>
                        <Text className="text-base font-semibold text-[#1E2933]">
                          {trendData.waistStats.start.toFixed(1)}
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">结束值</Text>
                        <Text className="text-base font-semibold text-[#1E2933]">
                          {trendData.waistStats.end.toFixed(1)}
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">变化量</Text>
                        <View className="flex items-center justify-center gap-1">
                          {trendData.waistStats.change > 0 ? (
                            <TrendingUp size={12} color="#EF4444" />
                          ) : (
                            <TrendingDown size={12} color="#3C8D6E" />
                          )}
                          <Text className={`text-base font-semibold ${
                            trendData.waistStats.change > 0 ? 'text-[#EF4444]' : 'text-[#3C8D6E]'
                          }`}
                          >
                            {trendData.waistStats.change > 0 ? '+' : ''}{trendData.waistStats.change.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <View className="text-center">
                        <Text className="text-xs text-[#6B7280] mb-1 block">变化率</Text>
                        <Text className={`text-base font-semibold ${
                          trendData.waistStats.changePercent > 0 ? 'text-[#EF4444]' : 'text-[#3C8D6E]'
                        }`}
                        >
                          {trendData.waistStats.changePercent > 0 ? '+' : ''}{trendData.waistStats.changePercent.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  )}
                </CardContent>
              </Card>
            </View>

            {/* 导出按钮 */}
            <View className="px-4 pt-6 pb-6">
              <Button 
                className="w-full bg-[#F0EDE6] text-[#1E2933] py-4 rounded-xl text-base font-semibold"
                onClick={handleExport}
              >
                <Download size={20} color="#1E2933" />
                <Text className="ml-2">导出数据 (CSV)</Text>
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
