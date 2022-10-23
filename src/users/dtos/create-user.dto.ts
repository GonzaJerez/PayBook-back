import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {

    @ApiProperty({
        example: 'test@gmail.com',
        description: 'User email'
    })
    @IsString()
    @IsEmail()
    email:      string;

    @ApiProperty({
        example: 'Abcd1234',
        description: 'User password, must have a uppercase, lowercase letter and a number'
    })
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
            message: 'La contraseña debe tener por lo menos una mayúscula, una minúscula, una letra y un número'
    })
    password:   string;

    @ApiProperty({
        example: 'Gonzalo Jerez',
        description: 'User name'
    })
    @IsString()
    @MinLength(1)
    @MaxLength(30)
    fullName:   string;
}

