import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateRecordDto {
  @IsDateString()
  record_date: string;

  @IsNumber()
  weight: number;

  @IsOptional()
  @IsNumber()
  waist?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
