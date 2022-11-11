import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsPositive, IsString, Length, Min } from 'class-validator';
import { Account } from 'src/accounts/entities/account.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Expense } from 'src/expenses/entities/expense.entity';
import { Subcategory } from 'src/subcategories/entities/subcategory.entity';
import { User } from 'src/users/entities/user.entity';

export class CreateCreditPaymentDto {
  @ApiProperty({
    description: 'Number of installments',
    example: 6,
    required: false,
  })
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  installments: number;

  @ApiProperty({
    description: 'Name of the credit payment for better experience identifier',
    required: false,
    example: 'iPhone 13',
  })
  @IsString()
  @Length(0, 30)
  name: string;

  @ApiProperty({
    description: 'Account of this credit_payment',
    type: () => Account,
  })
  account: Account;

  @ApiProperty({
    description: 'User which creates this credit_payment',
    type: () => User,
  })
  user: User;

  @ApiProperty({
    description: 'Category of this credit_payment',
    type: () => Category,
  })
  category: Category;

  @ApiProperty({
    description: 'Subcategory of this credit_payment',
    type: () => Subcategory,
  })
  subcategory: Subcategory;

  @ApiProperty({
    description: 'First expense to create this credit_payment',
    type: () => Expense,
  })
  expense: Expense;
}
