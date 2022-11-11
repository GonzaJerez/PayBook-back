import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Subcategory } from '../../subcategories/entities/subcategory.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { CreditPayment } from '../../credit_payments/entities/credit_payment.entity';

@Entity('categories')
export class Category {
  @ApiProperty({
    example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
    description: 'Unique identifier',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Hogar',
    description: 'Name of category',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    default: true,
    description: 'Prop to identifier active or inactive category',
  })
  @Column('bool', {
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    type: () => Account,
    description: 'Account to this category belong',
  })
  @ManyToOne(() => Account, (account) => account.categories)
  account: Account;

  @ApiProperty({
    type: [Subcategory],
    description: 'Subcategories which belongs category',
  })
  @OneToMany(() => Subcategory, (subcategory) => subcategory.category, {
    cascade: true,
    eager: true,
  })
  subcategories?: Subcategory[];

  @ApiProperty({
    type: [Expense],
    description: 'Expenses that belong to this category',
  })
  @OneToMany(
    () => Expense,
    (expenses) => expenses.category,
    // {cascade:true}
  )
  expenses?: Expense[];

  @ApiProperty({
    type: [CreditPayment],
    description: 'Credit payment on this category',
  })
  @OneToMany(
    () => CreditPayment,
    (credit_payment) => credit_payment.category,
    // {cascade:true}
  )
  credit_payments?: CreditPayment[];
}
