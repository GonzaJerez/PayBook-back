import {ApiProperty} from "@nestjs/swagger";
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

import {Account} from "../../accounts/entities/account.entity";
import {Category} from "../../categories/entities/category.entity";
import {Subcategory} from "../../subcategories/entities/subcategory.entity";
import {User} from "../../users/entities/user.entity";

@Entity('expenses')
export class Expense {
    @ApiProperty({
        example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
        description: 'Unique identifier',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        example: 1500,
        description: 'Amount of expense',
        type: Number
    })
    @Column('float')
    amount: number;

    @ApiProperty({
        example: 'Compra de comida en Carrefour',
        description: 'Expense description',
        default: ''
    })
    @Column('text',{
        default:''
    })
    description: string;

    @ApiProperty({
        type: Number,
        description: 'Complete date when the expense was incured'
    })
    @Column('bigint')
    complete_date: number;

    @ApiProperty({
        type: Number,
        description: 'Date of month when the expense was incured'
    })
    @Column('int')
    num_date: number;

    @ApiProperty({
        type: Number,
        description: 'Number of month when the expense was incured'
    })
    @Column('int')
    month: number;

    @ApiProperty({
        type: Number,
        description: 'Year when the expense was incured'
    })
    @Column('int')
    year: number;

    @ApiProperty({
        type: Number,
        description: 'Number week of year',
    })
    @Column('int',{
        default:1
    })
    week: number;

    @ApiProperty({
        type: String,
        description: 'Name of the day when the expense was incured'
    })
    @Column('text')
    day_name: string;

    @ApiProperty({
        type: Number,
        description: 'Number of installments payment',
        default: 1
    })
    @Column('int',{
        default: 1
    })
    installments: number;

    @ApiProperty({
        type: Number,
        description: 'Number of installments paid',
        default: 1
    })
    @Column('int',{
        default: 1
    })
    installments_paid: number;

    // @ApiProperty({
    //     type: Boolean,
    //     description: 'Expense will be a monthly or not',
    //     default: false
    // })
    // @Column('bool',{
    //     default: false
    // })
    // monthly: boolean;

    // @ApiProperty({
    //     type: Boolean,
    //     description: 'Expense will be a yearly or not',
    //     default: false
    // })
    // @Column('bool',{
    //     default: false
    // })
    // yearly: boolean;

    // @ApiProperty({
    //     type: Boolean,
    //     description: 'The expense will be made forever or not',
    //     default: false
    // })
    // @Column('bool',{
    //     default:false
    // })
    // forever: boolean;

    // @ApiProperty({
    //     type: Number,
    //     description: 'Number of months to be spent',
    //     default: 0
    // })
    // @Column('int',{
    //     default:1
    // })
    // num_months: number;


    // @ApiProperty({
    //     type: ()=>Account,
    //     description: 'Account that made the expense',
    // })
    @ManyToOne(
        ()=> Account,
        account => account.expenses,
        {eager:true}
    )
    account: Account;

    // @ApiProperty({
    //     type: User,
    //     description: 'User that made the expense',
    // })
    @ManyToOne(
        ()=>User,
        user => user.expenses,
        {eager:true}
    )
    user: User;

    // @ApiProperty({
    //     type: Category,
    //     description: 'Category to which the expense belongs',
    // })
    @ManyToOne(
        ()=>Category,
        category => category.expenses,
        {eager:true}
    )
    category: Category;

    // @ApiProperty({
    //     type: Subcategory,
    //     description: 'Subcategory to which the expense belongs',
    // })
    @ManyToOne(
        ()=>Subcategory,
        subcategory => subcategory.expenses,
        {eager:true}
    )
    subcategory: Subcategory;
}
