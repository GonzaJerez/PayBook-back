import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

describe('SeedController (e2e)', () => {
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

  describe('executeSeed - /seed (GET)', () => {

    it('should return a Forbidden error when try to execute seed on non development environment', async () => {
      process.env.STAGE = 'prod'
      await request(app.getHttpServer())
        .get('/seed')
        .expect(403)
      process.env.STAGE = 'dev'
    })

    it('should execute a seed', async () => {
      await request(app.getHttpServer())
        .get('/seed')
        .expect(200,{
          message:'Seed executed'
        })
    })
  })

});
