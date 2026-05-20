import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UserModule } from './modules/user/user.module';
import { RecordModule } from './modules/record/record.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [UserModule, RecordModule, StatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
