import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { mockAdminUser, mockAdminUser2, mockCompleteUser, mockCreateUser, mockCreateUser2, mockUserToUpdate } from '../src/auth/mocks/userMocks';
import { User } from '../src/auth/entities/user.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userTest: User;
  let userTokenTest: string;
  let thirdUserTest: User;
  let thirdUserTokenTest: string;
  let adminTest: User;
  let adminTokenTest: string;

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

  describe('cleanUsers - /auth/test/clean (GET)', () => {

    it('should delete all users for tests', async () => {
      await request(app.getHttpServer())
        .get('/auth/test/clean')
        .expect(200, {
          message: 'Users table clean'
        })
    })

    it('should return error on production environment', async () => {

      process.env.STAGE = 'prod'

      await request(app.getHttpServer())
        .get('/auth/test/clean')
        .expect(403)
    })
  })

  describe('createAdmin - /auth/register/admin (POST)', () => {

    it('should create a new admin', async () => {
      await request(app.getHttpServer())
        .post('/auth/register/admin')
        .send(mockAdminUser)
        .then(res => {
          adminTokenTest = res.body.token;

          delete res.body.token;
          adminTest = res.body;
        })
    })

    it('should return a Forbidden error when an admin already exist', async () => {
      await request(app.getHttpServer())
        .post('/auth/register/admin')
        .send(mockAdminUser2)
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

  describe('create - /auth/register (POST)', () => {

    it('should create a new user', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockCreateUser)
        .expect(201)
        .then(res => {
          userTokenTest = res.body.token;

          delete res.body.token;
          userTest = res.body;
        })
    });

    it('should create a third user with other email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockCreateUser2)
        .expect(201)
        .then(res => {
          thirdUserTokenTest = res.body.token;

          delete res.body.token;
          thirdUserTest = res.body;
        })
    });

    it('should return error when email user already exist', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockCreateUser)
        .expect(400)
    });
  })

  describe('findAll - /auth (GET)', () => {

    it('should return all users', async () => {
      await request(app.getHttpServer())
        .get('/auth')
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200)
        .then(res => {
          expect(res.body).toEqual({
            totalUsers: 3,
            limit: 10,
            skip: 0,
            users: [adminTest, userTest, thirdUserTest]
          })
        })
    })

    it('should return an unauthorized error', async () => {
      await request(app.getHttpServer())
        .get('/auth')
        .expect(401)
    })
  })

  describe('findOne - /auth:id (GET)', () => {

    it('should return a user by id', async () => {
      await request(app.getHttpServer())
        .get(`/auth/${userTest.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200)
        .then(res => {
          expect(res.body).toEqual(userTest)
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .get(`/auth/${userTest.id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .get(`/auth/${userTest.id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(`/auth/123456789`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .get(`/auth/${mockCompleteUser.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
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

  describe('update - /auth/:id (PATCH)', () => {

    it('should return an updated user when updated by himself', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${userTest.id}`)
        .send(mockUserToUpdate)
        .auth(userTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest,
          ...mockUserToUpdate
        })
    })

    it('should return an updated user when updated by an admin', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${userTest.id}`)
        .send({ fullName: userTest.fullName })
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest
        })
    })

    it('should return a Forbidden error when some user want to update other user', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${userTest.id}`)
        .send(mockUserToUpdate)
        .auth(thirdUserTokenTest, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden'
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${userTest.id}`)
        .send(mockUserToUpdate)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${userTest.id}`)
        .send(mockUserToUpdate)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/123456789`)
        .send(mockUserToUpdate)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/${mockCompleteUser.id}`)
        .send(mockUserToUpdate)
        .auth(adminTokenTest, { type: 'bearer' })
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

  describe('remove (1) - /auth/:id (DELETE)', () => {

    it('should return a Forbidden error when some user want to remove other user', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/${userTest.id}`)
        .auth(thirdUserTokenTest, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden'
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/${userTest.id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/${userTest.id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/123456789`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/${mockCompleteUser.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
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
        .delete(`/auth/${userTest.id}`)
        .auth(userTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest,
          isActive: false
        })
    })
  })

  describe('activate - /auth/activate/:id (PATCH)', () => {

    it('should return an Unauthorized error when user try to activate by himself', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/activate/${userTest.id}`)
        .auth(userTokenTest, { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'User deleted. Contact the admin',
          error: 'Unauthorized'
        })
    })

    it('should activate user account when an admin do it', async () => {
      await request(app.getHttpServer())
        .patch(`/auth/activate/${userTest.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest,
          isActive: true
        })
    })
  })

  describe('remove (2) - /auth/:id (DELETE)', () => {

    it('should change prop "isActive" of user to false when an admin closes his account', async () => {
      await request(app.getHttpServer())
        .delete(`/auth/${userTest.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest,
          isActive: false
        })
    })

  })

  describe('login - /auth/login (POST)', () => {

    it('should login user when credentials are corrects', async () => {
      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({
          email: mockCreateUser.email,
          password: mockCreateUser.password
        })
        .expect(200)
        .then(res => {
          expect(res.body).toEqual({
            id: userTest.id,
            email: userTest.email,
            token: expect.any(String)
          })
        })
    })

    it('should return an BadRequest error when password does not satisfy the requirements ', async () => {
      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({
          email: mockCreateUser.email,
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
        .post(`/auth/login`)
        .send({
          email: 'otroemailgmail.com',
          password: mockCreateUser.password
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

    it('should return an Unauthorized error user when credentials are incorrect', async () => {
      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({
          email: mockCreateUser.email,
          password: 'Abc1234'
        })
        .expect(401,{
          error: 'Unauthorized',
          message: 'Credentials are not valid',
          statusCode: 401
        })
    })

    it('should return an Unauthorized error user when credentials are incorrect', async () => {
      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({
          email: 'otro-test@gmail.com',
          password: mockCreateUser.password
        })
        .expect(401,{
          error: 'Unauthorized',
          message: 'Credentials are not valid',
          statusCode: 401
        })
    })

  })

});
