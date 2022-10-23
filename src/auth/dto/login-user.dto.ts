import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class LoginUserDto {

    @IsString()
    @IsEmail()
    email:      string;

    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La contraseña debe tener por lo menos una mayúscula, una minúscula, una letra y un número'
    })
    password:   string;

}