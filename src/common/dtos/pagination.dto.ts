import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    example: 10,
    default: 10,
    description: 'Limit of the results',
    required: false,
  })
  @IsOptional()
  @IsPositive()
  // Transformar
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    example: 5,
    default: 0,
    description: 'Skip users',
    required: false,
  })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  skip?: number;
}
