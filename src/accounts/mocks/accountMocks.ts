import { CreateAccountDto } from "../dto/create-account.dto"
import { UpdateAccountDto } from "../dto/update-account.dto"

export const mockToCreateAccount:CreateAccountDto = {
    name: 'testAccount',
    description: 'This is an description',
}

export const mockToCreateSecondAccount:CreateAccountDto = {
    name: 'testAccount2',
    description: 'This is an description',
}

export const mockToUpdateAccount:UpdateAccountDto = {
    name: 'TestAccountUpdated'
}

export const mockExampleUUID = '919b61bc-155a-4f1b-a9b3-89bd5b1a8dbf'