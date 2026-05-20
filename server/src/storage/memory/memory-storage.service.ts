import { Injectable, OnModuleInit } from '@nestjs/common';

// 内存存储（开发环境降级方案）
// 生产环境请开通 Supabase 服务
@Injectable()
export class MemoryStorage implements OnModuleInit {
  private users: Map<string, any> = new Map();
  private records: any[] = [];

  onModuleInit() {
    // 初始化默认用户
    this.users.set('temp-user-001', {
      id: 'temp-user-001',
      nickname: '小初',
      gender: 'female',
      birth_date: '1995-01-15',
      height: '165',
      target_weight: '55',
      target_waist: '65',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 添加一些示例数据
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      this.records.push({
        id: `record-${i}`,
        user_id: 'temp-user-001',
        record_date: date.toISOString().split('T')[0],
        weight: (65 + Math.random() * 2).toFixed(1),
        waist: (80 - i * 0.5).toFixed(1),
        note: i === 0 ? '今日打卡' : null,
        created_at: date.toISOString(),
        updated_at: date.toISOString()
      });
    }
  }

  // 用户相关操作
  async getUser(id: string) {
    return this.users.get(id) || null;
  }

  async upsertUser(id: string, data: any) {
    const existing = this.users.get(id);
    const updated = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString()
    };
    this.users.set(id, updated);
    return updated;
  }

  // 记录相关操作
  async createRecord(data: any) {
    const existing = this.records.find(
      r => r.user_id === data.user_id && r.record_date === data.record_date
    );

    if (existing) {
      Object.assign(existing, {
        ...data,
        updated_at: new Date().toISOString()
      });
      return existing;
    }

    const record = {
      id: `record-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.records.push(record);
    return record;
  }

  async getRecord(userId: string, date: string) {
    return this.records.find(
      r => r.user_id === userId && r.record_date === date
    ) || null;
  }

  async getRecentRecords(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    return this.records
      .filter(r => r.user_id === userId && r.record_date >= startDateStr)
      .sort((a, b) => b.record_date.localeCompare(a.record_date));
  }

  async getAllRecords(userId: string) {
    return this.records
      .filter(r => r.user_id === userId)
      .sort((a, b) => a.record_date.localeCompare(b.record_date));
  }

  async getRecordCount(userId: string, startDate?: string) {
    let filtered = this.records.filter(r => r.user_id === userId);
    if (startDate) {
      filtered = filtered.filter(r => r.record_date >= startDate);
    }
    return filtered.length;
  }
}

// 导出单例实例
export const memoryStorage = new MemoryStorage();
