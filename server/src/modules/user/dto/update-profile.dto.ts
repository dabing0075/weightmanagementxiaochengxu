import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;

  @IsOptional()
  @IsString()
  birth_date?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  target_weight?: number;

  @IsOptional()
  @IsNumber()
  target_waist?: number;
}
