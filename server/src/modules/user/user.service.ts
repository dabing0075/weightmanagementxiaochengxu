import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  /**
   * 获取用户信息
   */
  async getUserInfo() {
    const client = getSupabaseClient()
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) throw new Error(`获取用户信息失败: ${error.message}`)
    
    return data?.[0] || null
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(updateUserDto: UpdateUserDto) {
    const client = getSupabaseClient()
    
    // 先查询是否有用户
    const { data: existingUsers, error: queryError } = await client
      .from('users')
      .select('id')
      .limit(1)
    
    if (queryError) throw new Error(`查询用户失败: ${queryError.message}`)
    
    if (!existingUsers || existingUsers.length === 0) {
      // 没有用户，创建新用户
      const { data, error } = await client
        .from('users')
        .insert({
          nickname: updateUserDto.nickname || '用户',
          gender: updateUserDto.gender || 'male',
          birth_date: updateUserDto.birth_date || '1990-01-01',
          height: updateUserDto.height || 170,
          target_weight: updateUserDto.target_weight || 65,
          target_waist: updateUserDto.target_waist || 80
        })
        .select()
      
      if (error) throw new Error(`创建用户失败: ${error.message}`)
      return data?.[0]
    } else {
      // 更新现有用户
      const userId = existingUsers[0].id
      const { data, error } = await client
        .from('users')
        .update({
          ...updateUserDto,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
      
      if (error) throw new Error(`更新用户失败: ${error.message}`)
      return data?.[0]
    }
  }

  /**
   * 初始化用户
   */
  async initUser(body: { nickname?: string; gender?: string; birth_date?: string; height?: number }) {
    const client = getSupabaseClient()
    
    // 检查是否已有用户
    const { data: existingUsers, error: queryError } = await client
      .from('users')
      .select('id')
      .limit(1)
    
    if (queryError) throw new Error(`查询用户失败: ${queryError.message}`)
    
    if (existingUsers && existingUsers.length > 0) {
      return existingUsers[0]
    }
    
    // 创建新用户
    const { data, error } = await client
      .from('users')
      .insert({
        nickname: body.nickname || '用户',
        gender: body.gender || 'male',
        birth_date: body.birth_date || '1990-01-01',
        height: body.height || 170,
        target_weight: 65,
        target_waist: 80
      })
      .select()
    
    if (error) throw new Error(`初始化用户失败: ${error.message}`)
    return data?.[0]
  }
}
