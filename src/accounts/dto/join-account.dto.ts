import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinAccountDto {
  @ApiProperty({
    example: '8c0b9bf0',
    description: 'Key to access to an account',
    uniqueItems: true,
  })
  @IsString()
  @Length(8, 8)
  access_key: string;
}
