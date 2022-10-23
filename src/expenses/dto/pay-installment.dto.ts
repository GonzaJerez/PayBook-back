import {Type} from "class-transformer";
import {IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length, Min} from "class-validator";

export class PayInstallmentDto {
    
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
}
