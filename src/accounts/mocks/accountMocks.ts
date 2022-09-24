import {CreateUserDto} from "src/users/dtos/create-user.dto"
import { mockCompleteUser } from "../../users/mocks/userMocks"
import { CreateAccountDto } from "../dto/create-account.dto"
import { UpdateAccountDto } from "../dto/update-account.dto"
import { Account } from "../entities/account.entity"

export const mockToCreateAccount:CreateAccountDto = {
    name: 'testAccount',
    description: 'This is an description',
    max_num_users: 2,
}

export const mockToCreateSecondAccount:CreateAccountDto = {
    name: 'testAccount2',
    description: 'This is an description',
}

export const mockToCreateThirdAccount:CreateAccountDto = {
    name: 'testAccount3',
    description: 'This is an description',
}

export const mockToUpdateAccount:UpdateAccountDto = {
    name: 'TestAccountUpdated'
}

export const mockExampleUUID = '919b61bc-155a-4f1b-a9b3-89bd5b1a8dbf'

export const mockCompleteAccount:Account = {
    name: 'testAccount',
    description: 'This is an description',
    max_num_users: 10,
    access_key: 'f12f42g5',
    admin_user: mockCompleteUser,
    creator_user: mockCompleteUser,
    id: mockExampleUUID,
    isActive: true,
    users: [mockCompleteUser]
}

export const mockAdminUserOnAccountTest:CreateUserDto = {
    email: "admin-account@gmail.com",
    password: "Abc123",
    fullName: "Admin"
}

export const mockCreateUserOnAccountTest:CreateUserDto = {
    email: 'test-account@gmail.com',
    fullName: 'Test',
    password: 'Abc123'
}

export const mockCreateUser2OnAccountTest:CreateUserDto = {
    email: 'test2-account@gmail.com',
    fullName: 'Test2',
    password: 'Abc123'
}

export const mockCreateUser3OnAccountTest:CreateUserDto = {
    email: 'test3-account@gmail.com',
    fullName: 'Test3',
    password: 'Abc123'
}