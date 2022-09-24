import { IsArray, IsString, MinLength } from "class-validator";

export class PushOutAccountDto {
    
    // @MinLength(1)
    @IsString({each:true})
    @IsArray()
    idUsers: string[]
}