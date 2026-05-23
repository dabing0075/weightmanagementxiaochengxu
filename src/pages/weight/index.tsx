import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { Calculator, Target, Flame, Droplets, Utensils, Clock } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'

interface UserProfile {
  birthDate: string
  gender: 'male' | 'female'
  currentWeight: number
  targetWeight: number
  height: number
  age: number
}

interface WeightPlan {
  bmi: number
  bodyFatRate: number
  bmr: number
  tdee: number
  dailyCalories: number
  dailyDeficit: number
  weeksToGoal: number
  isGoalAchieved: boolean
  protein: number
  carbs: number
  fat: number
  fiber: number
  water: number
  weeklyGoal: number
  activityLevel: string
}

const activityOptions = [
  { value: 'sedentary', label: '久坐', desc: '办公室工作，几乎不运动', factor: 1.2 },
  { value: 'light', label: '轻度活动', desc: '每周轻度运动1-3天', factor: 1.375 },
  { value: 'moderate', label: '中度活动', desc: '每周中度运动3-5天', factor: 1.55 },
  { value: 'active', label: '高度活动', desc: '每周高强度运动6-7天', factor: 1.725 },
  { value: 'veryActive', label: '极高活动', desc: '每日高强度运动+体力工作', factor: 1.9 },
]

const weeklyGoalOptions = [
  { value: 0.5, label: '温和减重', desc: '每周减重0.5公斤', deficit: 3850 },
  { value: 1, label: '激进减重', desc: '每周减重1公斤', deficit: 7700 },
]

