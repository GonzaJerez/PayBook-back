import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, ValidationPipe} from '@nestjs/common';
import * as request from 'supertest';

import {AppModule} from '../src/app.module';
import {UserWithToken} from '../src/users/interfaces/UserWithToken.interface';
import {fakeUUID, mockToCreateAdmin, mockToCreateUser, mockToCreateUser2, mockUser1ToLogin, mockUserToUpdate} from '../src/users/mocks/userMocks';
import {fakeAccountUUID, mockToCreateAccount, mockToUpdateAccount} from '../src/accounts/mocks/accountMocks';
import {ValidRoles} from '../src/auth/interfaces';
import {mockToCreateCategory, mockToUpdateCategory} from '../src/categories/mocks/categoriesMock';
import {category1, expense1, subcategory1} from '../src/seed/mocks/seedMock';
import {defaultCategories} from '../src/categories/data/default-categories';
import {Account} from '../src/accounts/entities/account.entity';
import {Category} from '../src/categories/entities/category.entity';
import {mockToCreateSubcategory, mockToUpdateSubcategory} from '../src/subcategories/mocks/subcategoriesMocks';
import {Subcategory} from '../src/subcategories/entities/subcategory.entity';
import {mockToCreateExpense, mockToCreateExpenseNegativeAmount, mockToCreateExpenseWithoutAmount, mockToUpdateExpense} from '../src/expenses/mocks/expensesMocks';
import {Expense} from '../src/expenses/entities/expense.entity';

