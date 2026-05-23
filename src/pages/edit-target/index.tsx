import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

interface UserInfo {
  id: string
  nickname: string
  target_weight: number
  target_waist: number
  // 当前健康指标
  current_weight?: number
  current_waist?: number
}

interface HealthMetrics {
  currentWeight: number
  currentWaist: number
}

export default function EditTargetPage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '',
    nickname: '',
    target_weight: 65,
    target_waist: 80
  })
  const [metrics, setMetrics] = useState<HealthMetrics>({
    currentWeight: 0,
    currentWaist: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [userRes, metricsRes] = await Promise.all([
        Network.request({ url: '/api/user/info', method: 'GET' }),
        Network.request({ url: '/api/health/metrics', method: 'GET' })
      ])
      
      if (userRes.data?.code === 200 && userRes.data?.data) {
        setUserInfo(userRes.data.data)
      }
      if (metricsRes.data?.code === 200 && metricsRes.data?.data) {
        setMetrics({
          currentWeight: metricsRes.data.data.currentWeight,
          currentWaist: metricsRes.data.data.currentWaist
        })
      }
    } catch (error) {
      console.error('Fetch data error:', error)
    }
  }

  async function handleSave() {
    if (!userInfo.target_weight || userInfo.target_weight < 30 || userInfo.target_weight > 200) {
      Taro.showToast({ title: '请输入有效目标体重(30-200kg)', icon: 'none' })
      return
    }
    if (!userInfo.target_waist || userInfo.target_waist < 40 || userInfo.target_waist > 150) {
      Taro.showToast({ title: '请输入有效目标腰围(40-150cm)', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/user/info',
        method: 'PUT',
        data: {
          target_weight: userInfo.target_weight,
          target_waist: userInfo.target_waist
        }
      })
      console.log('Update target response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Update target error:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex flex-col min-h-screen bg-[#F7F4ED]">
      {/* Header */}
      <View className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-[#F7F4ED]">
        <View 
          className="w-10 h-10 flex items-center justify-center rounded-full"
          onClick={() => Taro.navigateBack()}
        >
          <ArrowLeft size={24} color="#1E2933" />
        </View>
        <Text className="text-base font-semibold text-[#1E2933]">设置健康目标</Text>
        <View className="w-10 h-10" />
      </View>

      {/* Content */}
      <View className="flex-1 px-4 py-4">
        {/* 当前数据 */}
        <Card className="shadow-md mb-4">
          <CardContent className="p-4">
            <Text className="text-sm font-medium text-[#6B7280] mb-3 block">当前数据</Text>
            <View className="grid grid-cols-2 gap-4">
              <View className="bg-[#F7F4ED] rounded-xl p-3 text-center">
                <Text className="text-xs text-[#6B7280] block mb-1">当前体重</Text>
                <Text className="text-xl font-bold text-[#1E2933]">
                  {metrics.currentWeight || '--'}
                  <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                </Text>
              </View>
              <View className="bg-[#F7F4ED] rounded-xl p-3 text-center">
                <Text className="text-xs text-[#6B7280] block mb-1">当前腰围</Text>
                <Text className="text-xl font-bold text-[#1E2933]">
                  {metrics.currentWaist || '--'}
                  <Text className="text-sm font-normal text-[#6B7280] ml-1">cm</Text>
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 目标设置 */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <Text className="text-sm font-medium text-[#1E2933] mb-4 block">设置目标</Text>
            
            {/* 目标体重 */}
            <View className="mb-4">
              <Text className="text-sm text-[#6B7280] mb-2 block">目标体重 (kg)</Text>
              <View className="bg-[#F7F4ED] rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="digit"
                  placeholder="请输入目标体重"
                  value={String(userInfo.target_weight || '')}
                  onInput={(e) => setUserInfo({ ...userInfo, target_weight: parseFloat(e.detail.value) || 0 })}
                />
              </View>
              {metrics.currentWeight > 0 && userInfo.target_weight > 0 && (
                <Text className="text-xs text-[#3C8D6E] mt-2 block">
                  需减重 {(metrics.currentWeight - userInfo.target_weight).toFixed(1)} kg
                </Text>
              )}
            </View>

            {/* 目标腰围 */}
            <View className="mb-4">
              <Text className="text-sm text-[#6B7280] mb-2 block">目标腰围 (cm)</Text>
              <View className="bg-[#F7F4ED] rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="digit"
                  placeholder="请输入目标腰围"
                  value={String(userInfo.target_waist || '')}
                  onInput={(e) => setUserInfo({ ...userInfo, target_waist: parseFloat(e.detail.value) || 0 })}
                />
              </View>
              {metrics.currentWaist > 0 && userInfo.target_waist > 0 && (
                <Text className="text-xs text-[#3C8D6E] mt-2 block">
                  需减 {(metrics.currentWaist - userInfo.target_waist).toFixed(1)} cm
                </Text>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 提示 */}
        <View className="mt-4 px-2">
          <Text className="text-xs text-[#6B7280]">
            温馨提示：合理的目标有助于健康减重。建议每周减重0.5-1公斤为宜。
          </Text>
        </View>

        {/* 保存按钮 */}
        <View className="mt-6">
          <Button
            className="w-full py-3 bg-[#F26B3A] text-white font-semibold rounded-xl"
            onClick={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-semibold">{loading ? '保存中...' : '保存目标'}</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
