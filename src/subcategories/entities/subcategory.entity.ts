import {ApiProperty} from "@nestjs/swagger";
import {Category} from "../../categories/entities/category.entity";
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

@Entity('subcategories')
export class Subcategory{

    @ApiProperty({
        example: '143a3eea-edc9-409d-b448-750ce50b9bf0',
        description: 'Unique identifier',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        example: 'Expensas',
        description: 'Name of subcategory',
    })
    @Column('text')
    name: string;

    @ApiProperty({
        default: true,
        description: 'Prop to identifier active or inactive subcategory',
    })
    @Column('bool',{
        default: true
    })
    isActive: boolean;

    @ApiProperty({
        type: Category,
        description: 'Category to this subcategory belongs'
    })
    @ManyToOne(
        ()=> Category,
        category => category.subcategories
    )
    category: Category
}
