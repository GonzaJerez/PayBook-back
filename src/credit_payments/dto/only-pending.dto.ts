import {Type} from "class-transformer";
import {IsOptional} from "class-validator";


export class OnlyPendingDto {

  @IsOptional()
  @Type(()=>Boolean)
  pending: true;

}