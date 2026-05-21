import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Network } from '@/network'
import { ChevronRight, Download, Info, MessageCircle, Trash2 } from 'lucide-react-taro'
import './index.css'

interface UserProfile {
  name: string
  gender: string
  birth_date: string
  height: string
  target_weight: string
}

interface CheckinStats {
  totalDays: number
  consecutiveDays: number
  monthDays: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [checkinStats, setCheckinStats] = useState<CheckinStats>({ totalDays: 0, consecutiveDays: 0, monthDays: 0 })

  useEffect(() => {
    loadProfile()
    loadCheckinStats()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await Network.request({ url: '/api/user/profile' })
      if (res.data) {
        setProfile(res.data)
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const loadCheckinStats = async () => {
    try {
      const res = await Network.request({ url: '/api/records/stats' })
      if (res.data) {
        setCheckinStats({
          totalDays: res.data.totalDays || 128,
          consecutiveDays: res.data.consecutiveDays || 15,
          monthDays: res.data.monthDays || 18
        })
      }
    } catch (error) {
      console.error('加载打卡统计失败:', error)
    }
  }

  const menuItems = [
    { icon: Download, label: '数据导出', action: () => console.log('导出数据') },
    { icon: Info, label: '关于我们', value: 'v1.0.0', action: () => console.log('关于我们') },
    { icon: MessageCircle, label: '意见反馈', action: () => console.log('意见反馈') },
    { icon: Trash2, label: '清除缓存', value: '12.5 MB', action: () => console.log('清除缓存') }
  ]

  const getGenderText = (gender: string) => {
    return gender === 'male' ? '男' : gender === 'female' ? '女' : '未设置'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未设置'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <View className="page-container">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">个人中心</Text>
        <View className="header-right" />
      </View>

      <View className="main-content">
        {/* 用户头像和昵称区域 */}
        <View className="user-section">
          <View className="avatar">
            <Text className="avatar-text">{profile?.name?.charAt(0) || '初'}</Text>
          </View>
          <View className="user-info">
            <Text className="user-name">{profile?.name || '小初'}</Text>
            <Text className="user-bio">坚持打卡，健康生活</Text>
          </View>
          <ChevronRight size={20} color="#6B7280" />
        </View>

        {/* 个人信息卡片 */}
        <View className="info-card">
          <View className="info-card-header">
            <Text className="info-card-title">个人信息</Text>
            <Text className="info-card-edit">编辑</Text>
          </View>
          <View className="info-list">
            <View className="info-item">
              <Text className="info-label">姓名</Text>
              <Text className="info-value">{profile?.name || '未设置'}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">性别</Text>
              <Text className="info-value">{getGenderText(profile?.gender || '')}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">出生年月</Text>
              <Text className="info-value">{formatDate(profile?.birth_date || '')}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">身高</Text>
              <Text className="info-value">{profile?.height ? `${profile.height} cm` : '未设置'}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">目标体重</Text>
              <Text className="info-value">{profile?.target_weight ? `${profile.target_weight} kg` : '未设置'}</Text>
            </View>
          </View>
        </View>

        {/* 打卡记录卡片 */}
        <View className="stats-card">
          <View className="stats-card-header">
            <Text className="stats-card-title">打卡记录</Text>
            <Text className="stats-card-link">查看全部</Text>
          </View>
          <View className="stats-grid">
            <View className="stat-box">
              <Text className="stat-number">{checkinStats.totalDays}</Text>
              <Text className="stat-label">总打卡天数</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-number">{checkinStats.consecutiveDays}</Text>
              <Text className="stat-label">连续打卡</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-number">{checkinStats.monthDays}</Text>
              <Text className="stat-label">本月打卡</Text>
            </View>
          </View>
        </View>

        {/* 健康目标设置卡片 */}
        <View className="setting-card">
          <Text className="setting-title">健康目标设置</Text>
          <View className="setting-list">
            <View className="setting-item">
              <Text className="setting-label">目标体重</Text>
              <Text className="setting-value">{profile?.target_weight || '55'} kg</Text>
            </View>
            <View className="setting-item">
              <Text className="setting-label">目标腰围</Text>
              <Text className="setting-value">65 cm</Text>
            </View>
            <View className="setting-item">
              <Text className="setting-label">提醒时间</Text>
              <Text className="setting-value">每日 08:00</Text>
            </View>
          </View>
        </View>

        {/* 更多功能入口 */}
        <View className="menu-card">
          {menuItems.map((item, index) => (
            <View 
              key={item.label}
              className={index < menuItems.length - 1 ? 'menu-item menu-item-border' : 'menu-item'}
              onClick={item.action}
            >
              <item.icon size={20} color="#6B7280" />
              <Text className="menu-label">{item.label}</Text>
              {item.value && <Text className="menu-value">{item.value}</Text>}
              <ChevronRight size={16} color="#6B7280" className="menu-arrow" />
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
