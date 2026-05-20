import { Module } from '@nestjs/common';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [RecordController],
  providers: [RecordService],
  exports: [RecordService]
})
export class RecordModule {}
