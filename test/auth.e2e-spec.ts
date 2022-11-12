import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { UserWithToken } from '../src/users/interfaces/UserWithToken.interface';
import {
  fakeTokenGoogle,
  mockToCreateUser,
  mockUser1ToLogin,
} from '../src/users/mocks/userMocks';
import { PASSWORD_TEST } from '../src/seed/mocks/seedMock';
import { UsersService } from '../src/users/users.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let service: UsersService;
  let seedUsers: UserWithToken[];
  let seedAdmin: UserWithToken;
  const BASE_URL = '/auth';
  let COMPLEMENT_URL = '';

  let userTest1: UserWithToken;

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
      });
  });

  describe('login - /auth/login (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/login';
    });

    it('should login user when credentials are corrects', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockUser1ToLogin)
        .expect(200)
        .then((res) => {
          expect(res.body.user).toMatchObject({
            email: userTest1.email,
            id: userTest1.id,
          });
          expect(typeof res.body.token).toBe('string');
        });
    });

    it('should return an BadRequest error when password does not satisfy the requirements ', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({
          email: mockUser1ToLogin.email,
          password: 'ABC',
        })
        .expect(400);
    });

    it('should return an BadRequest error when email does not satisfy the requirements ', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({
          email: 'otroemailgmail.com',
          password: mockUser1ToLogin.password,
        })
        .expect(400)
        .then((res) => {
          expect(res.body).toEqual({
            statusCode: 400,
            message: [expect.any(String)],
            error: 'Bad Request',
          });
        });
    });

    it('should return an Unauthorized error user when credentials (password) are incorrect', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({
          email: mockUser1ToLogin.email,
          password: 'Abc12345',
        })
        .expect(401);
    });

    it('should return an Unauthorized error user when credentials (email) are incorrect', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({
          email: 'otro-test@gmail.com',
          password: mockUser1ToLogin.password,
        })
        .expect(401);
    });
  });

  describe('checkToken - /auth/checkToken (GET)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/checkToken';
    });

    it('should return a new token when token is valid', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.user.id).toBe(userTest1.id);
          expect(typeof res.body.token).toBe('string');
        });
    });

    it('should return a Unauthorized error when token is invalid', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth('123456789', { type: 'bearer' })
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
        .post(`/users/google`)
        .send(fakeTokenGoogle)
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send({ email: emailToTestPasswordRecovery })
        .expect(403);
    });

    it.skip('should send a email with security code and return a success message', async () => {
      await request(app.getHttpServer())
        .post(`/users/register`)
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
        .post(`/users/register`)
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
        .post(`/users/register`)
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
        .post(`${BASE_URL}/login`)
        .send({
          email: userTest1.email,
          password: PASSWORD_TEST,
        })
        .expect(401);

      await request(app.getHttpServer())
        .post(`${BASE_URL}/login`)
        .send({
          email: userTest1.email,
          password: newPassword,
        })
        .expect(200);
    });
  });
});
