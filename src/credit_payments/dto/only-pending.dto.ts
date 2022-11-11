import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class OnlyPendingDto {
  @ApiProperty({
    description:
      'Prop to indicate whether to show only pending credit_payments or all of them',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  pending: true;
}
