import {CreateExpenseDto} from "../dto/create-expense.dto";
import {UpdateExpenseDto} from "../dto/update-expense.dto";

export const mockToCreateExpense = (categoryId:string, subcategoryId:string):CreateExpenseDto => {
    return {
        amount: 1500,
        description: 'Expense mock',
        categoryId,
        subcategoryId,
        complete_date: Date.now()
    }
}

export const mockToCreateExpenseNegativeAmount = (categoryId:string, subcategoryId:string):CreateExpenseDto => {
    return {
        amount: -500,
        description: 'Expense mock',
        categoryId,
        subcategoryId,
        complete_date: Date.now()
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