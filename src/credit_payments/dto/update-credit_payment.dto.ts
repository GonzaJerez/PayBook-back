import {Type} from 'class-transformer';
import {IsOptional, IsPositive, IsString, Length, Min} from 'class-validator';

export class UpdateCreditPaymentDto {

  @IsPositive()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  installments?: number;

  @IsString()
  @Length(0, 30)
  @IsOptional()
  name?: string;
}
