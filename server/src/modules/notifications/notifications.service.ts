import { Injectable } from '@nestjs/common'

// 内存存储（与管理后台共享）
export interface GlobalNotification {
  id: string
  title: string
  content: string
  type: string
  created_at: string
}

export interface UserNotification {
  id: string
  user_id: string
  title: string
  content: string
  type: string
  is_read: boolean
  created_at: string
}

// 用户已读通知记录（记录用户已阅读的通知ID）
export const userReadNotifications: Record<string, Set<string>> = {}

// 导出内存存储供其他模块使用
export const globalNotifications: GlobalNotification[] = []
export const userNotifications: UserNotification[] = []

// 计数器管理
let _notificationIdCounter = 1
export function getNextNotificationId(): number {
  return _notificationIdCounter++
}

// 获取用户已读记录
function getUserReadSet(userId: string): Set<string> {
  if (!userReadNotifications[userId]) {
    userReadNotifications[userId] = new Set<string>()
  }
  return userReadNotifications[userId]
}

@Injectable()
export class NotificationsService {
  /**
   * 获取用户通知列表（全局通知 + 个人通知）
   */
  async getUserNotifications(userId?: string) {
    // 使用默认用户 ID，确保全局通知的已读状态一致
    const effectiveUserId = userId || 'default-user'
    const readSet = getUserReadSet(effectiveUserId)
    
    // 获取全局通知（默认未读，除非用户已标记已读）
    const globalNotifs = globalNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      date: n.created_at.split('T')[0],
      read: readSet.has(n.id), // 根据用户已读记录判断
    }))

    // 获取个人通知（如果有 userId）
    let personalNotifs: any[] = []
    if (userId) {
      personalNotifs = userNotifications
        .filter(n => n.user_id === userId)
        .map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          content: n.content,
          date: n.created_at.split('T')[0],
          read: n.is_read,
        }))
    }

    // 合并并按时间排序
    const allNotifications = [...globalNotifs, ...personalNotifs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return allNotifications
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string, userId?: string) {
    // 对于全局通知，使用默认用户标记
    const effectiveUserId = userId || 'default-user'
    const readSet = getUserReadSet(effectiveUserId)
    readSet.add(notificationId)
    
    // 查找个人通知
    const notification = userNotifications.find(n => n.id === notificationId)
    if (notification) {
      notification.is_read = true
    }
    return { success: true }
  }

  /**
   * 创建全局通知（供管理后台调用）
   */
  async createGlobalNotification(title: string, content: string, type: string = 'system') {
    const now = new Date().toISOString()
    const notification: GlobalNotification = {
      id: `global-${getNextNotificationId()}`,
      title,
      content,
      type,
      created_at: now,
    }
    globalNotifications.push(notification)
    console.log('创建全局通知:', notification)
    return { success: true, notification }
  }

  /**
   * 创建个人通知（供管理后台调用）
   */
  async createUserNotification(userId: string, title: string, content: string, type: string = 'system') {
    const now = new Date().toISOString()
    const notification: UserNotification = {
      id: `notif-${getNextNotificationId()}`,
      user_id: userId,
      title,
      content,
      type,
      is_read: false,
      created_at: now,
    }
    userNotifications.push(notification)
    console.log('创建个人通知:', notification)
    return { success: true, notification }
  }

  /**
   * 获取所有通知（供管理后台调用）
   */
  async getAllNotifications(page: number = 1, pageSize: number = 20) {
    const from = (page - 1) * pageSize
    const to = from + pageSize
    
    const sortedNotifications = [...globalNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    const paginatedData = sortedNotifications.slice(from, to)

    return {
      data: paginatedData,
      total: globalNotifications.length,
      page,
      pageSize,
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string) {
    const globalIndex = globalNotifications.findIndex(n => n.id === notificationId)
    if (globalIndex !== -1) {
      globalNotifications.splice(globalIndex, 1)
      return { success: true }
    }

    const userIndex = userNotifications.findIndex(n => n.id === notificationId)
    if (userIndex !== -1) {
      userNotifications.splice(userIndex, 1)
      return { success: true }
    }

    return { success: false, message: '通知不存在' }
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId?: string): Promise<number> {
    const notifications = await this.getUserNotifications(userId)
    return notifications.filter(n => !n.read).length
  }
}
