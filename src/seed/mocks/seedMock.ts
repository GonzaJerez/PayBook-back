import * as bcrypt from 'bcrypt'
import {CreateAccountDto} from 'src/accounts/dto/create-account.dto'
import {CreateUserDto} from "src/users/dtos/create-user.dto"

export const PASSWORD_TEST = 'Abc123'

export const adminTest:CreateUserDto = {
    email: "admin@gmail.com",
    password: bcrypt.hashSync(PASSWORD_TEST, 10),
    fullName: "Admin"
}

export const user1:CreateUserDto = {
    email: 'test@gmail.com',
    fullName: 'Test',
    password: bcrypt.hashSync(PASSWORD_TEST, 10),
}

export const user2:CreateUserDto = {
    email: 'test2@gmail.com',
    fullName: 'Test2',
    password: bcrypt.hashSync(PASSWORD_TEST, 10),
}

export const user3:CreateUserDto = {
    email: 'test3@gmail.com',
    fullName: 'Test3',
    password: bcrypt.hashSync(PASSWORD_TEST, 10),
}

export const account1:CreateAccountDto = {
    name: 'testAccount',
    description: 'This is an description',
    max_num_users: 2,
}

export const account2:CreateAccountDto = {
    name: 'testAccount2',
    description: 'This is an description',
    max_num_users: 1
}

export const account3:CreateAccountDto = {
    name: 'testAccount3',
    description: 'This is an description',
}
