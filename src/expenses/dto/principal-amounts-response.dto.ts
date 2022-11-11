import { ApiProperty } from '@nestjs/swagger';

export class PrincipalAmountsResponseDto {
  @ApiProperty({
    description: 'Total amount spent on actual month',
    example: 30189,
  })
  totalAmountOnMonth: number;

  @ApiProperty({
    description: 'Total amount spent on actual week',
    example: 2387,
  })
  totalAmountOnWeek: number;

  @ApiProperty({
    description: 'Total amount spent today',
    example: 1500,
  })
  totalAmountOnDay: number;

  @ApiProperty({
    description: 'Total fixed costs',
    example: 17234,
  })
  totalAmountFixedCostsMonthly: number;
}
