import { Controller, Get, HttpCode } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('records')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('stats/detail')
  @HttpCode(200)
  async getDetailedStats() {
    return await this.statsService.getDetailedStats();
  }
}
