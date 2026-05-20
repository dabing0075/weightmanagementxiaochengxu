import { Injectable, OnModuleInit } from '@nestjs/common';
import { MemoryStorage } from '../../storage/memory/memory-storage.service';
import { UserService } from '../user/user.service';

@Injectable()
export class StatsService implements OnModuleInit {
  private readonly TEMP_USER_ID = 'temp-user-001';
  private storage: MemoryStorage;

  constructor(private readonly userService: UserService) {}

  onModuleInit() {
    this.storage = new MemoryStorage();
    this.storage.onModuleInit();
  }

  async getDetailedStats() {
    try {
      const weightData = await this.storage.getAllRecords(this.TEMP_USER_ID);
      
      const weightValues = (weightData || []).map(r => parseFloat(r.weight));
      const weightStats = this.calculateStats(weightValues, weightData || [], 'weight');

      const waistValues = (weightData || []).filter(r => r.waist).map(r => parseFloat(r.waist));
      const waistStats = this.calculateStats(waistValues, weightData || [], 'waist');

      const healthResult = await this.userService.getProfile();
      const user = healthResult.data;

      let bmi = 0;
      let bmiLevel = '--';
      let bmiTrend = '暂无足够数据';
      let bodyFat = 0;
      let bodyFatLevel = '--';
      let bodyFatTrend = '暂无足够数据';

      if (weightData && weightData.length > 0 && user?.height) {
        const latestRecord = weightData[weightData.length - 1];
        const heightM = parseFloat(user.height) / 100;
        const weightKg = parseFloat(latestRecord.weight);
        
        bmi = weightKg / (heightM * heightM);
        
        if (bmi < 18.5) bmiLevel = '偏瘦';
        else if (bmi < 24) bmiLevel = '正常';
        else if (bmi < 28) bmiLevel = '超重';
        else bmiLevel = '肥胖';

        if (weightData.length >= 2) {
          const firstRecord = weightData[0];
          const firstBmi = parseFloat(firstRecord.weight) / (heightM * heightM);
          const bmiChange = bmi - firstBmi;
          
          if (Math.abs(bmiChange) < 0.5) {
            bmiTrend = 'BMI 保持稳定，继续保持';
          } else if (bmiChange > 0) {
            bmiTrend = `BMI 上升 ${bmiChange.toFixed(1)}，注意控制饮食`;
          } else {
            bmiTrend = `BMI 下降 ${Math.abs(bmiChange).toFixed(1)}，继续保持`;
          }
        }

        const age = user.birth_date 
          ? new Date().getFullYear() - new Date(user.birth_date).getFullYear() 
          : 25;
        
        if (user.gender === 'male') {
          bodyFat = 1.2 * bmi + 0.23 * age - 16.2;
        } else {
          bodyFat = 1.2 * bmi + 0.23 * age - 5.4;
        }

        if (user.gender === 'male') {
          if (bodyFat < 10) bodyFatLevel = '偏瘦';
          else if (bodyFat < 20) bodyFatLevel = '正常';
          else if (bodyFat < 25) bodyFatLevel = '偏高';
          else bodyFatLevel = '肥胖';
        } else {
          if (bodyFat < 18) bodyFatLevel = '偏瘦';
          else if (bodyFat < 28) bodyFatLevel = '正常';
          else if (bodyFat < 33) bodyFatLevel = '偏高';
          else bodyFatLevel = '肥胖';
        }

        if (weightData.length >= 2) {
          const firstRecord = weightData[0];
          const firstBmi = parseFloat(firstRecord.weight) / (heightM * heightM);
          let firstBodyFat: number;
          
          if (user.gender === 'male') {
            firstBodyFat = 1.2 * firstBmi + 0.23 * age - 16.2;
          } else {
            firstBodyFat = 1.2 * firstBmi + 0.23 * age - 5.4;
          }
          
          const bodyFatChange = bodyFat - firstBodyFat;
          
          if (Math.abs(bodyFatChange) < 1) {
            bodyFatTrend = '体脂率保持稳定，继续保持';
          } else if (bodyFatChange > 0) {
            bodyFatTrend = `体脂率上升 ${bodyFatChange.toFixed(1)}%，增加运动量`;
          } else {
            bodyFatTrend = `体脂率下降 ${Math.abs(bodyFatChange).toFixed(1)}%，继续保持`;
          }
        }
      }

      const suggestions = this.generateSuggestions(weightStats, bmi, bmiLevel, user);

      return {
        code: 200,
        msg: 'success',
        data: {
          weight: weightStats,
          waist: waistStats,
          bmi: {
            current: Math.round(bmi * 10) / 10,
            level: bmiLevel,
            trend: bmiTrend
          },
          bodyFat: {
            current: Math.round(bodyFat * 10) / 10,
            level: bodyFatLevel,
            trend: bodyFatTrend
          },
          suggestions
        }
      };
    } catch (error) {
      console.error('获取详细统计失败:', error);
      return { code: 500, msg: '获取统计失败', data: null };
    }
  }

  private calculateStats(values: number[], records: any[], type: 'weight' | 'waist') {
    if (values.length === 0) {
      return {
        average: 0,
        max: 0,
        maxDate: '--',
        min: 0,
        minDate: '--',
        stdDev: 0
      };
    }

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    
    const maxDate = records.find((r, i) => 
      type === 'weight' ? parseFloat(r.weight) === max : parseFloat(r.waist) === max
    )?.record_date || '--';
    
    const minDate = records.find((r, i) => 
      type === 'weight' ? parseFloat(r.weight) === min : parseFloat(r.waist) === min
    )?.record_date || '--';

    const squaredDiffs = values.map(v => Math.pow(v - average, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
      average: Math.round(average * 10) / 10,
      max: Math.round(max * 10) / 10,
      maxDate: maxDate.slice(5) || maxDate,
      min: Math.round(min * 10) / 10,
      minDate: minDate.slice(5) || minDate,
      stdDev: Math.round(stdDev * 100) / 100
    };
  }

  private generateSuggestions(weightStats: any, bmi: number, bmiLevel: string, user: any): string[] {
    const suggestions: string[] = [];

    if (weightStats.average > 0) {
      if (user?.target_weight) {
        const target = parseFloat(user.target_weight);
        const current = weightStats.max;
        const diff = current - target;
        
        if (diff > 0) {
          suggestions.push(`当前体重距离目标还有 ${diff.toFixed(1)}kg，建议每周减重 0.5-1kg`);
        } else {
          suggestions.push('已达成目标体重，继续保持健康的生活方式');
        }
      }
    }

    if (bmi > 0) {
      if (bmiLevel === '偏瘦') {
        suggestions.push('BMI 偏低，建议增加营养摄入，适当进行力量训练');
      } else if (bmiLevel === '正常') {
        suggestions.push('BMI 在正常范围，保持均衡饮食和适量运动');
      } else if (bmiLevel === '超重') {
        suggestions.push('BMI 偏高，建议控制饮食，增加有氧运动');
      } else {
        suggestions.push('BMI 过高，建议咨询专业医生制定减重计划');
      }
    }

    suggestions.push('每天保持 8 杯水，促进新陈代谢');
    suggestions.push('建议每周运动 3-5 次，每次 30 分钟以上');

    return suggestions.slice(0, 4);
  }
}
