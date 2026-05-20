import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import './index.css'

interface UserInfo {
  id: string
  nickname: string
  height?: string
  target_weight?: string
  target_waist?: string
}

interface WeightRecord {
  id: string
  record_date: string
  weight: string
  waist?: string
}

interface HealthStats {
  currentWeight: number
  currentWaist: number
  bmi: number
  bodyFatRate: number
  bmiLevel: string
  bodyFatLevel: string
}

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [todayRecord, setTodayRecord] = useState<WeightRecord | null>(null)
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<WeightRecord[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    fetchData()
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取用户信息
      const userRes = await Network.request({
        url: '/api/user/profile',
        method: 'GET'
      })
      console.log('用户信息:', userRes.data)
      
      if (userRes.data?.code === 200 && userRes.data?.data) {
        setUserInfo(userRes.data.data)
      }

      // 获取今日记录
      const today = new Date().toISOString().split('T')[0]
      const todayRes = await Network.request({
        url: `/api/records/today?date=${today}`,
        method: 'GET'
      })
      console.log('今日记录:', todayRes.data)
      
      if (todayRes.data?.code === 200 && todayRes.data?.data) {
        setTodayRecord(todayRes.data.data)
      }

      // 获取健康统计
      const statsRes = await Network.request({
        url: '/api/records/stats',
        method: 'GET'
      })
      console.log('健康统计:', statsRes.data)
      
      if (statsRes.data?.code === 200 && statsRes.data?.data) {
        setHealthStats(statsRes.data.data)
      }

      // 获取最近7天记录
      const recentRes = await Network.request({
        url: '/api/records/recent?days=7',
        method: 'GET'
      })
      console.log('最近记录:', recentRes.data)
      
      if (recentRes.data?.code === 200 && recentRes.data?.data) {
        setRecentRecords(recentRes.data.data)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
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

  const getBmiColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-500'
    if (bmi < 24) return 'text-success'
    if (bmi < 28) return 'text-warning'
    return 'text-destructive'
  }

  const getBmiBgColor = (bmi: number) => {
    if (bmi < 18.5) return 'bg-blue-50'
    if (bmi < 24) return 'bg-success bg-opacity-10'
    if (bmi < 28) return 'bg-warning bg-opacity-10'
    return 'bg-destructive bg-opacity-10'
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-background">
      {/* 顶部区域 */}
      <View className="bg-primary px-4 pt-12 pb-8 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="text-white text-lg font-semibold block">健康管理</Text>
            <Text className="text-white text-sm mt-1 block">坚持打卡，健康生活</Text>
          </View>
          <View 
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            onClick={goToProfile}
          >
            <Text className="text-white text-lg font-bold">
              {userInfo?.nickname?.charAt(0) || '初'}
            </Text>
          </View>
        </View>

        {/* 今日打卡状态 */}
        <View className="bg-white backdrop-blur rounded-2xl p-4 mt-4">
          <View className="flex items-center justify-between">
            <View>
              <Text className="text-white text-sm mb-1 block">
                {todayRecord ? '今日已打卡' : '今日未打卡'}
              </Text>
              <Text className="text-white text-xs block">
                {todayRecord 
                  ? `体重 ${todayRecord.weight}kg${todayRecord.waist ? ` · 腰围 ${todayRecord.waist}cm` : ''}`
                  : '记录今日体重和腰围数据'
                }
              </Text>
            </View>
            <Button 
              size="sm" 
              className="bg-white text-primary hover:bg-white"
              onClick={goToCheckin}
            >
              {todayRecord ? '再次记录' : '立即打卡'}
            </Button>
          </View>
        </View>
      </View>

      {/* 健康指标卡片 */}
      <View className="px-4 -mt-4">
        <View className="grid grid-cols-2 gap-3">
          {/* 体重卡片 */}
          <Card className="bg-surface shadow-card">
            <CardContent className="p-4">
              <Text className="text-xs text-muted-foreground mb-2 block">体重</Text>
              <Text className="text-2xl font-bold text-on-surface block">
                {healthStats?.currentWeight || '--'}
                <Text className="text-sm font-normal text-muted-foreground ml-1">kg</Text>
              </Text>
              {userInfo?.target_weight && (
                <Text className="text-xs text-muted-foreground mt-1 block">
                  目标 {userInfo.target_weight}kg
                </Text>
              )}
            </CardContent>
          </Card>

          {/* 腰围卡片 */}
          <Card className="bg-surface shadow-card">
            <CardContent className="p-4">
              <Text className="text-xs text-muted-foreground mb-2 block">腰围</Text>
              <Text className="text-2xl font-bold text-on-surface block">
                {healthStats?.currentWaist || '--'}
                <Text className="text-sm font-normal text-muted-foreground ml-1">cm</Text>
              </Text>
              {userInfo?.target_waist && (
                <Text className="text-xs text-muted-foreground mt-1 block">
                  目标 {userInfo.target_waist}cm
                </Text>
              )}
            </CardContent>
          </Card>

          {/* BMI 卡片 */}
          <Card className={`bg-surface shadow-card ${healthStats ? getBmiBgColor(healthStats.bmi) : ''}`}>
            <CardContent className="p-4">
              <Text className="text-xs text-muted-foreground mb-2 block">BMI</Text>
              <Text className={`text-2xl font-bold block ${healthStats ? getBmiColor(healthStats.bmi) : 'text-on-surface'}`}>
                {healthStats?.bmi?.toFixed(1) || '--'}
              </Text>
              <Badge variant="outline" className="mt-2 text-xs">
                {healthStats?.bmiLevel || '--'}
              </Badge>
            </CardContent>
          </Card>

          {/* 体脂率卡片 */}
          <Card className="bg-surface shadow-card">
            <CardContent className="p-4">
              <Text className="text-xs text-muted-foreground mb-2 block">体脂率</Text>
              <Text className="text-2xl font-bold text-on-surface block">
                {healthStats?.bodyFatRate?.toFixed(1) || '--'}
                <Text className="text-sm font-normal text-muted-foreground ml-1">%</Text>
              </Text>
              <Badge variant="outline" className="mt-2 text-xs">
                {healthStats?.bodyFatLevel || '--'}
              </Badge>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 最近趋势 */}
      <View className="px-4 mt-6">
        <Card className="bg-surface shadow-card">
          <CardHeader className="pb-2">
            <View className="flex items-center justify-between">
              <CardTitle className="text-base">近7天体重趋势</CardTitle>
              <Text 
                className="text-xs text-primary"
                onClick={goToData}
              >
                查看详情
              </Text>
            </View>
          </CardHeader>
          <CardContent className="pt-0">
            {recentRecords.length > 0 ? (
              <View className="h-32 flex items-end justify-around gap-1 pt-4">
                {recentRecords.map((record, index) => {
                  const weight = parseFloat(record.weight)
                  const minWeight = Math.min(...recentRecords.map(r => parseFloat(r.weight)))
                  const maxWeight = Math.max(...recentRecords.map(r => parseFloat(r.weight)))
                  const range = maxWeight - minWeight || 1
                  const height = ((weight - minWeight) / range) * 60 + 40
                  
                  return (
                    <View key={record.id || index} className="flex flex-col items-center gap-1">
                      <View 
                        className="w-8 bg-primary bg-opacity-20 rounded-t"
                        style={{ height: `${height}px` }}
                      />
                      <Text className="text-xs text-muted-foreground">
                        {record.record_date.slice(5)}
                      </Text>
                      <Text className="text-xs font-semibold">
                        {record.weight}
                      </Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View className="h-32 flex items-center justify-center">
                <Text className="text-sm text-muted-foreground">暂无数据，开始打卡记录吧</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 快速操作 */}
      <View className="px-4 mt-6 mb-6">
        <Card className="bg-surface shadow-card">
          <CardContent className="p-4">
            <View className="grid grid-cols-3 gap-3">
              <View 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container"
                onClick={goToCheckin}
              >
                <View className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Text className="text-primary text-lg">+</Text>
                </View>
                <Text className="text-xs text-on-surface">记录数据</Text>
              </View>

              <View 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container"
                onClick={goToData}
              >
                <View className="w-10 h-10 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
                  <Text className="text-success text-lg">📊</Text>
                </View>
                <Text className="text-xs text-on-surface">查看趋势</Text>
              </View>

              <View 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container"
                onClick={goToProfile}
              >
                <View className="w-10 h-10 rounded-full bg-warning bg-opacity-10 flex items-center justify-center">
                  <Text className="text-warning text-lg">⚙️</Text>
                </View>
                <Text className="text-xs text-on-surface">设置目标</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
