import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Scale, Ruler, Share2, TrendingDown, TrendingUp, Activity, CircleUser } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { HealthRangeBar } from '@/components/ui/health-range-bar'
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
  bodyComposition: {
    fatMass: number // 脂肪量
    leanBodyMass: number // 去脂体重
    bodyWater: number // 水分
    protein: number // 蛋白质
    muscleMass: number // 肌肉量
    skeletalMuscle: number // 骨骼肌
    boneMass: number // 骨质
    vfi: number // 内脏脂肪等级
    bmr: number // 基础代谢率
  } | null
  gender: 'male' | 'female'
}

interface BodyComparisonData {
  summary: {
    days: number
    weightLoss: number
    fatLoss: number
  }
  firstRecord: {
    date: string
    weight: number
    waist: number
    bmi: number
    bodyFatRate: number
    fatMass: number
    leanBodyMass: number
    bodyWater: number
    protein: number
    boneMass: number
    muscleMass: number
    skeletalMuscle: number
    vfi: number
    bmr: number
    healthScore: number
    obesityLevel: string
    bodyAge: number
    weightControl: number
    fatControl: number
    muscleControl: number
    bodyType: string
    weightJin: number
    fatMassJin: number
    leanBodyMassJin: number
    bodyWaterJin: number
    proteinJin: number
    boneMassJin: number
    muscleMassJin: number
    skeletalMuscleJin: number
    weightControlJin: number
    fatControlJin: number
  }
  latestRecord: {
    date: string
    weight: number
    waist: number
    bmi: number
    bodyFatRate: number
    fatMass: number
    leanBodyMass: number
    bodyWater: number
    protein: number
    boneMass: number
    muscleMass: number
    skeletalMuscle: number
    vfi: number
    bmr: number
    healthScore: number
    obesityLevel: string
    bodyAge: number
    weightControl: number
    fatControl: number
    muscleControl: number
    bodyType: string
    weightJin: number
    fatMassJin: number
    leanBodyMassJin: number
    bodyWaterJin: number
    proteinJin: number
    boneMassJin: number
    muscleMassJin: number
    skeletalMuscleJin: number
    weightControlJin: number
    fatControlJin: number
  }
  changes: Record<string, { value: number; text: string; direction: string }>
}

