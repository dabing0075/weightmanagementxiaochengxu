import { Controller, Get, Put, Body, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(200)
  async getProfile() {
    return await this.userService.getProfile();
  }

  @Put('profile')
  @HttpCode(200)
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return await this.userService.updateProfile(updateProfileDto);
  }

  @Get('stats')
  @HttpCode(200)
  async getUserStats() {
    return await this.userService.getUserStats();
  }
}
