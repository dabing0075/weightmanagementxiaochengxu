import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

// 内存存储通知（临时方案，生产环境应使用数据库）
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  targetUsers?: string[];
}

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// 内存存储
const globalNotifications: Notification[] = [];
const userNotifications: UserNotification[] = [];
let notificationIdCounter = 1;

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

    // 获取用户基本信息
    const { data: users, error, count } = await client
      .from('users')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) {
      console.error('获取客户列表失败:', error);
      return { data: [], total: 0, page, pageSize };
    }

    // 获取每个用户的最新打卡记录
    const enrichedUsers = await Promise.all(
      (users || []).map(async (user) => {
        // 获取最新打卡记录
        const { data: latestRecord } = await client
          .from('records')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // 获取第一条打卡记录（初始体重）
        const { data: firstRecord } = await client
          .from('records')
          .select('weight, date')
          .eq('user_id', user.id)
          .order('date', { ascending: true })
          .limit(1)
          .single();

        // 计算减重量
        let weightLost = 0;
        let startWeight = firstRecord?.weight || 0;
        let currentWeight = latestRecord?.weight || 0;

        if (startWeight && currentWeight) {
          weightLost = startWeight - currentWeight;
        }

        return {
          ...user,
          currentWeight,
          startWeight,
          weightLost: Math.round(weightLost * 10) / 10,
          latestRecordDate: latestRecord?.date,
          totalRecords: latestRecord ? 1 : 0,
        };
      }),
    );

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

    // 获取所有打卡记录
    const { data: records } = await client
      .from('records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    // 获取第一条和最后一条记录
    const firstRecord = records?.[0];
    const latestRecord = records?.[records.length - 1];

    return {
      user,
      records: records || [],
      summary: {
        startWeight: firstRecord?.weight || 0,
        currentWeight: latestRecord?.weight || 0,
        weightLost: firstRecord && latestRecord
          ? Math.round((firstRecord.weight - latestRecord.weight) * 10) / 10
          : 0,
        totalDays: records?.length || 0,
        startDate: firstRecord?.date,
        latestDate: latestRecord?.date,
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

    // 获取今日打卡人数
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCheckins } = await client
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('date', today);

    // 获取总打卡次数
    const { count: totalRecords } = await client
      .from('records')
      .select('*', { count: 'exact', head: true });

    // 获取所有用户计算平均减重
    const { data: users } = await client
      .from('users')
      .select('id');

    let totalWeightLost = 0;
    let userCountWithRecords = 0;

    for (const user of users || []) {
      const { data: records } = await client
        .from('records')
        .select('weight')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (records && records.length >= 2) {
        const firstWeight = records[0].weight;
        const lastWeight = records[records.length - 1].weight;
        totalWeightLost += firstWeight - lastWeight;
        userCountWithRecords++;
      }
    }

    return {
      totalUsers: totalUsers || 0,
      todayCheckins: todayCheckins || 0,
      totalRecords: totalRecords || 0,
      averageWeightLost: userCountWithRecords > 0
        ? Math.round((totalWeightLost / userCountWithRecords) * 10) / 10
        : 0,
      totalWeightLost: Math.round(totalWeightLost * 10) / 10,
    };
  }

  // 获取减重排行榜
  async getWeightLossRanking(limit: number = 10) {
    const client = getSupabaseClient();
    
    const { data: users } = await client
      .from('users')
      .select('id, nickname, avatar_url');

    const rankings: Array<{
      userId: string;
      nickname: string;
      avatarUrl: string | null;
      startWeight: number;
      currentWeight: number;
      weightLost: number;
      startDate: string;
      latestDate: string;
    }> = [];

    for (const user of users || []) {
      const { data: records } = await client
        .from('records')
        .select('weight, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (records && records.length >= 2) {
        const firstWeight = records[0].weight;
        const lastWeight = records[records.length - 1].weight;
        const weightLost = firstWeight - lastWeight;

        rankings.push({
          userId: user.id,
          nickname: user.nickname || '未设置昵称',
          avatarUrl: user.avatar_url,
          startWeight: firstWeight,
          currentWeight: lastWeight,
          weightLost: Math.round(weightLost * 10) / 10,
          startDate: records[0].date,
          latestDate: records[records.length - 1].date,
        });
      }
    }

    // 按减重量排序
    rankings.sort((a, b) => b.weightLost - a.weightLost);

    return rankings.slice(0, limit);
  }

  // 创建通知（使用内存存储）
  async createNotification(
    title: string,
    content: string,
    type: string = 'system',
    targetUsers?: string[],
  ) {
    const now = new Date().toISOString();
    
    // 如果指定了目标用户，为每个用户创建通知
    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach((userId) => {
        userNotifications.push({
          id: `notif-${notificationIdCounter++}`,
          user_id: userId,
          title,
          content,
          type,
          is_read: false,
          created_at: now,
        });
      });
    } else {
      // 全局通知
      globalNotifications.push({
        id: `global-${notificationIdCounter++}`,
        title,
        content,
        type,
        created_at: now,
      });
    }

    console.log('通知创建成功:', { title, content, type, targetUsers });
    return { success: true, message: '通知创建成功' };
  }

  // 获取通知列表（使用内存存储）
  async getNotifications(page: number = 1, pageSize: number = 20) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    
    // 按创建时间倒序排列
    const sortedNotifications = [...globalNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const paginatedData = sortedNotifications.slice(from, to);

    return {
      data: paginatedData,
      total: globalNotifications.length,
      page,
      pageSize,
    };
  }

  // 删除通知（使用内存存储）
  async deleteNotification(notificationId: string) {
    const index = globalNotifications.findIndex(n => n.id === notificationId);
    if (index === -1) {
      return { success: false, message: '通知不存在' };
    }
    
    globalNotifications.splice(index, 1);
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
