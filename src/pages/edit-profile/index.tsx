import { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

interface UserInfo {
  id: string
  nickname: string
  gender: string
  birth_date: string
  height: number
}

export default function EditProfilePage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '',
    nickname: '',
    gender: 'male',
    birth_date: '1990-01-01',
    height: 170
  })
  const [loading, setLoading] = useState(false)

  const genderOptions = ['男', '女']
  const genderValues = ['male', 'female']

  useEffect(() => {
    fetchUserInfo()
  }, [])

  async function fetchUserInfo() {
    try {
      const res = await Network.request({
        url: '/api/user/info',
        method: 'GET'
      })
      console.log('User info response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setUserInfo(res.data.data)
      }
    } catch (error) {
      console.error('Fetch user info error:', error)
    }
  }

  async function handleSave() {
    if (!userInfo.nickname) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!userInfo.height || userInfo.height < 100 || userInfo.height > 250) {
      Taro.showToast({ title: '请输入有效身高(100-250cm)', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/user/info',
        method: 'PUT',
        data: {
          nickname: userInfo.nickname,
          gender: userInfo.gender,
          birth_date: userInfo.birth_date,
          height: userInfo.height
        }
      })
      console.log('Update user response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Update user error:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function handleGenderChange(e) {
    const index = e.detail.value
    setUserInfo({ ...userInfo, gender: genderValues[index] })
  }

  function handleBirthDateChange(e) {
    setUserInfo({ ...userInfo, birth_date: e.detail.value })
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
        <Text className="text-base font-semibold text-[#1E2933]">编辑个人信息</Text>
        <View className="w-10 h-10" />
      </View>

      {/* Content */}
      <View className="flex-1 px-4 py-4">
        <Card className="shadow-md">
          <CardContent className="p-4">
            {/* 昵称 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-[#1E2933] mb-2 block">昵称</Text>
              <View className="bg-[#F7F4ED] rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入昵称"
                  value={userInfo.nickname}
                  onInput={(e) => setUserInfo({ ...userInfo, nickname: e.detail.value })}
                />
              </View>
            </View>

            {/* 性别 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-[#1E2933] mb-2 block">性别</Text>
              <Picker mode="selector" range={genderOptions} onChange={handleGenderChange}>
                <View className="bg-[#F7F4ED] rounded-xl px-4 py-3 flex items-center justify-between">
                  <Text className="text-sm text-[#1E2933]">
                    {userInfo.gender === 'male' ? '男' : '女'}
                  </Text>
                  <Text className="text-xs text-[#6B7280]">点击选择</Text>
                </View>
              </Picker>
            </View>

            {/* 出生日期 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-[#1E2933] mb-2 block">出生日期</Text>
              <Picker mode="date" value={userInfo.birth_date} onChange={handleBirthDateChange}>
                <View className="bg-[#F7F4ED] rounded-xl px-4 py-3 flex items-center justify-between">
                  <Text className="text-sm text-[#1E2933]">{userInfo.birth_date}</Text>
                  <Text className="text-xs text-[#6B7280]">点击选择</Text>
                </View>
              </Picker>
            </View>

            {/* 身高 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-[#1E2933] mb-2 block">身高 (cm)</Text>
              <View className="bg-[#F7F4ED] rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="number"
                  placeholder="请输入身高"
                  value={String(userInfo.height || '')}
                  onInput={(e) => setUserInfo({ ...userInfo, height: parseFloat(e.detail.value) || 0 })}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <View className="mt-6">
          <Button
            className="w-full py-3 bg-[#F26B3A] text-white font-semibold rounded-xl"
            onClick={handleSave}
            disabled={loading}
          >
            <Text className="text-white font-semibold">{loading ? '保存中...' : '保存'}</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
