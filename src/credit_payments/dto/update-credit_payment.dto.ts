import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

export class UpdateCreditPaymentDto {
  @ApiProperty({
    description: 'Number of installments',
    example: 6,
    required: false,
  })
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  installments?: number;

  @ApiProperty({
    description: 'Name of the credit payment for better experience identifier',
    required: false,
    example: 'iPhone 13',
  })
  @IsString()
  @Length(0, 30)
  @IsOptional()
  name?: string;
}
