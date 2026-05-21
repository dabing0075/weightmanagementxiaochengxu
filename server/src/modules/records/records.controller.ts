import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post('checkin')
  async checkIn(@Body() body: { date: string; weight: number; waist: number; note?: string }) {
    console.log('[RecordsController] POST /api/records/checkin', body);
    return this.recordsService.checkIn(body);
  }

  @Get('recent')
  async getRecentRecords(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    console.log('[RecordsController] GET /api/records/recent', { days: daysNum });
    return this.recordsService.getRecentRecords(daysNum);
  }

  @Get('history')
  async getHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    console.log('[RecordsController] GET /api/records/history', { startDate, endDate });
    return this.recordsService.getHistory(startDate, endDate);
  }
}
