import {IsEmail, IsString} from "class-validator";

export class CreatePaymentDto {

    @IsString()
    preapproval_plan_id: string;

    @IsEmail()
    payer_email: string;

    @IsString()
    card_token_id: string;
}
