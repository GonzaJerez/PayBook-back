import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of category',
    example: 'Hogar',
  })
  @IsString()
  @Length(1, 20)
  name: string;
}
