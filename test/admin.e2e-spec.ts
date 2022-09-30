import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import {mockToCreateAdmin} from '../src/users/mocks/userMocks';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  const BASE_URL='/admin'
  let COMPLEMENT_URL=''

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
  })

  
  describe('createAdmin - /admin/register (POST)', () => {
    beforeAll(()=>{
      COMPLEMENT_URL='/register'
    })

    it('should create a new admin', async () => {

      // Limpio DB
      await request(app.getHttpServer())
        .get('/seed/clean')
        .expect(200)

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .send(mockToCreateAdmin)
        .expect(201)
    })

    it('should return a Forbidden error when an admin already exist', async () => {
      // Limpia DB y genera seed
      await request(app.getHttpServer())
        .get('/seed')
        .expect(200)

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
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
