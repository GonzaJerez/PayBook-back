import { CreateUserDto } from "../dto/create-user.dto"
import { LoginUserDto } from "../dto/login-user.dto"
import { UpdateUserDto } from "../dto/update-user.dto"
import { User } from "../entities/user.entity"
import { ValidRoles } from "../interfaces"

export const mockAdminUser:CreateUserDto = {
    email: "admin@gmail.com",
    password: "Abc123",
    fullName: "Admin"
}

export const mockAdminUser2:CreateUserDto = {
    email: "admin2@gmail.com",
    password: "Abc123",
    fullName: "Admin2"
}

export const mockCreateUser:CreateUserDto = {
    email: 'test@gmail.com',
    fullName: 'Test',
    password: 'Abc123'
}

export const mockCreateUser2:CreateUserDto = {
    email: 'test2@gmail.com',
    fullName: 'Test2',
    password: 'Abc123'
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