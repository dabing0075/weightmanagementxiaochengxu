import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'

@Injectable()
export class HealthService {
  /**
   * 获取健康指标
   * 计算 BMI、体脂率等
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
        weightDiff: 0,
        todayCheckedIn: false
      }
    }

    // 获取最新的体重记录
    const { data: records, error: recordError } = await client
      .from('weight_records')
      .select('*')
      .order('record_date', { ascending: false })
      .limit(1)
    
    if (recordError) throw new Error(`获取记录失败: ${recordError.message}`)
    
    const latestRecord = records?.[0]
    
    // 检查今天是否已打卡
    const today = new Date().toISOString().split('T')[0]
    const { data: todayRecords, error: todayError } = await client
      .from('weight_records')
      .select('id')
      .eq('record_date', today)
      .limit(1)
    
    if (todayError) throw new Error(`检查打卡状态失败: ${todayError.message}`)
    
    const todayCheckedIn = todayRecords && todayRecords.length > 0

    // 如果没有记录，返回用户目标数据
    if (!latestRecord) {
      return {
        currentWeight: null,
        currentWaist: null,
        bmi: null,
        bmiLevel: '--',
        bodyFatRate: null,
        bodyFatLevel: '--',
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
      weightDiff,
      todayCheckedIn
    }
  }

  /**
   * 获取体重趋势数据
   * @param days 天数
   */
  async getWeightTrend(days: number) {
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
      .select('record_date, weight')
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
      .order('record_date', { ascending: true })
    
    if (error) throw new Error(`获取趋势数据失败: ${error.message}`)
    
    // 填充缺失的日期
    const result: { date: string; weight: number | null }[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const record = records?.find(r => r.record_date === dateStr)
      
      result.push({
        date: dateStr,
        weight: record?.weight || null
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // 如果数据不足7天，用最近的数据填充
    const validRecords = records?.filter(r => r.weight !== null) || []
    if (validRecords.length > 0) {
      const lastWeight = validRecords[validRecords.length - 1].weight
      result.forEach(item => {
        if (item.weight === null) {
          // 使用最近的体重数据
          const nearest = validRecords.reduce((prev, curr) => {
            const prevDiff = Math.abs(new Date(prev.record_date).getTime() - new Date(item.date).getTime())
            const currDiff = Math.abs(new Date(curr.record_date).getTime() - new Date(item.date).getTime())
            return currDiff < prevDiff ? curr : prev
          })
          item.weight = nearest.weight
        }
      })
    }
    
    return result
  }

  /**
   * 获取 BMI 等级
   */
  private getBmiLevel(bmi: number): string {
    if (bmi < 18.5) return '偏瘦'
    if (bmi < 24) return '健康'
    if (bmi < 28) return '超重'
    return '肥胖'
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
   * 获取体脂率等级
   */
  private getBodyFatLevel(bodyFat: number, gender: string): string {
    if (gender === 'male') {
      if (bodyFat < 10) return '5-15%'
      if (bodyFat < 20) return '10-20%'
      return '15-25%'
    } else {
      if (bodyFat < 18) return '15-25%'
      if (bodyFat < 28) return '20-30%'
      return '25-35%'
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
}
