import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../../accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Subcategory } from '../../subcategories/entities/subcategory.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class CreditPayment {
  @ApiProperty({
    example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
    description: 'Unique identifier',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'TV 52"',
    description: 'Name to reference the purchase',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    type: Number,
    description: 'Number of installments payment',
    default: 1,
  })
  @Column('int', {
    default: 1,
  })
  installments: number;

  @ApiProperty({
    type: Number,
    description: 'Number of installments paid',
    default: 1,
  })
  @Column('int', {
    default: 1,
  })
  installments_paid: number;

  @ApiProperty({
    type: Boolean,
    description:
      'If is true, this credit_payment is being used correctly, if it is not because it was deleted',
    default: true,
  })
  @Column('bool', {
    default: true,
  })
  isActive: boolean;

  @OneToMany(() => Expense, (expense) => expense.credit_payment, {
    eager: true,
    cascade: true,
  })
  expenses: Expense[];

  @ManyToOne(() => Account, (account) => account.credit_payments, {
    eager: true,
  })
  account: Account;

  @ManyToOne(() => User, (user) => user.credit_payments, { eager: true })
  user: User;

  @ManyToOne(() => Category, (category) => category.credit_payments, {
    eager: true,
  })
  category: Category;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.credit_payments, {
    eager: true,
  })
  subcategory: Subcategory;
}
