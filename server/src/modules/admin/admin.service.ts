import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

// 通知接口
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  targetUsers?: string[];
}

@Injectable()
export class AdminService {
  // 管理员登录验证
  async validateAdmin(username: string, password: string) {
    // 简单的管理员验证（实际项目中应该使用数据库存储）
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
      return {
        success: true,
        token: Buffer.from(`${username}:${Date.now()}`).toString('base64'),
      };
    }
    return { success: false, message: '用户名或密码错误' };
  }

  // 获取所有客户列表
  async getCustomers(
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const client = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 映射排序字段到数据库字段
    const sortFieldMap: Record<string, string> = {
      'created_at': 'created_at',
      'weightToGoal': 'current_weight', // 用当前体重排序
      'currentWeight': 'current_weight',
      'currentWaist': 'current_waist',
    };
    const dbSortField = sortFieldMap[sortBy] || 'created_at';

    // 获取用户基本信息
    const { data: users, error, count } = await client
      .from('users')
      .select('*', { count: 'exact' })
      .order(dbSortField, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) {
      console.error('获取客户列表失败:', error);
      return { data: [], total: 0, page, pageSize };
    }

    // 用户表已经包含了最新数据，直接返回
    const enrichedUsers = (users || []).map((user) => {
      // 从用户表获取当前体重和腰围
      const currentWeight = user.current_weight || 0;
      const currentWaist = user.current_waist || 0;

      // 计算减重量（目标体重 - 当前体重）
      const targetWeight = user.target_weight || 0;
      const weightToGoal = targetWeight > 0 && currentWeight > 0 
        ? Math.round((targetWeight - currentWeight) * 10) / 10 
        : 0;

      return {
        id: user.id,
        nickname: user.nickname || '未设置',
        gender: user.gender || '未设置',
        height: user.height || 0,
        currentWeight: currentWeight,
        currentWaist: currentWaist,
        targetWeight: targetWeight,
        targetWaist: user.target_waist || 0,
        bmi: user.bmi || 0,
        bmiLevel: user.bmi_level || '',
        bodyFatRate: user.body_fat_rate || 0,
        bodyFatLevel: user.body_fat_level || '',
        waistLevel: user.waist_level || '',
        weightToGoal: weightToGoal,
        lastCheckinDate: user.last_checkin_date || '',
        createdAt: user.created_at || '',
      };
    });

    return {
      data: enrichedUsers,
      total: count || 0,
      page,
      pageSize,
    };
  }

  // 获取客户详情
  async getCustomerDetail(userId: string) {
    const client = getSupabaseClient();
    
    // 获取用户基本信息
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    // 获取所有打卡记录（从 weight_records 表）
    const { data: records } = await client
      .from('weight_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    // 使用用户表中的当前数据
    const currentWeight = user.current_weight || 0;
    const targetWeight = user.target_weight || 0;

    return {
      user: {
        id: user.id,
        nickname: user.nickname || '未设置',
        gender: user.gender || '未设置',
        height: user.height || 0,
        currentWeight: currentWeight,
        currentWaist: user.current_waist || 0,
        targetWeight: targetWeight,
        targetWaist: user.target_waist || 0,
        bmi: user.bmi || 0,
        bmiLevel: user.bmi_level || '',
        bodyFatRate: user.body_fat_rate || 0,
        bodyFatLevel: user.body_fat_level || '',
        waistLevel: user.waist_level || '',
      },
      records: records || [],
      summary: {
        currentWeight: currentWeight,
        targetWeight: targetWeight,
        weightToGoal: targetWeight > 0 && currentWeight > 0
          ? Math.round((targetWeight - currentWeight) * 10) / 10
          : 0,
        totalDays: records?.length || 0,
      },
    };
  }

  // 获取统计数据
  async getStatistics() {
    const client = getSupabaseClient();
    
    // 获取总用户数
    const { count: totalUsers } = await client
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 获取今日打卡人数（从 weight_records 表）
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCheckins } = await client
      .from('weight_records')
      .select('*', { count: 'exact', head: true })
      .eq('date', today);

    // 获取总打卡次数
    const { count: totalRecords } = await client
      .from('weight_records')
      .select('*', { count: 'exact', head: true });

    // 从用户表获取减重数据
    const { data: users } = await client
      .from('users')
      .select('current_weight, target_weight');

    let totalWeightToGoal = 0;
    let userCountWithGoal = 0;

    for (const user of users || []) {
      if (user.current_weight && user.target_weight) {
        totalWeightToGoal += user.target_weight - user.current_weight;
        userCountWithGoal++;
      }
    }

    return {
      totalUsers: totalUsers || 0,
      todayCheckins: todayCheckins || 0,
      totalRecords: totalRecords || 0,
      averageWeightToGoal: userCountWithGoal > 0
        ? Math.round((totalWeightToGoal / userCountWithGoal) * 10) / 10
        : 0,
      totalWeightToGoal: Math.round(totalWeightToGoal * 10) / 10,
    };
  }

  // 获取减重排行榜
  async getWeightLossRanking(limit: number = 10) {
    const client = getSupabaseClient();
    
    // 直接从用户表获取数据
    const { data: users } = await client
      .from('users')
      .select('id, nickname, avatar_url, current_weight, target_weight, bmi, body_fat_rate, last_checkin_date')
      .not('current_weight', 'is', null)
      .not('target_weight', 'is', null);

    // 计算距离目标的重量
    const rankings: Array<{
      userId: string;
      nickname: string;
      avatarUrl: string | null;
      currentWeight: number;
      targetWeight: number;
      weightToGoal: number;
      bmi: number;
      bodyFatRate: number;
      lastCheckinDate: string;
    }> = [];

    for (const user of users || []) {
      const currentWeight = user.current_weight || 0;
      const targetWeight = user.target_weight || 0;
      
      if (currentWeight > 0 && targetWeight > 0) {
        rankings.push({
          userId: user.id,
          nickname: user.nickname || '未设置',
          avatarUrl: user.avatar_url,
          currentWeight: currentWeight,
          targetWeight: targetWeight,
          weightToGoal: Math.round((targetWeight - currentWeight) * 10) / 10,
          bmi: user.bmi || 0,
          bodyFatRate: user.body_fat_rate || 0,
          lastCheckinDate: user.last_checkin_date || '',
        });
      }
    }

    // 按距离目标的重量排序（接近目标的排前面）
    rankings.sort((a, b) => a.weightToGoal - b.weightToGoal);

    return rankings.slice(0, limit);
  }

  // 创建通知（使用数据库存储）
  async createNotification(
    title: string,
    content: string,
    type: string = 'system',
    targetUsers?: string[],
  ) {
    const client = getSupabaseClient();
    
    // 插入全局通知到数据库
    const { data, error } = await client
      .from('global_notifications')
      .insert({
        title,
        content,
        type,
      })
      .select()
      .single();

    if (error) {
      console.error('创建通知失败:', error);
      return { success: false, message: '创建通知失败' };
    }

    // 如果指定了目标用户，为每个用户创建关联记录
    if (targetUsers && targetUsers.length > 0 && data) {
      const userNotificationData = targetUsers.map(userId => ({
        user_id: userId,
        notification_id: data.id,
        is_read: false,
      }));
      
      const { error: userError } = await client
        .from('user_notifications')
        .insert(userNotificationData);
      
      if (userError) {
        console.error('创建用户通知关联失败:', userError);
      }
    }

    console.log('通知创建成功:', { title, content, type, targetUsers });
    return { success: true, message: '通知创建成功', data };
  }

  // 获取通知列表（使用数据库存储）
  async getNotifications(page: number = 1, pageSize: number = 20) {
    const client = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 获取总数
    const { count, error: countError } = await client
      .from('global_notifications')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('获取通知总数失败:', countError);
    }

    // 分页获取通知列表
    const { data, error } = await client
      .from('global_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('获取通知列表失败:', error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  // 删除通知（使用数据库存储）
  async deleteNotification(notificationId: string) {
    const client = getSupabaseClient();
    
    // 先删除关联的用户通知记录
    await client
      .from('user_notifications')
      .delete()
      .eq('notification_id', notificationId);
    
    // 再删除全局通知
    const { error } = await client
      .from('global_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('删除通知失败:', error);
      return { success: false, message: '删除失败' };
    }
    
    return { success: true, message: '删除成功' };
  }

  // 获取所有用户列表（用于通知推送选择）
  async getAllUsersForNotification() {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('users')
      .select('id, nickname, avatar_url')
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  }
}
