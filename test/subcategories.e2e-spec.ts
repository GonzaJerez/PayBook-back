import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { Account } from '../src/accounts/entities/account.entity';
import { AppModule } from '../src/app.module';
import { Category } from '../src/categories/entities/category.entity';
import { Subcategory } from '../src/subcategories/entities/subcategory.entity';
import { UserWithToken } from '../src/users/interfaces/UserWithToken.interface';
import {
  mockToCreateCategory,
  mockToUpdateCategory,
} from '../src/categories/mocks/categoriesMock';
import { subcategory1 } from '../src/seed/mocks/seedMock';
import { fakeUUID } from '../src/users/mocks/userMocks';
import {
  mockToCreateSubcategory,
  mockToUpdateSubcategory,
} from '../src/subcategories/mocks/subcategoriesMocks';

describe('SubategoriesController (e2e)', () => {
  let app: INestApplication;
  let seedUsers: UserWithToken[];
  let seedAdmin: UserWithToken;
  const BASE_URL = '/accounts';
  const COMPLEMENT_URL = '/subcategories';

  let userTest1: UserWithToken;
  let userTest2: UserWithToken;
  let accountTest1: Account;
  // let accountTest2:Account;
  let categoryTest1: Category;
  // let categoryTest2:Category;
  let subcategoryTest1: Subcategory;

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
        // accountTest2 = userTest1.accounts[1]
        categoryTest1 = accountTest1.categories[0];
        // categoryTest2 = accountTest1.categories[1]
        subcategoryTest1 = categoryTest1.subcategories[0];
      });
  });

  describe('create - /accounts/{:idAccount}/categories/{:idCategory}/subcategory (POST)', () => {
    it('should return a NotFound error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .post(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest2.token, { type: 'bearer' })
        .send(subcategory1)
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted account', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .post(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(subcategory1)
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted category', async () => {
      // Elimino categoria primero
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .post(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(subcategory1)
        .expect(404);
    });

    it('should return a BadRequest error when already exist subcategory on category with same name', async () => {
      await request(app.getHttpServer())
        .post(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(subcategory1)
        .expect(400);
    });

    it('should return a Unauthorized error when user not authenticated', async () => {
      await request(app.getHttpServer())
        .post(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .send(subcategory1)
        .expect(401);
    });

    it('should return a BadRequest error when name is not specified', async () => {
      await request(app.getHttpServer())
        .post(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send({})
        .expect(400);
    });

    it('should return subcategory created', async () => {
      await request(app.getHttpServer())
        .post(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToCreateSubcategory)
        .expect(201)
        .then((res) => {
          expect(res.body.subcategory.name.toLowerCase()).toBe(
            mockToCreateSubcategory.name.toLowerCase(),
          );
          expect(res.body.subcategory.category.id).toBe(categoryTest1.id);
          expect(res.body.subcategory.isActive).toBeTruthy();
          expect(typeof res.body.subcategory.id).toBe('string');
        });
    });
  });

  describe('findAll - /accounts/{:idAccount}/categories/{:idCategory}/subcategory (GET)', () => {
    it('should return a Forbidden error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest2.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted account', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToCreateCategory)
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted category', async () => {
      // Elimino categoria primero
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToCreateCategory)
        .expect(404);
    });

    it('should return a Unauthorized error when user not authenticated', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .expect(401);
    });

    it('should return all subcategories', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.subcategories).toHaveLength(
            categoryTest1.subcategories.length,
          );
        });
    });

    it('should return all subcategories except those for which "isActive" is false', async () => {
      // Elimino subcategoria primero
      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then((res) => {
          expect(res.body.subcategories).toHaveLength(
            categoryTest1.subcategories.length - 1,
          );
        });
    });
  });

  describe('findOne - /accounts/{:idAccount}/categories/{:idCategory}/subcategory/{:id} (GET)', () => {
    it('should return a NotFound error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest2.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted account', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted category', async () => {
      // Elimino categoria primero
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200);

      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a BadRequest error when id is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/123456789`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(400);
    });

    it('should return a NotFound error when doesnt exist subcategory with id', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${fakeUUID}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a Forbidden error when category has already been deleted', async () => {
      // Elimino subcategoria primero
      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a Unauthorized error when user not authenticated', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .expect(401);
    });

    it('should return a subcategory', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then(({ body }) => {
          expect(typeof body.subcategory.id).toBe('string');
          expect(body.subcategory.name).toBe(subcategoryTest1.name);
          expect(body.subcategory.category.id).toBe(categoryTest1.id);
          expect(body.subcategory.isActive).toBeTruthy();
        });
    });
  });

  describe('update - /accounts/{:idAccount}/categories/{:idCategory}/subcategory/{:id} (PATCH)', () => {
    it('should return a Forbidden error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest2.token, { type: 'bearer' })
        .send(mockToUpdateSubcategory)
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted account', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToUpdateCategory)
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted category', async () => {
      // Elimino categoria primero
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToUpdateCategory)
        .expect(404);
    });

    it('should return a BadRequest error when id is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/123456789`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToUpdateSubcategory)
        .expect(400);
    });

    it('should return a BadRequest error when doesnt exist subcategory with id', async () => {
      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${fakeUUID}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToUpdateSubcategory)
        .expect(404);
    });

    it('should return a BadRequest error when name is not specified', async () => {
      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send({})
        .expect(400);
    });

    it('should return a Unauthorized error when user not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .send(mockToUpdateSubcategory)
        .expect(401);
    });

    it('should return a NotFound error when category has already been deleted', async () => {
      // Elimino subcategoria primero
      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .get(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a updated subcategory', async () => {
      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .send(mockToUpdateSubcategory)
        .expect(200)
        .then(({ body }) => {
          expect(body.subcategory).toMatchObject(mockToUpdateSubcategory);
          expect(body.subcategory.category.id).toBe(categoryTest1.id);
          expect(typeof body.subcategory.id).toBe('string');
          expect(body.subcategory.isActive).toBeTruthy();
        });
    });
  });

  describe('remove - /accounts/{:idAccount}/categories/{:idCategory}/subcategory/{:id} (DELETE)', () => {
    it('should return a Forbidden error when user to not belong to account try to access', async () => {
      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest2.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted account', async () => {
      // Elimina cuenta primero
      await request(app.getHttpServer())
        .delete(`/accounts/${accountTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a NotFound error when user try to access to deleted category', async () => {
      // Elimino categoria primero
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}`)
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a BadRequest error when id is not a valid uuid', async () => {
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/${accountTest1.id}/categories/123456789`)
        .auth(userTest1.token, { type: 'bearer' })
        .expect(400);
    });

    it('should return a Unauthorized error when user not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .expect(401);
    });

    it('should return a BadRequest error when doesnt exist subcategory with id', async () => {
      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${fakeUUID}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a NotFound error when when subcategory has already been deleted', async () => {
      // Elimino subcategoria primero
      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' });

      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(404);
    });

    it('should return a deleted subcategory', async () => {
      await request(app.getHttpServer())
        .delete(
          `${BASE_URL}/${accountTest1.id}/categories/${categoryTest1.id}${COMPLEMENT_URL}/${subcategoryTest1.id}`,
        )
        .auth(userTest1.token, { type: 'bearer' })
        .expect(200)
        .then(({ body }) => {
          expect(body.isActive).toBeFalsy();
        });
    });
  });
});
