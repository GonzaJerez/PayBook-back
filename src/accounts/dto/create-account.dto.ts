import { Type } from "class-transformer";
import { IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateAccountDto {

    @IsString()
    @MinLength(3)
    @MaxLength(30)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(80)
    description?: string;
    
    @IsOptional()
    @Min(1)
    @Max(10)
    @Type(()=>Number)
    max_num_users?: number;
}
