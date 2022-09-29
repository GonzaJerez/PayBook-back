import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsOptional, IsPositive, IsString, isString, IsUUID, Max, Min } from "class-validator";
import {PaginationDto} from "../../common/dtos/pagination.dto";
import {daysNames} from "../utils/days-names";

export class FiltersExpensesDto{

    @IsOptional()
    @IsPositive()
    // Transformar
    @Type(()=> Number)
    min_amount?: number;

    @IsOptional()
    @IsPositive()
    @Type(()=>Number)
    max_amount?: number;

    @IsOptional()
    @Min(1)
    @Max(31)
    @Type(()=>Number)
    num_date?: number;

    @IsOptional()
    @Min(0)
    @Max(12)
    @Type(()=>Number)
    month?: number;

    @IsOptional()
    @Min(0)
    @Type(()=>Number)
    year?: number;

    @IsOptional()
    @IsIn(daysNames)
    day_name?: string;

    @IsOptional()
    monthly?: boolean;

    @IsOptional()
    yearly?: boolean;

    @IsOptional()
    users?: string

    @IsOptional()
    categories?: string

    @IsOptional()
    subcategories?: string
}