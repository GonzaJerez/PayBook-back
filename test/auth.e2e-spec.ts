import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import {UserWithToken} from '../src/users/interfaces/UserWithToken.interface';
import {mockUser1ToLogin} from '../src/users/mocks/userMocks';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let seedUsers: UserWithToken[]
  let seedAdmin: UserWithToken
  const BASE_URL='/auth'
  let COMPLEMENT_URL=''

  let userTest1:UserWithToken;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    process.env.NODE_ENV = 'test'

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
      })
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
