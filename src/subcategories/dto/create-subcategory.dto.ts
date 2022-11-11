import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateSubcategoryDto {
  @ApiProperty({
    description: 'Name of category',
    example: 'Verdulería',
  })
  @IsString()
  @Length(1, 30)
  name: string;
}
