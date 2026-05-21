import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { ChevronRight, Download, Info, MessageCircle, Trash2, Settings } from 'lucide-react-taro'
import './index.css'

interface UserProfile {
  name: string
  gender?: string
  birth_date?: string
  height?: number
  target_weight?: number
  target_waist?: number
  reminder_time?: string
}

interface CheckinStats {
  totalDays: number
  streakDays: number
  monthDays: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '初'
  })
  const [checkinStats, setCheckinStats] = useState<CheckinStats>({
    totalDays: 0,
    streakDays: 0,
    monthDays: 0
  })

  useDidShow(() => {
    fetchProfile()
    fetchCheckinStats()
  })

  const fetchProfile = async () => {
    try {
      const res = await Network.request({
        url: '/api/user/profile',
        method: 'GET'
      })
      console.log('用户信息:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        setProfile(res.data.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const fetchCheckinStats = async () => {
    try {
      const res = await Network.request({
        url: '/api/records/stats',
        method: 'GET'
      })
      console.log('打卡统计:', res.data)
      
      if (res.data?.code === 200 && res.data?.data) {
        setCheckinStats(res.data.data)
      }
    } catch (error) {
      console.error('获取打卡统计失败:', error)
    }
  }

  const handleEditProfile = () => {
    Taro.showToast({ title: '编辑功能开发中', icon: 'none' })
  }

  const handleViewRecords = () => {
    Taro.showToast({ title: '查看全部记录', icon: 'none' })
  }

  const handleExportData = () => {
    Taro.showToast({ title: '数据导出中...', icon: 'loading' })
    setTimeout(() => {
      Taro.showToast({ title: '导出成功', icon: 'success' })
    }, 1500)
  }

  const handleClearCache = () => {
    Taro.showModal({
      title: '确认清除',
      content: '确定要清除缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '清除成功', icon: 'success' })
        }
      }
    })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未设置'
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className="profile-page">
      {/* Header */}
      <View className="header">
        <View className="header-left" />
        <Text className="header-title">个人中心</Text>
        <View className="header-right">
          <Settings size={20} color="#6B7280" />
        </View>
      </View>

      {/* 主内容区域 */}
      <View className="main-content">
        {/* 用户头像和昵称 */}
        <View className="user-header">
          <View className="user-avatar">
            <Text className="avatar-text">{profile.name?.charAt(0) || '初'}</Text>
          </View>
          <View className="user-info">
            <Text className="user-name">{profile.name || '小初'}</Text>
            <Text className="user-signature">坚持打卡，健康生活</Text>
          </View>
          <View className="user-edit" onClick={handleEditProfile}>
            <ChevronRight size={20} color="#6B7280" />
          </View>
        </View>

        {/* 个人信息卡片 */}
        <View className="info-card">
          <View className="card-header">
            <Text className="card-title">个人信息</Text>
            <View className="card-edit" onClick={handleEditProfile}>
              <Text className="card-edit-text">编辑</Text>
            </View>
          </View>
          
          <View className="info-list">
            <View className="info-item">
              <Text className="info-label">姓名</Text>
              <Text className="info-value">{profile.name || '未设置'}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">性别</Text>
              <Text className="info-value">{profile.gender || '未设置'}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">出生年月</Text>
              <Text className="info-value">{formatDate(profile.birth_date || '')}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">身高</Text>
              <Text className="info-value">{profile.height ? `${profile.height}cm` : '未设置'}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">目标体重</Text>
              <Text className="info-value">{profile.target_weight ? `${profile.target_weight}kg` : '未设置'}</Text>
            </View>
          </View>
        </View>

        {/* 打卡记录卡片 */}
        <View className="stats-card">
          <Text className="card-title">打卡记录</Text>
          
          <View className="stats-grid">
            <View className="stat-box">
              <Text className="stat-value">{checkinStats.totalDays}</Text>
              <Text className="stat-label">总打卡天数</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-value highlight">{checkinStats.streakDays}</Text>
              <Text className="stat-label">连续打卡</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-value">{checkinStats.monthDays}</Text>
              <Text className="stat-label">本月打卡</Text>
            </View>
          </View>
          
          <View className="view-all-button" onClick={handleViewRecords}>
            <Text className="view-all-text">查看全部</Text>
            <ChevronRight size={16} color="#6B7280" />
          </View>
        </View>

        {/* 健康目标设置卡片 */}
        <View className="goals-card">
          <Text className="card-title">健康目标</Text>
          
          <View className="goals-list">
            <View className="goal-item">
              <Text className="goal-label">目标体重</Text>
              <Text className="goal-value">{profile.target_weight ? `${profile.target_weight} kg` : '未设置'}</Text>
              <ChevronRight size={20} color="#6B7280" />
            </View>
            <View className="goal-item">
              <Text className="goal-label">目标腰围</Text>
              <Text className="goal-value">{profile.target_waist ? `${profile.target_waist} cm` : '未设置'}</Text>
              <ChevronRight size={20} color="#6B7280" />
            </View>
            <View className="goal-item">
              <Text className="goal-label">提醒时间</Text>
              <Text className="goal-value">{profile.reminder_time || '每日 08:00'}</Text>
              <ChevronRight size={20} color="#6B7280" />
            </View>
          </View>
        </View>

        {/* 更多功能 */}
        <View className="menu-card">
          <View className="menu-item" onClick={handleExportData}>
            <View className="menu-left">
              <Download size={20} color="#F26B3A" />
              <Text className="menu-text">数据导出</Text>
            </View>
            <ChevronRight size={20} color="#6B7280" />
          </View>
          
          <View className="menu-item">
            <View className="menu-left">
              <Info size={20} color="#F26B3A" />
              <Text className="menu-text">关于我们</Text>
            </View>
            <View className="menu-right">
              <Text className="menu-hint">v1.0.0</Text>
              <ChevronRight size={20} color="#6B7280" />
            </View>
          </View>
          
          <View className="menu-item">
            <View className="menu-left">
              <MessageCircle size={20} color="#F26B3A" />
              <Text className="menu-text">意见反馈</Text>
            </View>
            <ChevronRight size={20} color="#6B7280" />
          </View>
          
          <View className="menu-item" onClick={handleClearCache}>
            <View className="menu-left">
              <Trash2 size={20} color="#EF4444" />
              <Text className="menu-text-danger">清除缓存</Text>
            </View>
            <View className="menu-right">
              <Text className="menu-hint">12.5 MB</Text>
              <ChevronRight size={20} color="#6B7280" />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
