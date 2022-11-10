import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, IsString, Length } from 'class-validator';

export class SecurityCodeDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'Email where the security code was sent ',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '432891',
    description: 'Security code to recovery password ',
  })
  @IsNumberString()
  @Length(6, 6)
  code: string;
}
