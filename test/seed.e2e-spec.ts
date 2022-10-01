import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';


describe('SeedController (e2e)', () => {
  let app: INestApplication;
  let BASE_URL='/seed'
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

  describe('executeSeed - /seed (GET)', () => {

    it('should return a Forbidden error when try to execute seed on non development environment', async () => {
      process.env.NODE_ENV = 'prod'
      await request(app.getHttpServer())
        .get(BASE_URL)
        .expect(403)
      process.env.NODE_ENV = 'dev'
    })

    it('should execute a seed', async () => {
      await request(app.getHttpServer())
        .get(BASE_URL)
        .expect(200)
        .then(res => {
          expect(res.body.message).toBe('Seed executed')
          expect(res.body.users).toHaveLength(3)
          expect(res.body.users[0]).toMatchObject({
            email: expect.any(String),
            fullName: expect.any(String),
            id: expect.any(String),
            isActive: true,
            token: expect.any(String),
            accounts: expect.any(Object),
            accounts_admin: expect.any(Object),
            accounts_owner: expect.any(Object),
          })
          expect(res.body.admin).toMatchObject({
            email: expect.any(String),
            fullName: expect.any(String),
            id: expect.any(String),
            isActive: true,
            token: expect.any(String),
          })
        })
    })
  })

  describe('cleanDB - /seed/clean (GET)', () => {
    beforeAll(()=>{
      COMPLEMENT_URL='/clean'
    })

    it('should return a Forbidden error when try to execute seed on non development environment', async () => {
      process.env.NODE_ENV = 'prod'
      await request(app.getHttpServer())
        .get(`${BASE_URL}${COMPLEMENT_URL}`)
        .expect(403)
      process.env.NODE_ENV = 'dev'
    })

    it('should clean DB', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}${COMPLEMENT_URL}`)
        .expect(200, {
          message: 'DB cleaned'
        })
    })

  })

});
