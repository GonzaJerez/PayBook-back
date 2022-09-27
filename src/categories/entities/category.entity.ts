import {ApiProperty} from "@nestjs/swagger";
import {Account} from "../../accounts/entities/account.entity";
import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Subcategory} from "../../subcategories/entities/subcategory.entity";

@Entity('categories')
export class Category {

    @ApiProperty({
        example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
        description: 'Unique identifier',
        uniqueItems: true
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
    @Column('bool',{
        default: true
    })
    isActive: boolean;

    @ApiProperty({
        type: Account,
        description: 'Account to this category belong'
    })
    @ManyToOne(
        ()=>Account,
        account => account.categories,
    )
    account: Account

    @ApiProperty({
        type: [Subcategory],
        description: 'Subcategories which belongs category'
    })
    @OneToMany(
        ()=>Subcategory,
        subcategory => subcategory.category,
        {cascade:true,eager:true}
    )
    subcategories?: Subcategory[]
}
