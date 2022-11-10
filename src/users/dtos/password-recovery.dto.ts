import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class PasswordRecoveryDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'Email where the security code will be sent ',
  })
  @IsEmail()
  email: string;
}