describe('App (e2e)', () => {
  let app: INestApplication;
  let seedUsers: UserWithToken[]
  let seedAdmin: UserWithToken
  let BASE_URL=''
  let COMPLEMENT_URL=''

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

  describe('SeedController', () => {
    beforeAll(()=>{
      BASE_URL='/seed'
    })


    describe('executeSeed - /seed (GET)', () => {

      it('should return a Forbidden error when try to execute seed on non development environment', async () => {
        process.env.STAGE = 'prod'
        await request(app.getHttpServer())
          .get(BASE_URL)
          .expect(403)
        process.env.STAGE = 'dev'
      })

      it('should execute a seed', async () => {
        await request(app.getHttpServer())
          .get(BASE_URL)
          .expect(200)
          .then(res => {
            expect(res.body.message).toBe('Seed executed')
            expect(res.body.users).toHaveLength(3)
            expect(res.body.users[0]).toMatchObject({
              email: expect.any(String),
              fullName: expect.any(String),
              id: expect.any(String),
              isActive: true,
              token: expect.any(String),
              accounts: expect.any(Object),
              accounts_admin: expect.any(Object),
              accounts_owner: expect.any(Object),
            })
            expect(res.body.admin).toMatchObject({
              email: expect.any(String),
              fullName: expect.any(String),
              id: expect.any(String),
              isActive: true,
              token: expect.any(String),
            })
          })
      })
    })

    describe('cleanDB - /seed/clean (GET)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/clean'
      })

      it('should return a Forbidden error when try to execute seed on non development environment', async () => {
        process.env.STAGE = 'prod'
        await request(app.getHttpServer())
          .get(`${BASE_URL}${COMPLEMENT_URL}`)
          .expect(403)
        process.env.STAGE = 'dev'
      })

      it('should clean DB', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}${COMPLEMENT_URL}`)
          .expect(200, {
            message: 'DB cleaned'
          })
      })

    })

  })

  describe('AuthController (e2e)', () => {
    beforeAll(()=>{
      BASE_URL='/auth'
    })

    describe('login - /auth/login (POST)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/login'
      })

      it('should login user when credentials are corrects', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send(mockUser1ToLogin)
          .expect(200)
          .then(res => {
            expect(res.body).toEqual({
              id: userTest1.id,
              email: userTest1.email,
              token: expect.any(String)
            })
          })
      })

      it('should return an BadRequest error when password does not satisfy the requirements ', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send({
            email: mockUser1ToLogin.email,
            password: 'ABC'
          })
          .expect(400)
          .then(res => {
            expect(res.body).toEqual({
              statusCode: 400,
              message: [
                expect.any(String)
              ],
              error: 'Bad Request'
            })
          })
      })

      it('should return an BadRequest error when email does not satisfy the requirements ', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send({
            email: 'otroemailgmail.com',
            password: mockUser1ToLogin.password
          })
          .expect(400)
          .then(res => {
            expect(res.body).toEqual({
              statusCode: 400,
              message: [
                expect.any(String)
              ],
              error: 'Bad Request'
            })
          })
      })

      it('should return an Unauthorized error user when credentials (password) are incorrect', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send({
            email: mockUser1ToLogin.email,
            password: 'Abc1234'
          })
          .expect(401, {
            error: 'Unauthorized',
            message: 'Credentials are not valid',
            statusCode: 401
          })
      })

      it('should return an Unauthorized error user when credentials (email) are incorrect', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send({
            email: 'otro-test@gmail.com',
            password: mockUser1ToLogin.password
          })
          .expect(401, {
            error: 'Unauthorized',
            message: 'Credentials are not valid',
            statusCode: 401
          })
      })

    })

  });

  describe('UsersController (e2e)', () => {
    beforeAll(()=>{
      BASE_URL='/users'
    })
  
    describe('create - /users/register (POST)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/register'
      })
  
      it('should create a new user', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send(mockToCreateUser)
          .expect(201)
          .then(res => {
            expect(res.body.accounts).toHaveLength(1)
            expect(res.body.accounts[0].categories).toHaveLength(defaultCategories.length)
            expect(res.body.accounts[0].categories[0].subcategories).toHaveLength(defaultCategories[0].subcategories.length)
            expect(res.body.accounts[0].categories[1].subcategories).toHaveLength(defaultCategories[1].subcategories.length)
          })
      });
  
      it('should create a third user with other email', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send(mockToCreateUser2)
          .expect(201)
          .then(res => {
            expect(res.body.accounts).toHaveLength(1)
            expect(res.body.accounts[0].categories).toHaveLength(defaultCategories.length)
            expect(res.body.accounts[0].categories[0].subcategories).toHaveLength(defaultCategories[0].subcategories.length)
            expect(res.body.accounts[0].categories[1].subcategories).toHaveLength(defaultCategories[1].subcategories.length)
          })
      });
  
      it('should return error when email user already exist', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send(mockToCreateUser)
  
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send(mockToCreateUser)
          .expect(400)
      });
    })
  
    describe('findAll - /users (GET)', () => {
  
      it('should return all users', async () => {
  
        await request(app.getHttpServer())
          .get(`${BASE_URL}`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(200)
          .then(res => {
            expect(res.body.totalUsers).toBe(seedUsers.length + 1 || 10)
            expect(res.body.limit).toBe(10)
            expect(res.body.skip).toBe(0)
          })
      })
  
      it('should return an unauthorized error when req not contain token', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}`)
          .expect(401)
      })
    })
  
    describe('findOne - /users:id (GET)', () => {
  
      it('should return a user by id when is same user', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${userTest1.id}`)
          .auth(userTest1.token, { type: 'bearer' })
          .expect(200)
          .then(res => {
            expect(res.body).toMatchObject({id: userTest1.id})
            expect(res.body).toHaveProperty('accounts')
            expect(res.body).toHaveProperty('accounts_owner')
            expect(res.body).toHaveProperty('accounts_admin')
          })
      })
  
      it('should return a user by id when is admin', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${userTest1.id}`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(200)
          .then(res => {
            expect(res.body).toMatchObject({id: userTest1.id})
            expect(res.body).toHaveProperty('accounts')
            expect(res.body).toHaveProperty('accounts_owner')
            expect(res.body).toHaveProperty('accounts_admin')
          })
      })
  
      it('should return a Forbidden error when is other user', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${userTest1.id}`)
          .auth(userTest2.token, { type: 'bearer' })
          .expect(403)
      })
  
      it('should return an unauthorized error when not exist token', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${userTest1.id}`)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized'
          })
      })
  
      it('should return an unauthorized error when token is not valid', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${userTest1.id}`)
          .auth('123456789', { type: 'bearer' })
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized'
          })
      })
  
      it('should return a BadRequest error when id isnt a valid uuid', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}/123456789`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(400, {
            statusCode: 400,
            message: 'Validation failed (uuid is expected)',
            error: 'Bad Request'
          })
      })
  
      it('should return a BadRequest error when id doesnt exist', async () => {
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${fakeUUID}`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(404)
      })
    })
  
    describe('update - /users/:id (PATCH)', () => {
  
      it('should return an updated user when updated by himself', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${userTest1.id}`)
          .send(mockUserToUpdate)
          .auth(userTest1.token, { type: 'bearer' })
          .expect(200)
          .then( res => {
            expect(res.body).toMatchObject({...mockUserToUpdate})
          })
      })
  
      it('should return an updated user when updated by an admin', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${userTest1.id}`)
          .send(mockUserToUpdate)
          .auth(userTest1.token, { type: 'bearer' })
          .expect(200)
          .then( res => {
            expect(res.body).toMatchObject({...mockUserToUpdate})
          })
      })
  
      it('should return a Forbidden error when some user want to update other user', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${userTest1.id}`)
          .send(mockUserToUpdate)
          .auth(userTest2.token, { type: 'bearer' })
          .expect(403, {
            statusCode: 403,
            message: "You don't have permission to perform this action",
            error: 'Forbidden'
          })
      })
  
      it('should return an unauthorized error when not exist token', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${userTest1.id}`)
          .send(mockUserToUpdate)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized'
          })
      })
  
      it('should return an unauthorized error when token is not valid', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${userTest1.id}`)
          .send(mockUserToUpdate)
          .auth('123456789', { type: 'bearer' })
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized'
          })
      })
  
      it('should return a BadRequest error when id isnt a valid uuid', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/123456789`)
          .send(mockUserToUpdate)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(400, {
            statusCode: 400,
            message: 'Validation failed (uuid is expected)',
            error: 'Bad Request'
          })
      })
  
      it('should return a BadRequest error when id doesnt exist', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${fakeUUID}`)
          .send(mockUserToUpdate)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(404)
          .then(res => {
            expect(res.body).toEqual({
              statusCode: 404,
              message: expect.any(String),
              error: 'Not Found'
            })
          })
      })
    })
  
    describe('remove (1) - /users/:id (DELETE)', () => {
  
      it('should return a Forbidden error when some user want to remove other user', async () => {
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${userTest1.id}`)
          .auth(userTest2.token, { type: 'bearer' })
          .expect(403, {
            statusCode: 403,
            message: "You don't have permission to perform this action",
            error: 'Forbidden'
          })
      })
  
      it('should return an unauthorized error when not exist token', async () => {
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${userTest1.id}`)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized'
          })
      })
  
      it('should return an unauthorized error when token is not valid', async () => {
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${userTest1.id}`)
          .auth('123456789', { type: 'bearer' })
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized'
          })
      })
  
      it('should return a BadRequest error when id isnt a valid uuid', async () => {
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/123456789`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(400, {
            statusCode: 400,
            message: 'Validation failed (uuid is expected)',
            error: 'Bad Request'
          })
      })
  
      it('should return a BadRequest error when id doesnt exist', async () => {
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${fakeUUID}`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(404)
          .then(res => {
            expect(res.body).toEqual({
              statusCode: 404,
              message: expect.any(String),
              error: 'Not Found'
            })
          })
      })
  
      it('should change prop "isActive" to false when user closes his account', async () => {
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${userTest1.id}`)
          .auth(userTest1.token, { type: 'bearer' })
          .expect(200)
          .then(res=>{
            expect(res.body.isActive).toBeFalsy()
          })
      })
  
      it('should change prop "isActive" of user to false when an admin closes his account', async () => {
          await request(app.getHttpServer())
            .delete(`${BASE_URL}/${userTest1.id}`)
            .auth(seedAdmin.token, { type: 'bearer' })
            .expect(200)
            .then(res=>{
              expect(res.body.isActive).toBeFalsy()
            })
        })
    })
  
    describe('reactivate - /users/reactivate/:id (PATCH)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/reactivate'
      })
  
      it('should return a Forbidden error when user try to reactivate by himself', async () => {
  
        // Delete account
        await request(app.getHttpServer())
            .delete(`${BASE_URL}/${userTest1.id}`)
            .auth(seedAdmin.token, { type: 'bearer' })
  
        await request(app.getHttpServer())
          .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
          .auth(userTest1.token, { type: 'bearer' })
          .expect(403, {
            statusCode: 403,
            message: 'User deleted. Contact the admin',
            error: 'Forbidden'
          })
      })
  
      it('should reactivate user account when an admin do it', async () => {
        await request(app.getHttpServer())
          .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(200)
          .then(res =>{
            expect(res.body.isActive).toBeTruthy()
          })
      })
    })

    describe('becomePremium - /users/premium', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/premium'
      })

      it('should return a user with roles = premium',async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body.roles).toEqual([ValidRoles.USER_PREMIUM])
          })
      })
      
    })
  
  });

  describe('AdminController (e2e)', () => {
    beforeAll(()=>{
      BASE_URL='/admin'
    })
  
    describe('createAdmin - /admin/register (POST)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/register'
      })
  
      it('should create a new admin', async () => {

        // Limpio DB
        await request(app.getHttpServer())
          .get('/seed/clean')
          .expect(200)

        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send(mockToCreateAdmin)
          .expect(201)
      })
  
      it('should return a Forbidden error when an admin already exist', async () => {
        // Limpia DB y genera seed
        await request(app.getHttpServer())
          .get('/seed')
          .expect(200)
  
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .send(mockToCreateAdmin)
          .expect(403)
          .then(res => {
            expect(res.body).toEqual({
              statusCode: 403,
              message: expect.any(String),
              error: 'Forbidden'
            })
          })
      });
    })
  
  });
  
  describe('AccountsController (e2e)', () => {
    beforeAll(()=>{
      BASE_URL='/accounts'
    })

    describe('create - /accounts (POST)', () => {
  
      it('should return a Unauthorized error when user not authenticated', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}`)
          .send(mockToCreateAccount)
          .expect(401)
      })
  
      it('should return a BadRequest error when client not send a name', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({description: mockToCreateAccount.description})
          .expect(400)
      })
  
      it('should create an account', async () => {
        // Elimino una cuenta para que quede espacio disponible
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)
        
        await request(app.getHttpServer())
          .post(`${BASE_URL}`)
          .send(mockToCreateAccount)
          .auth(userTest1.token,{type:'bearer'})
          .expect(201)
          .then(res =>{
            expect(res.body).toMatchObject({
              ...mockToCreateAccount,
              access_key: expect.any(String)
            })
            expect(res.body.users[0].id).toBe(userTest1.id)
            expect(res.body.admin_user.id).toBe(userTest1.id)
            expect(res.body.creator_user.id).toBe(userTest1.id)
            expect(res.body.categories).toHaveLength(defaultCategories.length)
            expect(res.body.categories[0].subcategories).toHaveLength(defaultCategories[0].subcategories.length)
            expect(res.body.categories[1].subcategories).toHaveLength(defaultCategories[1].subcategories.length)
          })
          
      })
  
      it('should create an account with empty description', async () => {
        // Elimino una cuenta para que quede espacio disponible
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)

        await request(app.getHttpServer())
          .post(`${BASE_URL}`)
          .send({name: mockToCreateAccount.name})
          .auth(userTest1.token,{type:'bearer'})
          .expect(201)
          .then(res =>{
            expect(res.body).toMatchObject({
              name: mockToCreateAccount.name,
              access_key: expect.any(String)
            })
            expect(res.body.users[0].id).toBe(userTest1.id)
            expect(res.body.admin_user.id).toBe(userTest1.id)
            expect(res.body.creator_user.id).toBe(userTest1.id)
          })
      })
  
      it('should return a Forbidden error when user no premium try to create a 3th account', async () => {
        await request(app.getHttpServer())
          .post(`${BASE_URL}`)
          .send(mockToCreateAccount)
          .auth(userTest2.token,{type:'bearer'})
          .expect(403)
      })
  
      it('should create a third account for same user when he is premium', async () => {
  
        await request(app.getHttpServer())
          .post('/users/premium')
          .auth(userTest2.token,{type:'bearer'})
  
        await request(app.getHttpServer())
          .post(`${BASE_URL}`)
          .send(mockToCreateAccount)
          .auth(userTest2.token,{type:'bearer'})
          .expect(201)
          .then(res =>{
            expect(res.body).toMatchObject({
              name: mockToCreateAccount.name,
              access_key: expect.any(String)
            })
            expect(res.body.users[0].id).toBe(userTest2.id)
            expect(res.body.admin_user.id).toBe(userTest2.id)
            expect(res.body.creator_user.id).toBe(userTest2.id)
          })
      })
  
    })
  
    describe('findAll - /accounts (GET)', () => {
  
      it('should return all accounts', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body.accounts.length).toBe(res.body.totalAccounts)
            expect(res.body.accounts[0]).toHaveProperty('users')
            expect(res.body.accounts[0]).toHaveProperty('creator_user')
            expect(res.body.accounts[0]).toHaveProperty('admin_user')
          })
      })
  
      it('should return a Forbidden error if is not an admin', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(403)
      })
  
      it('should return only 2 accounts, skiping 1', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}?limit=2&skip=1`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body.accounts).toHaveLength(2)
            expect(res.body.limit).toBe(2)
            expect(res.body.skip).toBe(1)
          })
      })
  
    })
  
    describe('findOne - /accounts/{:id} (GET)', () => {
      
      it('should return an account by id when is admin', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body.id).toBe(accountTest1.id)
            expect(res.body).toHaveProperty('users')
            expect(res.body).toHaveProperty('creator_user')
            expect(res.body).toHaveProperty('admin_user')
        })
      })
  
      it('should return an account by id when user belong to the account', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body.id).toBe(accountTest1.id)
            expect(res.body).toHaveProperty('users')
            expect(res.body).toHaveProperty('creator_user')
            expect(res.body).toHaveProperty('admin_user')
        })
      })
  
      it('should return a Forbidden error if user doesnt belong to the account and is not an admin', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(403)
      })
  
      it('should return a NotFounded error if id doesnt exist', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${fakeAccountUUID}`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(404)
      })
  
      it('should return a BadRequest error if id is not a valid uuid', async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/123456789`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(400)
      })
  
      it('should return the account even if it is inactive for the admin', async()=>{
  
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
  
        // Valida que se pueda ver la cuenta eliminada si es un admin
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)
      })
  
      it('should return Forbidden error when try to access an account which has already been deleted', async()=>{
  
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
        
        // Al eliminar la cuenta se desvincula del usuario, por lo tanto ya no se puede acceder
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(403)
      })
  
    })
  
    describe('update - /accounts/{:id]', () => {
  
      it('should return updated account when is updated for admin', async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}`)
          .send(mockToUpdateAccount)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body.id).toBe(accountTest1.id)
            expect(res.body).toMatchObject(mockToUpdateAccount)
          })
      })
  
      it('should return a Forbidden error when updated by a user other than account_admin', async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}`)
          .send(mockToUpdateAccount)
          .auth(userTest2.token,{type:'bearer'})
          .expect(403)
      })
  
      it('should return updated account when is updated for account_admin', async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}`)
          .send(mockToUpdateAccount)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body.id).toBe(accountTest1.id)
            expect(res.body).toMatchObject(mockToUpdateAccount)
          })
      })
  
    })
  
    describe('join - /accounts/join (POST)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/join'
      })
  
      it('should return a NotFount error when the access_key is incorrect', async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({access_key: '12345678'})
          .expect(404)
      })
  
      it('should return a BadRequest error and when the access_key have invalid format', async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({access_key: '123456789'})
          .expect(400)
      })
  
      it('should return a BadRequest error when user already exist in the account try to rejoin', async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({access_key: accountTest1.access_key})
          .expect(400)
      })
  
      it('should return the account the user join', async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({access_key: userTest2.accounts[0].access_key})
          .expect(200)
          .then( res => {
            expect(res.body.users.at(-1).id).toBe(userTest1.id)
          })
      })
  
      it('should return a Forbidden error when user try to join and the account already has maximum number of users', async()=>{
        await request(app.getHttpServer())
            .post(`${BASE_URL}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send({access_key: userTest2.accounts[1].access_key})
            .expect(403)
      })
  
      it('should return a Forbbiden error when the account to try access was deleted', async()=>{
  
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
  
        await request(app.getHttpServer())
          .post(`${BASE_URL}${COMPLEMENT_URL}`)
          .auth(userTest2.token,{type:'bearer'})
          .send({access_key: accountTest1.access_key})
          .expect(404)
      })
  
    })
  
    describe('leave - /accounts/leave/{:id} (DELETE)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/leave'
      })
      
      it('should return a BadRequest error when id is a invalid uuid', async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}${COMPLEMENT_URL}/123456789`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(400)
      })
  
      it('should return a NotFound error when id is not exist', async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}${COMPLEMENT_URL}/${fakeAccountUUID}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })
  
      it('should return the updated account and change admin when the actual account_admin leaves', async()=>{
        // Agrego usuario1 a la primera cuenta de usuario2
        await request(app.getHttpServer())
          .post('/accounts/join')
          .auth(userTest1.token,{type:'bearer'})
          .send({access_key: userTest2.accounts[0].access_key})
  
        // Elimino usuario2 de su primera cuenta, quedando como admin el usuario1
        await request(app.getHttpServer())
          .delete(`${BASE_URL}${COMPLEMENT_URL}/${userTest2.accounts[0].id}`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(200)
          .then( res => {
            expect(res.body.admin_user.id).not.toEqual(userTest2.id)
            expect(res.body.admin_user.id).toEqual(userTest1.id)
          })
      })
  
      it('should delete account when last user leave', async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}${COMPLEMENT_URL}/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then( res => {
            expect(res.body.isActive).toBeFalsy()
          })
      })
  
    })
  
    describe('pushOut - /accounts/pushout/{:id} (PATCH)', () => {
      beforeAll(()=>{
        COMPLEMENT_URL='/pushout'
      })
  
      it('should return a Forbidden error when a non-admin user try to pushout another user ',async()=>{
  
        await request(app.getHttpServer())
            .patch(`${BASE_URL}${COMPLEMENT_URL}/${accountTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .send({idUsers: [userTest1.id]})
            .expect(403)
      })
  
      it('should return a BadRequest error when id is not a valid uuid',async()=>{
  
        await request(app.getHttpServer())
            .patch(`${BASE_URL}${COMPLEMENT_URL}/123456789`)
            .auth(userTest2.token,{type:'bearer'})
            .send({idUsers: [userTest1.id]})
            .expect(400)
      })
  
      it('should return a NotFound error when not exist account whith that id',async()=>{
  
        await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${fakeAccountUUID}`)
            .auth(userTest2.token,{type:'bearer'})
            .send({idUsers: [userTest1.id]})
            .expect(404)
      })
  
      it('should return a BadRequest error when userId is not a valid uuid',async()=>{
  
        await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send({idUsers: ['123456789']})
            .expect(400)
      })
  
      it('should return the account updated without users ejected',async()=>{
  
        // Agrego usuario1 a la primera cuenta de usuario2
        await request(app.getHttpServer())
          .post('/accounts/join')
          .auth(userTest1.token,{type:'bearer'})
          .send({access_key: userTest2.accounts[0].access_key})
  
        // Elimino usuario1 de primera cuenta de usuario2
        await request(app.getHttpServer())
            .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest2.accounts[0].id}`)
            .auth(userTest2.token,{type:'bearer'})
            .send({idUsers: [userTest1.id]})
            .expect(200)
            .then( res => {
              expect(res.body.users).toHaveLength(1)
            })
      })
  
    })
  
    describe('remove - /accounts/{:id}', () => {
      
      it('should return a Forbidden error when other user than account_admin try to delete account', async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(403)
      })
  
      it('should return an account deleted when do it account_admin', async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}`)
          .auth(seedAdmin.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body).toMatchObject({
              isActive: false
            })
          })
      })
  
      it('should return an account deleted when do it the admin', async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res => {
            expect(res.body).toMatchObject({
              isActive: false,
              users: []
            })
          })
      })
  
    })
  
  });

  describe('CategoriesController (e2e', () => {
    beforeAll(()=>{
      BASE_URL=`/accounts`
    })

    describe('create - /accounts/{:idAccount}/categories (POST)', () => {

      it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}/categories`)
          .auth(userTest2.token,{type:'bearer'})
          .send(mockToCreateCategory)
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}/categories`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToCreateCategory)
          .expect(404)
      })

      it('should return a BadRequest error when already exist category on account with same name',async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}/categories`)
          .auth(userTest1.token,{type:'bearer'})
          .send(category1)
          .expect(400)
      })

      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories`)
        .send(category1)
        .expect(401)
      })

      it('should return a BadRequest error when name is not specified',async()=>{
        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories`)
        .auth(userTest1.token,{type:'bearer'})
        .send({})
        .expect(400)
      })

      it('should return category created',async()=>{
        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories`)
        .auth(userTest1.token,{type:'bearer'})
        .send(mockToCreateCategory)
        .expect(201)
        .then(res =>{
          expect(res.body.name.toLowerCase()).toBe(mockToCreateCategory.name.toLowerCase())
          expect(res.body.account.id).toStrictEqual(accountTest1.id)
          expect(res.body.isActive).toBeTruthy()
          expect(typeof res.body.id).toBe('string')
        })
      })

      it('should return category reactivated when user creates category with same name another category deleted on same account',async()=>{
        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories`)
        .auth(userTest1.token,{type:'bearer'})
        .send({name: categoryTest1.name})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({name: categoryTest1.name})
          expect(res.body.account.id).toBe(accountTest1.id)
          expect(res.body.isActive).toBeTruthy()
          expect(res.body.id).toBe(categoryTest1.id)
        })
      })

    })

    describe('findAll - /accounts/{:idAccount}/categories (GET)', () => {

      it('should return a Forbidden error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToCreateCategory)
          .expect(404)
      })

      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories`)
          .expect(401)
      })

      it('should return all categories',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res=>{
            expect(res.body).toHaveLength(accountTest1.categories.length)
          })
      })

      // TODO:
      it('should return all categories except those for which "isActive" is false',async()=>{
        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res=>{
            expect(res.body).toHaveLength(accountTest1.categories.length - 1)
          })
      })


    })

    describe('findOne - /accounts/{:idAccount}/categories/{id} (GET)', () => {

      it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a BadRequest error when id is not a valid uuid',async()=>{
        await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/categories/123456789`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(400)
      })

      it('should return a NotFound error when doesnt exist category with id',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${fakeUUID}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      // TODO:
      it('should return a Forbidden error when category has already been deleted',async()=>{
        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })
      
      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .expect(401)
      })

      it('should return a category',async()=>{
        await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(200)
        .then(({body}) =>{
          expect(typeof body.id).toBe('string')
          expect(body.name).toBe(categoryTest1.name)
          expect(body.account.id).toBe(accountTest1.id)
          expect(body.isActive).toBeTruthy()
        })
      })

    })

    describe('update - /accounts/{:idAccount}/categories/{:id} (PATCH)', () => {

      it('should return a Forbidden error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest2.token,{type:'bearer'})
          .send(mockToUpdateCategory)
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateCategory)
          .expect(404)
      })

      it('should return a BadRequest error when id is not a valid uuid',async()=>{
        await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}/categories/123456789`)
        .auth(userTest1.token,{type:'bearer'})
        .send(mockToUpdateCategory)
        .expect(400)
      })

      it('should return a BadRequest error when doesnt exist category with id',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${fakeUUID}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateCategory)
          .expect(404)
      })

      it('should return a BadRequest error when name is not specified',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({})
          .expect(400)
      })
      
      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .send(mockToUpdateCategory)
        .expect(401)
      })

      it('should return a NotFound error when category has already been deleted',async()=>{
        // Elimino categoria primero
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a updated category',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateCategory)
          .expect(200)
          .then(({body})=>{
            expect(body).toMatchObject(mockToUpdateCategory)
            expect(body.account.id).toBe(accountTest1.id)
            expect(typeof body.id).toBe('string')
            expect(body.isActive).toBeTruthy()
          })
      })

    })

    describe('remove - /accounts/{:idAccount}/categories/{:id} (DELETE)', () => {

      it('should return a Forbidden error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest2.token,{type:'bearer'})
        .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a BadRequest error when id is not a valid uuid',async()=>{
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/123456789`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(400)
      })

      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .expect(401)
      })

      it('should return a BadRequest error when doesnt exist category with id',async()=>{
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${fakeUUID}`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(404)
      })

      it('should return a NotFound error when when category has already been deleted',async()=>{
        // Elimino categoria primero
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(404)
      })
      

      it('should return a deleted category',async()=>{
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(200)
        .then(({body})=>{
            expect(body.isActive).toBeFalsy()
        })
      })

    })

  })

  describe('SubcategoriesController (e2e', () => {
    beforeAll(()=>{
      BASE_URL=`/accounts`,
      COMPLEMENT_URL='/subcategories'
    })

    describe('create - /accounts/{:idAccount}/categories/{:idCategory}/subcategory (POST)', () => {

      it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest2.token,{type:'bearer'})
          .send(subcategory1)
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(subcategory1)
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted category',async()=>{
        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(subcategory1)
          .expect(404)
      })

      it('should return a BadRequest error when already exist subcategory on category with same name',async()=>{
        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(subcategory1)
          .expect(400)
      })

      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
        .send(subcategory1)
        .expect(401)
      })

      it('should return a BadRequest error when name is not specified',async()=>{
        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest1.token,{type:'bearer'})
        .send({})
        .expect(400)
      })

      it('should return subcategory created',async()=>{
        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest1.token,{type:'bearer'})
        .send(mockToCreateSubcategory)
        .expect(201)
        .then(res =>{
          expect(res.body.name.toLowerCase()).toBe(mockToCreateSubcategory.name.toLowerCase())
          expect(res.body.category.id).toBe(categoryTest1.id)
          expect(res.body.isActive).toBeTruthy()
          expect(typeof res.body.id).toBe('string')
        })
      })

      it('should return subcategory reactivated when user creates subcategory with same name another subcategory deleted on same category',async()=>{
        
        // Elimino subcategoria primero
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
        .post(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
        .auth(userTest1.token,{type:'bearer'})
        .send({name: subcategoryTest1.name})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({name: subcategoryTest1.name})
          expect(res.body.category.id).toBe(categoryTest1.id)
          expect(res.body.isActive).toBeTruthy()
          expect(res.body.id).toBe(subcategoryTest1.id)
        })
      })

    })

    describe('findAll - /accounts/{:idAccount}/categories/{:idCategory}/subcategory (GET)', () => {

      it('should return a Forbidden error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToCreateCategory)
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted category',async()=>{
        
        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToCreateCategory)
          .expect(404)
      })

      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .expect(401)
      })

      it('should return all subcategories',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res=>{
            expect(res.body).toHaveLength(categoryTest1.subcategories.length)
          })
      })

      it('should return all subcategories except those for which "isActive" is false',async()=>{
        
        // Elimino subcategoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(res=>{
            expect(res.body).toHaveLength(categoryTest1.subcategories.length - 1)
          })
      })


    })

    describe('findOne - /accounts/{:idAccount}/categories/{:idCategory}/subcategory/{:id} (GET)', () => {

      it('should return a NotFound error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted category',async()=>{
        
        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a BadRequest error when id is not a valid uuid',async()=>{
        await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/123456789`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(400)
      })

      it('should return a NotFound error when doesnt exist subcategory with id',async()=>{
        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a Forbidden error when category has already been deleted',async()=>{
        
        // Elimino subcategoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })
      
      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .expect(401)
      })

      it('should return a subcategory',async()=>{
        await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(200)
        .then(({body}) =>{
          expect(typeof body.id).toBe('string')
          expect(body.name).toBe(subcategoryTest1.name)
          expect(body.category.id).toBe(categoryTest1.id)
          expect(body.isActive).toBeTruthy()
        })
      })

    })

    describe('update - /accounts/{:idAccount}/categories/{:idCategory}/subcategory/{:id} (PATCH)', () => {

      it('should return a Forbidden error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest2.token,{type:'bearer'})
          .send(mockToUpdateSubcategory)
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{

        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateCategory)
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted category',async()=>{

        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateCategory)
          .expect(404)
      })

      it('should return a BadRequest error when id is not a valid uuid',async()=>{
        await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/123456789`)
        .auth(userTest1.token,{type:'bearer'})
        .send(mockToUpdateSubcategory)
        .expect(400)
      })

      it('should return a BadRequest error when doesnt exist subcategory with id',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateSubcategory)
          .expect(404)
      })

      it('should return a BadRequest error when name is not specified',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({})
          .expect(400)
      })
      
      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .send(mockToUpdateSubcategory)
        .expect(401)
      })

      it('should return a NotFound error when category has already been deleted',async()=>{
        
        // Elimino subcategoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a updated subcategory',async()=>{
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateSubcategory)
          .expect(200)
          .then(({body})=>{
            expect(body).toMatchObject(mockToUpdateSubcategory)
            expect(body.category.id).toBe(categoryTest1.id)
            expect(typeof body.id).toBe('string')
            expect(body.isActive).toBeTruthy()
          })
      })

    })

    describe('remove - /accounts/{:idAccount}/categories/{:idCategory}/subcategory/{:id} (DELETE)', () => {

      it('should return a Forbidden error when user to not belong to account try to access',async()=>{
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .auth(userTest2.token,{type:'bearer'})
        .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted account',async()=>{
        // Elimina cuenta primero
        await request(app.getHttpServer())
          .delete(`/accounts/${accountTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a NotFound error when user try to access to deleted category',async()=>{
        // Elimino categoria primero
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a BadRequest error when id is not a valid uuid',async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/123456789`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(400)
      })

      it('should return a Unauthorized error when user not authenticated',async()=>{
        await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .expect(401)
      })

      it('should return a BadRequest error when doesnt exist subcategory with id',async()=>{
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
      })

      it('should return a NotFound error when when subcategory has already been deleted',async()=>{
        
        // Elimino subcategoria primero
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})

        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(404)
      })
      

      it('should return a deleted subcategory',async()=>{
        await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`)
        .auth(userTest1.token,{type:'bearer'})
        .expect(200)
        .then(({body})=>{
            expect(body.isActive).toBeFalsy()
        })
      })

    })

  })

  describe('ExpensesController', () => {
    beforeAll(()=>{
      BASE_URL=`/accounts`,
      COMPLEMENT_URL='/expenses'
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

})