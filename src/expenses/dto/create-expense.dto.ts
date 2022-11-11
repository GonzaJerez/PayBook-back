import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
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
    example: 'Christmas shopping',
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  description?: string;

  @ApiProperty({
    description: 'Installments of the expense',
    required: false,
    default: 1,
    example: 6,
  })
  @IsPositive()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  installments?: number;

  @ApiProperty({
    description: 'Name of the credit payment for better experience identifier',
    required: false,
    example: 'iPhone 13',
  })
  @IsString()
  @IsOptional()
  @Length(0, 30)
  name_credit_payment?: string;

  @ApiProperty({
    description: 'Id of category to wich this expense belongs',
    example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Id of subcategory to wich this expense belongs',
    example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
  })
  @IsUUID()
  subcategoryId: string;
}
