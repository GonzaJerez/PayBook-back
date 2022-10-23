import {CreateExpenseDto} from "../dto/create-expense.dto";
import {PayInstallmentDto} from "../dto/pay-installment.dto";
import {UpdateExpenseDto} from "../dto/update-expense.dto";

export const mockToCreateExpense = (categoryId:string, subcategoryId:string):CreateExpenseDto => {
    return {
        amount: 1500,
        description: 'Expense mock',
        categoryId,
        subcategoryId,
        complete_date: Date.now(),
        installments: 1,
    }
}

export const mockToCreateExpenseWithInstallments = (categoryId:string, subcategoryId:string):CreateExpenseDto => {
    return {
        amount: 1500,
        description: 'Expense mock',
        categoryId,
        subcategoryId,
        complete_date: Date.now(),
        installments: 2,
        name_credit_payment: 'Televisor Samsung 52"'
    }
}

export const mockToPayInstallment:PayInstallmentDto = {
        amount: 1500,
        description: 'Expense mock',
        complete_date: Date.now(),
}

export const mockToCreateExpenseNegativeAmount = (categoryId:string, subcategoryId:string):CreateExpenseDto => {
    return {
        amount: -500,
        description: 'Expense mock',
        categoryId,
        subcategoryId,
        complete_date: Date.now(),
        installments: 1
    }
}

export const mockToCreateExpenseWithoutAmount = (categoryId:string, subcategoryId:string) => {
    return {
        description: 'Expense mock',
        complete_date: Date.now(),
        categoryId,
        subcategoryId
    }
}

export const mockToUpdateExpense = (categoryId:string, subcategoryId:string):UpdateExpenseDto => {
    return {
        amount: 1200,
        description: 'Updated expense',
        categoryId,
        subcategoryId,
        complete_date: Date.now()
    }
}