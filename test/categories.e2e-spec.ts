import {INestApplication, ValidationPipe} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";
import * as request from 'supertest';

import {Account} from "../src/accounts/entities/account.entity";
import {AppModule} from "../src/app.module";
import {Category} from "../src/categories/entities/category.entity";
import {UserWithToken} from "../src/users/interfaces/UserWithToken.interface";
import {mockToCreateCategory, mockToUpdateCategory} from "../src/categories/mocks/categoriesMock";
import {category1} from "../src/seed/mocks/seedMock";
import {fakeUUID} from "../src/users/mocks/userMocks";



describe('CategoriesController (e2e)', () => {
    let app: INestApplication;
    let BASE_URL='/accounts'
    let COMPLEMENT_URL='/categories'
    
    let seedUsers: UserWithToken[]
    let seedAdmin: UserWithToken
    let userTest1:UserWithToken;
    let userTest2:UserWithToken;
    let accountTest1:Account;
    // let accountTest2:Account;
    let categoryTest1:Category;
    // let categoryTest2:Category;
  
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
          userTest2 = seedUsers[1]
          accountTest1 = userTest1.accounts[0]
        //   accountTest2 = userTest1.accounts[1]
          categoryTest1 = accountTest1.categories[0]
        //   categoryTest2 = accountTest1.categories[1]
        })
    })

    describe('create - /accounts/{:idAccount}/categories (POST)', () => {

        it('should return a NotFound error when user to not belong to account try to access',async()=>{
          await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest2.token,{type:'bearer'})
            .send(mockToCreateCategory)
            .expect(404)
        })
  
        it('should return a NotFound error when user try to access to deleted account',async()=>{
          // Elimina cuenta primero
          await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateCategory)
            .expect(404)
        })
  
        it('should return a BadRequest error when already exist category on account with same name',async()=>{
          await request(app.getHttpServer())
            .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(category1)
            .expect(400)
        })
  
        it('should return a Unauthorized error when user not authenticated',async()=>{
          await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
          .send(category1)
          .expect(401)
        })
  
        it('should return a BadRequest error when name is not specified',async()=>{
          await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({})
          .expect(400)
        })
  
        it('should return category created',async()=>{
          await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToCreateCategory)
          .expect(201)
          .then(res =>{
            expect(res.body.name.toLowerCase()).toBe(mockToCreateCategory.name.toLowerCase())
            expect(res.body.account.id).toStrictEqual(accountTest1.id)
            expect(res.body.isActive).toBeTruthy()
            expect(typeof res.body.id).toBe('string')
          })
        })
  
        it('should return category reactivated when user creates category with same name another category deleted on same account',async()=>{
          // Elimino categoria primero
          await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
          .post(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
          .auth(userTest1.token,{type:'bearer'})
          .send({name: categoryTest1.name})
          .expect(201)
          .then(res =>{
            expect(res.body).toMatchObject({name: categoryTest1.name})
            expect(res.body.account.id).toBe(accountTest1.id)
            expect(res.body.isActive).toBeTruthy()
            expect(res.body.id).toBe(categoryTest1.id)
          })
        })
  
      })
  
      describe('findAll - /accounts/{:idAccount}/categories (GET)', () => {
  
        it('should return a Forbidden error when user to not belong to account try to access',async()=>{
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest2.token,{type:'bearer'})
            .expect(404)
        })
  
        it('should return a NotFound error when user try to access to deleted account',async()=>{
          // Elimina cuenta primero
          await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToCreateCategory)
            .expect(404)
        })
  
        it('should return a Unauthorized error when user not authenticated',async()=>{
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .expect(401)
        })
  
        it('should return all categories',async()=>{
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then(res=>{
              expect(res.body).toHaveLength(accountTest1.categories.length)
            })
        })
  
        // TODO:
        it('should return all categories except those for which "isActive" is false',async()=>{
          // Elimino categoria primero
          await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(200)
            .then(res=>{
              expect(res.body).toHaveLength(accountTest1.categories.length - 1)
            })
        })
  
  
      })
  
      describe('findOne - /accounts/{:idAccount}/categories/{id} (GET)', () => {
  
        it('should return a NotFound error when user to not belong to account try to access',async()=>{
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .expect(404)
        })
  
        it('should return a NotFound error when user try to access to deleted account',async()=>{
          // Elimina cuenta primero
          await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })
  
        it('should return a BadRequest error when id is not a valid uuid',async()=>{
          await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(400)
        })
  
        it('should return a NotFound error when doesnt exist category with id',async()=>{
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })
  
        it('should return a Forbidden error when category has already been deleted',async()=>{
          // Elimino categoria primero
          await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })
        
        it('should return a Unauthorized error when user not authenticated',async()=>{
          await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .expect(401)
        })
  
        it('should return a category',async()=>{
          await request(app.getHttpServer())
          .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(({body}) =>{
            expect(typeof body.id).toBe('string')
            expect(body.name).toBe(categoryTest1.name)
            expect(body.account.id).toBe(accountTest1.id)
            expect(body.isActive).toBeTruthy()
          })
        })
  
      })
  
      describe('update - /accounts/{:idAccount}/categories/{:id} (PATCH)', () => {
  
        it('should return a Forbidden error when user to not belong to account try to access',async()=>{
          await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest2.token,{type:'bearer'})
            .send(mockToUpdateCategory)
            .expect(404)
        })
  
        it('should return a NotFound error when user try to access to deleted account',async()=>{
          // Elimina cuenta primero
          await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToUpdateCategory)
            .expect(404)
        })
  
        it('should return a BadRequest error when id is not a valid uuid',async()=>{
          await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
          .auth(userTest1.token,{type:'bearer'})
          .send(mockToUpdateCategory)
          .expect(400)
        })
  
        it('should return a BadRequest error when doesnt exist category with id',async()=>{
          await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToUpdateCategory)
            .expect(404)
        })
  
        it('should return a BadRequest error when name is not specified',async()=>{
          await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send({})
            .expect(400)
        })
        
        it('should return a Unauthorized error when user not authenticated',async()=>{
          await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .send(mockToUpdateCategory)
          .expect(401)
        })
  
        it('should return a NotFound error when category has already been deleted',async()=>{
          // Elimino categoria primero
          await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .get(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })
  
        it('should return a updated category',async()=>{
          await request(app.getHttpServer())
            .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .send(mockToUpdateCategory)
            .expect(200)
            .then(({body})=>{
              expect(body).toMatchObject(mockToUpdateCategory)
              expect(body.account.id).toBe(accountTest1.id)
              expect(typeof body.id).toBe('string')
              expect(body.isActive).toBeTruthy()
            })
        })
  
      })
  
      describe('remove - /accounts/{:idAccount}/categories/{:id} (DELETE)', () => {
  
        it('should return a Forbidden error when user to not belong to account try to access',async()=>{
          await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .auth(userTest2.token,{type:'bearer'})
          .expect(404)
        })
  
        it('should return a NotFound error when user try to access to deleted account',async()=>{
          // Elimina cuenta primero
          await request(app.getHttpServer())
            .delete(`/accounts/${accountTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
            .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
            .auth(userTest1.token,{type:'bearer'})
            .expect(404)
        })
  
        it('should return a BadRequest error when id is not a valid uuid',async()=>{
          await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/123456789`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(400)
        })
  
        it('should return a Unauthorized error when user not authenticated',async()=>{
          await request(app.getHttpServer())
          .patch(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .expect(401)
        })
  
        it('should return a BadRequest error when doesnt exist category with id',async()=>{
          await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${fakeUUID}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
        })
  
        it('should return a NotFound error when when category has already been deleted',async()=>{
          // Elimino categoria primero
          await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
  
          await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(404)
        })
        
  
        it('should return a deleted category',async()=>{
          await request(app.getHttpServer())
          .delete(`${BASE_URL}/${accountTest1.id}${COMPLEMENT_URL}/${categoryTest1.id}`)
          .auth(userTest1.token,{type:'bearer'})
          .expect(200)
          .then(({body})=>{
              expect(body.isActive).toBeFalsy()
          })
        })
  
      })
})