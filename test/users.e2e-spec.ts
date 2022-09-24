import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { mockAdminUser, mockAdminUser2, mockCompleteUser, mockCreateUser, mockCreateUser2, mockUserToUpdate } from '../src/users/mocks/userMocks';
import { User } from '../src/users/entities/user.entity';

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

  describe('cleanUsers - /users/test/clean (GET)', () => {

    afterAll(async()=>{
        await request(app.getHttpServer())
          .post('/admin/register')
          .send(mockAdminUser)
          .then(res => {
            adminTokenTest = res.body.token;
  
            delete res.body.token;
            adminTest = res.body;
      })
    })

    it('should delete all users for tests', async () => {
      await request(app.getHttpServer())
        .get('/users/test/clean')
        .expect(200, {
          message: 'Users table clean'
        })
    })

    it('should return error on production environment', async () => {

      process.env.STAGE = 'prod'

      await request(app.getHttpServer())
        .get('/users/test/clean')
        .expect(403)
    })
  })

  describe('create - /users/register (POST)', () => {

    it('should create a new user', async () => {
      await request(app.getHttpServer())
        .post('/users/register')
        .send(mockCreateUser)
        .expect(201)
        .then(res => {
          expect(res.body.accounts).toHaveLength(1)

          userTokenTest = res.body.token;

          delete res.body.token;
          delete res.body.accounts;
          userTest = res.body;
        })
    });

    it('should create a third user with other email', async () => {
      await request(app.getHttpServer())
        .post('/users/register')
        .send(mockCreateUser2)
        .expect(201)
        .then(res => {
          expect(res.body.accounts).toHaveLength(1)
          
          thirdUserTokenTest = res.body.token;

          delete res.body.token;
          delete res.body.accounts;
          thirdUserTest = res.body;
        })
    });

    it('should return error when email user already exist', async () => {
      await request(app.getHttpServer())
        .post('/users/register')
        .send(mockCreateUser)
        .expect(400)
    });
  })

  describe('findAll - /users (GET)', () => {

    it('should return all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200)
        .then(res => {
          // expect(res.body).toEqual({
          //   totalUsers: 3,
          //   limit: 10,
          //   skip: 0,
          //   users: [userTest, thirdUserTest, adminTest]
          // })
          expect(res.body.totalUsers).toBe(3)
          expect(res.body.limit).toBe(10)
          expect(res.body.skip).toBe(0)
          expect(res.body.users).toContainEqual({...userTest})
        })
    })

    it('should return an unauthorized error', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401)
    })
  })

  describe('findOne - /users:id (GET)', () => {

    it('should return a user by id', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userTest.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200)
        .then(res => {
          expect(res.body).toMatchObject({...userTest})
          expect(res.body).toHaveProperty('accounts')
          expect(res.body).toHaveProperty('accounts_owner')
          expect(res.body).toHaveProperty('accounts_admin')
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userTest.id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userTest.id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(`/users/123456789`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .get(`/users/${mockCompleteUser.id}`)
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

  describe('update - /users/:id (PATCH)', () => {

    it('should return an updated user when updated by himself', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userTest.id}`)
        .send(mockUserToUpdate)
        .auth(userTokenTest, { type: 'bearer' })
        .expect(200)
        .then( res => {
          expect(res.body).toMatchObject({...mockUserToUpdate})
        })
    })

    it('should return an updated user when updated by an admin', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userTest.id}`)
        .send({ fullName: userTest.fullName })
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200)
        .then( res => {
          expect(res.body).toMatchObject({ fullName: userTest.fullName })
        })
    })

    it('should return a Forbidden error when some user want to update other user', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userTest.id}`)
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
        .patch(`/users/${userTest.id}`)
        .send(mockUserToUpdate)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userTest.id}`)
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
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${mockCompleteUser.id}`)
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

  describe('remove (1) - /users/:id (DELETE)', () => {

    it('should return a Forbidden error when some user want to remove other user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userTest.id}`)
        .auth(thirdUserTokenTest, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden'
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userTest.id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userTest.id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`/users/123456789`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${mockCompleteUser.id}`)
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
        .delete(`/users/${userTest.id}`)
        .auth(userTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest,
          isActive: false
        })
    })
  })

  describe('reactivate - /users/reactivate/:id (PATCH)', () => {

    it('should return an Unauthorized error when user try to reactivate by himself', async () => {
      await request(app.getHttpServer())
        .patch(`/users/reactivate/${userTest.id}`)
        .auth(userTokenTest, { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'User deleted. Contact the admin',
          error: 'Unauthorized'
        })
    })

    it('should reactivate user account when an admin do it', async () => {
      await request(app.getHttpServer())
        .patch(`/users/reactivate/${userTest.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest,
          isActive: true
        })
    })
  })

  describe('remove (2) - /users/:id (DELETE)', () => {

    it('should change prop "isActive" of user to false when an admin closes his account', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userTest.id}`)
        .auth(adminTokenTest, { type: 'bearer' })
        .expect(200, {
          ...userTest,
          isActive: false
        })
    })

  })

});
