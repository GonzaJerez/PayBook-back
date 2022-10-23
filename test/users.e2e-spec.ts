import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, ValidationPipe} from '@nestjs/common';
import * as request from 'supertest';

import {AppModule} from '../src/app.module';
import {fakeTokenGoogle, fakeUUID, mockToCreateUser, mockToCreateUser2, mockUser1ToLogin, mockUserToUpdateEmail, mockUserToUpdateName, mockUserToUpdatePassword} from '../src/users/mocks/userMocks';
import {UserWithToken} from '../src/users/interfaces/UserWithToken.interface';
import {ValidRoles} from '../src/auth/interfaces';
import {defaultCategories} from '../src/categories/data/default-categories';
import {UsersService} from '../src/users/users.service';
import {user1} from '../src/seed/mocks/seedMock';


describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let service: UsersService;
  let seedUsers: UserWithToken[]
  let seedAdmin: UserWithToken
  const BASE_URL = '/users'
  let COMPLEMENT_URL = ''

  let userTest1: UserWithToken;
  let userTest2: UserWithToken;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .compile();

    process.env.NODE_ENV = 'test'

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true
      })
    )

    await app.init();
    service = moduleFixture.get<UsersService>(UsersService);
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
      })
  })

  describe('google - /users/google', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/google'
    })

    it('should return a BadRequest when tokenGoogle doesnt exist', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(401)
    })

    it('should return user with token and create user when doesnt exist user with same email', async () => {
      jest
        .spyOn(service, 'googleVerify')
        .mockImplementation(async () => ({
          name: mockToCreateUser.fullName, 
          email: mockToCreateUser.email
        }))

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(200)
        .then(res => {
          expect(res.body.user.accounts).toHaveLength(1)
          expect(res.body.user.google).toBeTruthy()
          expect(res.body.user.accounts[0].categories).toHaveLength(defaultCategories.length)
          expect(res.body.user.accounts[0].categories[0].subcategories).toHaveLength(defaultCategories[0].subcategories.length)
          expect(res.body.user.accounts[0].categories[1].subcategories).toHaveLength(defaultCategories[1].subcategories.length)
          expect(typeof res.body.token).toBe('string')
        })
    })

    it('should return user with token when user already registred with google', async () => {
      jest
        .spyOn(service, 'googleVerify')
        .mockImplementation(async () => ({
          name: mockToCreateUser.fullName, 
          email: mockToCreateUser.email
        }))

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(200)

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(200)
    })

    it('should return Unauthorized error when user regitred with email', async () => {
      jest
        .spyOn(service, 'googleVerify')
        .mockImplementation(async () => ({
          name: user1.fullName, 
          email: user1.email
        }))

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(401)
    })

    it('should return Forbidden error when user already been deleted', async () => {
      jest
        .spyOn(service, 'googleVerify')
        .mockImplementation(async () => ({
          name: user1.fullName, 
          email: user1.email
        }))

      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.isActive).toBeFalsy()
        })

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(401)
    })

  })

  describe('register - /users/register (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/register'
    })

    it('should create a new user', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockToCreateUser)
        .expect(201)
        .then(res => {
          expect(res.body.user.accounts).toHaveLength(1)
          expect(res.body.user.google).toBeFalsy()
          expect(res.body.user.accounts[0].categories).toHaveLength(defaultCategories.length)
          expect(res.body.user.accounts[0].categories[0].subcategories).toHaveLength(defaultCategories[0].subcategories.length)
          expect(res.body.user.accounts[0].categories[1].subcategories).toHaveLength(defaultCategories[1].subcategories.length)
          expect(typeof res.body.token).toBe('string')
        })
    });

    it('should create a third user with other email', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockToCreateUser2)
        .expect(201)
        .then(res => {
          expect(res.body.user.accounts).toHaveLength(1)
          expect(res.body.user.accounts[0].categories).toHaveLength(defaultCategories.length)
          expect(res.body.user.accounts[0].categories[0].subcategories).toHaveLength(defaultCategories[0].subcategories.length)
          expect(res.body.user.accounts[0].categories[1].subcategories).toHaveLength(defaultCategories[1].subcategories.length)
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
        .auth(seedAdmin.token, {type: 'bearer'})
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
        .auth(userTest1.token, {type: 'bearer'})
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
        .auth(seedAdmin.token, {type: 'bearer'})
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
        .auth(userTest2.token, {type: 'bearer'})
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
        .auth('123456789', {type: 'bearer'})
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/123456789`)
        .auth(seedAdmin.token, {type: 'bearer'})
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${fakeUUID}`)
        .auth(seedAdmin.token, {type: 'bearer'})
        .expect(404)
    })
  })

  describe('update - /users/:id (PATCH)', () => {

    it('should return an updated user when updated by himself - (name)', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.user).toMatchObject({...mockUserToUpdateName})
        })
    })

    it('should return an updated user when updated by himself - (email)', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateEmail)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.user).toMatchObject({...mockUserToUpdateEmail})
        })
    })

    it('should return an updated user when updated by himself - (password)', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdatePassword)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)

      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send(mockUser1ToLogin)
        .expect(401)

      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({...mockUser1ToLogin, password: mockUserToUpdatePassword.newPassword})
        .expect(200)
    })

    it('should return an updated user when updated by an admin', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth(seedAdmin.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.user).toMatchObject({...mockUserToUpdateName})
        })
    })

    it('should return a Forbidden error when some user want to update other user', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth(userTest2.token, {type: 'bearer'})
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden'
        })
    })

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth('123456789', {type: 'bearer'})
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/123456789`)
        .send(mockUserToUpdateName)
        .auth(seedAdmin.token, {type: 'bearer'})
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${fakeUUID}`)
        .send(mockUserToUpdateName)
        .auth(seedAdmin.token, {type: 'bearer'})
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
        .auth(userTest2.token, {type: 'bearer'})
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
        .auth('123456789', {type: 'bearer'})
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized'
        })
    })

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/123456789`)
        .auth(seedAdmin.token, {type: 'bearer'})
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request'
        })
    })

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${fakeUUID}`)
        .auth(seedAdmin.token, {type: 'bearer'})
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
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.isActive).toBeFalsy()
        })
    })

    it('should change prop "isActive" of user to false when an admin closes his account', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(seedAdmin.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.isActive).toBeFalsy()
        })
    })
  })

  describe('reactivate - /users/reactivate/:id (PATCH)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/reactivate'
    })

    it('should return a Forbidden error when user try to reactivate by himself', async () => {

      // Delete account
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(seedAdmin.token, {type: 'bearer'})

      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(403, {
          statusCode: 403,
          message: 'User deleted. Contact the admin',
          error: 'Forbidden'
        })
    })

    it('should reactivate user account when an admin do it', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(seedAdmin.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.isActive).toBeTruthy()
        })
    })
  })

  describe('becomePremium - /users/premium', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/premium'
    })

    it('should return a user with roles = premium', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest1.token, {type: 'bearer'})
        .expect(200)
        .then(res => {
          expect(res.body.roles).toEqual([ValidRoles.USER_PREMIUM])
        })
    })

  })

});
