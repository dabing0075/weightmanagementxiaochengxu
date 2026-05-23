import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'

@Injectable()
export class HealthService {
  /**
   * 获取健康指标
   * 优先从用户表获取已计算的健康指标，如果没有则实时计算
   */
  async getHealthMetrics() {
    const client = getSupabaseClient()
    
    // 获取用户信息（假设只有一个用户）
    const { data: users, error: userError } = await client
      .from('users')
      .select('*')
      .limit(1)
    
    if (userError) throw new Error(`获取用户信息失败: ${userError.message}`)
    
    const user = users?.[0]
    if (!user) {
      // 如果没有用户，返回默认值
      return {
        currentWeight: null,
        currentWaist: null,
        bmi: null,
        bmiLevel: '--',
        bodyFatRate: null,
        bodyFatLevel: '--',
        waistLevel: '--',
        weightDiff: 0,
        todayCheckedIn: false
      }
    }

    // 检查今天是否已打卡
    const today = new Date().toISOString().split('T')[0]
    const { data: todayRecords, error: todayError } = await client
      .from('weight_records')
      .select('id')
      .eq('record_date', today)
      .limit(1)
    
    if (todayError) throw new Error(`检查打卡状态失败: ${todayError.message}`)
    
    const todayCheckedIn = todayRecords && todayRecords.length > 0

    // 如果用户表已有健康指标数据，直接返回
    if (user.current_weight && user.bmi) {
      const weightDiff = user.target_weight 
        ? user.current_weight - user.target_weight 
        : 0

      return {
        currentWeight: user.current_weight,
        currentWaist: user.current_waist,
        bmi: user.bmi,
        bmiLevel: user.bmi_level || '--',
        bodyFatRate: user.body_fat_rate,
        bodyFatLevel: user.body_fat_level || '--',
        waistLevel: user.waist_level || '--',
        weightDiff,
        todayCheckedIn
      }
    }

    // 如果用户表没有健康指标，从最新打卡记录计算
    const { data: records, error: recordError } = await client
      .from('weight_records')
      .select('*')
      .order('record_date', { ascending: false })
      .limit(1)
    
    if (recordError) throw new Error(`获取记录失败: ${recordError.message}`)
    
    const latestRecord = records?.[0]
    
    // 如果没有记录，返回默认值
    if (!latestRecord) {
      return {
        currentWeight: null,
        currentWaist: null,
        bmi: null,
        bmiLevel: '--',
        bodyFatRate: null,
        bodyFatLevel: '--',
        waistLevel: '--',
        weightDiff: 0,
        todayCheckedIn
      }
    }

    // 计算 BMI
    const bmi = user.height ? (latestRecord.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null
    const bmiNum = bmi ? parseFloat(bmi) : 0
    const bmiLevel = this.getBmiLevel(bmiNum)

    // 计算体脂率（使用简化的公式）
    const bodyFatRate = this.calculateBodyFat(
      latestRecord.weight,
      user.height,
      user.gender,
      this.calculateAge(user.birth_date)
    )
    const bodyFatLevel = this.getBodyFatLevel(bodyFatRate, user.gender)
    
    // 计算腰围健康等级
    const waistLevel = this.getWaistLevel(latestRecord.waist, user.gender)

    // 计算距离目标的差值
    const weightDiff = user.target_weight 
      ? latestRecord.weight - user.target_weight 
      : 0

    return {
      currentWeight: latestRecord.weight,
      currentWaist: latestRecord.waist,
      bmi: bmiNum,
      bmiLevel,
      bodyFatRate,
      bodyFatLevel,
      waistLevel,
      weightDiff,
      todayCheckedIn,
      gender: user.gender
    }
  }

  /**
   * 获取趋势数据（体重 + 腰围）
   * @param days 天数
   */
  async getTrendData(days: number) {
    const client = getSupabaseClient()
    
    // 计算起始日期
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    console.log(`[HealthService] 查询趋势数据: ${startDateStr} 至 ${endDateStr}`)
    
    // 查询记录
    const { data: records, error } = await client
      .from('weight_records')
      .select('record_date, weight, waist')
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
      .order('record_date', { ascending: true })
    
    if (error) throw new Error(`获取趋势数据失败: ${error.message}`)
    
    // 构建趋势数据
    const weightTrend: { date: string; weight: number }[] = []
    const waistTrend: { date: string; waist: number }[] = []
    const currentDate = new Date(startDate)
    
    // 如果没有数据，返回空数组
    if (!records || records.length === 0) {
      return {
        weightTrend: [],
        waistTrend: [],
        weightStats: { start: 0, end: 0, change: 0, changePercent: 0 },
        waistStats: { start: 0, end: 0, change: 0, changePercent: 0 }
      }
    }
    
    // 填充数据，对于缺失的日期使用最近的数据
    let lastWeight = records[0]?.weight || 0
    let lastWaist = records[0]?.waist || 0
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const record = records?.find(r => r.record_date === dateStr)
      
      if (record) {
        lastWeight = record.weight || lastWeight
        lastWaist = record.waist || lastWaist
      }
      
      weightTrend.push({
        date: dateStr,
        weight: lastWeight
      })
      
      waistTrend.push({
        date: dateStr,
        waist: lastWaist
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // 计算统计数据
    const validWeights = weightTrend.filter(d => d.weight > 0).map(d => d.weight)
    const validWaists = waistTrend.filter(d => d.waist > 0).map(d => d.waist)
    
    const weightStats = {
      start: validWeights[0] || 0,
      end: validWeights[validWeights.length - 1] || 0,
      change: 0,
      changePercent: 0
    }
    
    if (validWeights.length >= 2) {
      weightStats.change = weightStats.end - weightStats.start
      weightStats.changePercent = parseFloat(((weightStats.change / weightStats.start) * 100).toFixed(1))
    }
    
    const waistStats = {
      start: validWaists[0] || 0,
      end: validWaists[validWaists.length - 1] || 0,
      change: 0,
      changePercent: 0
    }
    
    if (validWaists.length >= 2) {
      waistStats.change = waistStats.end - waistStats.start
      waistStats.changePercent = parseFloat(((waistStats.change / waistStats.start) * 100).toFixed(1))
    }
    
    return {
      weightTrend,
      waistTrend,
      weightStats,
      waistStats
    }
  }

  /**
   * 获取 BMI 等级（根据文档标准）
   */
  private getBmiLevel(bmi: number): string {
    if (bmi < 18.5) return '体重过低'
    if (bmi < 24) return '正常'
    if (bmi < 28) return '超重'
    return '肥胖'
  }

  /**
   * 获取腰围健康等级（根据文档标准）
   */
  private getWaistLevel(waist: number, gender: string): string {
    if (!waist) return '--'
    
    if (gender === 'male') {
      if (waist < 85) return '正常'
      if (waist < 90) return '中心型肥胖前期'
      return '中心型肥胖'
    } else {
      if (waist < 80) return '正常'
      if (waist < 85) return '中心型肥胖前期'
      return '中心型肥胖'
    }
  }

  /**
   * 计算体脂率（简化公式）
   * 使用 BMI 法
   */
  private calculateBodyFat(weight: number, height: number, gender: string, age: number): number {
    if (!height || !weight) return 0
    
    const bmi = weight / Math.pow(height / 100, 2)
    const genderFactor = gender === 'male' ? 1 : 0
    
    // 体脂率 = (1.20 × BMI) + (0.23 × 年龄) - (10.8 × 性别) - 5.4
    const bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4
    
    return Math.max(5, Math.min(40, parseFloat(bodyFat.toFixed(1))))
  }

  /**
   * 获取体脂率等级（根据文档标准）
   */
  private getBodyFatLevel(bodyFat: number, gender: string): string {
    if (gender === 'male') {
      if (bodyFat < 10) return '偏低'
      if (bodyFat <= 20) return '正常'
      if (bodyFat <= 25) return '偏高'
      return '肥胖'
    } else {
      if (bodyFat < 15) return '偏低'
      if (bodyFat <= 25) return '正常'
      if (bodyFat <= 30) return '偏高'
      return '肥胖'
    }
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthDate: string): number {
    if (!birthDate) return 25
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  /**
   * 获取健康统计数据
   */
  async getHealthStats() {
    const client = getSupabaseClient()
    
    // 获取所有记录
    const { data: records, error } = await client
      .from('weight_records')
      .select('*')
      .order('record_date', { ascending: false })
    
    if (error) throw new Error(`获取记录失败: ${error.message}`)
    
    if (!records || records.length === 0) {
      return {
        weightStats: { avg: 0, max: 0, maxDate: '', min: 0, minDate: '', stdDev: 0 },
        waistStats: { avg: 0, max: 0, maxDate: '', min: 0, minDate: '', stdDev: 0 },
        bmiLevel: { current: 0, level: '--', distribution: { underweight: 0, normal: 0, overweight: 0, obese: 0 } },
        bodyFatLevel: { current: 0, status: '--', healthyRange: { min: 0, max: 0 } }
      }
    }

    // 获取用户信息
    const { data: users } = await client
      .from('users')
      .select('*')
      .limit(1)
    
    const user = users?.[0]

    // 计算体重统计
    const weights = records.map(r => r.weight).filter(w => w !== null)
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
    const maxWeight = Math.max(...weights)
    const minWeight = Math.min(...weights)
    const weightVariance = weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length
    const weightStdDev = Math.sqrt(weightVariance)

    const maxWeightRecord = records.find(r => r.weight === maxWeight)
    const minWeightRecord = records.find(r => r.weight === minWeight)

    // 计算腰围统计
    const waists = records.map(r => r.waist).filter(w => w !== null)
    const avgWaist = waists.reduce((a, b) => a + b, 0) / waists.length
    const maxWaist = Math.max(...waists)
    const minWaist = Math.min(...waists)
    const waistVariance = waists.reduce((sum, w) => sum + Math.pow(w - avgWaist, 2), 0) / waists.length
    const waistStdDev = Math.sqrt(waistVariance)

    const maxWaistRecord = records.find(r => r.waist === maxWaist)
    const minWaistRecord = records.find(r => r.waist === minWaist)

    // 计算 BMI
    let currentBmi = 0
    let bmiLevel = '--'
    if (user?.height && records[0]?.weight) {
      currentBmi = parseFloat((records[0].weight / Math.pow(user.height / 100, 2)).toFixed(1))
      bmiLevel = this.getBmiLevel(currentBmi)
    }

    // 计算体脂率
    let currentBodyFat = 0
    let bodyFatStatus = '--'
    if (user && records[0]) {
      currentBodyFat = this.calculateBodyFat(
        records[0].weight,
        user.height,
        user.gender,
        this.calculateAge(user.birth_date)
      )
      bodyFatStatus = this.getBodyFatLevel(currentBodyFat, user.gender)
    }

    // 计算腰围健康等级
    const currentWaist = records[0]?.waist || 0
    const waistLevel = this.getWaistLevel(currentWaist, user?.gender || 'male')

    // 根据性别获取健康区间
    const gender = user?.gender || 'male'
    const healthRanges = {
      bmi: {
        underweight: { max: 18.5, label: '体重过低' },
        normal: { min: 18.5, max: 23.9, label: '正常' },
        overweight: { min: 24, max: 27.9, label: '超重' },
        obese: { min: 28, label: '肥胖' }
      },
      bodyFat: {
        male: {
          low: { max: 10, label: '偏低' },
          normal: { min: 10, max: 20, label: '正常' },
          high: { min: 20, max: 25, label: '偏高' },
          obese: { min: 25, label: '肥胖' }
        },
        female: {
          low: { max: 15, label: '偏低' },
          normal: { min: 15, max: 25, label: '正常' },
          high: { min: 25, max: 30, label: '偏高' },
          obese: { min: 30, label: '肥胖' }
        }
      },
      waist: {
        male: {
          normal: { max: 85, label: '正常' },
          preObese: { min: 85, max: 90, label: '中心型肥胖前期' },
          obese: { min: 90, label: '中心型肥胖' }
        },
        female: {
          normal: { max: 80, label: '正常' },
          preObese: { min: 80, max: 85, label: '中心型肥胖前期' },
          obese: { min: 85, label: '中心型肥胖' }
        }
      }
    }

    return {
      weightStats: {
        avg: parseFloat(avgWeight.toFixed(1)),
        max: parseFloat(maxWeight.toFixed(1)),
        maxDate: maxWeightRecord?.record_date || '',
        min: parseFloat(minWeight.toFixed(1)),
        minDate: minWeightRecord?.record_date || '',
        stdDev: parseFloat(weightStdDev.toFixed(1))
      },
      waistStats: {
        avg: parseFloat(avgWaist.toFixed(1)),
        max: parseFloat(maxWaist.toFixed(1)),
        maxDate: maxWaistRecord?.record_date || '',
        min: parseFloat(minWaist.toFixed(1)),
        minDate: minWaistRecord?.record_date || '',
        stdDev: parseFloat(waistStdDev.toFixed(1)),
        level: waistLevel
      },
      bmiLevel: {
        current: currentBmi,
        level: bmiLevel,
        ranges: healthRanges.bmi
      },
      bodyFatLevel: {
        current: currentBodyFat,
        status: bodyFatStatus,
        ranges: healthRanges.bodyFat[gender]
      },
      waistLevel: {
        current: currentWaist,
        level: waistLevel,
        ranges: healthRanges.waist[gender]
      },
      gender: gender
    }
  }

  /**
   * 计算体重管理方案
   * @param weeklyGoal 每周减重目标（kg）
   * @param activityLevel 活动水平
   */
  async calculateWeightPlan(weeklyGoal: number, activityLevel: string) {
    const client = getSupabaseClient()
    
    // 获取用户信息
    const { data: users, error: userError } = await client
      .from('users')
      .select('*')
      .limit(1)
    
    if (userError) throw new Error(`获取用户信息失败: ${userError.message}`)
    
    const user = users?.[0]
    if (!user) {
      throw new Error('请先完善个人信息')
    }

    // 获取最新体重记录
    const { data: records, error: recordError } = await client
      .from('weight_records')
      .select('weight')
      .order('record_date', { ascending: false })
      .limit(1)
    
    if (recordError) throw new Error(`获取记录失败: ${recordError.message}`)
    
    const currentWeight = records?.[0]?.weight || user.current_weight || 70
    const targetWeight = user.target_weight || currentWeight
    const height = user.height || 170
    const gender = user.gender || 'male'
    const age = this.calculateAge(user.birth_date)

    // 计算 BMI
    const bmi = parseFloat((currentWeight / Math.pow(height / 100, 2)).toFixed(1))

    // 计算体脂率
    const bodyFatRate = this.calculateBodyFat(currentWeight, height, gender, age)

    // 计算基础代谢率 (BMR) - Mifflin-StJeor 公式
    let bmr: number
    if (gender === 'male') {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age + 5
    } else {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age - 161
    }
    bmr = Math.round(bmr)

    // 活动系数
    const activityFactors: Record<string, number> = {
      'sedentary': 1.2,      // 久坐
      'light': 1.375,        // 轻度活动
      'moderate': 1.55,      // 中度活动
      'active': 1.725,       // 高度活动
      'veryActive': 1.9      // 极高活动
    }
    const activityFactor = activityFactors[activityLevel] || 1.2

    // 计算总热量消耗 (TDEE)
    const tdee = Math.round(bmr * activityFactor)

    // 计算每日热量缺口
    // 1kg 脂肪 ≈ 7700 大卡
    // 每周减重 0.5kg 需要每日缺口约 550 大卡 (3850/7)
    // 每周减重 1kg 需要每日缺口约 1100 大卡 (7700/7)
    // 为安全起见，限制最大缺口为 500 大卡/天
    let dailyDeficit: number
    if (weeklyGoal === 0.5) {
      dailyDeficit = 3850 / 7 // 约 550，取整为 550
    } else {
      dailyDeficit = 7700 / 7 // 约 1100，限制为 500
    }
    dailyDeficit = Math.min(dailyDeficit, 500) // 安全限制

    // 每日热量摄入额度
    let dailyCalories = Math.round(tdee - dailyDeficit)
    // 最低热量限制
    dailyCalories = Math.max(dailyCalories, 1200)

    // 计算达成目标所需周数
    const weightToLose = currentWeight - targetWeight
    const weeksToGoal = weightToLose > 0 ? Math.ceil(weightToLose / weeklyGoal) : 0

    // 计算营养配比
    // 蛋白质: 1.6-2.2g/kg，取 2g/kg，30% 热量
    const proteinGrams = Math.round(currentWeight * 2)
    const proteinCalories = proteinGrams * 4

    // 碳水: 45% 热量
    const carbsCalories = Math.round(dailyCalories * 0.45)
    const carbsGrams = Math.round(carbsCalories / 4)

    // 脂肪: 25% 热量
    const fatCalories = Math.round(dailyCalories * 0.25)
    const fatGrams = Math.round(fatCalories / 9)

    // 膳食纤维: 25-30g
    const fiber = 28

    // 水分摄入: 体重 × 30ml
    const water = Math.round(currentWeight * 30)

    return {
      bmi,
      bodyFatRate,
      bmr,
      tdee,
      dailyCalories,
      weeksToGoal,
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams,
      fiber,
      water,
      weeklyGoal,
      activityLevel
    }
  }
}
