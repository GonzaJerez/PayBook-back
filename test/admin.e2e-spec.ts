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

    // Clean users for testing
    await request(app.getHttpServer())
      .get('/users/test/clean')
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createAdmin - /admin/register (POST)', () => {

    it('should create a new admin', async () => {
      await request(app.getHttpServer())
        .post('/admin/register')
        .send(mockAdminUser)
        .expect(201)
        .then(res => {
          adminTokenTest = res.body.token;

          delete res.body.token;
          adminTest = res.body;
        })
    })

    it('should return a Forbidden error when an admin already exist', async () => {
      await request(app.getHttpServer())
        .post('/admin/register')
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

});
