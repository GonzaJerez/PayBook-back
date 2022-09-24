import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import {UserWithToken} from '../src/users/interfaces/UserWithToken.interface';
import {fakeAccountUUID, mockToCreateAccount, mockToUpdateAccount} from '../src/accounts/mocks/accountMocks';

describe('AccountsController (e2e)', () => {
  let app: INestApplication;
  let seedUsers:UserWithToken[]
  let seedAdmin:UserWithToken

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
  });

  beforeEach(async()=>{
    await request(app.getHttpServer())
      .get('/seed')
      .expect(200)
      .then(res => {
        seedUsers = res.body.users
        seedAdmin = res.body.admin
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
        .auth(seedUsers[0].token,{type:'bearer'})
        .send({description: mockToCreateAccount.description})
        .expect(400)
    })

    it('should create an account', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send(mockToCreateAccount)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({
            ...mockToCreateAccount,
            access_key: expect.any(String)
          })
          expect(res.body.users[0].id).toBe(seedUsers[0].id)
          expect(res.body.admin_user.id).toBe(seedUsers[0].id)
          expect(res.body.creator_user.id).toBe(seedUsers[0].id)
        })
        
    })

    it('should create an account with empty description', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({name: mockToCreateAccount.name})
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({
            name: mockToCreateAccount.name,
            access_key: expect.any(String)
          })
          expect(res.body.users[0].id).toBe(seedUsers[0].id)
          expect(res.body.admin_user.id).toBe(seedUsers[0].id)
          expect(res.body.creator_user.id).toBe(seedUsers[0].id)
        })
    })

    it('should return a Forbidden error when user no premium try to create a 3th account', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send(mockToCreateAccount)
        .auth(seedUsers[1].token,{type:'bearer'})
        .expect(403)
    })

    it('should create a third account for same user when he is premium', async () => {

      await request(app.getHttpServer())
        .post('/users/premium')
        .auth(seedUsers[1].token,{type:'bearer'})

      await request(app.getHttpServer())
        .post('/accounts')
        .send(mockToCreateAccount)
        .auth(seedUsers[1].token,{type:'bearer'})
        .expect(201)
        .then(res =>{
          expect(res.body).toMatchObject({
            name: mockToCreateAccount.name,
            access_key: expect.any(String)
          })
          expect(res.body.users[0].id).toBe(seedUsers[1].id)
          expect(res.body.admin_user.id).toBe(seedUsers[1].id)
          expect(res.body.creator_user.id).toBe(seedUsers[1].id)
        })
    })

  })

  describe('findAll - /accounts (GET)', () => {

    it('should return all accounts', async()=>{
      await request(app.getHttpServer())
        .get('/accounts')
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
        .get('/accounts')
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(403)
    })

    it('should return only 2 accounts, skiping 1', async()=>{
      await request(app.getHttpServer())
        .get('/accounts?limit=2&offset=1')
        .auth(seedAdmin.token,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.accounts).toHaveLength(2)
          expect(res.body.limit).toBe(2)
          expect(res.body.offset).toBe(1)
        })
    })

  })

  describe('findOne - /accounts/{:id} (GET)', () => {
    
    it('should return an account by id when is admin', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedAdmin.token,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({...seedUsers[0].accounts[0]})
          expect(res.body).toHaveProperty('users')
          expect(res.body).toHaveProperty('creator_user')
          expect(res.body).toHaveProperty('admin_user')
      })
    })

    it('should return an account by id when user belong to the account', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({...seedUsers[0].accounts[0]})
          expect(res.body).toHaveProperty('users')
          expect(res.body).toHaveProperty('creator_user')
          expect(res.body).toHaveProperty('admin_user')
      })
    })

    it('should return a Forbidden error if user doesnt belong to the account and is not an admin', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[1].token,{type:'bearer'})
        .expect(403)
    })

    it('should return a NotFounded error if id doesnt exist', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/${fakeAccountUUID}`)
        .auth(seedAdmin.token,{type:'bearer'})
        .expect(404)
    })

    it('should return a BadRequest error if id is not a valid uuid', async()=>{
      await request(app.getHttpServer())
        .get(`/accounts/123456789`)
        .auth(seedAdmin.token,{type:'bearer'})
        .expect(400)
    })

    it('should return the account even if it is inative for the admin', async()=>{

      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)

      // Valida que se pueda ver la cuenta eliminada si es un admin
      await request(app.getHttpServer())
        .get(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedAdmin.token,{type:'bearer'})
        .expect(200)
    })

    it('should return the accounts only if "isActive" is true', async()=>{

      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)
        
      await request(app.getHttpServer())
        .get(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(404)
    })  

  })

  describe('update - /accounts/{:id]', () => {

    it('should return updated account when is updated for admin', async()=>{
      await request(app.getHttpServer())
        .patch(`/accounts/${seedUsers[0].accounts[0].id}`)
        .send(mockToUpdateAccount)
        .auth(seedAdmin.token,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({
            ...seedUsers[0].accounts[0],
            ...mockToUpdateAccount
          })
        })
    })

    it('should return a Forbidden error when updated by a user other than account_admin', async()=>{
      await request(app.getHttpServer())
        .patch(`/accounts/${seedUsers[0].accounts[0].id}`)
        .send(mockToUpdateAccount)
        .auth(seedUsers[1].token,{type:'bearer'})
        .expect(403)
    })

    it('should return updated account when is updated for account_admin', async()=>{
      await request(app.getHttpServer())
        .patch(`/accounts/${seedUsers[0].accounts[0].id}`)
        .send(mockToUpdateAccount)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({
            ...seedUsers[0].accounts[0],
            ...mockToUpdateAccount
          })
        })
    })

  })

  describe('join - /accounts/join (POST)', () => { 

    it('should return a NotFount error when the access_key is incorrect', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(seedUsers[0].token,{type:'bearer'})
        .send({access_key: '12345678'})
        .expect(404)
    })

    it('should return a BadRequest error and when the access_key have invalid format', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(seedUsers[0].token,{type:'bearer'})
        .send({access_key: '123456789'})
        .expect(400)
    })

    it('should return a BadRequest error when user already exist in the account try to rejoin', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(seedUsers[0].token,{type:'bearer'})
        .send({access_key: seedUsers[0].accounts[0].access_key})
        .expect(400)
    })

    it('should return the account the user join', async()=>{
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(seedUsers[0].token,{type:'bearer'})
        .send({access_key: seedUsers[1].accounts[0].access_key})
        .expect(200)
        .then( res => {
          expect(res.body.users.at(-1).id).toBe(seedUsers[0].id)
        })
    })

    it('should return a Forbidden error when user try to join and the account already has maximum number of users', async()=>{
      await request(app.getHttpServer())
          .post('/accounts/join')
          .auth(seedUsers[0].token,{type:'bearer'})
          .send({access_key: seedUsers[1].accounts[1].access_key})
          .expect(403)
    })

    it('should return a Forbbiden error when the account to try access was deleted', async()=>{

      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)

      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(seedUsers[1].token,{type:'bearer'})
        .send({access_key: seedUsers[0].accounts[0].access_key})
        .expect(404)
    })

  })

  describe('leave - /accounts/leave/{:id} (DELETE)', () => {
    
    it('should return a BadRequest error when id is a invalid uuid', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/leave/123456789`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(400)
    })

    it('should return a NotFound error when id is not exist', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/leave/${fakeAccountUUID}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(404)
    })

    it('should return the updated account and change admin when the actual account_admin leaves', async()=>{
      // Agrego usuario1 a la primera cuenta de usuario2
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(seedUsers[0].token,{type:'bearer'})
        .send({access_key: seedUsers[1].accounts[0].access_key})

      // Elimino usuario2 de su primera cuenta, quedando como admin el usuario1
      await request(app.getHttpServer())
        .delete(`/accounts/leave/${seedUsers[1].accounts[0].id}`)
        .auth(seedUsers[1].token,{type:'bearer'})
        .expect(200)
        .then( res => {
          expect(res.body.admin_user.id).not.toEqual(seedUsers[1].id)
          expect(res.body.admin_user.id).toEqual(seedUsers[0].id)
        })
    })

    it('should delete account when last user leave', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/leave/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)
        .then( res => {
          expect(res.body.isActive).toBeFalsy()
        })
    })

  })

  describe('pushOut - /accounts/pushout/{:id} (PATCH)', () => {

    it('should return a Forbidden error when a non-admin user try to pushout another user ',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/${seedUsers[0].accounts[0].id}`)
          .auth(seedUsers[1].token,{type:'bearer'})
          .send({idUsers: [seedUsers[0].id]})
          .expect(403)
    })

    it('should return a BadRequest error when id is not a valid uuid',async()=>{

      await request(app.getHttpServer())
          .patch(`/accounts/pushout/123456789`)
          .auth(seedUsers[1].token,{type:'bearer'})
          .send({idUsers: [seedUsers[0].id]})
          .expect(400)
    })

    it('should return a NotFound error when not exist account whith that id',async()=>{

      await request(app.getHttpServer())
      .patch(`/accounts/pushout/${fakeAccountUUID}`)
          .auth(seedUsers[1].token,{type:'bearer'})
          .send({idUsers: [seedUsers[0].id]})
          .expect(404)
    })

    it('should return a BadRequest error when userId is not a valid uuid',async()=>{

      await request(app.getHttpServer())
      .patch(`/accounts/pushout/${seedUsers[0].accounts[0].id}`)
          .auth(seedUsers[0].token,{type:'bearer'})
          .send({idUsers: ['123456789']})
          .expect(400)
    })

    it('should return the account updated without users ejected',async()=>{

      // Agrego usuario1 a la primera cuenta de usuario2
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(seedUsers[0].token,{type:'bearer'})
        .send({access_key: seedUsers[1].accounts[0].access_key})

      // Elimino usuario1 de primera cuenta de usuario2
      await request(app.getHttpServer())
          .patch(`/accounts/pushout/${seedUsers[1].accounts[0].id}`)
          .auth(seedUsers[1].token,{type:'bearer'})
          .send({idUsers: [seedUsers[0].id]})
          .expect(200)
          .then( res => {
            expect(res.body.users).toHaveLength(1)
          })
    })

  })

  describe('remove - /accounts/{:id}', () => {
    
    it('should return a Forbidden error when other user than account_admin try to delete account', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[1].token,{type:'bearer'})
        .expect(403)
    })

    it('should return an account deleted when do it account_admin', async()=>{
      await request(app.getHttpServer())
        .delete(`/accounts/${seedUsers[0].accounts[0].id}`)
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
        .delete(`/accounts/${seedUsers[0].accounts[0].id}`)
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({
            isActive: false
          })
        })
    })

  })

});
