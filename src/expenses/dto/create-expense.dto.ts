import {Type} from "class-transformer";
import {IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length, Min} from "class-validator";

export class CreateExpenseDto {
    
    @IsPositive()
    @Min(1)
    @Type(()=>Number)
    amount: number;

    @IsNumber()
    @IsPositive()
    complete_date: number;
    
    @IsString()
    @IsOptional()
    @Length(0, 50)
    description?: string;

    @IsPositive()
    @Min(1)
    @IsOptional()
    @Type(()=>Number)
    installments?: number;

    @IsString()
    @IsOptional()
    @Length(0, 30)
    name_credit_payment?: string;

    @IsUUID()
    categoryId: string;

    @IsUUID()
    subcategoryId: string;
}
