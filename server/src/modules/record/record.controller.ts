import { Controller, Get, Post, Query, Body, HttpCode } from '@nestjs/common';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';

@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @HttpCode(200)
  async createRecord(@Body() createRecordDto: CreateRecordDto) {
    return await this.recordService.createRecord(createRecordDto);
  }

  @Get('today')
  @HttpCode(200)
  async getTodayRecord(@Query('date') date: string) {
    return await this.recordService.getTodayRecord(date);
  }

  @Get('recent')
  @HttpCode(200)
  async getRecentRecords(@Query('days') days: string) {
    return await this.recordService.getRecentRecords(parseInt(days) || 7);
  }

  @Get('stats')
  @HttpCode(200)
  async getHealthStats() {
    return await this.recordService.getHealthStats();
  }

  @Get('trend')
  @HttpCode(200)
  async getTrendData(@Query('days') days: string) {
    return await this.recordService.getTrendData(days);
  }
}
