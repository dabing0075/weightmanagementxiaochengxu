import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { HealthModule } from '@/modules/health/health.module';
import { UserModule } from '@/modules/user/user.module';
import { RecordsModule } from '@/modules/records/records.module';
import { DocumentModule } from '@/modules/document/document.module';
import { AdminModule } from '@/modules/admin/admin.module';

@Module({
  imports: [HealthModule, UserModule, RecordsModule, DocumentModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
