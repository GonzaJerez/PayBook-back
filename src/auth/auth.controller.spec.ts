import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { mockCreateUser, mockCompleteUser, mockUserToLogin, mockUserToUpdate } from './mocks/userMocks';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    create: jest.fn().mockImplementation((createUserDto:CreateUserDto)=>({
      ...mockCompleteUser,
      token: '123456789'
    })),
    createAdmin: jest.fn().mockImplementation((createUserDto:CreateUserDto)=>({
      ...mockCompleteUser,
      token: '123456789'
    })),
    findAll: jest.fn().mockImplementation(()=>({
      users: [mockCompleteUser],
      totalUsers: 1,
      limit: 10,
      skip: 0,
    })),
    findOne: jest.fn().mockImplementation((id:string)=>(mockCompleteUser)),
    update: jest.fn().mockImplementation((id: string, updateUserDto: UpdateUserDto, user:User)=>({
      ...mockCompleteUser,
      ...updateUserDto
    })),
    remove: jest.fn().mockImplementation((id: string, userAuth:User)=> mockCompleteUser),
    login: jest.fn().mockImplementation((loginUserDto:LoginUserDto)=>({
      email: mockCompleteUser.email,
      id: mockCompleteUser.id,
      token: '123456789'
    })),
    activate: jest.fn().mockImplementation((id:string)=> mockCompleteUser),
    clearUsers: jest.fn().mockImplementation(()=>({message:'Users table clean'}))
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    })
    .overrideProvider(AuthService)
    .useValue(mockAuthService)
    .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user created with token', ()=>{
    expect(controller.create(mockCreateUser)).toEqual({
      ...mockCompleteUser,
      token: expect.any(String)
    })
  })

  it('should return admin created with token', ()=>{
    expect(controller.createAdmin(mockCreateUser)).toEqual({
      ...mockCompleteUser,
      token: expect.any(String)
    })
  })

  it('should return users', ()=>{
    expect(controller.findAll({})).toEqual({
      users: [mockCompleteUser],
      totalUsers: expect.any(Number),
      limit: expect.any(Number),
      skip: expect.any(Number),
    })
  })

  it('should return a user by id', ()=>{
    expect(controller.findOne(mockCompleteUser.id)).toEqual({
      ...mockCompleteUser
    })
  })

  it('should return updated user', ()=>{
    expect(controller.update(mockCompleteUser.id,mockUserToUpdate,mockCompleteUser)).toEqual({
      ...mockCompleteUser,
      ...mockUserToUpdate
    })
  })

  it('should return user removed', ()=>{
    expect(controller.remove(mockCompleteUser.id, mockCompleteUser)).toEqual({
      ...mockCompleteUser
    })
  })

  it('should return user loged', ()=>{
    expect(controller.login(mockUserToLogin)).toEqual({
      email: mockUserToLogin.email,
      id: expect.any(String),
      token: expect.any(String)
    })
  })

  it('should return user reactivated', ()=>{
    expect(controller.activate(mockCompleteUser.id)).toEqual({
      ...mockCompleteUser,
    })
  })

  it('should return user reactivated', ()=>{
    expect(controller.clearUsers()).toEqual({message:'Users table clean'})
  })
});
