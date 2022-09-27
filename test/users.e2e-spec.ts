import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import {fakeUUID, mockToCreateUser, mockToCreateUser2, mockUserToUpdate} from '../src/users/mocks/userMocks';
import {UserWithToken} from 'src/users/interfaces/UserWithToken.interface';
import {ValidRoles} from 'src/auth/interfaces';

describe('UsersController (e2e)', () => {
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

  describe('create - /users/register (POST)', () => {

    it('should create a new user', async () => {
      await request(app.getHttpServer())
        .post('/users/register')
        .send(mockToCreateUser)
        .expect(201)
        .then(res => {
          expect(res.body.accounts).toHaveLength(1)
        })
    });

    it('should create a third user with other email', async () => {
      await request(app.getHttpServer())
        .post('/users/register')
        .send(mockToCreateUser2)
        .expect(201)
        .then(res => {
          expect(res.body.accounts).toHaveLength(1)
        })
    });

    it('should return error when email user already exist', async () => {
      await request(app.getHttpServer())
        .post('/users/register')
        .send(mockToCreateUser)

      await request(app.getHttpServer())
        .post('/users/register')
        .send(mockToCreateUser)
        .expect(400)
    });
  })

  describe('findAll - /users (GET)', () => {

    it('should return all users', async () => {

      await request(app.getHttpServer())
        .get('/users')
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
        .get('/users')
        .expect(401)
    })
  })

  describe('findOne - /users:id (GET)', () => {

    it('should return a user by id when is same user', async () => {
      await request(app.getHttpServer())
        .get(`/users/${seedUsers[0].id}`)
        .auth(seedUsers[0].token, { type: 'bearer' })
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({id: seedUsers[0].id})
          expect(res.body).toHaveProperty('accounts')
          expect(res.body).toHaveProperty('accounts_owner')
          expect(res.body).toHaveProperty('accounts_admin')
        })
    })

    it('should return a user by id when is admin', async () => {
      await request(app.getHttpServer())
        .get(`/users/${seedUsers[0].id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({id: seedUsers[0].id})
          expect(res.body).toHaveProperty('accounts')
          expect(res.body).toHaveProperty('accounts_owner')
          expect(res.body).toHaveProperty('accounts_admin')
        })
    })

    it('should return a Forbidden error when is other user', async () => {
      await request(app.getHttpServer())
        .get(`/users/${seedUsers[0].id}`)
        .auth(seedUsers[1].token, { type: 'bearer' })
        .expect(403)
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .get(`/users/${seedUsers[0].id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .get(`/users/${seedUsers[0].id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(`/users/123456789`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .get(`/users/${fakeUUID}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(404)
    })
  })

  describe('update - /users/:id (PATCH)', () => {

    it('should return an updated user when updated by himself', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seedUsers[0].id}`)
        .send(mockUserToUpdate)
        .auth(seedUsers[0].token, { type: 'bearer' })
        .expect(200)
        .then( res => {
          expect(res.body).toMatchObject({...mockUserToUpdate})
        })
    })

    it('should return an updated user when updated by an admin', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seedUsers[0].id}`)
        .send(mockUserToUpdate)
        .auth(seedUsers[0].token, { type: 'bearer' })
        .expect(200)
        .then( res => {
          expect(res.body).toMatchObject({...mockUserToUpdate})
        })
    })

    it('should return a Forbidden error when some user want to update other user', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seedUsers[0].id}`)
        .send(mockUserToUpdate)
        .auth(seedUsers[1].token, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden'
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seedUsers[0].id}`)
        .send(mockUserToUpdate)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seedUsers[0].id}`)
        .send(mockUserToUpdate)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`/users/123456789`)
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
        .patch(`/users/${fakeUUID}`)
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
        .delete(`/users/${seedUsers[0].id}`)
        .auth(seedUsers[1].token, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden'
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${seedUsers[0].id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${seedUsers[0].id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`/users/123456789`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${fakeUUID}`)
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
        .delete(`/users/${seedUsers[0].id}`)
        .auth(seedUsers[0].token, { type: 'bearer' })
        .expect(200)
        .then(res=>{
          expect(res.body.isActive).toBeFalsy()
        })
    })

    it('should change prop "isActive" of user to false when an admin closes his account', async () => {
        await request(app.getHttpServer())
          .delete(`/users/${seedUsers[0].id}`)
          .auth(seedAdmin.token, { type: 'bearer' })
          .expect(200)
          .then(res=>{
            expect(res.body.isActive).toBeFalsy()
          })
      })
  })

  describe('reactivate - /users/reactivate/:id (PATCH)', () => {

    it('should return a Forbidden error when user try to reactivate by himself', async () => {

      // Delete account
      await request(app.getHttpServer())
          .delete(`/users/${seedUsers[0].id}`)
          .auth(seedAdmin.token, { type: 'bearer' })

      await request(app.getHttpServer())
        .patch(`/users/reactivate/${seedUsers[0].id}`)
        .auth(seedUsers[0].token, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: 'User deleted. Contact the admin',
          error: 'Forbidden'
        })
    })

    it('should reactivate user account when an admin do it', async () => {
      await request(app.getHttpServer())
        .patch(`/users/reactivate/${seedUsers[0].id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then(res =>{
          expect(res.body.isActive).toBeTruthy()
        })
    })

  })

  describe('becomePremium - /users/premium', () => {

    it('should return a user with roles = premium',async()=>{
      await request(app.getHttpServer())
        .post('/users/premium')
        .auth(seedUsers[0].token,{type:'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.roles).toEqual([ValidRoles.USER_PREMIUM])
        })
    })
    
  })

});
