import {ApiProperty} from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateAccountDto {

    @ApiProperty({
        example: 'Cuenta personal',
        description: 'Name of account'
    })
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    name: string;

    @ApiProperty({
        example: 'Description of account',
        description: 'Description of account'
    })
    @IsString()
    @IsOptional()
    @MaxLength(80)
    description?: string;
    
    @ApiProperty({
        example: 5,
        description: 'max cant users'
    })
    @IsOptional()
    @Min(1)
    @Max(10)
    @Type(()=>Number)
    max_num_users?: number;
}
