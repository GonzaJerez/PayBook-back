import { ApiProperty } from '@nestjs/swagger';
import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm'

import { Account } from '../../accounts/entities/account.entity';
import { ValidRoles } from '../../auth/interfaces';
import {Expense} from '../../expenses/entities/expense.entity';

@Entity('users')
export class User {

    @ApiProperty({
        example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
        description: 'Unique identifier',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id:         string;

    @ApiProperty({
        example: 'test@gmail.com',
        description: 'User email',
        uniqueItems: true
    })
    @Column('text',{
        unique:true
    })
    email:      string;

    @ApiProperty({
        example: '$2b$10$txEVmlM4Brj12k0hLHQOZ.9SMPu8l7nOFS8VH7Qt3Jn2eaUkFE3QC',
        description: 'User password, must have a uppercase, lowercase letter and a number ',
    })
    @Column('text',{
        select: false
    })
    password?:   string;

    @ApiProperty({
        example: 'Gonzalo Jerez',
        description: 'User name',
    })
    @Column('text')
    fullName:   string;

    @ApiProperty({
        type: 'boolean',
        default: true,
        description: 'Prop to identifier active or inactive users',
    })
    @Column('bool',{
        default: true
    })
    isActive:   boolean;
    
    @ApiProperty({
        example: ['admin','user'],
        default: ['user'],
        description: 'Role for the permissions on the app',
    })
    @Column('text',{
        array:true,
        default: [ValidRoles.USER],
    })
    roles:      ValidRoles[];

    @ManyToMany(
        ()=>Account,
        account => account.users,
        {cascade:true}
    )
    @JoinTable({name:'users_accounts'})
    accounts: Account[]

    @OneToMany(
        ()=>Account,
        account => account.creator_user,
    )
    accounts_owner?: Account[]

    @OneToMany(
        ()=>Account,
        account => account.admin_user,
    )
    accounts_admin?: Account[]

    @ApiProperty({
        type: [Expense],
        description: 'Expenses by this user'
    })
    @OneToMany(
        ()=> Expense,
        expenses => expenses.user,
        // {cascade:true}
    )
    expenses?: Expense[];
}
