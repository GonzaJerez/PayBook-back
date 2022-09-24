import * as bcrypt from 'bcrypt'

import { CreateUserDto } from "../dtos/create-user.dto"
import { LoginUserDto } from "../../auth/dto/login-user.dto"
import { UpdateUserDto } from "../dtos/update-user.dto"
import { User } from "../entities/user.entity"
import { ValidRoles } from "../../auth/interfaces"

export const mockAdminUser:CreateUserDto = {
    email: "admin@gmail.com",
    password: bcrypt.hashSync('Abc123', 10),
    fullName: "Admin"
}

export const mockAdminUser2:CreateUserDto = {
    email: "admin2@gmail.com",
    password: bcrypt.hashSync('Abc123', 10),
    fullName: "Admin2"
}

export const mockCreateUser:CreateUserDto = {
    email: 'test@gmail.com',
    fullName: 'Test',
    password: bcrypt.hashSync('Abc123', 10),
}

export const mockCreateUser2:CreateUserDto = {
    email: 'test2@gmail.com',
    fullName: 'Test2',
    password: bcrypt.hashSync('Abc123', 10),
}

export const mockCreateUser3:CreateUserDto = {
    email: 'test3@gmail.com',
    fullName: 'Test3',
    password: bcrypt.hashSync('Abc123', 10),
}

export const mockCompleteUser:User = {
    id: '64cb3f76-b1cc-4add-8af7-584c5cee55b7',
    email: 'test@gmail.com',
    fullName: 'Test',
    roles: [ValidRoles.USER],
    isActive: true
}

export const mockUserToUpdate:UpdateUserDto = {
    fullName: 'Testing'
}

export const mockUserToLogin:LoginUserDto = {
    email: mockCreateUser.email,
    password: mockCreateUser.password
}