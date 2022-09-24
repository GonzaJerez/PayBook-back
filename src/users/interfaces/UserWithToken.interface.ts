import {User} from "../entities/user.entity";

export interface UserWithToken extends User{
    token: string
}