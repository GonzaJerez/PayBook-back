import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import {
  fakeTokenGoogle,
  fakeUUID,
  mockToCreateUser,
  mockToCreateUser2,
  mockUser1ToLogin,
  mockUserToUpdateEmail,
  mockUserToUpdateName,
  mockUserToUpdatePassword,
} from '../src/users/mocks/userMocks';
import { UserWithToken } from '../src/users/interfaces/UserWithToken.interface';
import { ValidRoles } from '../src/auth/interfaces';
import { UsersService } from '../src/users/users.service';
import { PASSWORD_TEST, user1 } from '../src/seed/mocks/seedMock';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let service: UsersService;
  let seedUsers: UserWithToken[];
  let seedAdmin: UserWithToken;
  const BASE_URL = '/users';
  let COMPLEMENT_URL = '';

  let userTest1: UserWithToken;
  let userTest2: UserWithToken;

  const emailToTestPasswordRecovery = 'gonzalojerezn@gmail.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    process.env.NODE_ENV = 'test';

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    service = moduleFixture.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await request(app.getHttpServer())
      .get('/seed')
      .expect(200)
      .then((res) => {
        seedUsers = res.body.users;
        seedAdmin = res.body.admin;

        userTest1 = seedUsers[0];
        userTest2 = seedUsers[1];
      });
  });

  describe('google - /users/google', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/google';
    });

    it('should return a BadRequest when tokenGoogle doesnt exist', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(401);
    });

    it('should return user with token and create user when doesnt exist user with same email', async () => {
      jest.spyOn(service, 'googleVerify').mockImplementation(async () => ({
        name: mockToCreateUser.fullName,
        email: mockToCreateUser.email,
      }));

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(200)
        .then((res) => {
          expect(res.body.user.google).toBeTruthy();
          expect(typeof res.body.token).toBe('string');
        });
    });

    it('should return user with token when user already registred with google', async () => {
      jest.spyOn(service, 'googleVerify').mockImplementation(async () => ({
        name: mockToCreateUser.fullName,
        email: mockToCreateUser.email,
      }));

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(200);
    });

    it('should return Unauthorized error when user regitred with email', async () => {
      jest.spyOn(service, 'googleVerify').mockImplementation(async () => ({
        name: user1.fullName,
        email: user1.email,
      }));

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(401);
    });

    it('should return Forbidden error when user already been deleted', async () => {
      jest.spyOn(service, 'googleVerify').mockImplementation(async () => ({
        name: user1.fullName,
        email: user1.email,
      }));

      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.isActive).toBeFalsy();
        });

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(fakeTokenGoogle)
        .expect(401);
    });
  });

  describe('register - /users/register (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/register';
    });

    it('should create a new user', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockToCreateUser)
        .expect(201)
        .then((res) => {
          expect(res.body.user.google).toBeFalsy();
          expect(typeof res.body.token).toBe('string');
        });
    });

    it('should create a third user with other email', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockToCreateUser2)
        .expect(201)
        .then((res) => {
          expect(res.body.user.google).toBeFalsy();
          expect(typeof res.body.token).toBe('string');
        });
    });

    it('should return an Unauthorized error when email user already exist', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockToCreateUser);

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockToCreateUser)
        .expect(401);
    });
  });

  describe('findAll - /users (GET)', () => {
    it('should return all users', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.totalUsers).toBe(seedUsers.length + 1 || 10);
          expect(res.body.limit).toBe(10);
          expect(res.body.skip).toBe(0);
        });
    });

    it('should return an unauthorized error when req not contain token', async () => {
      await request(app.getHttpServer()).get(`${BASE_URL}`).expect(401);
    });
  });

  describe('findOne - /users:id (GET)', () => {
    it('should return a user by id when is same user', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body).toMatchObject({ id: userTest1.id });
          expect(res.body).toHaveProperty('accounts');
          expect(res.body).toHaveProperty('accounts_owner');
          expect(res.body).toHaveProperty('accounts_admin');
        });
    });

    it('should return a user by id when is admin', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${userTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body).toMatchObject({ id: userTest1.id });
          expect(res.body).toHaveProperty('accounts');
          expect(res.body).toHaveProperty('accounts_owner');
          expect(res.body).toHaveProperty('accounts_admin');
        });
    });

    it('should return a Forbidden error when is other user', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${userTest1.id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(403);
    });

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${userTest1.id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized',
        });
    });

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${userTest1.id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized',
        });
    });

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/123456789`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request',
        });
    });

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${fakeUUID}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(404);
    });
  });

  describe('update - /users/:id (PATCH)', () => {
    it('should return an updated user when updated by himself - (name)', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.user).toMatchObject({ ...mockUserToUpdateName });
        });
    });

    it('should return an updated user when updated by himself - (email)', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateEmail)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.user).toMatchObject({ ...mockUserToUpdateEmail });
        });
    });

    it('should return an updated user when updated by himself - (password)', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdatePassword)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send(mockUser1ToLogin)
        .expect(401);

      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({
          ...mockUser1ToLogin,
          password: mockUserToUpdatePassword.newPassword,
        })
        .expect(200);
    });

    it('should return an updated user when updated by an admin', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.user).toMatchObject({ ...mockUserToUpdateName });
        });
    });

    it('should return a Forbidden error when some user want to update other user', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden',
        });
    });

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized',
        });
    });

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${userTest1.id}`)
        .send(mockUserToUpdateName)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized',
        });
    });

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/123456789`)
        .send(mockUserToUpdateName)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request',
        });
    });

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${fakeUUID}`)
        .send(mockUserToUpdateName)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(404)
        .then((res) => {
          expect(res.body).toEqual({
            statusCode: 404,
            message: expect.any(String),
            error: 'Not Found',
          });
        });
    });
  });

  describe('remove (1) - /users/:id (DELETE)', () => {
    it('should return a Forbidden error when some user want to remove other user', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: "You don't have permission to perform this action",
          error: 'Forbidden',
        });
    });

    it('should return an unauthorized error when not exist token', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized',
        });
    });

    it('should return an unauthorized error when token is not valid', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth('123456789', { type: 'bearer' })
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized',
        });
    });

    it('should return a BadRequest error when id isnt a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/123456789`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(400, {
          statusCode: 400,
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request',
        });
    });

    it('should return a BadRequest error when id doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${fakeUUID}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(404)
        .then((res) => {
          expect(res.body).toEqual({
            statusCode: 404,
            message: expect.any(String),
            error: 'Not Found',
          });
        });
    });

    it('should change prop "isActive" to false when user closes his account', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.isActive).toBeFalsy();
        });
    });

    it('should change prop "isActive" of user to false when an admin closes his account', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.isActive).toBeFalsy();
        });
    });
  });

  describe('reactivate - /users/reactivate/:id (PATCH)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/reactivate';
    });

    it('should return a Forbidden error when user try to reactivate by himself', async () => {
      // Delete account
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${userTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(403, {
          statusCode: 403,
          message: 'User deleted. Contact the admin',
          error: 'Forbidden',
        });
    });

    it('should reactivate user account when an admin do it', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.user.isActive).toBeTruthy();
        });
    });
  });

  describe('becomePremium - /users/premium/{:id} (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/premium';
    });

    it('should return a user with roles = premium', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ revenue_id: fakeUUID })
        .expect(200)
        .then((res) => {
          expect(res.body.user.roles).toEqual([ValidRoles.USER_PREMIUM]);
          expect(res.body.user.revenue_id).toBe(fakeUUID);
        });
    });

    it('should return a Bad Request error when doesnt exist revenue_id', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(400);
    });

    it('should return a Unathorized error when user is not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .send({ revenue_id: fakeUUID })
        .expect(401);
    });
  });

  describe('removePremium - /users/premium/{:id} (DELETE)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/premium';
    });

    it('should return a user with roles = user', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ revenue_id: fakeUUID })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.user.roles).toEqual([ValidRoles.USER]);
          expect(res.body.user.revenue_id).toBe(null);
        });
    });

    it('should return a Unathorized error when user is not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}${COMPLEMENT_URL}/${userTest1.id}`)
        .expect(401);
    });
  });

  describe('passwordRecovery - /users/password-recovery (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/password-recovery';
    });

    it('should return a Bad Request error when doesnt exist email to recovery password', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .expect(400);
    });

    it('should send a Not Found error when doesnt exist user with this email', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(404);
    });

    it('should send a Forbidden error when user was registred with google', async () => {
      jest.spyOn(service, 'googleVerify').mockImplementation(async () => ({
        name: mockToCreateUser.fullName,
        email: emailToTestPasswordRecovery,
      }));

      await request(app.getHttpServer())
        .post(`${BASE_URL}/google`)
        .send(fakeTokenGoogle)
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(403);
    });

    it.skip('should send a email with security code and return a success message', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}/register`)
        .send({ ...mockToCreateUser, email: emailToTestPasswordRecovery })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(200)
        .then((res) => {
          expect(res.body.ok).toBeTruthy();
          expect(typeof res.body.message).toBe('string');
        });
    });
  });

  describe('validateSecurityCode - /users/validate-security-code (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/validate-security-code';
    });

    it('should return a Bad Request error when doesnt exist email to validate code', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ code: 123456 })
        .expect(400);
    });

    it('should return a Bad Request error when doesnt exist code to validate', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(400);
    });

    it('should send a Not Found error when doesnt exist user with this code security', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery, code: '123456' })
        .expect(404);
    });

    it.skip('should return a Not Found error when code security is incorrect', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}/register`)
        .send({ ...mockToCreateUser, email: emailToTestPasswordRecovery })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE_URL}/password-recovery`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery, code: '123456' })
        .expect(404);
    });

    it.skip('should return a success message when code and email are corrects', async () => {
      let userCreatedId = '';
      let securityCodeUser = '';

      await request(app.getHttpServer())
        .post(`${BASE_URL}/register`)
        .send({ ...mockToCreateUser, email: emailToTestPasswordRecovery })
        .expect(201)
        .then((res) => {
          userCreatedId = res.body.user.id;
        });

      await request(app.getHttpServer())
        .post(`${BASE_URL}/password-recovery`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(200);

      await request(app.getHttpServer())
        .get(`${BASE_URL}/${userCreatedId}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          securityCodeUser = res.body.temporalSecurityCode;
        });

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({
          email: emailToTestPasswordRecovery,
          code: String(securityCodeUser),
        })
        .expect(200)
        .then((res) => {
          expect(res.body.ok).toBeTruthy();
          expect(typeof res.body.message).toBe('string');
        });

      await request(app.getHttpServer())
        .get(`${BASE_URL}/${userCreatedId}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.temporalSecurityCode).toBe(null);
        });
    });
  });

  describe('renewPassword - /users/renew-password (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/renew-password';
    });

    it('should return a Bad Request error when doesnt exist email to renew password', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ password: PASSWORD_TEST })
        .expect(400);
    });

    it('should return a Bad Request error when doesnt exist password to renew', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(400);
    });

    it('should send a Not Found error when doesnt exist user with this email', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery, password: PASSWORD_TEST })
        .expect(404);
    });

    it('should return a Forbidden error when the password is the same at last one', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: userTest1.email, password: PASSWORD_TEST })
        .expect(403);
    });

    it('should return a success message when password is updated successfully', async () => {
      const newPassword = 'Abcde12345';
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: userTest1.email, password: newPassword })
        .expect(200)
        .then((res) => {
          expect(res.body.ok).toBeTruthy();
          expect(typeof res.body.message).toBe('string');
        });

      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({
          email: userTest1.email,
          password: PASSWORD_TEST,
        })
        .expect(401);

      await request(app.getHttpServer())
        .post(`/auth/login`)
        .send({
          email: userTest1.email,
          password: newPassword,
        })
        .expect(200);
    });
  });
});
