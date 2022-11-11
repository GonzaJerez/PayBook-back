import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class PayInstallmentDto {
  @ApiProperty({
    description: 'Amount of expense',
    example: 1500,
  })
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Date time in miliseconds of the expense',
    example: 1668191423962,
  })
  @IsNumber()
  @IsPositive()
  complete_date: number;

  @ApiProperty({
    description: 'Description of the expense',
    required: false,
    example: 'iPhone 13 - 4th installment',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  description?: string;
}
