import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAccountDto {

    @IsString()
    @MinLength(3)
    @MaxLength(30)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(80)
    description: string;
}
