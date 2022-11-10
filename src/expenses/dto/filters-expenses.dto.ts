import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { daysNames } from '../utils/days-names';

export class FiltersExpensesDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  min_amount?: number;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  max_amount?: number;

  @IsOptional()
  @IsNumber({}, { each: true })
  @IsArray()
  @Type(() => Number)
  num_date?: number[];

  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  month?: number[];

  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  year?: number[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  @IsIn(daysNames, { each: true })
  day_name?: string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  users?: string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  subcategories?: string[];
}
