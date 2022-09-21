import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { Account } from '../src/accounts/entities/account.entity';
import { mockExampleUUID, mockToCreateAccount, mockToUpdateAccount } from '../src/accounts/mocks/accountMocks';
import { User } from '../src/auth/entities/user.entity';
import { mockAdminUser, mockCreateUser, mockCreateUser2 } from '../src/auth/mocks/userMocks';

describe('Accounts (e2e)', () => {
  let app: INestApplication;

  // Users for test
  let userTest: User;
  let userTokenTest: string;
  let adminTokenTest: string;
  let thirdUserTest: User;
  let thirdUserTokenTest: string;

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
      .get('/auth/test/clean')
      .expect(200, {
        message: 'Users table clean'
    })

    // Crea 2 usuarios comunes y un administrador
    await Promise.all([
      request(app.getHttpServer())
        .post('/auth/register/admin')
        .send(mockAdminUser)
        .then(res => {
          adminTokenTest = res.body.token;
      }),
      request(app.getHttpServer())
        .post('/auth/register')
        .send(mockCreateUser)
        .expect(201)
        .then(res => {
          userTokenTest = res.body.token;
          accountTest = res.body.account[0]
      }),
      request(app.getHttpServer())
        .post('/auth/register')
        .send(mockCreateUser2)
        .expect(201)
        .then(res => {
          thirdUserTokenTest = res.body.token;
          accountTest2 = res.body.account[0]
      })
    ])
  });

  afterAll(async () => {
    await app.close();
  });

  describe('cleanForTest - /accounts/test/clean (GET)', () => { 

    it('should delete all accounts for tests', async () => {
      await request(app.getHttpServer())
        .get('/accounts/test/clean')
        .expect(200, {
          message: 'Accounts table clean'
        })
    })

    it('should return error on production environment', async () => {

      process.env.STAGE = 'prod'

      await request(app.getHttpServer())
        .get('/accounts/test/clean')
        .expect(403)
    })

  })

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
          accountTest3 = res.body.account[1]
          expect(res.body).toEqual(expect.any(Account))
        })
    })

    it('should create an account for second user with empty description', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({name: mockToCreateAccount.name})
        .auth(thirdUserTokenTest,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toEqual(expect.any(Account))
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
        .post('/accounts')
        .send(mockToCreateAccount)
        .auth(userTokenTest,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toEqual(expect.any(Account))
        })
    })

  })

  describe('findAll - /accounts (GET)', () => {

    it('should return all users', async()=>{
      await request(app.getHttpServer())
        .get('/accounts')
        .auth(adminTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toEqual(expect.any(Account))
        })
    })

    it('should return a Forbidden error if is not an admin', async()=>{
      await request(app.getHttpServer())
        .get('/accounts')
        .auth(userTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should return only 2 accounts, skip 1', async()=>{
      await request(app.getHttpServer())
        .get('/accounts?limit=2&skip=1')
        .auth(adminTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toHaveLength(2)
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
          expect(res.body).toEqual(accountTest)
      })
    })

    it('should return a Forbidden error if is not an admin', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${accountTest.id}`)
        .auth(userTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should return a NotFounded error if id doesnt exist', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${accountTest.id}`)
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
          expect(res.body).toEqual({
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
          expect(res.body).toEqual({
            ...accountTest,
          })
        })
    })

  })

  describe('join - /accounts/join (POST)', () => { 

    it('should return a Forbidden error and deny access a user to an exist account when the access_key is incorrect', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTokenTest,{type:'bearer'})
        .send({access_key: '123456'})
        .expect(403)
    })

    it('should return a BadRequest error and when the access_key have invalid format', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTokenTest,{type:'bearer'})
        .send({access_key: '123456789'})
        .expect(400)
    })

    it('should return the account the user join', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTokenTest,{type:'bearer'})
        .send({access_key: accountTest2.access_key})
        .expect(200)
        .then( res => {
          expect(res.body.users).toContain(userTest.id)
        })
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
          expect(res.body.admin_user).not.toEqual(thirdUserTest)
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

    beforeAll( async()=>{
      await request(app.getHttpServer())
          .post('/accounts/join')
          .auth(userTokenTest,{type:'bearer'})
          .send({access_key: accountTest3.access_key})
    })

    it('should return a Forbidden error when a non-admin user try to pushout another user ',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/${accountTest3.id}`)
          .auth(userTokenTest,{type:'bearer'})
          .send({users: [thirdUserTest.id]})
          .expect(403)
    })

    it('should return a BadRequest error when id is not a valid uuid',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/123456789`)
          .auth(thirdUserTokenTest,{type:'bearer'})
          .send({users: [userTest.id]})
          .expect(400)
    })

    it('should return a NotFound error when not exist user whith that id',async()=>{

      await request(app.getHttpServer())
      .patch(`/accounts/pushout/${accountTest3.id}`)
          .auth(thirdUserTokenTest,{type:'bearer'})
          .send({users: [mockExampleUUID]})
          .expect(404)
    })

    it('should return the account updated without users ejected',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/${accountTest3.id}`)
          .auth(thirdUserTokenTest,{type:'bearer'})
          .send({users: [userTest.id]})
          .expect(200)
          .then( res => {
            expect(res.body.users).not.toContain(userTest.id)
          })
    })

  })

  describe('remove - /accounts/{:id}', () => {
    
    it('should return a Forbidden error when other user than account_admin try to delete account', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest.id}`)
        .auth(thirdUserTokenTest,{type:'bearer'})
        .expect(403)
    })

    it('should return an account deleted when do it account_admin', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest.id}`)
        .auth(userTokenTest,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toEqual({
            ...accountTest,
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
          expect(res.body).toEqual({
            ...accountTest2,
            isActive: false
          })
        })
    })

  })

});
