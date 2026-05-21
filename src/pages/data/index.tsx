import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Scale, Ruler, Download, Share2 } from 'lucide-react-taro'
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

  // 计算图表数据
  const weightData = trendData?.weightTrend || []
  const waistData = trendData?.waistTrend || []
  
  const minWeight = weightData.length > 0 ? Math.min(...weightData.map(d => d.weight)) : 0
  const maxWeight = weightData.length > 0 ? Math.max(...weightData.map(d => d.weight)) : 100
  const minWaist = waistData.length > 0 ? Math.min(...waistData.map(d => d.waist)) : 0
  const maxWaist = waistData.length > 0 ? Math.max(...waistData.map(d => d.waist)) : 100

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
          <ScrollView scrollX className="flex flex-row gap-2">
            {timeOptions.map(option => (
              <View
                key={option.value}
                className={`flex-shrink-0 px-4 py-2 rounded-full ${
                  timeRange === option.value 
                    ? 'bg-[#F26B3A]' 
                    : 'bg-[#F0EDE6]'
                }`}
                onClick={() => setTimeRange(option.value)}
              >
                <Text className={`text-sm font-medium ${
                  timeRange === option.value ? 'text-white' : 'text-[#6B7280]'
                }`}
                >
                  {option.label}
                </Text>
              </View>
            ))}
          </ScrollView>
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

                  {/* 简化趋势图 */}
                  {weightData.length > 0 ? (
                    <View className="space-y-2">
                      {weightData.slice(-7).map((item, index) => (
                        <View key={index} className="flex items-center gap-3">
                          <Text className="text-xs text-[#6B7280] w-12">{formatDate(item.date)}</Text>
                          <View className="flex-1 h-6 bg-[#F0EDE6] rounded overflow-hidden">
                            <View 
                              className="h-full bg-[#F26B3A] rounded"
                              style={{
                                width: `${((item.weight - minWeight) / (maxWeight - minWeight || 1)) * 100}%`
                              }}
                            />
                          </View>
                          <Text className="text-sm font-medium text-[#1E2933] w-12 text-right">
                            {item.weight.toFixed(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View className="py-8 text-center">
                      <Text className="text-sm text-[#6B7280]">暂无数据</Text>
                    </View>
                  )}

                  {/* 统计摘要 */}
                  {trendData?.weightStats && (
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
                        <Text className={`text-base font-semibold ${
                          trendData.weightStats.change > 0 ? 'text-[#EF4444]' : 'text-[#3C8D6E]'
                        }`}
                        >
                          {trendData.weightStats.change > 0 ? '+' : ''}{trendData.weightStats.change.toFixed(1)}
                        </Text>
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

                  {/* 简化趋势图 */}
                  {waistData.length > 0 ? (
                    <View className="space-y-2">
                      {waistData.slice(-7).map((item, index) => (
                        <View key={index} className="flex items-center gap-3">
                          <Text className="text-xs text-[#6B7280] w-12">{formatDate(item.date)}</Text>
                          <View className="flex-1 h-6 bg-[#F0EDE6] rounded overflow-hidden">
                            <View 
                              className="h-full bg-[#3C8D6E] rounded"
                              style={{
                                width: `${((item.waist - minWaist) / (maxWaist - minWaist || 1)) * 100}%`
                              }}
                            />
                          </View>
                          <Text className="text-sm font-medium text-[#1E2933] w-12 text-right">
                            {item.waist.toFixed(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View className="py-8 text-center">
                      <Text className="text-sm text-[#6B7280]">暂无数据</Text>
                    </View>
                  )}

                  {/* 统计摘要 */}
                  {trendData?.waistStats && (
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
                        <Text className={`text-base font-semibold ${
                          trendData.waistStats.change > 0 ? 'text-[#EF4444]' : 'text-[#3C8D6E]'
                        }`}
                        >
                          {trendData.waistStats.change > 0 ? '+' : ''}{trendData.waistStats.change.toFixed(1)}
                        </Text>
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
