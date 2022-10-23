import { IsString } from "class-validator";

export class LoginGoogleDto {

    @IsString()
    tokenGoogle:      string;

}