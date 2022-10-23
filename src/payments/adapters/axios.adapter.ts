import {Injectable} from "@nestjs/common";
import axios, {AxiosInstance} from "axios";
import {CreatePaymentDto} from "../dto/create-payment.dto";
import {HttpAdapter} from "../interfaces/http-adapter.interface";

@Injectable()
export class AxiosAdapter implements HttpAdapter {
    
    private axios:AxiosInstance = axios
    
    async get<T>(url: string, MPToken:string): Promise<T> {
        try {
            const {data} = await this.axios(url,{
                headers: {
                    Authorization: `Bearer ${MPToken}`
                }
            })
            return data
        } catch (error) {
            console.log(error);
            throw new Error(`Error in AxiosAdapter`)
        }
    }

    
    async post<T>(url: string, body:CreatePaymentDto, MPToken:string): Promise<T> {
        try {
            const {data} = await this.axios.post(url, body,{
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${MPToken}`
                }
            })
            return data
        } catch (error) {
            console.log(error);
            throw new Error(`Error in AxiosAdapter`)
        }
    }
    
}