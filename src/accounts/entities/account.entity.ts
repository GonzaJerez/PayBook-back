import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { CreditPayment } from '../../credit_payments/entities/credit_payment.entity';

@Entity('accounts')
export class Account {
  @ApiProperty({
    example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
    description: 'Unique identifier',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Gastos personales',
    description: 'Account name',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    example: 'Cuenta para manejar mis gastos en el dia a dia',
    description: 'Account description',
  })
  @Column('text', {
    default: '',
  })
  description: string;

  @ApiProperty({
    example: 5,
    default: 10,
    description: 'Maximum number of users that can access the account',
  })
  @Column('int', {
    default: 10,
  })
  max_num_users: number;

  @ApiProperty({
    example: '8c0b9bf0',
    description: 'Key to access to an account',
    uniqueItems: true,
  })
  @Column('text', {
    unique: true,
  })
  access_key: string;

  @ApiProperty({
    default: true,
    description: 'Prop to identifier active or inactive accounts',
  })
  @Column('bool', {
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Users to have access to this account',
    type: () => [User],
  })
  @ManyToMany(() => User, (user) => user.accounts, {
    onDelete: 'CASCADE',
    eager: true,
  })
  users: User[];

  @ApiProperty({
    description: 'User who created the account',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.accounts_owner, { eager: true })
  creator_user: User;

  @ApiProperty({
    description: 'Users admin the account',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.accounts_admin, { eager: true })
  admin_user: User;

  @ApiProperty({
    type: () => [Category],
    description: 'Categories to have this account',
  })
  @OneToMany(() => Category, (categories) => categories.account, {
    cascade: true,
  })
  categories?: Category[];

  @ApiProperty({
    type: () => [Expense],
    description: 'Expenses in this account',
  })
  @OneToMany(() => Expense, (expense) => expense.account, { cascade: true })
  expenses?: Expense[];

  @ApiProperty({
    type: () => [CreditPayment],
    description: 'Credit payments in this account',
  })
  @OneToMany(() => CreditPayment, (credit_payment) => credit_payment.account, {
    cascade: true,
  })
  credit_payments?: CreditPayment[];
}
