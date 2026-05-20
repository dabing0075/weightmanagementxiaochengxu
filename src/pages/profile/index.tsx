import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

interface UserInfo {
  id: string
  nickname: string
  gender?: string
  birth_date?: string
  height?: string
  target_weight?: string
  target_waist?: string
}

interface UserStats {
  totalDays: number
  continuousDays: number
  monthDays: number
}

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    nickname: '',
    gender: '',
    birth_date: '',
    height: '',
    target_weight: '',
    target_waist: ''
  })

  useDidShow(() => {
    fetchUserData()
  })

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      const userRes = await Network.request({
        url: '/api/user/profile',
        method: 'GET'
      })
      
      if (userRes.data?.code === 200 && userRes.data?.data) {
        setUserInfo(userRes.data.data)
        setEditData({
          nickname: userRes.data.data.nickname || '',
          gender: userRes.data.data.gender || '',
          birth_date: userRes.data.data.birth_date || '',
          height: userRes.data.data.height || '',
          target_weight: userRes.data.data.target_weight || '',
          target_waist: userRes.data.data.target_waist || ''
        })
      }

      const statsRes = await Network.request({
        url: '/api/user/stats',
        method: 'GET'
      })
      
      if (statsRes.data?.code === 200 && statsRes.data?.data) {
        setUserStats(statsRes.data.data)
      }
    } catch (error) {
      console.error('获取用户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const res = await Network.request({
        url: '/api/user/profile',
        method: 'PUT',
        data: editData
      })

      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setEditing(false)
        fetchUserData()
      } else {
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  }

  const handleClearCache = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorage()
          Taro.showToast({ title: '清除成功', icon: 'success' })
        }
      }
    })
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
      {/* 用户头像区域 */}
      <View className="bg-surface-container pt-12 pb-8 px-4">
        <View className="flex items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Text className="text-primary text-2xl font-bold">
              {userInfo?.nickname?.charAt(0) || '初'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-on-surface block">
              {userInfo?.nickname || '未设置昵称'}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1 block">
              坚持打卡，健康生活
            </Text>
          </View>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(!editing)}
          >
            {editing ? '取消' : '编辑'}
          </Button>
        </View>
      </View>

      <View className="p-4">
        {/* 打卡记录 */}
        <Card className="bg-surface shadow-card mb-4">
          <CardContent className="p-4">
            <View className="grid grid-cols-3 gap-3">
              <View className="text-center">
                <Text className="text-2xl font-bold text-primary block">
                  {userStats?.totalDays || 0}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1 block">总打卡</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-success block">
                  {userStats?.continuousDays || 0}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1 block">连续打卡</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-warning block">
                  {userStats?.monthDays || 0}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1 block">本月打卡</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 个人信息 */}
        <Card className="bg-surface shadow-card mb-4">
          <CardHeader>
            <CardTitle className="text-base">个人信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">昵称</Text>
              {editing ? (
                <View className="bg-surface-container rounded-lg px-3 py-2 w-32">
                  <Input
                    className="text-sm text-right w-full"
                    value={editData.nickname}
                    onInput={(e) => setEditData({ ...editData, nickname: e.detail.value })}
                  />
                </View>
              ) : (
                <Text className="text-sm text-on-surface">{userInfo?.nickname || '未设置'}</Text>
              )}
            </View>

            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">性别</Text>
              {editing ? (
                <View className="flex gap-2">
                  <Button
                    size="sm"
                    variant={editData.gender === 'male' ? 'default' : 'outline'}
                    className={editData.gender === 'male' ? 'bg-primary text-white' : ''}
                    onClick={() => setEditData({ ...editData, gender: 'male' })}
                  >
                    男
                  </Button>
                  <Button
                    size="sm"
                    variant={editData.gender === 'female' ? 'default' : 'outline'}
                    className={editData.gender === 'female' ? 'bg-primary text-white' : ''}
                    onClick={() => setEditData({ ...editData, gender: 'female' })}
                  >
                    女
                  </Button>
                </View>
              ) : (
                <Text className="text-sm text-on-surface">
                  {userInfo?.gender === 'male' ? '男' : userInfo?.gender === 'female' ? '女' : '未设置'}
                </Text>
              )}
            </View>

            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">出生日期</Text>
              {editing ? (
                <View className="bg-surface-container rounded-lg px-3 py-2">
                  <Input
                    type="text"
                    className="text-sm text-right w-full"
                    value={editData.birth_date}
                    onInput={(e) => setEditData({ ...editData, birth_date: e.detail.value })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              ) : (
                <Text className="text-sm text-on-surface">{userInfo?.birth_date || '未设置'}</Text>
              )}
            </View>

            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">身高</Text>
              {editing ? (
                <View className="bg-surface-container rounded-lg px-3 py-2 w-20">
                  <Input
                    type="digit"
                    className="text-sm text-right w-full"
                    value={editData.height}
                    onInput={(e) => setEditData({ ...editData, height: e.detail.value })}
                  />
                </View>
              ) : (
                <Text className="text-sm text-on-surface">{userInfo?.height ? `${userInfo.height}cm` : '未设置'}</Text>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 目标设置 */}
        <Card className="bg-surface shadow-card mb-4">
          <CardHeader>
            <CardTitle className="text-base">健康目标</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">目标体重</Text>
              {editing ? (
                <View className="bg-surface-container rounded-lg px-3 py-2 w-20">
                  <Input
                    type="digit"
                    className="text-sm text-right w-full"
                    value={editData.target_weight}
                    onInput={(e) => setEditData({ ...editData, target_weight: e.detail.value })}
                  />
                </View>
              ) : (
                <Text className="text-sm text-on-surface">
                  {userInfo?.target_weight ? `${userInfo.target_weight}kg` : '未设置'}
                </Text>
              )}
            </View>

            <View className="flex items-center justify-between">
              <Text className="text-sm text-muted-foreground">目标腰围</Text>
              {editing ? (
                <View className="bg-surface-container rounded-lg px-3 py-2 w-20">
                  <Input
                    type="digit"
                    className="text-sm text-right w-full"
                    value={editData.target_waist}
                    onInput={(e) => setEditData({ ...editData, target_waist: e.detail.value })}
                  />
                </View>
              ) : (
                <Text className="text-sm text-on-surface">
                  {userInfo?.target_waist ? `${userInfo.target_waist}cm` : '未设置'}
                </Text>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        {editing && (
          <Button
            className="w-full bg-primary text-white mb-4"
            onClick={handleSave}
          >
            保存修改
          </Button>
        )}

        {/* 其他功能 */}
        <Card className="bg-surface shadow-card">
          <CardContent className="p-0">
            <View 
              className="flex items-center justify-between p-4 border-b border-outline-variant"
              onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
            >
              <Text className="text-sm text-on-surface">数据导出</Text>
              <Text className="text-xs text-muted-foreground">导出 CSV</Text>
            </View>
            
            <View 
              className="flex items-center justify-between p-4 border-b border-outline-variant"
              onClick={() => Taro.showToast({ title: '版本 1.0.0', icon: 'none' })}
            >
              <Text className="text-sm text-on-surface">关于我们</Text>
              <Text className="text-xs text-muted-foreground">v1.0.0</Text>
            </View>
            
            <View 
              className="flex items-center justify-between p-4 border-b border-outline-variant"
              onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
            >
              <Text className="text-sm text-on-surface">意见反馈</Text>
              <Text className="text-xs text-muted-foreground">帮助改进</Text>
            </View>
            
            <View 
              className="flex items-center justify-between p-4"
              onClick={handleClearCache}
            >
              <Text className="text-sm text-on-surface">清除缓存</Text>
              <Text className="text-xs text-muted-foreground">12.5 MB</Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
