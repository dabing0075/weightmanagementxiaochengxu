import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Bell, 
  Scale, 
  Ruler, 
  Activity, 
  Percent,
  CircleCheck,
  FileText,
  Target
} from 'lucide-react-taro'

// 用户信息接口
interface UserInfo {
  id: string
  nickname: string
  gender: string
  birth_date: string
  height: number
  target_weight: number
  target_waist: number
  avatar_url: string | null
}

// 健康指标接口
interface HealthMetrics {
  currentWeight: number
  currentWaist: number
  bmi: number
  bmiLevel: string
  bodyFatRate: number
  bodyFatLevel: string
  weightDiff: number
  todayCheckedIn: boolean
}

// 趋势数据接口
interface TrendData {
  date: string
  weight: number
}

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [trendData, setTrendData] = useState<TrendData[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 获取用户信息
      const userRes = await Network.request({
        url: '/api/user/info',
        method: 'GET'
      })
      console.log('用户信息响应:', userRes.data)
      
      if (userRes.data?.code === 200 && userRes.data.data) {
        setUserInfo(userRes.data.data)
      }

      // 获取健康指标
      const metricsRes = await Network.request({
        url: '/api/health/metrics',
        method: 'GET'
      })
      console.log('健康指标响应:', metricsRes.data)
      
      if (metricsRes.data?.code === 200 && metricsRes.data.data) {
        setMetrics(metricsRes.data.data)
      }

      // 获取近7天趋势
      const trendRes = await Network.request({
        url: '/api/health/trend',
        method: 'GET',
        data: { days: 7 }
      })
      console.log('趋势数据响应:', trendRes.data)
      
      if (trendRes.data?.code === 200 && trendRes.data.data) {
        setTrendData(trendRes.data.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const goToCheckin = () => {
    Taro.switchTab({ url: '/pages/checkin/index' })
  }

  const goToData = () => {
    Taro.switchTab({ url: '/pages/data/index' })
  }

  const goToProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' })
  }

  // 计算趋势图路径
  const generateTrendPath = () => {
    if (trendData.length === 0) return { path: '', areaPath: '', points: [] }
    
    const width = 320
    const height = 100
    const padding = 10
    const weights = trendData.map(d => d.weight)
    const minWeight = Math.min(...weights) - 1
    const maxWeight = Math.max(...weights) + 1
    
    const xStep = (width - padding * 2) / (trendData.length - 1 || 1)
    const yScale = (height - padding * 2) / (maxWeight - minWeight || 1)
    
    const points = trendData.map((d, i) => ({
      x: padding + i * xStep,
      y: height - padding - (d.weight - minWeight) * yScale,
      weight: d.weight,
      date: d.date
    }))
    
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const areaD = `${pathD} L${points[points.length - 1].x},${height - padding} L${padding},${height - padding} Z`
    
    return { path: pathD, areaPath: areaD, points }
  }

  const { path, areaPath, points } = generateTrendPath()

  // 获取星期几
  const getWeekday = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  return (
    <View className="flex flex-col min-h-screen bg-[#F7F4ED]">
      {/* Header */}
      <View className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-[#F7F4ED]">
        <View className="w-10 h-10" />
        <Text className="text-base font-semibold text-[#1E2933]">健康管理</Text>
        <View className="w-10 h-10 flex items-center justify-center">
          <Bell size={20} color="#6B7280" />
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 overflow-y-auto pb-20">
        {/* 今日打卡状态 */}
        <View className="px-4 pt-3 pb-2">
          <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <CardContent className="p-4 flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 bg-[#3C8D6E]/15 rounded-full flex items-center justify-center">
                  <CircleCheck size={20} color="#3C8D6E" />
                </View>
                <View>
                  <Text className="block text-sm font-semibold text-[#1E2933]">
                    {metrics?.todayCheckedIn ? '今日已打卡' : '今日未打卡'}
                  </Text>
                  <Text className="block text-xs text-[#6B7280] mt-1">
                    {metrics?.todayCheckedIn ? '坚持就是胜利，继续保持！' : '快去记录今天的体重吧'}
                  </Text>
                </View>
              </View>
              <Button 
                onClick={goToCheckin}
                className="px-4 py-2 bg-[#F26B3A] text-white text-sm font-semibold rounded-lg"
              >
                打卡
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* 健康指标概览 */}
        <View className="px-4 pt-4">
          <View className="flex items-center justify-between mb-3">
            <Text className="text-base font-semibold text-[#1E2933]">健康指标</Text>
            <View onClick={goToData}>
              <Text className="text-xs text-[#F26B3A] font-medium">查看全部</Text>
            </View>
          </View>
          
          <View className="grid grid-cols-2 gap-3">
            {/* 体重卡片 */}
            <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-2">
                  <View className="w-7 h-7 bg-[#F26B3A]/15 rounded-lg flex items-center justify-center">
                    <Scale size={16} color="#F26B3A" />
                  </View>
                  <Text className="text-xs font-medium text-[#6B7280]">体重</Text>
                </View>
                <Text className="block text-2xl font-bold text-[#1E2933]">
                  {metrics?.currentWeight || '--'}
                  <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                </Text>
                <View className="mt-2 flex items-center gap-1">
                  <Text className="text-xs text-[#6B7280]">目标 {userInfo?.target_weight || '--'}kg</Text>
                  {metrics && (
                    <Text className="text-xs text-[#F59E0B] font-medium">
                      差 {metrics.weightDiff > 0 ? metrics.weightDiff.toFixed(1) : 0}kg
                    </Text>
                  )}
                </View>
              </CardContent>
            </Card>

            {/* 腰围卡片 */}
            <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-2">
                  <View className="w-7 h-7 bg-[#3C8D6E]/15 rounded-lg flex items-center justify-center">
                    <Ruler size={16} color="#3C8D6E" />
                  </View>
                  <Text className="text-xs font-medium text-[#6B7280]">腰围</Text>
                </View>
                <Text className="block text-2xl font-bold text-[#1E2933]">
                  {metrics?.currentWaist || '--'}
                  <Text className="text-sm font-normal text-[#6B7280] ml-1">cm</Text>
                </Text>
                <View className="mt-2">
                  <Text className="text-xs text-[#3C8D6E] font-medium">正常范围</Text>
                </View>
              </CardContent>
            </Card>

            {/* BMI卡片 */}
            <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-2">
                  <View className="w-7 h-7 bg-[#F26B3A]/15 rounded-lg flex items-center justify-center">
                    <Activity size={16} color="#F26B3A" />
                  </View>
                  <Text className="text-xs font-medium text-[#6B7280]">BMI</Text>
                </View>
                <Text className="block text-2xl font-bold text-[#1E2933]">
                  {metrics?.bmi || '--'}
                </Text>
                <View className="mt-2">
                  <View className="inline-flex items-center px-2 py-1 rounded-full bg-[#3C8D6E]/15">
                    <Text className="text-xs font-semibold text-[#3C8D6E]">{metrics?.bmiLevel || '--'}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* 体脂率卡片 */}
            <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-2">
                  <View className="w-7 h-7 bg-[#F59E0B]/15 rounded-lg flex items-center justify-center">
                    <Percent size={16} color="#F59E0B" />
                  </View>
                  <Text className="text-xs font-medium text-[#6B7280]">体脂率</Text>
                </View>
                <Text className="block text-2xl font-bold text-[#1E2933]">
                  {metrics?.bodyFatRate || '--'}
                  <Text className="text-sm font-normal text-[#6B7280] ml-1">%</Text>
                </Text>
                <View className="mt-2">
                  <Text className="text-xs text-[#3C8D6E] font-medium">正常 {metrics?.bodyFatLevel || '--'}</Text>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* 近7天体重趋势 */}
        <View className="px-4 pt-6">
          <View className="flex items-center justify-between mb-3">
            <Text className="text-base font-semibold text-[#1E2933]">体重趋势</Text>
            <Text className="text-xs text-[#6B7280]">近7天</Text>
          </View>
          
          <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <CardContent className="p-4">
              {trendData.length > 0 ? (
                <>
                  {/* SVG 折线图 */}
                  <View className="relative h-32">
                    <svg viewBox="0 0 320 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                      {/* 网格线 */}
                      <line x1="0" y1="25" x2="320" y2="25" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="50" x2="320" y2="50" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="0" y1="75" x2="320" y2="75" stroke="#E4DED2" strokeWidth="1" strokeDasharray="4,4" />
                      
                      {/* 渐变定义 */}
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#F26B3A" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#F26B3A" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* 区域填充 */}
                      <path d={areaPath} fill="url(#gradient)" opacity="0.3" />
                      
                      {/* 折线 */}
                      <path d={path} stroke="#F26B3A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* 数据点 */}
                      {points.map((p, i) => (
                        <circle 
                          key={i} 
                          cx={p.x} 
                          cy={p.y} 
                          r={i === points.length - 1 ? 5 : 4} 
                          fill="#F26B3A"
                          stroke={i === points.length - 1 ? '#fff' : 'none'}
                          strokeWidth={i === points.length - 1 ? 2 : 0}
                        />
                      ))}
                    </svg>
                    
                    {/* 当前值标注 */}
                    {points.length > 0 && (
                      <View 
                        className="absolute right-0 top-0 bg-[#F26B3A] text-white text-xs font-semibold px-2 py-1 rounded-lg"
                      >
                        <Text className="text-white text-xs font-semibold">
                          {points[points.length - 1].weight}kg
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* 日期标签 */}
                  <View className="flex justify-between mt-3">
                    {trendData.map((d, i) => (
                      <Text 
                        key={i} 
                        className={`text-xs ${i === trendData.length - 1 ? 'text-[#F26B3A] font-medium' : 'text-[#6B7280]'}`}
                      >
                        {getWeekday(d.date)}
                      </Text>
                    ))}
                  </View>
                </>
              ) : (
                <View className="h-32 flex items-center justify-center">
                  <Text className="text-[#6B7280] text-sm">暂无数据</Text>
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        {/* 快速操作 */}
        <View className="px-4 pt-6 pb-6">
          <Text className="text-base font-semibold text-[#1E2933] mb-3">快速操作</Text>
          
          <View className="grid grid-cols-3 gap-3">
            <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <View className="w-12 h-12 bg-[#F26B3A]/15 rounded-xl flex items-center justify-center">
                  <CircleCheck size={24} color="#F26B3A" />
                </View>
                <Text className="text-sm font-medium text-[#1E2933]">一键打卡</Text>
              </CardContent>
            </Card>

            <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <CardContent className="p-4 flex flex-col items-center gap-2" onClick={goToData}>
                <View className="w-12 h-12 bg-[#3C8D6E]/15 rounded-xl flex items-center justify-center">
                  <FileText size={24} color="#3C8D6E" />
                </View>
                <Text className="text-sm font-medium text-[#1E2933]">详细数据</Text>
              </CardContent>
            </Card>

            <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <CardContent className="p-4 flex flex-col items-center gap-2" onClick={goToProfile}>
                <View className="w-12 h-12 bg-[#F59E0B]/15 rounded-xl flex items-center justify-center">
                  <Target size={24} color="#F59E0B" />
                </View>
                <Text className="text-sm font-medium text-[#1E2933]">设置目标</Text>
              </CardContent>
            </Card>
          </View>
        </View>
      </View>
    </View>
  )
}
