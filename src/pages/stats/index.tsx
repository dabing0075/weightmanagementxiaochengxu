import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Scale, Ruler, Activity, TrendingUp, RefreshCw, CircleUser } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { HealthRangeBar } from '@/components/ui/health-range-bar'
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
    level: string
  }
  bmiLevel: {
    current: number
    level: string
    ranges: {
      underweight: { max: number; label: string }
      normal: { min: number; max: number; label: string }
      overweight: { min: number; max: number; label: string }
      obese: { min: number; label: string }
    }
  }
  bodyFatLevel: {
    current: number
    status: string
    ranges: {
      low: { max: number; label: string }
      normal: { min: number; max: number; label: string }
      high: { min: number; max: number; label: string }
      obese: { min: number; label: string }
    }
  }
  waistLevel: {
    current: number
    level: string
    ranges: {
      normal: { max: number; label: string }
      preObese: { min: number; max: number; label: string }
      obese: { min: number; label: string }
    }
  }
  gender: 'male' | 'female'
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
      case '体重过低':
      case '偏瘦':
        return '#3B82F6'
      case '正常':
        return '#3C8D6E'
      case '超重':
        return '#F59E0B'
      case '肥胖':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  function getLevelColor(level: string) {
    switch (level) {
      case '正常':
        return '#3C8D6E'
      case '偏高':
      case '中心型肥胖前期':
        return '#F59E0B'
      case '肥胖':
      case '中心型肥胖':
        return '#EF4444'
      case '偏低':
        return '#3B82F6'
      default:
        return '#6B7280'
    }
  }

  const genderText = statsData?.gender === 'male' ? '男性' : '女性'

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
            {/* 性别提示 */}
            {statsData && (
              <View className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-sm">
                <CircleUser size={16} color={statsData.gender === 'male' ? '#3B82F6' : '#EC4899'} />
                <Text className="text-sm text-[#6B7280]">
                  当前健康标准基于
                  <Text className="font-semibold text-[#1E2933]"> {genderText} </Text>
                  体型评价
                </Text>
              </View>
            )}

            {/* BMI 变化趋势 */}
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <Activity size={16} color="#6366F1" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">BMI 健康等级</Text>
                </View>

                <View className="flex items-center justify-between mb-4">
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

                {/* BMI 健康区间线段图 */}
                {statsData?.bmiLevel && (
                  <HealthRangeBar
                    currentValue={statsData.bmiLevel.current}
                    ranges={statsData.bmiLevel.ranges}
                    unit=""
                    minValue={15}
                    maxValue={35}
                  />
                )}
              </CardContent>
            </Card>

            {/* 体脂率变化趋势 */}
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#EC4899]/10 flex items-center justify-center">
                    <TrendingUp size={16} color="#EC4899" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">体脂率健康等级</Text>
                </View>

                <View className="flex items-center justify-between mb-4">
                  <View>
                    <Text className="text-sm text-[#6B7280]">当前体脂率</Text>
                    <Text className="text-2xl font-bold text-[#1E2933]">
                      {statsData?.bodyFatLevel.current.toFixed(1) || '-'}%
                    </Text>
                  </View>
                  <View
                    className="px-4 py-2 rounded-full"
                    style={{ backgroundColor: getLevelColor(statsData?.bodyFatLevel.status || '') + '20' }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: getLevelColor(statsData?.bodyFatLevel.status || '') }}
                    >
                      {statsData?.bodyFatLevel.status || '-'}
                    </Text>
                  </View>
                </View>

                {/* 体脂率健康区间线段图 */}
                {statsData?.bodyFatLevel && (
                  <HealthRangeBar
                    currentValue={statsData.bodyFatLevel.current}
                    ranges={statsData.bodyFatLevel.ranges}
                    unit="%"
                    minValue={5}
                    maxValue={40}
                  />
                )}
              </CardContent>
            </Card>

            {/* 腰围健康等级 */}
            {statsData?.waistLevel && (
              <Card className="bg-white shadow-md">
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-4">
                    <View className="flex items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-[#3C8D6E]/10 flex items-center justify-center">
                        <Ruler size={16} color="#3C8D6E" />
                      </View>
                      <Text className="text-base font-semibold text-[#1E2933]">腰围健康等级</Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getLevelColor(statsData.waistLevel.level) + '20' }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getLevelColor(statsData.waistLevel.level) }}
                      >
                        {statsData.waistLevel.level}
                      </Text>
                    </View>
                  </View>

                  <View className="flex items-center justify-between mb-4">
                    <View>
                      <Text className="text-sm text-[#6B7280]">当前腰围</Text>
                      <Text className="text-2xl font-bold text-[#1E2933]">
                        {statsData.waistLevel.current.toFixed(1) || '-'}
                        <Text className="text-sm font-normal text-[#6B7280] ml-1">cm</Text>
                      </Text>
                    </View>
                  </View>

                  {/* 腰围健康区间线段图 */}
                  <HealthRangeBar
                    currentValue={statsData.waistLevel.current}
                    ranges={statsData.waistLevel.ranges}
                    unit="cm"
                    minValue={60}
                    maxValue={100}
                    multiLineLabels={true}
                  />
                </CardContent>
              </Card>
            )}

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
          </View>
        )}
      </ScrollView>
    </View>
  )
}
