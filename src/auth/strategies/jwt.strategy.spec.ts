import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../../users/entities/user.entity';
import { mockCompleteUser } from '../../users/mocks/userMocks';
import { JwtStrategy } from './jwt.strategy';


describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  const mockUserRepository = {
    findOneBy: jest.fn().mockImplementation(()=>mockCompleteUser),
  }

  const mockConfigService = {
    get: jest.fn().mockImplementation(()=>'tokenSecreto')
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        },
        ConfigService
      ],
    })
    .overrideProvider(ConfigService)
    .useValue(mockConfigService)
    .compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('should return user', async()=>{
    expect(await jwtStrategy.validate({id:mockCompleteUser.id})).toEqual({
        ...mockCompleteUser,
    })
  })

});
