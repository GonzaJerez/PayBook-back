import { IsString, Length, MaxLength, MinLength } from "class-validator";

export class JoinAccountDto {

    @IsString()
    @Length(8,8)
    access_key: string;
}