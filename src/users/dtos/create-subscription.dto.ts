import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
    description: 'Revenue account identifier',
  })
  @IsString()
  revenue_id: string;
}
