import {INestApplication, ValidationPipe} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";
import * as request from 'supertest';

import {Account} from "../src/accounts/entities/account.entity";
import {AppModule} from "../src/app.module";
import {Category} from "../src/categories/entities/category.entity";
import {Expense} from "../src/expenses/entities/expense.entity";
import {Subcategory} from "../src/subcategories/entities/subcategory.entity";
import {UserWithToken} from "../src/users/interfaces/UserWithToken.interface";
import {mockToCreateExpense, mockToCreateExpenseNegativeAmount, mockToCreateExpenseWithoutAmount, mockToUpdateExpense} from "../src/expenses/mocks/expensesMocks";
import {fakeUUID} from "../src/users/mocks/userMocks";


describe('ExpensesController (e2e)', () => {
    let app: INestApplication;
    let seedUsers: UserWithToken[]
    let seedAdmin: UserWithToken
    const BASE_URL='/accounts'
    let COMPLEMENT_URL='/expenses'
  
    let userTest1:UserWithToken;
    let userTest2:UserWithToken;
    let accountTest1:Account;
    let accountTest2:Account;
    let categoryTest1:Category;
    let categoryTest2:Category;
    let subcategoryTest1:Subcategory;
    let expenseTest1:Expense;
  
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule]
      }).compile();

      process.env.NODE_ENV = 'test'
  
      app = moduleFixture.createNestApplication();
  
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true
        })
      )
  
      await app.init();
    });
  
    afterAll(async () => {
      await app.close();
    })
  
    beforeEach(async()=>{
      await request(app.getHttpServer())
        .get('/seed')
        .expect(200)
        .then(res => {
          seedUsers = res.body.users
          seedAdmin = res.body.admin
  
          userTest1 = seedUsers[0]
          userTest2 = seedUsers[1]
          accountTest1 = userTest1.accounts[0]
          accountTest2 = userTest1.accounts[1]
          categoryTest1 = accountTest1.categories[0]
          categoryTest2 = accountTest1.categories[1]
          subcategoryTest1 = categoryTest1.subcategories[0]
          expenseTest1 = accountTest1.expenses[0]
        })
    })
    
    describe('create - /accounts/{:idAccount}/expenses (POST)', () => {

        it('should create a new expense', async()=>{
        const mockToCreateExpenseTest = mockToCreateExpense(categoryTest1.id, subcategoryTest1.id)

        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseTest)
            .expect(201)
            .then(res =>{
            delete mockToCreateExpenseTest.categoryId
            delete mockToCreateExpenseTest.subcategoryId
            
            expect(res.body).toMatchObject(mockToCreateExpenseTest)
            expect(res.body.category.id).toBe(categoryTest1.id)
            expect(res.body.subcategory.id).toBe(subcategoryTest1.id)
            expect(res.body.account.id).toBe(accountTest1.id)
            expect(res.body.user.id).toBe(userTest1.id)
            expect(typeof res.body.id).toBe('string')
            })
        })
        
        it('should return a BadRequest error when doesnt exist amount', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseWithoutAmount(categoryTest1.id, subcategoryTest1.id))
            .expect(400)
        })

        it('should return a BadRequest error when amount is negative', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseNegativeAmount(categoryTest1.id, subcategoryTest1.id))
            .expect(400)
        })

        it('should return a Notfound error when account doesnt exist', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseNegativeAmount(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a BadRequest error when subcategory doesnt exist in category', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest2.id, subcategoryTest1.id))
            .expect(400)
        })

        it('should return a Notfound error when accountId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/123456789${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseNegativeAmount(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a BadRequest error when categoryId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseNegativeAmount('123456789', subcategoryTest1.id))
            .expect(400)
        })

        it('should return a BadRequest error when subcategoryId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseNegativeAmount(categoryTest1.id, '123456789'))
            .expect(400)
        })

        it('should return a Unauthorized error when user is not authenticated', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(401)
        })

        it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest2.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a NotFound error when user try to access to deleted account',async()=>{

        // Elimina cuenta primero
        await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a NotFound error when user try to use deleted category',async()=>{

        // Elimino categoria primero
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a NotFound error when user try to use deleted subcategory',async()=>{

        // Elimino categoria primero
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}/subcategories/${subcategoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

    })

    describe('findAllOnMonth - /accounts/{:idAccount}/expenses (POST)', () => {

        it('should return all expenses in account on actual month and amounts', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then(res =>{
            expect(typeof res.body.totalAmountOnMonth).toBe('number')
            expect(typeof res.body.totalAmountOnWeek).toBe('number')
            expect(typeof res.body.totalAmountOnDay).toBe('number')
            })
        })

        it('should return a Notfound error when account doesnt exist', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Notfound error when accountId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/123456789${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Unauthorized error when user is not authenticated', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .expect(401)
        })

        it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest2.token,{type:'bearer'})
            .expect(404)
        })

        // it('should return a NotFound error when user try to access to deleted account',async()=>{

        //   // Elimina cuenta primero
        //   await request(app.getHttpServer())
        //     .delete(`/accounts/${accountTest1.id}`)
        //     .auth(userTest1.token,{type:'bearer'})

        //   await request(app.getHttpServer())
        //     .get(`${BASE_URL}/${accountTest1}${COMPLEMENT_URL}`)
        //     .auth(userTest1.token,{type:'bearer'})
        //     .expect(404)
        // })

    })

    describe('statistics - /accounts/{:idAccount}/expenses/statistics (POST)', () => {

        beforeAll(()=>{
        COMPLEMENT_URL='/expenses/statistics'
        })

        afterAll(()=>{
        COMPLEMENT_URL='/expenses'
        })

        it('should return expenses on account in actual month and amounts when empty querys', async()=>{
        const currentDate = new Date()

        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then(res=>{
            expect(typeof res.body.totalAmount).toBe('number')
            expect(Object.keys(res.body.totalAmountsForCategories).length).toBeGreaterThanOrEqual(1)
            expect(Object.keys(res.body.totalAmountsForSubcategories)).toHaveLength(0)
            res.body.expenses.forEach( (expense:Expense) =>{
                expect(expense.month).toBe(currentDate.getMonth() + 1)
                expect(expense.year).toBe(currentDate.getFullYear())
            })
            })
        })

        it('should return a expense on account by filters and total amounts', async()=>{
        const MAX_AMOUNT = 1600;
        const MONTHLY = 'false';
        const DAY_NAME = 'Martes'

        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}?categories=${categoryTest1.id}&max_amount=${MAX_AMOUNT}&monthly=${MONTHLY}&day_name=${DAY_NAME}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then(res=>{
            expect(typeof res.body.totalAmount).toBe('number')
            expect(Object.keys(res.body.totalAmountsForCategories)).toHaveLength(0)
            expect(Object.keys(res.body.totalAmountsForSubcategories).length).toBeGreaterThanOrEqual(1)
            res.body.expenses.forEach( (expense:Expense) =>{
                expect(expense.category.id).toBe(categoryTest1.id)
                expect(expense.amount).toBeLessThan(MAX_AMOUNT)
                expect(expense.monthly).toBeFalsy()
                expect(expense.day_name).toBe(DAY_NAME)
            })
            })
        })

        it('should return expenses on account by filters and total amounts', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}?categories=${categoryTest1.id}+${categoryTest2.id}&month=0`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then(res=>{
            expect(typeof res.body.totalAmount).toBe('number')
            expect(res.body).toHaveProperty('totalAmount')
            expect(Object.keys(res.body.totalAmountsForSubcategories).length).toBe(0)
            expect(Object.keys(res.body.totalAmountsForCategories).length).toBeGreaterThanOrEqual(1)
            res.body.expenses.forEach( (expense:Expense) =>{
                expect([categoryTest1.id,categoryTest2.id].includes(expense.category.id)).toBeTruthy()
            })
            })
        })

        it('should return a BadRequest error when some idCategory is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}?categories=${categoryTest1.id}+123456789`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(400)
        })

        it('should return a Notfound error when account doesnt exist', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Notfound error when accountId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/123456789${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Unauthorized error when user is not authenticated', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .expect(401)
        })

        it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest2.token,{type:'bearer'})
            .expect(404)
        })

    })

    describe('findOne - /accounts/{:idAccount}/expenses/{:id} (POST)', () => {

        it('should return a Notfound error when account doesnt exist', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a BadRequest error when id is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(400)
        })

        it('should return a Notfound error when expense doesnt exist', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Notfound error when accountId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/123456789${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Unauthorized error when user is not authenticated', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .expect(401)
        })

        it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a NotFound error when user try to access to deleted account',async()=>{

        // Elimina cuenta primero
        await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Forbidden error when expense is from another account', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest2.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(403)
        })

        it('should return a expense on account', async()=>{
        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then(res =>{
            expect(res.body.id).toBe(expenseTest1.id)
            })
        })

    })

    describe('update - /accounts/{:idAccount}/expenses/{:id} (POST)', () => {

        it('should return a Unauthorized error when user is not authenticated', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(401)
        })

        it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a Notfound error when accountId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/123456789${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a Notfound error when account doesnt exist', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a BadRequest error when id is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(400)
        })

        it('should return a Notfound error when expense doesnt exist', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a BadRequest error when categoryId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense('123456789', subcategoryTest1.id))
            .expect(400)
        })

        it('should return a BadRequest error when subcategoryId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, '123456789'))
            .expect(400)
        })

        it('should return a NotFound error when user try to access to deleted account',async()=>{

        // Elimina cuenta primero
        await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a NotFound error when user try to use deleted category',async()=>{

        // Elimino categoria primero
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a NotFound error when user try to use deleted subcategory',async()=>{

        // Elimino categoria primero
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}/subcategories/${subcategoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(404)
        })

        it('should return a Forbidden error when user which doesnt made the expense and non-admin try to update expense',async()=>{
        
        // Agrego userTest2 a accountTest1 primero
        await request(app.getHttpServer())
            .post(`${BASE_URL}/join`)
            .auth(userTest2.token,{type:'bearer'})
            .send({access_key: accountTest1.access_key})
            .expect(200)

        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .send(mockToUpdateExpense(categoryTest1.id, subcategoryTest1.id))
            .expect(403)
        })

        it('should return a BadRequest error when subcategory doesnt exist in category', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToUpdateExpense(categoryTest2.id, subcategoryTest1.id))
            .expect(400)
        })

        it('should return a BadRequest error when amount is negative', async()=>{
        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateExpenseNegativeAmount(categoryTest1.id, subcategoryTest1.id))
            .expect(400)
        })

        it('should return an update expense', async()=>{
        const mockToUpdate = mockToUpdateExpense(categoryTest1.id, subcategoryTest1.id)

        await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToUpdate)
            .expect(200)
            .then( res => {
            delete mockToUpdate.categoryId
            delete mockToUpdate.subcategoryId

            expect(res.body.id).toBe(expenseTest1.id)
            expect(res.body.category.id).toBe(categoryTest1.id)
            expect(res.body.subcategory.id).toBe(subcategoryTest1.id)
            expect(res.body).toMatchObject(mockToUpdate)
            })
        })
    
    })

    describe('delete - /accounts/{:idAccount}/expenses/{:id} (POST)', () => {

        it('should return a Notfound error when accountId is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/123456789${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Notfound error when account doesnt exist', async()=>{
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a BadRequest error when id is not a valid uuid', async()=>{
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(400)
        })

        it('should return a Notfound error when expense doesnt exist', async()=>{
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Unauthorized error when user is not authenticated', async()=>{
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .expect(401)
        })

        it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a Forbidden error when user which doesnt made the expense and non-admin try to delete expense',async()=>{
        
        // Agrego userTest2 a accountTest1 primero
        await request(app.getHttpServer())
            .post(`${BASE_URL}/join`)
            .auth(userTest2.token,{type:'bearer'})
            .send({access_key: accountTest1.access_key})
            .expect(200)

        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .expect(403)
        })

        it('should return a NotFound error when user try to access to deleted account',async()=>{

        // Elimina cuenta primero
        await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

        it('should return a deleted expense', async()=>{
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then( res =>{
            expect(res.body.ok).toBeTruthy()
            expect(typeof res.body.message).toBe('string')
            expect(res.body).toHaveProperty('expense')
            })

        await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${expenseTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })

    })

    })