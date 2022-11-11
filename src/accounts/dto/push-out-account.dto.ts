import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class PushOutAccountDto {
  @ApiProperty({
    description: 'Users id to pushout from account',
    example: [
      '143a3eea-edc9-409d-b448-750ce50b9bf0',
      '143a3eea-edc9-409d-b448-45asg4as35f4',
    ],
  })
  @IsUUID(4, { each: true })
  @IsString({ each: true })
  @IsArray()
  idUsers: string[];
}
