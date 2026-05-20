import { Injectable, OnModuleInit } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MemoryStorage } from '../../storage/memory/memory-storage.service';

@Injectable()
export class UserService implements OnModuleInit {
  private readonly TEMP_USER_ID = 'temp-user-001';
  private storage: MemoryStorage;

  onModuleInit() {
    this.storage = new MemoryStorage();
    this.storage.onModuleInit();
  }

  async getProfile() {
    try {
      const data = await this.storage.getUser(this.TEMP_USER_ID);
      
      if (!data) {
        const newUser = await this.storage.upsertUser(this.TEMP_USER_ID, {
          nickname: '小初'
        });
        return { code: 200, msg: 'success', data: newUser };
      }

      return { code: 200, msg: 'success', data };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return { code: 500, msg: '获取用户信息失败', data: null };
    }
  }

  async updateProfile(updateProfileDto: UpdateProfileDto) {
    try {
      const data = await this.storage.upsertUser(this.TEMP_USER_ID, updateProfileDto);
      return { code: 200, msg: 'success', data };
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return { code: 500, msg: '更新用户信息失败', data: null };
    }
  }

  async getUserStats() {
    try {
      const totalDays = await this.storage.getRecordCount(this.TEMP_USER_ID);
      const records = await this.storage.getAllRecords(this.TEMP_USER_ID);
      
      let continuousDays = 0;
      if (records && records.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        const lastRecordDate = records[records.length - 1].record_date;
        if (lastRecordDate === today || lastRecordDate === yesterday) {
          continuousDays = 1;
          let checkDate = new Date(lastRecordDate);
          
          for (let i = records.length - 2; i >= 0; i--) {
            const prevDate = new Date(checkDate);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            
            if (records[i].record_date === prevDateStr) {
              continuousDays++;
              checkDate = prevDate;
            } else {
              break;
            }
          }
        }
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthDays = await this.storage.getRecordCount(this.TEMP_USER_ID, monthStart);

      return {
        code: 200,
        msg: 'success',
        data: {
          totalDays: totalDays || 0,
          continuousDays,
          monthDays: monthDays || 0
        }
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      return { code: 500, msg: '获取统计失败', data: null };
    }
  }
}