export default function WeightPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(0.5)
  const [activityLevel, setActivityLevel] = useState<string>('sedentary')
  const [weightPlan, setWeightPlan] = useState<WeightPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [calculated, setCalculated] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  // 每次进入页面时刷新数据（打卡后体重变化）
  useDidShow(() => {
    fetchProfile()
  })

  async function fetchProfile() {
    try {
      const [userRes, metricsRes] = await Promise.all([
        Network.request({ url: '/api/user/info', method: 'GET' }),
        Network.request({ url: '/api/health/metrics', method: 'GET' })
      ])
      
      console.log('User response:', userRes.data)
      console.log('Metrics response:', metricsRes.data)
      
      if (userRes.data?.code === 200 && userRes.data?.data) {
        const userData = userRes.data.data
        const metricsData = metricsRes.data?.data
        
        // 计算年龄
        let age = 25
        if (userData.birth_date) {
          const today = new Date()
          const birth = new Date(userData.birth_date)
          age = today.getFullYear() - birth.getFullYear()
          const monthDiff = today.getMonth() - birth.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
          }
        }
        
        setProfile({
          birthDate: userData.birth_date,
          gender: userData.gender || 'male',
          currentWeight: metricsData?.currentWeight || 70,
          targetWeight: userData.target_weight || 65,
          height: userData.height || 170,
          age: age
        })
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
    }
  }

  async function calculatePlan() {
    if (!profile) return
    
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/health/weight-plan',
        method: 'POST',
        data: {
          weeklyGoal,
          activityLevel
        }
      })
      console.log('Weight plan response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setWeightPlan(res.data.data)
        setCalculated(true)
      }
    } catch (error) {
      console.error('Calculate plan error:', error)
    } finally {
      setLoading(false)
    }
  }

  function getWeeklyGoalLabel(value: number) {
    return weeklyGoalOptions.find(o => o.value === value)?.label || `${value}公斤/周`
  }

  const weightToLose = profile ? profile.currentWeight - profile.targetWeight : 0
  const isGoalAchieved = profile ? profile.currentWeight <= profile.targetWeight : false

  return (
    <View className="flex flex-col min-h-screen bg-[#F7F4ED]">
      {/* Header */}
      <View className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-[#F7F4ED]">
        <View className="w-10 h-10" />
        <Text className="text-base font-semibold text-[#1E2933]">体重管理</Text>
        <View className="w-10 h-10" />
      </View>

      {/* Content */}
      <ScrollView scrollY className="flex-1 pb-20">
        <View className="px-4 py-4 space-y-4">
          {/* 个人信息卡片 */}
          {profile && (
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#F26B3A]/10 flex items-center justify-center">
                    <Target size={16} color="#F26B3A" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">我的基本信息</Text>
                </View>

                <View className="grid grid-cols-2 gap-4">
                  <View className="bg-[#F7F4ED] rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">当前体重</Text>
                    <Text className="text-xl font-bold text-[#1E2933]">
                      {profile.currentWeight}
                      <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                    </Text>
                  </View>
                  <View className="bg-[#3C8D6E]/10 rounded-xl p-3">
                    <Text className="text-xs text-[#6B7280] mb-1 block">目标体重</Text>
                    <Text className="text-xl font-bold text-[#3C8D6E]">
                      {profile.targetWeight}
                      <Text className="text-sm font-normal text-[#6B7280] ml-1">kg</Text>
                    </Text>
                  </View>
                </View>

                <View className="grid grid-cols-3 gap-3 mt-3">
                  <View className="bg-[#F7F4ED] rounded-xl p-3 text-center">
                    <Text className="text-xs text-[#6B7280] mb-1 block">身高</Text>
                    <Text className="text-base font-semibold text-[#1E2933]">{profile.height} cm</Text>
                  </View>
                  <View className="bg-[#F7F4ED] rounded-xl p-3 text-center">
                    <Text className="text-xs text-[#6B7280] mb-1 block">年龄</Text>
                    <Text className="text-base font-semibold text-[#1E2933]">{profile.age} 岁</Text>
                  </View>
                  <View className="bg-[#F7F4ED] rounded-xl p-3 text-center">
                    <Text className="text-xs text-[#6B7280] mb-1 block">性别</Text>
                    <Text className="text-base font-semibold text-[#1E2933]">
                      {profile.gender === 'male' ? '男' : '女'}
                    </Text>
                  </View>
                </View>

                <View className={`mt-3 p-3 rounded-xl ${isGoalAchieved ? 'bg-[#3C8D6E]/10' : 'bg-[#F26B3A]/10'}`}>
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-[#6B7280]">
                      {isGoalAchieved ? '目标状态' : '需减重'}
                    </Text>
                    {isGoalAchieved ? (
                      <Text className="text-lg font-bold text-[#3C8D6E]">🎉 已达成目标</Text>
                    ) : (
                      <Text className="text-lg font-bold text-[#F26B3A]">{weightToLose.toFixed(1)} kg</Text>
                    )}
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* 每周减重目标选择 - 仅未达成目标时显示 */}
          {!isGoalAchieved && (
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-4">
                  <View className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <Calculator size={16} color="#6366F1" />
                  </View>
                  <Text className="text-base font-semibold text-[#1E2933]">每周减重目标</Text>
                </View>

                <View className="space-y-3">
                  {weeklyGoalOptions.map(option => (
                    <View
                      key={option.value}
                      className={`p-4 rounded-xl border-2 ${
                        weeklyGoal === option.value
                          ? 'border-[#F26B3A] bg-[#F26B3A]/5'
                          : 'border-[#E4DED2] bg-[#F7F4ED]'
                      }`}
                      onClick={() => setWeeklyGoal(option.value)}
                    >
                      <View className="flex items-center justify-between">
                        <View>
                          <Text className="text-base font-semibold text-[#1E2933]">{option.label}</Text>
                          <Text className="text-sm text-[#6B7280] mt-1">{option.desc}</Text>
                        </View>
                        <View
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            weeklyGoal === option.value
                              ? 'border-[#F26B3A] bg-[#F26B3A]'
                              : 'border-[#D1D5DB]'
                          }`}
                        >
                          {weeklyGoal === option.value && (
                            <View className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 已达成目标提示 */}
          {isGoalAchieved && (
            <Card className="bg-[#3C8D6E]/10 border border-[#3C8D6E]/30">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-2">
                  <Text className="text-base font-semibold text-[#3C8D6E]">💡 维持体重模式</Text>
                </View>
                <Text className="text-sm text-[#1E2933]">
                  您已达成目标体重！生成的方案将帮助您维持当前体重，保持健康的生活方式。
                </Text>
              </CardContent>
            </Card>
          )}

          {/* 活动水平选择 */}
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-4">
                <View className="w-8 h-8 rounded-full bg-[#3C8D6E]/10 flex items-center justify-center">
                  <Flame size={16} color="#3C8D6E" />
                </View>
                <Text className="text-base font-semibold text-[#1E2933]">活动水平</Text>
              </View>

              <View className="space-y-2">
                {activityOptions.map(option => (
                  <View
                    key={option.value}
                    className={`p-3 rounded-xl border-2 ${
                      activityLevel === option.value
                        ? 'border-[#3C8D6E] bg-[#3C8D6E]/5'
                        : 'border-[#E4DED2] bg-[#F7F4ED]'
                    }`}
                    onClick={() => setActivityLevel(option.value)}
                  >
                    <View className="flex items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-[#1E2933]">{option.label}</Text>
                        <Text className="text-xs text-[#6B7280] mt-1">{option.desc}</Text>
                      </View>
                      <View
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          activityLevel === option.value
                            ? 'border-[#3C8D6E] bg-[#3C8D6E]'
                            : 'border-[#D1D5DB]'
                        }`}
                      >
                        {activityLevel === option.value && (
                          <View className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* 计算按钮 */}
          <Button
            className={`w-full py-4 rounded-xl text-base font-semibold ${isGoalAchieved ? 'bg-[#3C8D6E] text-white' : 'bg-[#F26B3A] text-white'}`}
            onClick={calculatePlan}
            disabled={loading}
          >
            {loading ? '计算中...' : isGoalAchieved ? '生成维持方案' : '生成减重方案'}
          </Button>

          {/* 计算结果 */}
          {calculated && weightPlan && (
            <View className="space-y-4">
              {/* 时间预估 */}
              <Card className={weightPlan.isGoalAchieved ? "bg-gradient-to-r from-[#10B981] to-[#059669] shadow-lg" : "bg-gradient-to-r from-[#F26B3A] to-[#E85A2A] shadow-lg"}>
                <CardContent className="p-4">
                  <View className="flex items-center gap-2 mb-3">
                    <Clock size={20} color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white">
                      {weightPlan.isGoalAchieved ? '已达成目标' : '达成目标预估'}
                    </Text>
                  </View>
                  {weightPlan.isGoalAchieved ? (
                    <View>
                      <Text className="text-xl font-bold text-white">🎉 恭喜！您已达成目标体重</Text>
                      <Text className="text-sm text-[rgba(255,255,255,0.7)] mt-2">
                        当前热量摄入按维持体重标准计算，保持健康生活方式
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View className="flex items-baseline gap-2">
                        <Text className="text-4xl font-bold text-white">{weightPlan.weeksToGoal}</Text>
                        <Text className="text-lg text-[rgba(255,255,255,0.8)]">周</Text>
                      </View>
                      <Text className="text-sm text-[rgba(255,255,255,0.7)] mt-2">
                        按{getWeeklyGoalLabel(weeklyGoal)}节奏，预计 {Math.ceil(weightPlan.weeksToGoal / 4)} 个月达成目标
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>

              {/* 每日热量摄入 */}
              <Card className="bg-white shadow-md">
                <CardContent className="p-4">
                  <View className="flex items-center gap-2 mb-4">
                    <View className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                      <Flame size={16} color="#EF4444" />
                    </View>
                    <Text className="text-base font-semibold text-[#1E2933]">
                      {weightPlan.isGoalAchieved ? '每日热量摄入标准' : '每日热量摄入额度'}
                    </Text>
                  </View>

                  <View className="flex items-center justify-center py-4">
                    <View className="text-center">
                      <Text className="text-5xl font-bold text-[#F26B3A]">{weightPlan.dailyCalories}</Text>
                      <Text className="text-lg text-[#6B7280] ml-2">大卡/天</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E4DED2]">
                    <View className="text-center">
                      <Text className="text-xs text-[#6B7280] mb-1 block">基础代谢率</Text>
                      <Text className="text-base font-semibold text-[#1E2933]">{weightPlan.bmr} 大卡</Text>
                    </View>
                    <View className="text-center">
                      <Text className="text-xs text-[#6B7280] mb-1 block">总热量消耗</Text>
                      <Text className="text-base font-semibold text-[#1E2933]">{weightPlan.tdee} 大卡</Text>
                    </View>
                    <View className="text-center">
                      <Text className="text-xs text-[#6B7280] mb-1 block">热量差</Text>
                      <Text className={`text-base font-semibold ${weightPlan.dailyDeficit > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {weightPlan.dailyDeficit > 0 ? `-${weightPlan.dailyDeficit}` : 0} 大卡
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>

              {/* 营养配比建议 */}
              <Card className="bg-white shadow-md">
                <CardContent className="p-4">
                  <View className="flex items-center gap-2 mb-4">
                    <View className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                      <Utensils size={16} color="#10B981" />
                    </View>
                    <Text className="text-base font-semibold text-[#1E2933]">每日营养配比建议</Text>
                  </View>

                  {/* 蛋白质 */}
                  <View className="mb-4">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-2">
                        <View className="w-3 h-3 rounded-full bg-[#EF4444]" />
                        <Text className="text-sm font-medium text-[#1E2933]">蛋白质</Text>
                      </View>
                      <Text className="text-sm font-semibold text-[#EF4444]">{weightPlan.protein}g (30%)</Text>
                    </View>
                    <View className="h-2 bg-[#F7F4ED] rounded-full overflow-hidden">
                      <View className="h-full bg-[#EF4444] rounded-full" style={{ width: '30%' }} />
                    </View>
                    <Text className="text-xs text-[#6B7280] mt-1">推荐食物：鸡胸肉、豆腐、鸡蛋、鱼类</Text>
                  </View>

                  {/* 碳水化合物 */}
                  <View className="mb-4">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-2">
                        <View className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                        <Text className="text-sm font-medium text-[#1E2933]">碳水化合物</Text>
                      </View>
                      <Text className="text-sm font-semibold text-[#F59E0B]">{weightPlan.carbs}g (45%)</Text>
                    </View>
                    <View className="h-2 bg-[#F7F4ED] rounded-full overflow-hidden">
                      <View className="h-full bg-[#F59E0B] rounded-full" style={{ width: '45%' }} />
                    </View>
                    <Text className="text-xs text-[#6B7280] mt-1">推荐食物：燕麦、红薯、糙米、全麦面包</Text>
                  </View>

                  {/* 脂肪 */}
                  <View className="mb-4">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-2">
                        <View className="w-3 h-3 rounded-full bg-[#6366F1]" />
                        <Text className="text-sm font-medium text-[#1E2933]">脂肪</Text>
                      </View>
                      <Text className="text-sm font-semibold text-[#6366F1]">{weightPlan.fat}g (25%)</Text>
                    </View>
                    <View className="h-2 bg-[#F7F4ED] rounded-full overflow-hidden">
                      <View className="h-full bg-[#6366F1] rounded-full" style={{ width: '25%' }} />
                    </View>
                    <Text className="text-xs text-[#6B7280] mt-1">推荐食物：亚麻籽油、菜籽油、橄榄油、坚果、牛油果</Text>
                  </View>

                  {/* 膳食纤维 */}
                  <View className="p-3 bg-[#10B981]/10 rounded-xl">
                    <View className="flex items-center justify-between">
                      <Text className="text-sm font-medium text-[#1E2933]">膳食纤维</Text>
                      <Text className="text-sm font-semibold text-[#10B981]">25-30g/天</Text>
                    </View>
                    <Text className="text-xs text-[#6B7280] mt-1">推荐食物：西兰花、苹果、菠菜</Text>
                  </View>
                </CardContent>
              </Card>

              {/* 水分摄入 */}
              <Card className="bg-white shadow-md">
                <CardContent className="p-4">
                  <View className="flex items-center gap-2 mb-4">
                    <View className="w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                      <Droplets size={16} color="#3B82F6" />
                    </View>
                    <Text className="text-base font-semibold text-[#1E2933]">每日水分摄入</Text>
                  </View>

                  <View className="flex items-center justify-between">
                    <View>
                      <Text className="text-3xl font-bold text-[#3B82F6]">{weightPlan.water}</Text>
                      <Text className="text-sm text-[#6B7280] ml-1">毫升/天</Text>
                    </View>
                    <View className="w-16 h-16 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                      <Droplets size={28} color="#3B82F6" />
                    </View>
                  </View>

                  <View className="mt-3 p-3 bg-[#3B82F6]/5 rounded-xl">
                    <Text className="text-xs text-[#6B7280]">
                      💡 建议：饭前喝一杯水可减少进食量，有助于控制热量摄入
                    </Text>
                  </View>
                </CardContent>
              </Card>

              {/* 健康提示 */}
              <Card className="bg-[#FEF3C7] border border-[#F59E0B]/30">
                <CardContent className="p-4">
                  <Text className="text-sm text-[#92400E] font-medium mb-2">⚠️ 健康提示</Text>
                  <Text className="text-sm text-[#92400E]">
                    • 每日热量摄入不宜低于1200大卡{'\n'}
                    • 建议结合适量运动提高减重效果{'\n'}
                    • 如有身体不适请及时就医{'\n'}
                    • 减重是一个循序渐进的过程，请保持耐心
                  </Text>
                </CardContent>
              </Card>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
