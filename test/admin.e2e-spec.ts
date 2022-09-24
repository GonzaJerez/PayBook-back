import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import {mockToCreateAdmin} from '../src/users/mocks/userMocks';

describe('AdminController (e2e)', () => {
  let app: INestApplication;

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

  beforeAll(async()=>{
    await request(app.getHttpServer())
      .get('/seed/clean')
      .expect(200,{
        message: 'DB cleaned'
      })
  })

  describe('createAdmin - /admin/register (POST)', () => {

    it('should create a new admin', async () => {
      await request(app.getHttpServer())
        .post('/admin/register')
        .send(mockToCreateAdmin)
        .expect(201)
    })

    it('should return a Forbidden error when an admin already exist', async () => {
      // Limpia DB y genera seed
      await request(app.getHttpServer())
        .get('/seed')
        .expect(200)

      await request(app.getHttpServer())
        .post('/admin/register')
        .send(mockToCreateAdmin)
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
