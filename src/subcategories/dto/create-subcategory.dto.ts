import {IsString, Length} from "class-validator";

export class CreateSubcategoryDto {
    @IsString()
    @Length(1,30)
    name:   string;
}
