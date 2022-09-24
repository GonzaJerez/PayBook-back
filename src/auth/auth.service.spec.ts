import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt'

import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { UpdateUserDto } from '../users/dtos/update-user.dto';
import { User } from '../users/entities/user.entity';
import { mockCompleteUser, mockCreateUser, mockUserToLogin, mockUserToUpdate } from '../users/mocks/userMocks';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    create: jest.fn().mockImplementation((createAuthDto: CreateUserDto)=>({
        ...mockCompleteUser
    })),
    save: jest.fn().mockImplementation(()=>({
      ...mockCompleteUser,
    })),
    findAndCount:jest.fn().mockImplementation(()=>([[mockCompleteUser],1])),
    findOneBy: jest.fn().mockImplementation(()=>mockCompleteUser),
    preload: jest.fn().mockImplementation((updateUserDto:UpdateUserDto)=>({
      ...mockCompleteUser,
      ...updateUserDto
    })),
    findOne: jest.fn().mockImplementation(()=>({
      ...mockUserToLogin,
      password: bcrypt.hashSync(mockUserToLogin.password, 10),
      id: mockCompleteUser.id
    })),
    delete: jest.fn()
  }

  const mockJwtService = {
    sign: jest.fn().mockImplementation(()=>'123456789')
  }

  const mockConfigService = {
    get: jest.fn().mockImplementation(()=>'dev')
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        },
        JwtService,
        ConfigService
      ],
    })
    .overrideProvider(JwtService)
    .useValue(mockJwtService)
    .overrideProvider(ConfigService)
    .useValue(mockConfigService)
    .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdmin', () => { 
    it('should return admin created with token', async()=>{
      expect(await service.create(mockCreateUser)).toEqual({
        ...mockCompleteUser,
        token: expect.any(String)
      })
    })
  })

  describe('create', () => { 
    it('should return user created with token', async()=>{
      expect(await service.create(mockCreateUser)).toEqual({
        ...mockCompleteUser,
        token: expect.any(String)
      })
    })
  })

  describe('findAll', () => { 
    it('should return array of users', async()=>{
      expect(await service.findAll({})).toEqual({
        totalUsers: 1,
        limit: 10,
        skip: 0,
        users: [mockCompleteUser],
      })
    })

    it('should return array of users, with querys', async()=>{
      const LIMIT = 5;
      const OFFSET = 10;

      expect(await service.findAll({limit:LIMIT,offset:OFFSET})).toEqual({
        totalUsers: 1,
        limit: LIMIT,
        skip: OFFSET,
        users: [mockCompleteUser],
      })
    })
  })

  describe('findOne', () => {
    it('should return a user by id', async()=>{
      expect(await service.findOne(mockCompleteUser.id)).toEqual({
        ...mockCompleteUser
      })
    })
  })

  describe('update', () => {
    it('should return a user updated', async()=>{
      expect(await service.update(mockCompleteUser.id,mockUserToUpdate,mockCompleteUser)).toEqual({
        ...mockCompleteUser,
        ...mockUserToUpdate
      })
    })
  })

  describe('remove', () => {
    it('should return a user removed', async()=>{
      expect(await service.remove(mockCompleteUser.id,mockCompleteUser)).toEqual({
        ...mockCompleteUser
      })
    })
  })

  describe('login', () => {
    it('should return a user loged', async()=>{
      expect(await service.login(mockUserToLogin)).toEqual({
        email: mockUserToLogin.email,
        id: expect.any(String),
        token: expect.any(String)
      })
    })
  })

  describe('activate', () => {
    it('should return a user reactivated', async()=>{
      mockCompleteUser.isActive = false;

      expect(await service.activate(mockCompleteUser.id)).toEqual({
        ...mockCompleteUser,
        isActive: true
      })
    })
  })

  describe('cleanUsers', () => {
    it('should return a message when de table users was cleaned', async()=>{

      expect(await service.cleanUsers()).toEqual({
        message: "Users table clean",
      })
    })
  })
});
