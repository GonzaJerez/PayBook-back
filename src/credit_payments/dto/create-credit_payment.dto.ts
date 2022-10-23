import {Type} from "class-transformer";
import {IsPositive, IsString, Length, Min} from "class-validator";
import {Account} from "src/accounts/entities/account.entity";
import {Category} from "src/categories/entities/category.entity";
import {Expense} from "src/expenses/entities/expense.entity";
import {Subcategory} from "src/subcategories/entities/subcategory.entity";
import {User} from "src/users/entities/user.entity";

export class CreateCreditPaymentDto {

    @IsPositive()
    @Min(1)
    @Type(()=>Number)
    installments: number;

    @IsString()
    @Length(0, 30)
    name: string;

    account: Account;

    user: User;

    category: Category;

    subcategory: Subcategory;

    expense: Expense;
}
