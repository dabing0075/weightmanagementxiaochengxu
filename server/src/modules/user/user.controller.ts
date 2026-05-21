import { Controller, Get, Post, Body, Put } from '@nestjs/common'
import { UserService } from './user.service'
import { UpdateUserDto } from './dto/update-user.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户信息
   */
  @Get('info')
  async getUserInfo() {
    console.log('[UserController] GET /api/user/info')
    const data = await this.userService.getUserInfo()
    console.log('[UserController] 返回数据:', data)
    return {
      code: 200,
      msg: 'success',
      data
    }
  }

  /**
   * 更新用户信息
   */
  @Put('info')
  async updateUserInfo(@Body() updateUserDto: UpdateUserDto) {
    console.log('[UserController] PUT /api/user/info')
    console.log('[UserController] 请求数据:', updateUserDto)
    const data = await this.userService.updateUserInfo(updateUserDto)
    console.log('[UserController] 返回数据:', data)
    return {
      code: 200,
      msg: 'success',
      data
    }
  }

  /**
   * 初始化用户信息
   */
  @Post('init')
  async initUser(@Body() body: { nickname?: string; gender?: string; birth_date?: string; height?: number }) {
    console.log('[UserController] POST /api/user/init')
    console.log('[UserController] 请求数据:', body)
    const data = await this.userService.initUser(body)
    console.log('[UserController] 返回数据:', data)
    return {
      code: 200,
      msg: 'success',
      data
    }
  }
}