export default function DataPage() {
  const [timeRange, setTimeRange] = useState(7)
  const [trendData, setTrendData] = useState<TrendResponse | null>(null)
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [comparisonData, setComparisonData] = useState<BodyComparisonData | null>(null)
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

  async function fetchStats() {
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
    }
  }

  async function fetchComparison() {
    try {
      const res = await Network.request({
        url: '/api/health/body-comparison',
        method: 'GET'
      })
      console.log('Comparison data response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setComparisonData(res.data.data)
      }
    } catch (error) {
      console.error('Fetch comparison error:', error)
    }
  }

  useEffect(() => {
    fetchTrendData()
    fetchStats()
    fetchComparison()
    
    // 监听打卡成功事件，刷新数据
    const handleCheckinSuccess = () => {
      console.log('数据页收到打卡成功事件，刷新数据')
      fetchTrendData()
      fetchStats()
      fetchComparison()
    }
    Taro.eventCenter.on('checkinSuccess', handleCheckinSuccess)
    
    return () => {
      Taro.eventCenter.off('checkinSuccess', handleCheckinSuccess)
    }
  }, [timeRange])

  // 每次进入页面时刷新数据（打卡后数据变化）
  useDidShow(() => {
    fetchTrendData()
    fetchStats()
    fetchComparison()
  })

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

  const genderText = statsData?.gender === 'male' ? '男性' : '女性'

  // 分享功能
  async function handleShare() {
    try {
      const res = await Taro.showActionSheet({
        itemList: ['生成健康报告', '复制数据到剪贴板', '分享给好友']
      })
      
      switch (res.tapIndex) {
        case 0: // 生成健康报告
          await generateHealthReport()
          break
        case 1: // 复制数据
          await copyDataToClipboard()
          break
        case 2: // 分享给好友
          await shareToFriends()
          break
      }
    } catch {
      // 用户取消
    }
  }

  async function generateHealthReport() {
    if (!statsData) {
      Taro.showToast({ title: '暂无数据', icon: 'none' })
      return
    }
    
    const report = `
📊 健康数据报告
生成时间：${new Date().toLocaleDateString()}

【基本信息】
性别：${genderText}

【体重统计】
平均体重：${statsData.weightStats.avg.toFixed(1)} kg
最高体重：${statsData.weightStats.max.toFixed(1)} kg (${statsData.weightStats.maxDate})
最低体重：${statsData.weightStats.min.toFixed(1)} kg (${statsData.weightStats.minDate})
波动范围：${(statsData.weightStats.max - statsData.weightStats.min).toFixed(1)} kg

【腰围统计】
平均腰围：${statsData.waistStats.avg.toFixed(1)} cm
最大腰围：${statsData.waistStats.max.toFixed(1)} cm (${statsData.waistStats.maxDate})
最小腰围：${statsData.waistStats.min.toFixed(1)} cm (${statsData.waistStats.minDate})

【健康等级】
BMI：${statsData.bmiLevel.current.toFixed(1)} (${statsData.bmiLevel.level})
体脂率：${statsData.bodyFatLevel.current.toFixed(1)}% (${statsData.bodyFatLevel.status})
腰围：${statsData.waistLevel.current.toFixed(1)} cm (${statsData.waistLevel.level})

— 来自体重管理小程序
    `.trim()
    
    await Taro.setClipboardData({ data: report })
    Taro.showToast({ title: '报告已复制', icon: 'success' })
  }

  async function copyDataToClipboard() {
    if (!trendData) {
      Taro.showToast({ title: '暂无数据', icon: 'none' })
      return
    }
    
    const csvWeightData = trendData.weightTrend.map(d => 
      `${d.date},${d.weight}`
    ).join('\n')
    
    const data = `日期,体重(kg)\n${csvWeightData}`
    
    await Taro.setClipboardData({ data })
    Taro.showToast({ title: '数据已复制', icon: 'success' })
  }

  async function shareToFriends() {
    // 小程序环境使用分享功能
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      // 需要在页面配置中启用分享
      Taro.showToast({ title: '请点击右上角分享', icon: 'none' })
    } else {
      // H5环境复制分享链接
      const shareUrl = window.location.href
      await Taro.setClipboardData({ data: shareUrl })
      Taro.showToast({ title: '链接已复制', icon: 'success' })
    }
  }

  return (
    <View className="flex flex-col min-h-screen bg-[#F7F4ED]">
      {/* Header */}
      <View className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-[#F7F4ED]">
        <View className="w-10 h-10" />
        <Text className="text-base font-semibold text-[#1E2933]">数据分析</Text>
        <View 
          className="w-10 h-10 flex items-center justify-center rounded-full"
          onClick={handleShare}
        >
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
          <View className="px-4 py-4 space-y-4">
            {/* 体重趋势卡片 */}
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

            {/* 腰围趋势卡片 */}
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

            {/* 分割线 */}
            <View className="h-2 bg-[#E4DED2] mx-[-16px]" />

            {/* 统计分析标题 */}
            <View className="flex items-center gap-2 px-4 py-2">
              <View className="w-1 h-4 bg-[#F26B3A] rounded" />
              <Text className="text-base font-semibold text-[#1E2933]">统计分析</Text>
            </View>

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

            {/* 体重统计卡片 */}
            {statsData?.weightStats && (
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
                        {statsData.weightStats.avg.toFixed(1)}
                        <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                      </Text>
                    </View>
                    <View className="bg-[#F7F4ED] rounded-xl p-3">
                      <Text className="text-xs text-[#6B7280] mb-1 block">标准差</Text>
                      <Text className="text-xl font-bold text-[#1E2933]">
                        {statsData.weightStats.stdDev.toFixed(1)}
                        <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-4 mt-3">
                    <View className="bg-[#EF4444]/10 rounded-xl p-3">
                      <Text className="text-xs text-[#6B7280] mb-1 block">最大值</Text>
                      <Text className="text-lg font-bold text-[#EF4444]">
                        {statsData.weightStats.max.toFixed(1)} kg
                      </Text>
                      <Text className="text-xs text-[#6B7280] mt-1">
                        {statsData.weightStats.maxDate ? formatDate(statsData.weightStats.maxDate) : '-'}
                      </Text>
                    </View>
                    <View className="bg-[#3C8D6E]/10 rounded-xl p-3">
                      <Text className="text-xs text-[#6B7280] mb-1 block">最小值</Text>
                      <Text className="text-lg font-bold text-[#3C8D6E]">
                        {statsData.weightStats.min.toFixed(1)} kg
                      </Text>
                      <Text className="text-xs text-[#6B7280] mt-1">
                        {statsData.weightStats.minDate ? formatDate(statsData.weightStats.minDate) : '-'}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 腰围统计卡片 */}
            {statsData?.waistStats && (
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
                        {statsData.waistStats.avg.toFixed(1)}
                        <Text className="text-sm font-normal text-[#6B7280] ml-1">cm</Text>
                      </Text>
                    </View>
                    <View className="bg-[#F7F4ED] rounded-xl p-3">
                      <Text className="text-xs text-[#6B7280] mb-1 block">标准差</Text>
                      <Text className="text-xl font-bold text-[#1E2933]">
                        {statsData.waistStats.stdDev.toFixed(1)}
                        <Text className="text-sm font-normal text-[#6B7280] ml-1">cm</Text>
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-4 mt-3">
                    <View className="bg-[#EF4444]/10 rounded-xl p-3">
                      <Text className="text-xs text-[#6B7280] mb-1 block">最大值</Text>
                      <Text className="text-lg font-bold text-[#EF4444]">
                        {statsData.waistStats.max.toFixed(1)} cm
                      </Text>
                      <Text className="text-xs text-[#6B7280] mt-1">
                        {statsData.waistStats.maxDate ? formatDate(statsData.waistStats.maxDate) : '-'}
                      </Text>
                    </View>
                    <View className="bg-[#3C8D6E]/10 rounded-xl p-3">
                      <Text className="text-xs text-[#6B7280] mb-1 block">最小值</Text>
                      <Text className="text-lg font-bold text-[#3C8D6E]">
                        {statsData.waistStats.min.toFixed(1)} cm
                      </Text>
                      <Text className="text-xs text-[#6B7280] mt-1">
                        {statsData.waistStats.minDate ? formatDate(statsData.waistStats.minDate) : '-'}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* BMI 健康等级 */}
            {statsData?.bmiLevel && (
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
                        {statsData.bmiLevel.current.toFixed(1)}
                      </Text>
                    </View>
                    <View
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: getBmiColor(statsData.bmiLevel.level) + '20' }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: getBmiColor(statsData.bmiLevel.level) }}
                      >
                        {statsData.bmiLevel.level}
                      </Text>
                    </View>
                  </View>

                  {/* BMI 健康区间线段图 */}
                  <HealthRangeBar
                    currentValue={statsData.bmiLevel.current}
                    ranges={statsData.bmiLevel.ranges}
                    unit=""
                    minValue={15}
                    maxValue={35}
                  />
                </CardContent>
              </Card>
            )}

            {/* 体脂率健康等级 */}
            {statsData?.bodyFatLevel && (
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
                        {statsData.bodyFatLevel.current.toFixed(1)}%
                      </Text>
                    </View>
                    <View
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: getLevelColor(statsData.bodyFatLevel.status) + '20' }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: getLevelColor(statsData.bodyFatLevel.status) }}
                      >
                        {statsData.bodyFatLevel.status}
                      </Text>
                    </View>
                  </View>

                  {/* 体脂率健康区间线段图 */}
                  <HealthRangeBar
                    currentValue={statsData.bodyFatLevel.current}
                    ranges={statsData.bodyFatLevel.ranges}
                    unit="%"
                    minValue={5}
                    maxValue={40}
                  />
                </CardContent>
              </Card>
            )}

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
                        {statsData.waistLevel.current.toFixed(1)}
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
                  />
                </CardContent>
              </Card>
            )}
          </View>
        )}

        {/* 身体成分指标 */}
        {statsData?.bodyComposition && (
            <View className="px-4 mt-4">
              <Text className="block text-lg font-semibold text-[#1E2933] mb-3">身体成分指标</Text>
              
              {/* 指标卡片网格 */}
              <View className="grid grid-cols-2 gap-3">
                {/* 脂肪量 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">脂肪量</Text>
                  <Text className="block text-xl font-bold text-[#F97316]">{statsData.bodyComposition.fatMass}</Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">kg = 体重 × 体脂率</Text>
                </View>
                
                {/* 去脂体重 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">去脂体重</Text>
                  <Text className="block text-xl font-bold text-[#3B82F6]">{statsData.bodyComposition.leanBodyMass}</Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">kg = 体重 - 脂肪量</Text>
                </View>
                
                {/* 水分 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">水分</Text>
                  <Text className="block text-xl font-bold text-[#06B6D4]">{statsData.bodyComposition.bodyWater}</Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">kg = 去脂体重 × 73.5%</Text>
                </View>
                
                {/* 蛋白质 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">蛋白质</Text>
                  <Text className="block text-xl font-bold text-[#8B5CF6]">{statsData.bodyComposition.protein}</Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">kg = 去脂体重 × 19%</Text>
                </View>
                
                {/* 肌肉量 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">肌肉量</Text>
                  <Text className="block text-xl font-bold text-[#10B981]">{statsData.bodyComposition.muscleMass}</Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">kg = 水分 + 蛋白质</Text>
                </View>
                
                {/* 骨骼肌 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">骨骼肌</Text>
                  <Text className="block text-xl font-bold text-[#EC4899]">{statsData.bodyComposition.skeletalMuscle}</Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">kg = 肌肉量 × 71.3%</Text>
                </View>
                
                {/* 骨质 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">骨质</Text>
                  <Text className="block text-xl font-bold text-[#6366F1]">{statsData.bodyComposition.boneMass}</Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">kg = 去脂体重 × 17%</Text>
                </View>
                
                {/* 内脏脂肪等级 */}
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="block text-xs text-[#6B7280] mb-1">内脏脂肪等级</Text>
                  <Text className={`block text-xl font-bold ${statsData.bodyComposition.vfi <= 9 ? 'text-[#10B981]' : statsData.bodyComposition.vfi <= 14 ? 'text-[#F97316]' : 'text-[#EF4444]'}`}>
                    {statsData.bodyComposition.vfi}
                  </Text>
                  <Text className="block text-xs text-[#9CA3AF] mt-1">级 {statsData.bodyComposition.vfi <= 9 ? '(正常)' : statsData.bodyComposition.vfi <= 14 ? '(偏高)' : '(高风险)'}</Text>
                </View>
              </View>
              
              {/* 基础代谢率 */}
              <View className="bg-gradient-to-r from-[#4CAF50] to-[#45A049] rounded-xl p-4 shadow-sm mt-3">
                <View className="flex flex-row justify-between items-center">
                  <View>
                    <Text className="block text-sm text-white text-opacity-80">基础代谢率 (BMR)</Text>
                    <Text className="block text-xs text-white text-opacity-60 mt-1">Mifflin-St Jeor 公式计算</Text>
                  </View>
                  <View className="text-right">
                    <Text className="block text-2xl font-bold text-white">{statsData.bodyComposition.bmr}</Text>
                    <Text className="block text-xs text-white text-opacity-80">kcal/天</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

        {/* 身体数据对比表格 */}
        {comparisonData && (
          <View className="px-4 mt-6 mb-6">
            <Text className="block text-lg font-semibold text-[#1E2933] mb-3">身体数据对比</Text>
            <Text className="block text-xs text-[#6B7280] mb-3">
              首次打卡 {comparisonData.firstRecord.date} 与最新打卡 {comparisonData.latestRecord.date} 对比（共 {comparisonData.summary.days} 天）
            </Text>
            
            {/* 表格 */}
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 表头 */}
              <View className="flex flex-row bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs font-semibold text-[#374151] text-center">指标</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs font-semibold text-[#374151] text-center">初始</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs font-semibold text-[#374151] text-center">当前</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className="block text-xs font-semibold text-[#374151] text-center">变化</Text>
                </View>
              </View>
              
              {/* 数据行 */}
              {/* 体重 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">体重</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.weightJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.weightJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.weight?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.weight?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.weight?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* BMI */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">BMI</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.bmi}</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.bmi}</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.bmi?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.bmi?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.bmi?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 体脂率 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">体脂率</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.bodyFatRate}%</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.bodyFatRate}%</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.bodyFatRate?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.bodyFatRate?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.bodyFatRate?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 脂肪量 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">脂肪量</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.fatMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.fatMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.fatMass?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.fatMass?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.fatMass?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 去脂体重 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">去脂体重</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.leanBodyMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.leanBodyMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.leanBodyMass?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.leanBodyMass?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.leanBodyMass?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 水分 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">水分</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.bodyWaterJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.bodyWaterJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.bodyWater?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.bodyWater?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.bodyWater?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 蛋白质 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">蛋白质</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.proteinJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.proteinJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.protein?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.protein?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.protein?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 骨量 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">骨量</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.boneMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.boneMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.boneMass?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.boneMass?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.boneMass?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 肌肉量 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">肌肉量</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.muscleMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.muscleMassJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.muscleMass?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.muscleMass?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.muscleMass?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 骨骼肌 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">骨骼肌</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.skeletalMuscleJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.skeletalMuscleJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.skeletalMuscle?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.skeletalMuscle?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.skeletalMuscle?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 内脏脂肪指数 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">内脏脂肪指数</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.vfi}</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.vfi}</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.vfi?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.vfi?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.vfi?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 基础代谢率 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">基础代谢率</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.bmr}kcal</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.bmr}kcal</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.bmr?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.bmr?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.bmr?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 肥胖等级 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">肥胖等级</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.obesityLevel}</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.obesityLevel}</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className="block text-xs text-[#6B7280] text-center">-</Text>
                </View>
              </View>

              {/* 身体年龄 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">身体年龄</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.bodyAge}岁</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.bodyAge}岁</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.bodyAge?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.bodyAge?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.bodyAge?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 健康评分 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">健康评分</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.healthScore}分</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.healthScore}分</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.healthScore?.direction === 'up' ? 'text-[#10B981]' : comparisonData.changes?.healthScore?.direction === 'down' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.healthScore?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 体重控制 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">体重控制</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.weightControlJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.weightControlJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.weightControl?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.weightControl?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.weightControl?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 脂肪控制 */}
              <View className="flex flex-row border-b border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">脂肪控制</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.fatControlJin}斤</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.fatControlJin}斤</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className={`block text-xs text-center font-semibold ${comparisonData.changes?.fatControl?.direction === 'down' ? 'text-[#10B981]' : comparisonData.changes?.fatControl?.direction === 'up' ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {comparisonData.changes?.fatControl?.text || '-'}
                  </Text>
                </View>
              </View>

              {/* 肌肉控制 */}
              <View className="flex flex-row">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">肌肉控制</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.firstRecord.muscleControl}kg</Text>
                </View>
                <View className="w-1/4 p-2 border-r border-[#E5E7EB]">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.muscleControl}kg</Text>
                </View>
                <View className="w-1/4 p-2">
                  <Text className="block text-xs text-[#6B7280] text-center">-</Text>
                </View>
              </View>

              {/* 身体型 */}
              <View className="flex flex-row border-t border-[#E5E7EB]">
                <View className="w-1/4 p-2 border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <Text className="block text-xs text-[#374151]">身体型</Text>
                </View>
                <View className="w-3/4 p-2">
                  <Text className="block text-xs text-[#1E2933] text-center">{comparisonData.latestRecord.bodyType}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        </ScrollView>
        </View>
  )
}
