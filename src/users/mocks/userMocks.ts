import { UpdateUserDto } from "../dtos/update-user.dto"
import {CreateUserDto} from "../dtos/create-user.dto"
import {LoginUserDto} from "../../auth/dto/login-user.dto"
import {PASSWORD_TEST, user1} from "../../seed/mocks/seedMock"

export const mockToCreateUser:CreateUserDto = {
    email: 'user-test@gmail.com',
    fullName: 'Test1',
    password: PASSWORD_TEST
}

export const mockToCreateUser2:CreateUserDto = {
    email: 'user-test2@gmail.com',
    fullName: 'Test1',
    password: PASSWORD_TEST
}

export const mockToCreateAdmin:CreateUserDto = {
    email: "admin-test@gmail.com",
    password: PASSWORD_TEST,
    fullName: "Admin"
}

export const fakeUUID = '64cb3f76-b1cc-4add-8af7-584c5cee55b7'

// export const mockCompleteUser:User = {
//     id: '64cb3f76-b1cc-4add-8af7-584c5cee55b7',
//     email: 'test@gmail.com',
//     fullName: 'Test',
//     roles: [ValidRoles.USER],
//     isActive: true
// }

export const mockUserToUpdate:UpdateUserDto = {
    fullName: 'Testing'
}

export const mockUser1ToLogin:LoginUserDto = {
    email: user1.email,
    password: PASSWORD_TEST
}

// export const mockAdmin1ToLogin:LoginUserDto = {
//     email: admin1.email,
//     password: PASSWORD_TEST
// }