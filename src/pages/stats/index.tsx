import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Network } from '@/network'

interface StatsData {
  weight: {
    average: number
    max: number
    maxDate: string
    min: number
    minDate: string
    stdDev: number
  }
  waist: {
    average: number
    max: number
    maxDate: string
    min: number
    minDate: string
    stdDev: number
  }
  bmi: {
    current: number
    level: string
    trend: string
  }
  bodyFat: {
    current: number
    level: string
    trend: string
  }
  suggestions: string[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    fetchStats()
  })

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/records/stats/detail',
        method: 'GET'
      })
      
      if (res.data?.code === 200 && res.data?.data) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
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

  const getBmiProgress = (bmi: number) => {
    // BMI 范围 15-35 映射到 0-100
    const progress = ((bmi - 15) / 20) * 100
    return Math.min(100, Math.max(0, progress))
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-background p-4">
      {/* 体重统计 */}
      <Card className="bg-surface shadow-card mb-4">
        <CardHeader>
          <CardTitle className="text-base">体重统计</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="text-center p-3 bg-surface-container rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">平均值</Text>
              <Text className="text-xl font-bold text-on-surface">{stats?.weight?.average?.toFixed(1) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">kg</Text>
            </View>
            <View className="text-center p-3 bg-surface-container rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">标准差</Text>
              <Text className="text-xl font-bold text-on-surface">{stats?.weight?.stdDev?.toFixed(2) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">kg</Text>
            </View>
            <View className="text-center p-3 bg-success bg-opacity-10 rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">最小值</Text>
              <Text className="text-xl font-bold text-success">{stats?.weight?.min?.toFixed(1) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">kg</Text>
              <Text className="text-xs text-muted-foreground mt-1 block">{stats?.weight?.minDate}</Text>
            </View>
            <View className="text-center p-3 bg-destructive bg-opacity-10 rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">最大值</Text>
              <Text className="text-xl font-bold text-destructive">{stats?.weight?.max?.toFixed(1) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">kg</Text>
              <Text className="text-xs text-muted-foreground mt-1 block">{stats?.weight?.maxDate}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 腰围统计 */}
      <Card className="bg-surface shadow-card mb-4">
        <CardHeader>
          <CardTitle className="text-base">腰围统计</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="text-center p-3 bg-surface-container rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">平均值</Text>
              <Text className="text-xl font-bold text-on-surface">{stats?.waist?.average?.toFixed(1) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">cm</Text>
            </View>
            <View className="text-center p-3 bg-surface-container rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">标准差</Text>
              <Text className="text-xl font-bold text-on-surface">{stats?.waist?.stdDev?.toFixed(2) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">cm</Text>
            </View>
            <View className="text-center p-3 bg-success bg-opacity-10 rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">最小值</Text>
              <Text className="text-xl font-bold text-success">{stats?.waist?.min?.toFixed(1) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">cm</Text>
              <Text className="text-xs text-muted-foreground mt-1 block">{stats?.waist?.minDate}</Text>
            </View>
            <View className="text-center p-3 bg-destructive bg-opacity-10 rounded-xl">
              <Text className="text-xs text-muted-foreground block mb-1">最大值</Text>
              <Text className="text-xl font-bold text-destructive">{stats?.waist?.max?.toFixed(1) || '--'}</Text>
              <Text className="text-xs text-muted-foreground">cm</Text>
              <Text className="text-xs text-muted-foreground mt-1 block">{stats?.waist?.maxDate}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* BMI 分析 */}
      <Card className={`bg-surface shadow-card mb-4 ${stats ? getBmiBgColor(stats.bmi.current) : ''}`}>
        <CardHeader>
          <CardTitle className="text-base">BMI 分析</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex items-center justify-between mb-4">
            <View>
              <Text className="text-xs text-muted-foreground block">当前 BMI</Text>
              <Text className={`text-3xl font-bold ${stats ? getBmiColor(stats.bmi.current) : 'text-on-surface'}`}>
                {stats?.bmi?.current?.toFixed(1) || '--'}
              </Text>
            </View>
            <Badge variant="outline" className="text-sm">
              {stats?.bmi?.level || '--'}
            </Badge>
          </View>
          
          <Progress value={stats ? getBmiProgress(stats.bmi.current) : 0} className="h-2 mb-2" />
          
          <View className="flex justify-between text-xs text-muted-foreground">
            <Text>偏瘦</Text>
            <Text>正常</Text>
            <Text>超重</Text>
            <Text>肥胖</Text>
          </View>

          <View className="mt-4 p-3 bg-surface-container rounded-xl">
            <Text className="text-xs text-muted-foreground block mb-1">趋势分析</Text>
            <Text className="text-sm text-on-surface">{stats?.bmi?.trend || '暂无足够数据'}</Text>
          </View>
        </CardContent>
      </Card>

      {/* 体脂率分析 */}
      <Card className="bg-surface shadow-card mb-4">
        <CardHeader>
          <CardTitle className="text-base">体脂率分析</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex items-center justify-between mb-4">
            <View>
              <Text className="text-xs text-muted-foreground block">当前体脂率</Text>
              <Text className="text-3xl font-bold text-on-surface">
                {stats?.bodyFat?.current?.toFixed(1) || '--'}
                <Text className="text-base font-normal text-muted-foreground ml-1">%</Text>
              </Text>
            </View>
            <Badge variant="outline" className="text-sm">
              {stats?.bodyFat?.level || '--'}
            </Badge>
          </View>

          <View className="mt-4 p-3 bg-surface-container rounded-xl">
            <Text className="text-xs text-muted-foreground block mb-1">趋势分析</Text>
            <Text className="text-sm text-on-surface">{stats?.bodyFat?.trend || '暂无足够数据'}</Text>
          </View>
        </CardContent>
      </Card>

      {/* 健康建议 */}
      <Card className="bg-surface shadow-card">
        <CardHeader>
          <CardTitle className="text-base">💡 健康建议</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.suggestions && stats.suggestions.length > 0 ? (
            <View className="space-y-3">
              {stats.suggestions.map((suggestion, index) => (
                <View key={index} className="flex items-start gap-2">
                  <Text className="text-primary text-sm">•</Text>
                  <Text className="text-sm text-on-surface flex-1">{suggestion}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">暂无建议，继续记录数据以获取个性化建议</Text>
          )}
        </CardContent>
      </Card>
    </View>
  )
}
