import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Min amount',
    example: 1500,
    required: false,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  min_amount?: number;

  @ApiProperty({
    description: 'Max amount',
    example: 6000,
    required: false,
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  max_amount?: number;

  @ApiProperty({
    description: 'Date of month',
    example: [4],
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @IsArray()
  @Type(() => Number)
  num_date?: number[];

  @ApiProperty({
    description: 'Month (number)',
    example: [11],
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  month?: number[];

  @ApiProperty({
    description: 'Year',
    example: [2017],
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  year?: number[];

  @ApiProperty({
    description: 'Name of day',
    example: ['Martes'],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  @IsIn(daysNames, { each: true })
  day_name?: string[];

  @ApiProperty({
    description: 'id of users',
    example: ['143a3eea-edc9-409d-b448-750ce50b9bf0'],
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  users?: string[];

  @ApiProperty({
    description: 'id of categories',
    example: ['143a3eea-edc9-409d-b448-750ce50b9bf0'],
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  categories?: string[];

  @ApiProperty({
    description: 'id of subcategories',
    example: ['143a3eea-edc9-409d-b448-750ce50b9bf0'],
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  subcategories?: string[];
}
