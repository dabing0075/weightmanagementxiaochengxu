import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

@Injectable()
export class RecordsService {
  // 默认用户ID（实际项目应从JWT获取）
  private readonly DEFAULT_USER_ID = 'f0bc3324-5b55-43e8-97fb-9f7913e7ff40';
  private supabase = getSupabaseClient();

  async checkIn(data: { date: string; weight: number; waist: number; note?: string }) {
    // 检查当天是否已打卡
    const { data: existing, error: checkError } = await this.supabase
      .from('weight_records')
      .select('id')
      .eq('user_id', this.DEFAULT_USER_ID)
      .eq('record_date', data.date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[RecordsService] 检查记录失败', checkError);
      return { code: 500, msg: '检查记录失败', data: null };
    }

    if (existing) {
      // 更新现有记录
      const { data: updated, error: updateError } = await this.supabase
        .from('weight_records')
        .update({
          weight: data.weight,
          waist: data.waist,
          note: data.note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[RecordsService] 更新记录失败', updateError);
        return { code: 500, msg: '更新记录失败', data: null };
      }

      console.log('[RecordsService] 更新记录成功', updated);
      return { code: 200, msg: '记录已更新', data: updated };
    }

    // 创建新记录
    const { data: newRecord, error: insertError } = await this.supabase
      .from('weight_records')
      .insert({
        user_id: this.DEFAULT_USER_ID,
        record_date: data.date,
        weight: data.weight,
        waist: data.waist,
        note: data.note || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[RecordsService] 创建记录失败', insertError);
      return { code: 500, msg: '创建记录失败', data: null };
    }

    console.log('[RecordsService] 创建记录成功', newRecord);
    return { code: 200, msg: '打卡成功', data: newRecord };
  }

  async getRecentRecords(days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const { data, error } = await this.supabase
      .from('weight_records')
      .select('*')
      .eq('user_id', this.DEFAULT_USER_ID)
      .gte('record_date', startDate.toISOString().split('T')[0])
      .lte('record_date', endDate.toISOString().split('T')[0])
      .order('record_date', { ascending: false });

    if (error) {
      console.error('[RecordsService] 获取最近记录失败', error);
      return { code: 500, msg: '获取记录失败', data: null };
    }

    console.log('[RecordsService] 获取最近记录成功', data?.length || 0, '条');
    return { code: 200, msg: 'success', data };
  }

  async getHistory(startDate?: string, endDate?: string) {
    let query = this.supabase
      .from('weight_records')
      .select('*')
      .eq('user_id', this.DEFAULT_USER_ID);

    if (startDate) {
      query = query.gte('record_date', startDate);
    }
    if (endDate) {
      query = query.lte('record_date', endDate);
    }

    const { data, error } = await query.order('record_date', { ascending: false });

    if (error) {
      console.error('[RecordsService] 获取历史记录失败', error);
      return { code: 500, msg: '获取记录失败', data: null };
    }

    console.log('[RecordsService] 获取历史记录成功', data?.length || 0, '条');
    return { code: 200, msg: 'success', data };
  }

  async getCheckinStats() {
    // 获取所有记录
    const { data: records, error } = await this.supabase
      .from('weight_records')
      .select('record_date')
      .eq('user_id', this.DEFAULT_USER_ID)
      .order('record_date', { ascending: false });

    if (error) {
      console.error('[RecordsService] 获取打卡统计失败', error);
      return { code: 500, msg: '获取统计失败', data: null };
    }

    const totalDays = records?.length || 0;

    // 计算连续打卡天数
    let continuousDays = 0;
    if (records && records.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < records.length; i++) {
        const recordDate = new Date(records[i].record_date);
        recordDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (recordDate.getTime() === expectedDate.getTime()) {
          continuousDays++;
        } else {
          break;
        }
      }
    }

    // 计算本月打卡天数
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthDays = records?.filter(r => new Date(r.record_date) >= monthStart).length || 0;

    console.log('[RecordsService] 打卡统计', { totalDays, continuousDays, monthDays });
    return {
      code: 200,
      msg: 'success',
      data: {
        totalDays,
        continuousDays,
        monthDays
      }
    };
  }
}
