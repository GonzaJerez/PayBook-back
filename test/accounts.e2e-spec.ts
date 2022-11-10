import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { UserWithToken } from '../src/users/interfaces/UserWithToken.interface';
import {
  fakeAccountUUID,
  mockToCreateAccount,
  mockToUpdateAccount,
} from '../src/accounts/mocks/accountMocks';
import { Account } from '../src/accounts/entities/account.entity';
import { defaultCategories } from '../src/categories/data/default-categories';
import { fakeUUID } from '../src/users/mocks/userMocks';

describe('AccountsController (e2e)', () => {
  let app: INestApplication;
  const BASE_URL = '/accounts';
  let COMPLEMENT_URL = '';

  let seedUsers: UserWithToken[];
  let seedAdmin: UserWithToken;
  let userTest1: UserWithToken;
  let userTest2: UserWithToken;
  let accountTest1: Account;
  let accountTest2: Account;

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
        accountTest1 = userTest1.accounts[0];
        accountTest2 = userTest1.accounts[1];
      });
  });

  describe('create - /accounts (POST)', () => {
    it('should return a Unauthorized error when user not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}`)
        .send(mockToCreateAccount)
        .expect(401);
    });

    it('should return a BadRequest error when client not send a name', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ description: mockToCreateAccount.description })
        .expect(400);
    });

    it('should create an account', async () => {
      // Elimino cuentas para que quede espacio disponible
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest2.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}`)
        .send(mockToCreateAccount)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(201)
        .then((res) => {
          expect(res.body.account).toMatchObject({
            ...mockToCreateAccount,
            access_key: expect.any(String),
          });
          expect(res.body.account.users[0].id).toBe(userTest1.id);
          expect(res.body.account.admin_user.id).toBe(userTest1.id);
          expect(res.body.account.creator_user.id).toBe(userTest1.id);
          expect(res.body.account.categories).toHaveLength(
            defaultCategories.length,
          );
          expect(res.body.account.categories[0].subcategories).toHaveLength(
            defaultCategories[0].subcategories.length,
          );
          expect(res.body.account.categories[1].subcategories).toHaveLength(
            defaultCategories[1].subcategories.length,
          );
        });
    });

    it('should create an account with empty description', async () => {
      // Elimino cuentas para que quede espacio disponible
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200);
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest2.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}`)
        .send({ name: mockToCreateAccount.name })
        .auth(userTest1.token, { type: 'bearer' })
        .expect(201)
        .then((res) => {
          expect(res.body.account).toMatchObject({
            name: mockToCreateAccount.name,
            access_key: expect.any(String),
          });
          expect(res.body.account.users[0].id).toBe(userTest1.id);
          expect(res.body.account.admin_user.id).toBe(userTest1.id);
          expect(res.body.account.creator_user.id).toBe(userTest1.id);
        });
    });

    it('should return a Forbidden error when user no premium try to create a 2nd account', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}`)
        .send(mockToCreateAccount)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(403);
    });

    it('should create a third account for same user when he is premium', async () => {
      await request(app.getHttpServer())
        .post(`/users/premium/${userTest2.id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .send({ revenue_id: fakeUUID });

      await request(app.getHttpServer())
        .post(`${BASE_URL}`)
        .send(mockToCreateAccount)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(201)
        .then((res) => {
          expect(res.body.account).toMatchObject({
            name: mockToCreateAccount.name,
            access_key: expect.any(String),
          });
          expect(res.body.account.users[0].id).toBe(userTest2.id);
          expect(res.body.account.admin_user.id).toBe(userTest2.id);
          expect(res.body.account.creator_user.id).toBe(userTest2.id);
        });
    });
  });

  describe('findAll - /accounts (GET)', () => {
    it('should return all accounts', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.accounts.length).toBe(res.body.totalAccounts);
          expect(res.body.accounts[0]).toHaveProperty('users');
          expect(res.body.accounts[0]).toHaveProperty('creator_user');
          expect(res.body.accounts[0]).toHaveProperty('admin_user');
        });
    });
  });

  describe('findOne - /accounts/{:id} (GET)', () => {
    it('should return an account by id when is admin', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.id).toBe(accountTest1.id);
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('creator_user');
          expect(res.body).toHaveProperty('admin_user');
        });
    });

    it('should return an account by id when user belong to the account', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.id).toBe(accountTest1.id);
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('creator_user');
          expect(res.body).toHaveProperty('admin_user');
        });
    });

    it('should return a Forbidden error if user doesnt belong to the account and is not an admin', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(403);
    });

    it('should return a NotFounded error if id doesnt exist', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${fakeAccountUUID}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a BadRequest error if id is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/123456789`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(400);
    });

    it('should return the account even if it is inactive for the admin', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200);

      // Valida que se pueda ver la cuenta eliminada si es un admin
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200);
    });

    it('should return Forbidden error when try to access an account which has already been deleted', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200);

      // Al eliminar la cuenta se desvincula del usuario, por lo tanto ya no se puede acceder
      await request(app.getHttpServer())
        .get(`${BASE_URL}/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('update - /accounts/{:id]', () => {
    it('should return updated account when is updated for admin', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}`)
        .send(mockToUpdateAccount)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.account.id).toBe(accountTest1.id);
          expect(res.body.account).toMatchObject(mockToUpdateAccount);
        });
    });

    it('should return a Forbidden error when updated by a user other than account_admin', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}`)
        .send(mockToUpdateAccount)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(403);
    });

    it('should return updated account when is updated for account_admin', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/${accountTest1.id}`)
        .send(mockToUpdateAccount)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.account.id).toBe(accountTest1.id);
          expect(res.body.account).toMatchObject(mockToUpdateAccount);
        });
    });
  });

  describe('join - /accounts/join (POST)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/join';
    });

    it('should return a NotFount error when the access_key is incorrect', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ access_key: '12345678' })
        .expect(404);
    });

    it('should return a BadRequest error and when the access_key have invalid format', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ access_key: '123456789' })
        .expect(400);
    });

    it('should return a BadRequest error when user already exist in the account try to rejoin', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ access_key: accountTest1.access_key })
        .expect(400);
    });

    it('should return the account the user join', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ access_key: userTest2.accounts[0].access_key })
        .expect(200)
        .then((res) => {
          expect(res.body.account.users.at(-1).id).toBe(userTest1.id);
        });
    });

    it('should return a Forbidden error when user try to join and the account already has maximum number of users', async () => {
      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ access_key: userTest2.accounts[1].access_key })
        .expect(403);
    });

    it('should return a Forbbiden error when the account to try access was deleted', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${BASE_URL}${COMPLEMENT_URL}`)
        .auth(userTest2.token, { type: 'bearer' })
        .send({ access_key: accountTest1.access_key })
        .expect(404);
    });
  });

  describe('leave - /accounts/leave/{:id} (DELETE)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/leave';
    });

    it('should return a BadRequest error when id is a invalid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}${COMPLEMENT_URL}/123456789`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(400);
    });

    it('should return a NotFound error when id is not exist', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}${COMPLEMENT_URL}/${fakeAccountUUID}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return the updated account and change admin when the actual account_admin leaves', async () => {
      // Agrego usuario1 a la primera cuenta de usuario2
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTest1.token, { type: 'bearer' })
        .send({ access_key: userTest2.accounts[0].access_key });

      // Elimino usuario2 de su primera cuenta, quedando como admin el usuario1
      await request(app.getHttpServer())
        .delete(`${BASE_URL}${COMPLEMENT_URL}/${userTest2.accounts[0].id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.account.admin_user.id).not.toEqual(userTest2.id);
          expect(res.body.account.admin_user.id).toEqual(userTest1.id);
        });
    });

    it('should delete account when last user leave', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}${COMPLEMENT_URL}/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.account.isActive).toBeFalsy();
        });
    });
  });

  describe('pushOut - /accounts/pushout/{:id} (PATCH)', () => {
    beforeAll(() => {
      COMPLEMENT_URL = '/pushout';
    });

    it('should return a Forbidden error when a non-admin user try to pushout another user ', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${accountTest1.id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .send({ idUsers: [userTest1.id] })
        .expect(403);
    });

    it('should return a BadRequest error when id is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/123456789`)
        .auth(userTest2.token, { type: 'bearer' })
        .send({ idUsers: [userTest1.id] })
        .expect(400);
    });

    it('should return a NotFound error when not exist account whith that id', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${fakeAccountUUID}`)
        .auth(userTest2.token, { type: 'bearer' })
        .send({ idUsers: [userTest1.id] })
        .expect(404);
    });

    it('should return a BadRequest error when userId is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .send({ idUsers: ['123456789'] })
        .expect(400);
    });

    it('should return the account updated without users ejected', async () => {
      // Agrego usuario1 a la primera cuenta de usuario2
      await request(app.getHttpServer())
        .post('/accounts/join')
        .auth(userTest1.token, { type: 'bearer' })
        .send({ access_key: userTest2.accounts[0].access_key });

      // Elimino usuario1 de primera cuenta de usuario2
      await request(app.getHttpServer())
        .patch(`${BASE_URL}${COMPLEMENT_URL}/${userTest2.accounts[0].id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .send({ idUsers: [userTest1.id] })
        .expect(200)
        .then((res) => {
          expect(res.body.account.users).toHaveLength(1);
        });
    });
  });

  describe('remove - /accounts/{:id}', () => {
    it('should return a Forbidden error when other user than account_admin try to delete account', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(userTest2.token, { type: 'bearer' })
        .expect(403);
    });

    it('should return an account deleted when do it account_admin', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(seedAdmin.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.account).toMatchObject({
            isActive: false,
          });
        });
    });

    it('should return an account deleted when do it the admin', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.account).toMatchObject({
            isActive: false,
            users: [],
          });
        });
    });
  });
});
