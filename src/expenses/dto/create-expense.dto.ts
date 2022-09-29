import {IsBoolean, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length, Min} from "class-validator";

export class CreateExpenseDto {
    
    @IsNumber({maxDecimalPlaces:2})
    @IsPositive()
    @Min(1)
    amount: number;

    @IsNumber()
    @IsPositive()
    complete_date: number;
    
    @IsString()
    @IsOptional()
    @Length(0, 50)
    description?: string;

    @IsBoolean()
    @IsOptional()
    monthly?: boolean;

    @IsBoolean()
    @IsOptional()
    yearly?: boolean;

    @IsBoolean()
    @IsOptional()
    forever?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(1)
    num_months?: number;

    @IsUUID()
    categoryId: string;

    @IsUUID()
    subcategoryId: string;
}
