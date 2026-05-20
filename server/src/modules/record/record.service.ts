import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { MemoryStorage } from '../../storage/memory/memory-storage.service';
import { UserService } from '../user/user.service';

@Injectable()
export class RecordService implements OnModuleInit {
  private readonly TEMP_USER_ID = 'temp-user-001';
  private storage: MemoryStorage;

  constructor(private readonly userService: UserService) {}

  onModuleInit() {
    this.storage = new MemoryStorage();
    this.storage.onModuleInit();
  }

  async createRecord(createRecordDto: CreateRecordDto) {
    try {
      const data = await this.storage.createRecord({
        user_id: this.TEMP_USER_ID,
        ...createRecordDto
      });
      return { code: 200, msg: '打卡成功', data };
    } catch (error) {
      console.error('创建记录失败:', error);
      return { code: 500, msg: '创建记录失败', data: null };
    }
  }

  async getTodayRecord(date: string) {
    try {
      const data = await this.storage.getRecord(this.TEMP_USER_ID, date);
      return { code: 200, msg: 'success', data };
    } catch (error) {
      console.error('获取今日记录失败:', error);
      return { code: 500, msg: '获取记录失败', data: null };
    }
  }

  async getRecentRecords(days: number) {
    try {
      const data = await this.storage.getRecentRecords(this.TEMP_USER_ID, days);
      return { code: 200, msg: 'success', data };
    } catch (error) {
      console.error('获取最近记录失败:', error);
      return { code: 500, msg: '获取记录失败', data: null };
    }
  }

  async getHealthStats() {
    try {
      const records = await this.storage.getAllRecords(this.TEMP_USER_ID);
      const userResult = await this.userService.getProfile();
      const user = userResult.data;

      let bmi = 0;
      let bodyFatRate = 0;
      let bmiLevel = '--';
      let bodyFatLevel = '--';

      if (records && records.length > 0 && user?.height) {
        const latestRecord = records[records.length - 1];
        const heightM = parseFloat(user.height) / 100;
        const weightKg = parseFloat(latestRecord.weight);
        
        bmi = weightKg / (heightM * heightM);
        
        if (bmi < 18.5) bmiLevel = '偏瘦';
        else if (bmi < 24) bmiLevel = '正常';
        else if (bmi < 28) bmiLevel = '超重';
        else bmiLevel = '肥胖';

        const age = user.birth_date 
          ? new Date().getFullYear() - new Date(user.birth_date).getFullYear() 
          : 25;
        
        if (user.gender === 'male') {
          bodyFatRate = 1.2 * bmi + 0.23 * age - 16.2;
        } else {
          bodyFatRate = 1.2 * bmi + 0.23 * age - 5.4;
        }

        if (user.gender === 'male') {
          if (bodyFatRate < 10) bodyFatLevel = '偏瘦';
          else if (bodyFatRate < 20) bodyFatLevel = '正常';
          else if (bodyFatRate < 25) bodyFatLevel = '偏高';
          else bodyFatLevel = '肥胖';
        } else {
          if (bodyFatRate < 18) bodyFatLevel = '偏瘦';
          else if (bodyFatRate < 28) bodyFatLevel = '正常';
          else if (bodyFatRate < 33) bodyFatLevel = '偏高';
          else bodyFatLevel = '肥胖';
        }
      }

      const latestWeight = records && records.length > 0 ? records[records.length - 1] : null;

      return {
        code: 200,
        msg: 'success',
        data: {
          currentWeight: latestWeight?.weight ? parseFloat(latestWeight.weight) : 0,
          currentWaist: latestWeight?.waist ? parseFloat(latestWeight.waist) : 0,
          bmi: Math.round(bmi * 10) / 10,
          bodyFatRate: Math.round(bodyFatRate * 10) / 10,
          bmiLevel,
          bodyFatLevel
        }
      };
    } catch (error) {
      console.error('获取健康统计失败:', error);
      return { code: 500, msg: '获取统计失败', data: null };
    }
  }

  async getTrendData(days: string) {
    try {
      const allRecords = await this.storage.getAllRecords(this.TEMP_USER_ID);
      
      let records = allRecords;
      if (days !== 'all') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const startDateStr = startDate.toISOString().split('T')[0];
        records = allRecords.filter(r => r.record_date >= startDateStr);
      }

      const weightRecords = records
        .filter(r => r.weight)
        .map(r => ({
          id: r.record_date,
          record_date: r.record_date,
          weight: r.weight,
          waist: r.waist
        }));

      const weightSummary = this.calculateSummary(weightRecords.map(r => parseFloat(r.weight)));

      const waistRecords = records
        .filter(r => r.waist)
        .map(r => ({
          id: r.record_date,
          record_date: r.record_date,
          weight: r.weight,
          waist: r.waist
        }));

      const waistSummary = this.calculateSummary(waistRecords.map(r => parseFloat(r.waist)));

      return {
        code: 200,
        msg: 'success',
        data: {
          weight: {
            records: weightRecords,
            summary: weightSummary
          },
          waist: {
            records: waistRecords,
            summary: waistSummary
          }
        }
      };
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      return { code: 500, msg: '获取数据失败', data: null };
    }
  }

  private calculateSummary(values: number[]) {
    if (values.length === 0) {
      return {
        startWeight: 0,
        endWeight: 0,
        change: 0,
        changePercent: 0
      };
    }

    const startWeight = values[0];
    const endWeight = values[values.length - 1];
    const change = endWeight - startWeight;
    const changePercent = startWeight !== 0 ? (change / startWeight) * 100 : 0;

    return {
      startWeight: Math.round(startWeight * 10) / 10,
      endWeight: Math.round(endWeight * 10) / 10,
      change: Math.round(change * 10) / 10,
      changePercent: Math.round(changePercent * 10) / 10
    };
  }
}
