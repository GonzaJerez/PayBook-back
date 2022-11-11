import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: 'Abcd1234',
    description: 'New password for update',
    required: false,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @IsOptional()
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe tener por lo menos una mayúscula, una minúscula, una letra y un número',
  })
  newPassword?: string;
}
