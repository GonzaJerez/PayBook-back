import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { mockCreateUser } from '../src/users/mocks/userMocks';
import { User } from '../src/users/entities/user.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userTest: User;
  let userTokenTest: string;

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

    await request(app.getHttpServer())
      .get('/users/test/clean')

    await request(app.getHttpServer())
      .post('/users/register')
      .send(mockCreateUser)
      .then(res => {
        userTokenTest = res.body.token;

        delete res.body.token;
        userTest = res.body;
      })
  });

  afterAll(async () => {
    await app.close();
  });

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
