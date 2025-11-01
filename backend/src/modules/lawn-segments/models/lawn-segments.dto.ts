import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class UpdateLawnSegmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  size?: number;

  @IsArray()
  @IsOptional()
  coordinates?: number[][][] | null;

  @IsString()
  @IsOptional()
  color?: string;
}
