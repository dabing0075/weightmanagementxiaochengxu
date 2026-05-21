import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Scale, Ruler, Activity, TrendingUp, RefreshCw } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Network } from '@/network'

interface StatsData {
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
  bmiLevel: {
    current: number
    level: string
    distribution: {
      underweight: number
      normal: number
      overweight: number
      obese: number
    }
  }
  bodyFatLevel: {
    current: number
    status: string
    healthyRange: { min: number; max: number }
  }
}

export default function StatsPage() {
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/health/stats',
        method: 'GET'
      })
      console.log('Stats data response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setStatsData(res.data.data)
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  function formatDate(dateStr: string) {
    return dateStr.slice(5) // MM-DD
  }

  function getBmiColor(level: string) {
    switch (level) {
      case '偏瘦': return '#3B82F6'
      case '正常': return '#3C8D6E'
      case '超重': return '#F59E0B'
      case '肥胖': return '#EF4444'
      default: return '#6B7280'
    }
  }

  return (
    <View className="flex flex-col min-h-screen bg-[#F7F4ED]">
      {/* Header */}
      <View className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-[#F7F4ED]">
        <View className="w-10 h-10" />
        <Text className="text-base font-semibold text-[#1E2933]">统计分析</Text>
        <View 
          className="w-10 h-10 flex items-center justify-center rounded-full"
          onClick={fetchStats}
        >
          <RefreshCw size={20} color="#6B7280" />
        </View>
      </View>

      {/* Content */}
      <ScrollView scrollY className="flex-1 pb-20">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-sm text-[#6B7280]">加载中...</Text>
          </View>
        ) : (
          <View className="px-4 py-4 space-y-4">
            {/* 体重统计卡片 */}
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#F26B3A]/10 flex items-center justify-center">
                    <Scale size={16} color="#F26B3A" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">体重统计</Text>
                </View>

                <View className="grid grid-cols-2 gap-4">
                  <View className="bg-[#F7F4ED] rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">平均值</Text>
                    <Text className="text-xl font-bold text-[#1E2933]">
                      {statsData?.weightStats.avg.toFixed(1) || '-'} 
                      <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                    </Text>
                  </View>
                  <View className="bg-[#F7F4ED] rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">标准差</Text>
                    <Text className="text-xl font-bold text-[#1E2933]">
                      {statsData?.weightStats.stdDev.toFixed(1) || '-'}
                      <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                    </Text>
                  </View>
                </View>

                <View className="grid grid-cols-2 gap-4 mt-3">
                  <View className="bg-[#EF4444]/10 rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">最大值</Text>
                    <Text className="text-lg font-bold text-[#EF4444]">
                      {statsData?.weightStats.max.toFixed(1) || '-'} kg
                    </Text>
                    <Text className="text-xs text-[#6B7280] mt-1">
                      {statsData?.weightStats.maxDate ? formatDate(statsData.weightStats.maxDate) : '-'}
                    </Text>
                  </View>
                  <View className="bg-[#3C8D6E]/10 rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">最小值</Text>
                    <Text className="text-lg font-bold text-[#3C8D6E]">
                      {statsData?.weightStats.min.toFixed(1) || '-'} kg
                    </Text>
                    <Text className="text-xs text-[#6B7280] mt-1">
                      {statsData?.weightStats.minDate ? formatDate(statsData.weightStats.minDate) : '-'}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 腰围统计卡片 */}
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#3C8D6E]/10 flex items-center justify-center">
                    <Ruler size={16} color="#3C8D6E" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">腰围统计</Text>
                </View>

                <View className="grid grid-cols-2 gap-4">
                  <View className="bg-[#F7F4ED] rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">平均值</Text>
                    <Text className="text-xl font-bold text-[#1E2933]">
                      {statsData?.waistStats.avg.toFixed(1) || '-'} 
                      <Text className="text-sm font-normal text-[#6B7280] ml-1">cm</Text>
                    </Text>
                  </View>
                  <View className="bg-[#F7F4ED] rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">标准差</Text>
                    <Text className="text-xl font-bold text-[#1E2933]">
                      {statsData?.waistStats.stdDev.toFixed(1) || '-'}
                      <Text className="text-sm font-normal text-[#6B7280] ml-1">cm</Text>
                    </Text>
                  </View>
                </View>

                <View className="grid grid-cols-2 gap-4 mt-3">
                  <View className="bg-[#EF4444]/10 rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">最大值</Text>
                    <Text className="text-lg font-bold text-[#EF4444]">
                      {statsData?.waistStats.max.toFixed(1) || '-'} cm
                    </Text>
                    <Text className="text-xs text-[#6B7280] mt-1">
                      {statsData?.waistStats.maxDate ? formatDate(statsData.waistStats.maxDate) : '-'}
                    </Text>
                  </View>
                  <View className="bg-[#3C8D6E]/10 rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">最小值</Text>
                    <Text className="text-lg font-bold text-[#3C8D6E]">
                      {statsData?.waistStats.min.toFixed(1) || '-'} cm
                    </Text>
                    <Text className="text-xs text-[#6B7280] mt-1">
                      {statsData?.waistStats.minDate ? formatDate(statsData.waistStats.minDate) : '-'}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* BMI 变化趋势 */}
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <Activity size={16} color="#6366F1" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">BMI 变化趋势</Text>
                </View>

                <View className="flex items-center justify-between mb-3">
                  <View>
                    <Text className="text-sm text-[#6B7280]">当前 BMI</Text>
                    <Text className="text-2xl font-bold text-[#1E2933]">
                      {statsData?.bmiLevel.current.toFixed(1) || '-'}
                    </Text>
                  </View>
                  <View 
                    className="px-4 py-2 rounded-full"
                    style={{ backgroundColor: getBmiColor(statsData?.bmiLevel.level || '') + '20' }}
                  >
                    <Text 
                      className="text-sm font-semibold"
                      style={{ color: getBmiColor(statsData?.bmiLevel.level || '') }}
                    >
                      {statsData?.bmiLevel.level || '-'}
                    </Text>
                  </View>
                </View>

                {/* BMI 等级分布 */}
                <View className="bg-[#F7F4ED] rounded-xl p-3">
                  <Text className="text-xs text-[#6B7280] mb-2 block">健康等级标准</Text>
                  <View className="flex justify-between text-xs">
                    <View className="text-center">
                      <View className="w-4 h-4 rounded bg-[#3B82F6] mb-1 mx-auto" />
                      <Text className="text-[#6B7280]">偏瘦</Text>
                      <Text className="text-[#6B7280]">&lt;18.5</Text>
                    </View>
                    <View className="text-center">
                      <View className="w-4 h-4 rounded bg-[#3C8D6E] mb-1 mx-auto" />
                      <Text className="text-[#6B7280]">正常</Text>
                      <Text className="text-[#6B7280]">18.5-24</Text>
                    </View>
                    <View className="text-center">
                      <View className="w-4 h-4 rounded bg-[#F59E0B] mb-1 mx-auto" />
                      <Text className="text-[#6B7280]">超重</Text>
                      <Text className="text-[#6B7280]">24-28</Text>
                    </View>
                    <View className="text-center">
                      <View className="w-4 h-4 rounded bg-[#EF4444] mb-1 mx-auto" />
                      <Text className="text-[#6B7280]">肥胖</Text>
                      <Text className="text-[#6B7280]">&gt;28</Text>
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 体脂率变化趋势 */}
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#EC4899]/10 flex items-center justify-center">
                    <TrendingUp size={16} color="#EC4899" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">体脂率变化趋势</Text>
                </View>

                <View className="flex items-center justify-between mb-3">
                  <View>
                    <Text className="text-sm text-[#6B7280]">当前体脂率</Text>
                    <Text className="text-2xl font-bold text-[#1E2933]">
                      {statsData?.bodyFatLevel.current.toFixed(1) || '-'}%
                    </Text>
                  </View>
                  <View className="px-4 py-2 rounded-full bg-[#3C8D6E]/10">
                    <Text className="text-sm font-semibold text-[#3C8D6E]">
                      {statsData?.bodyFatLevel.status || '-'}
                    </Text>
                  </View>
                </View>

                {/* 健康范围指示条 */}
                <View className="bg-[#F7F4ED] rounded-xl p-3">
                  <Text className="text-xs text-[#6B7280] mb-2 block">
                    健康范围: {statsData?.bodyFatLevel.healthyRange.min || '-'}% - {statsData?.bodyFatLevel.healthyRange.max || '-'}%
                  </Text>
                  <View className="h-2 bg-[#E4DED2] rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-[#3C8D6E] rounded-full"
                      style={{ width: '60%' }}
                    />
                  </View>
                  <View className="flex justify-between text-xs text-[#6B7280] mt-1">
                    <Text>偏低</Text>
                    <Text>健康</Text>
                    <Text>偏高</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 健康建议卡片 */}
            <Card className="bg-gradient-to-br from-[#F26B3A]/10 to-[#3C8D6E]/10 shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-3">
                  <Text className="text-base font-semibold text-[#1E2933]">健康建议</Text>
                </View>

                <View className="space-y-2">
                  <View className="flex items-start gap-2">
                    <View className="w-2 h-2 rounded-full bg-[#F26B3A] mt-2" />
                    <Text className="text-sm text-[#1E2933] flex-1">
                      体重呈下降趋势，继续保持健康饮食和适量运动
                    </Text>
                  </View>
                  <View className="flex items-start gap-2">
                    <View className="w-2 h-2 rounded-full bg-[#3C8D6E] mt-2" />
                    <Text className="text-sm text-[#1E2933] flex-1">
                      BMI 在正常范围内，保持良好的生活习惯
                    </Text>
                  </View>
                  <View className="flex items-start gap-2">
                    <View className="w-2 h-2 rounded-full bg-[#6366F1] mt-2" />
                    <Text className="text-sm text-[#1E2933] flex-1">
                      腰围接近目标值，继续坚持核心训练
                    </Text>
                  </View>
                  <View className="flex items-start gap-2">
                    <View className="w-2 h-2 rounded-full bg-[#EC4899] mt-2" />
                    <Text className="text-sm text-[#1E2933] flex-1">
                      每天保持充足水分摄入，促进新陈代谢
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
