import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../auth/entities/user.entity";
import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('accounts')
export class Account {

    @ApiProperty({
        example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
        description: 'Unique identifier',
        uniqueItems: true
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
    @Column('text',{
        default:''
    })
    description: string;

    @ApiProperty({
        example: '8c0b9bf0',
        description: 'Key to access to an account',
        uniqueItems: true
    })
    @Column('text',{
        unique: true,
    })
    access_key: string;

    @ApiProperty({
        default: true,
        description: 'Prop to identifier active or inactive accounts',
    })
    @Column('bool',{
        default: true
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Users to have access to this account',
    })
    @ManyToMany(
        ()=> User,
        user => user.accounts
    )
    users: User[];

    @ApiProperty({
        description: 'User who created the account',
    })
    @ManyToOne(
        ()=> User,
        user => user.accounts_owner
    )
    creator_user: User;

    @ApiProperty({
        description: 'Users admin the account',
    })
    @ManyToOne(
        ()=> User,
        user => user.accounts_admin
    )
    admin_user: User;
}