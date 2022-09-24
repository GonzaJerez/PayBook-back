import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { Account } from '../src/accounts/entities/account.entity';
import { mockAdminUserOnAccountTest, mockCreateUser2OnAccountTest, mockCreateUser3OnAccountTest, mockCreateUserOnAccountTest, mockExampleUUID, mockToCreateAccount, mockToUpdateAccount } from '../src/accounts/mocks/accountMocks';
import { User } from '../src/users/entities/user.entity';
import { mockAdminUser, mockCreateUser, mockCreateUser2, mockCreateUser3 } from '../src/users/mocks/userMocks';
import { ValidRoles } from '../src/auth/interfaces';

describe('Accounts (e2e)', () => {
  let app: INestApplication;

  // Users for test
  let userTest: User;
  let userTokenTest: string;
  let adminTokenTest: string;
  let thirdUserTest: User;
  let thirdUserTokenTest: string;
  let fourthUserTokenTest: string;

  // Accounts created
  let accountTest: Account;
  let accountTest2: Account;
  let accountTest3: Account;

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

    // Limpia todos los usuarios existentes
    await request(app.getHttpServer())
      .get('/users/test/clean')

    // Crea 2 usuarios comunes y un administrador
    await Promise.all([
      request(app.getHttpServer())
        .post('/admin/register')
        .send(mockAdminUserOnAccountTest)
        .then(res => {
          adminTokenTest = res.body.token;
      }),
      request(app.getHttpServer())
        .post('/users/register')
        .send(mockCreateUserOnAccountTest)
        .expect(201)
        .then(res => {
          userTokenTest = res.body.token;

          delete res.body.token;
          userTest = res.body;
          accountTest = res.body.accounts[0]
      }),
      request(app.getHttpServer())
        .post('/users/register')
        .send(mockCreateUser2OnAccountTest)
        .expect(201)
        .then(res => {
          thirdUserTokenTest = res.body.token;

          delete res.body.token;
          thirdUserTest = res.body;
          accountTest2 = res.body.accounts[0]
      }),
      request(app.getHttpServer())
        .post('/users/register')
        .send(mockCreateUser3OnAccountTest)
        .expect(201)
        .then(res => {
          fourthUserTokenTest = res.body.token;
      })
    ])
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create - /accounts (POST)', () => {

    it('should return a Unauthorized error when user not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send(mockToCreateAccount)
        .expect(401)
    })

    it('should return a BadRequest error when client not send a name', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .auth(userTokenTest,{type:'bearer'})
        .send({description: mockToCreateAccount.description})
        .expect(400)
    })

    it('should create an account', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send(mockToCreateAccount)
        .auth(userTokenTest,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({
            ...mockToCreateAccount,
            access_key: expect.any(String),
            users: [{...userTest}],
            creator_user: {...userTest},
            admin_user: {...userTest},
          })
          
          accountTest3 = res.body;
          userTest.accounts = [...userTest.accounts, res.body]
        })
        
    })

    it('should create an account for second user with empty description', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({name: mockToCreateAccount.name})
        .auth(thirdUserTokenTest,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({
            name: mockToCreateAccount.name,
            description: '',
            access_key: expect.any(String),
            users: [{...thirdUserTest}],
            creator_user: {...thirdUserTest},
            admin_user: {...thirdUserTest},
          })

          thirdUserTest.accounts = [...thirdUserTest.accounts, res.body]
        })
    })

    it('should return a Frobidden error when user no premium try to create a 3th account', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send(mockToCreateAccount)
        .auth(userTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should create a third account for same user when he is premium', async () => {

      await request(app.getHttpServer())
        .post('/users/premium')
        .auth(userTokenTest,{type:'bearer'})
        .then(res =>{
          userTest = res.body
        })

      await request(app.getHttpServer())
        .post('/accounts')
        .send(mockToCreateAccount)
        .auth(userTokenTest,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({
            ...mockToCreateAccount,
            access_key: expect.any(String),
            users: [{...userTest}],
            creator_user: {...userTest},
            admin_user: {...userTest},
          })

          userTest.accounts = [...userTest.accounts, res.body]
          expect(userTest.accounts).toHaveLength(3)
        })
    })

  })

  describe('findAll - /accounts (GET)', () => {

    it('should return all accounts', async()=>{
      await request(app.getHttpServer())
        .get('/accounts')
        .auth(adminTokenTest,{type:'bearer'})
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
        .get('/accounts')
        .auth(userTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should return only 2 accounts, skiping 1', async()=>{
      await request(app.getHttpServer())
        .get('/accounts?limit=2&offset=1')
        .auth(adminTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.accounts).toHaveLength(2)
          expect(res.body.limit).toBe(2)
          expect(res.body.offset).toBe(1)
        })
    })

  })

  describe('findOne - /accounts/{:id} (GET)', () => {
    
    it('should return an account by id', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${accountTest.id}`)
        .auth(adminTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({...accountTest})
          expect(res.body).toHaveProperty('users')
          expect(res.body).toHaveProperty('creator_user')
          expect(res.body).toHaveProperty('admin_user')
      })
    })

    it('should return a Forbidden error if user doesnt belong to the account and is not an admin', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${accountTest.id}`)
        .auth(thirdUserTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should return a NotFounded error if id doesnt exist', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${mockExampleUUID}`)
        .auth(adminTokenTest,{type:'bearer'})
        .expect(404)
    })

    it('should return a BadRequest error if id is not a valid uuid', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/123456789`)
        .auth(adminTokenTest,{type:'bearer'})
        .expect(400)
    })

  })

  describe('update - /accounts/{:id]', () => {

    it('should return updated account when is updated for admin', async()=>{
      await request(app.getHttpServer())
        .patch(`/accounts/${accountTest.id}`)
        .send(mockToUpdateAccount)
        .auth(adminTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({
            ...accountTest,
            ...mockToUpdateAccount
          })
        })
    })

    it('should return a Forbidden error when updated by a user other than account_admin', async()=>{
      await request(app.getHttpServer())
        .patch(`/accounts/${accountTest.id}`)
        .send(mockToUpdateAccount)
        .auth(thirdUserTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should return updated account when is updated for account_admin', async()=>{
      await request(app.getHttpServer())
        .patch(`/accounts/${accountTest.id}`)
        .send(mockToCreateAccount)
        .auth(userTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({...mockToCreateAccount})
        })
    })

  })

  describe('join - /accounts/join (POST)', () => { 

    it('should return a NotFount error when the access_key is incorrect', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTokenTest,{type:'bearer'})
        .send({access_key: '12345678'})
        .expect(404)
    })

    it('should return a BadRequest error and when the access_key have invalid format', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTokenTest,{type:'bearer'})
        .send({access_key: '123456789'})
        .expect(400)
    })

    it('should return a BadRequest error when user already exist in the account try to rejoin', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(thirdUserTokenTest,{type:'bearer'})
        .send({access_key: accountTest2.access_key})
        .expect(400)
    })

    it('should return the account the user join', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTokenTest,{type:'bearer'})
        .send({access_key: accountTest2.access_key})
        .expect(200)
        .then( res => {
          expect(res.body.users.at(-1).id).toBe(userTest.id)
        })
    })

    it('should return a Forbidden error when user try to join and the account already has maximum number of users', async()=>{
      await request(app.getHttpServer())
          .post('/accounts/join')
          .auth(fourthUserTokenTest,{type:'bearer'})
          .send({access_key: accountTest3.access_key})
          .expect(200)
          .then((res)=>{
            accountTest3 = res.body;
          })
      await request(app.getHttpServer())
          .post('/accounts/join')
          .auth(adminTokenTest,{type:'bearer'})
          .send({access_key: accountTest3.access_key})
          .expect(403)
    })

  })

  describe('leave - /accounts/leave/{:id} (DELETE)', () => {
    
    it('should return a BadRequest error when id is a invalid uuid', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/leave/123456789`)
        .auth(userTokenTest,{type:'bearer'})
        .expect(400)
    })

    it('should return a NotFound error when id is not exist', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/leave/${mockExampleUUID}`)
        .auth(userTokenTest,{type:'bearer'})
        .expect(404)
    })

    it('should return the updated account and change admin when the actual account_admin leaves', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/leave/${accountTest2.id}`)
        .auth(thirdUserTokenTest,{type:'bearer'})
        .expect(200)
        .then( res => {
          expect(res.body.admin_user.id).not.toEqual(thirdUserTest.id)
        })
    })

    it('should delete account when last user leave', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/leave/${accountTest.id}`)
        .auth(userTokenTest,{type:'bearer'})
        .expect(200)
        .then( res => {
          expect(res.body.isActive).toBeFalsy()
        })
    })

  })

  describe('pushOut - /accounts/pushout/{:id} (PATCH)', () => {

    it('should return a Forbidden error when a non-admin user try to pushout another user ',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/${accountTest3.id}`)
          .auth(thirdUserTokenTest,{type:'bearer'})
          .send({idUsers: [userTest.id]})
          .expect(403)
    })

    it('should return a BadRequest error when id is not a valid uuid',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/123456789`)
          .auth(thirdUserTokenTest,{type:'bearer'})
          .send({idUsers: [userTest.id]})
          .expect(400)
    })

    it('should return a NotFound error when not exist account whith that id',async()=>{

      await request(app.getHttpServer())
      .patch(`/accounts/pushout/${mockExampleUUID}`)
          .auth(thirdUserTokenTest,{type:'bearer'})
          .send({idUsers: [userTest.id]})
          .expect(404)
    })

    it('should return a BadRequest error when userId is not a valid uuid',async()=>{

      await request(app.getHttpServer())
      .patch(`/accounts/pushout/${accountTest3.id}`)
          .auth(userTokenTest,{type:'bearer'})
          .send({idUsers: ['123456789']})
          .expect(400)
    })

    it('should return the account updated without users ejected',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/${accountTest3.id}`)
          .auth(userTokenTest,{type:'bearer'})
          .send({idUsers: [thirdUserTest.id]})
          .expect(200)
          .then( res => {
            expect(res.body.users[0]).not.toMatchObject({id:thirdUserTest.id})
          })
    })

  })

  describe('remove - /accounts/{:id}', () => {
    
    it('should return a Forbidden error when other user than account_admin try to delete account', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest3.id}`)
        .auth(thirdUserTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should return an account deleted when do it account_admin', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest3.id}`)
        .auth(userTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({
            isActive: false
          })
        })
    })

    it('should return an account deleted when do it the admin', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest2.id}`)
        .auth(adminTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({
            isActive: false
          })
        })
    })

  })

  describe('findOne - /accounts/{:id} (GET)', () => { 

    it('should return the account even if it is inative for the admin', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${accountTest2.id}`)
        .auth(adminTokenTest,{type:'bearer'})
        .expect(200)
    })

    it('should return the accounts only if "isActive" is true', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${accountTest2.id}`)
        .auth(userTokenTest,{type:'bearer'})
        .expect(404)
    })  
  })

  describe('join - /accounts/join (POST)', () => { 

    it('should return a Forbbiden error when the account to try access was deleted', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTokenTest,{type:'bearer'})
        .send({access_key: accountTest2.access_key})
        .expect(404)
    })

  })

});
