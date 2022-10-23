import {CreatePaymentDto} from "../dto/create-payment.dto"

export interface HttpAdapter {
    get<T>(url:string,token:string):Promise<T>
    post<T>(url:string,body:CreatePaymentDto,token:string):Promise<T>
}