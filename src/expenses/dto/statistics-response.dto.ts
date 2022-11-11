import { ApiProperty } from '@nestjs/swagger';
import { Expense } from '../entities/expense.entity';

export class StatisticsResponseDto {
  @ApiProperty({
    description: 'List of qualifying expenses',
    type: () => Expense,
  })
  expenses: Expense[];

  @ApiProperty({
    description: 'Total of all qualifying amount expenses',
    example: 14891,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total amounts by categories',
    example: { Hogar: 4125, Salidas: 5165 },
  })
  totalAmountsForCategories: { [x: string]: number };

  @ApiProperty({
    description: 'Total amounts by subcategories',
    example: { Carniceria: 3453, Verduleria: 1327 },
  })
  totalAmountsForSubcategories: { [x: string]: number };

  @ApiProperty({
    description: 'Total amounts by month in actual year',
    example: [
      { month: 4, totalAmount: 51234 },
      { month: 6, totalAmount: 4378 },
    ],
  })
  amountsForMonthInActualYear: {
    month: number;
    totalAmount: number;
  }[];
}
