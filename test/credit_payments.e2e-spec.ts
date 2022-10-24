import {INestApplication, ValidationPipe} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";
import * as request from 'supertest';

import {Account} from "../src/accounts/entities/account.entity";
import {AppModule} from "../src/app.module";
import {Category} from "../src/categories/entities/category.entity";
import {Expense} from "../src/expenses/entities/expense.entity";
import {Subcategory} from "../src/subcategories/entities/subcategory.entity";
import {UserWithToken} from "../src/users/interfaces/UserWithToken.interface";
import {mockToCreateExpense, mockToCreateExpenseNegativeAmount, mockToCreateExpenseWithInstallments, mockToCreateExpenseWithoutAmount, mockToPayInstallment, mockToUpdateExpense} from "../src/expenses/mocks/expensesMocks";
import {fakeUUID} from "../src/users/mocks/userMocks";
import {daysNames} from "../src/expenses/utils/days-names";
import {CreditPayment} from "src/credit_payments/entities/credit_payment.entity";


describe('CreditPaymentsController (e2e)', () => {
  let app: INestApplication;
  let seedUsers: UserWithToken[]
  let seedAdmin: UserWithToken
  const BASE_URL = '/accounts'
  let COMPLEMENT_URL = '/credit-payments'

  let userTest1: UserWithToken;
  let userTest2: UserWithToken;
  let accountTest1: Account;
  let categoryTest1: Category;
  let subcategoryTest1: Subcategory;
  let expenseTest1: Expense;

  let mockToCreateExpenseTest;
  let creditPaymentCreated;

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

  beforeEach(async () => {
    await request(app.getHttpServer())
      .get('/seed')
      .expect(200)
      .then(res => {
        seedUsers = res.body.users
        seedAdmin = res.body.admin

        userTest1 = seedUsers[0]
        userTest2 = seedUsers[1]
        accountTest1 = userTest1.accounts[0]
        categoryTest1 = accountTest1.categories[0]
        subcategoryTest1 = categoryTest1.subcategories[0]
      })



    mockToCreateExpenseTest = mockToCreateExpenseWithInstallments(categoryTest1.id, subcategoryTest1.id)
    await request(app.getHttpServer())
      .post(`${BASE_URL}/${accountTest1.id}/expenses`)
      .auth(userTest1.token, {type: 'bearer'})
      .send(mockToCreateExpenseTest)
      .expect(201)
      .then(res => {
        expenseTest1 = res.body.expense;
        creditPaymentCreated = res.body.expense.credit_payment
      })
  })

  describe('create - /accounts/{:idAccount}/expenses (POST)', () => {

    beforeAll(() => {
      COMPLEMENT_URL = '/expenses'
    })
    afterAll(() => {
      COMPLEMENT_URL = '/credit-payments'
    })

    it('should create a credit-payment', async () => {

      await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send(mockToCreateExpenseTest)
        .expect(201)
        .then(res => {
          expect(res.body.expense.credit_payment.name).toBe(mockToCreateExpenseTest.name_credit_payment)
          expect(res.body.expense.credit_payment.installments).toBe(mockToCreateExpenseTest.installments)
          expect(res.body.expense.credit_payment.installments_paid).toBe(1)
        })
    })

    it('should return a BadRequest error when installments is negative', async () => {

      await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({...mockToCreateExpenseTest, installments: -2})
        .expect(400)
    })

  })

  describe('findAll - /accounts/{:idAccount}/expenses (GET)', () => {

    it('should return all credit_payment in account', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.credit_payments[0].name).toBe(mockToCreateExpenseTest.name_credit_payment)
          expect(res.body.credit_payments[0].installments).toBe(mockToCreateExpenseTest.installments)
          expect(res.body.credit_payments[0].installments_paid).toBe(1)
        })
    })

    it('should return a Notfound error when account doesnt exist', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a Notfound error when accountId is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/123456789${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a Unauthorized error when user is not authenticated', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
        .expect(401)
    })

    it('should return a NotFound error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest2.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a NotFound error when user try to access to deleted account', async () => {

      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, {type: 'bearer'})

      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1}${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

  })

  describe('payInstallment - /accounts/{:idAccount}/expenses/payInstallment/{:idCreditPayment} (POST)', () => {

    beforeAll(() => {
      COMPLEMENT_URL = '/expenses/payInstallment'
    })
    afterAll(() => {
      COMPLEMENT_URL = '/credit-payments'
    })

    it('should pay installment from credit-payment', async () => {

      await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send(mockToPayInstallment)
        .expect(201)
        .then(res => {
          expect(res.body.expense.credit_payment.id).toBe(creditPaymentCreated.id)
          expect(res.body.expense.credit_payment.name).toBe(mockToCreateExpenseTest.name_credit_payment)
          expect(res.body.expense.credit_payment.installments).toBe(mockToCreateExpenseTest.installments)
          expect(res.body.expense.credit_payment.installments_paid).toBe(2)
        })
    })

    it('should return a BadRequest error when amount is negative', async () => {

      await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({...mockToPayInstallment, amount: -200})
        .expect(400)
    })

  })


  describe('update - /accounts/{:idAccount}/credit-payments (PATCH)', () => {

    it('should return a Unauthorized error when user is not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .send({name: 'prueba'})
        .expect(401)
    })

    it('should return a NotFound error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest2.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(404)
    })

    it('should return a Notfound error when accountId is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/123456789${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(404)
    })

    it('should return a Notfound error when account doesnt exist', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(404)
    })

    it('should return a BadRequest error when id is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(400)
    })

    it('should return a Notfound error when credit_payment doesnt exist', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(404)
    })

    it('should return a NotFound error when user try to access to deleted account', async () => {

      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, {type: 'bearer'})

      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(404)
    })

    it('should return a Forbidden error when user which doesnt made the expense and non-admin try to update credit_payment', async () => {

      // Agrego userTest2 a accountTest1 primero
      await request(app.getHttpServer())
        .post(`${BASE_URL}/join`)
        .auth(userTest2.token, {type: 'bearer'})
        .send({access_key: accountTest1.access_key})
        .expect(200)

      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest2.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(403)
    })


    it('should return an update expense', async () => {

      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .send({name: 'prueba'})
        .expect(200)
        .then(res => {
          expect(res.body.credit_payment.id).toBe(creditPaymentCreated.id)
          expect(res.body.credit_payment.name).toBe('prueba')
        })
    })

  })

  describe('delete - /accounts/{:idAccount}/expenses/{:id} (DELETE)', () => {

    it('should return a Notfound error when accountId is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/123456789${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a Notfound error when account doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${fakeUUID}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a BadRequest error when id is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(400)
    })

    it('should return a Notfound error when credit_payment doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a Unauthorized error when user is not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .expect(401)
    })

    it('should return a NotFound error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest2.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a Forbidden error when user which doesnt made the expense and non-admin try to delete expense', async () => {

      // Agrego userTest2 a accountTest1 primero
      await request(app.getHttpServer())
        .post(`${BASE_URL}/join`)
        .auth(userTest2.token, {type: 'bearer'})
        .send({access_key: accountTest1.access_key})
        .expect(200)

      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest2.token, {type: 'bearer'})
        .expect(403)
    })

    it('should return a NotFound error when user try to access to deleted account', async () => {

      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, {type: 'bearer'})

      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

    it('should return a deleted credit_payment and delete expenses in this credit_payment', async () => {

      // Encuentra gasto asociado a credit_payment
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/expenses/${expenseTest1.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)

      // Elimina credit_payment
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${creditPaymentCreated.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.ok).toBeTruthy()
        })

      // Busca y no encuentra credit_payment eliminado
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.credit_payments
            .find((credExp: CreditPayment) => credExp.id === creditPaymentCreated.id))
            .toBeUndefined()
        })

      // Busca y no encuentra gastos asociados al credit_payment eliminado
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/expenses/${expenseTest1.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(404)
    })

  })

})