import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  executeSeed(){
    return this.seedService.executeSeed()
  }

  @Get('clean')
  cleanDB(){
    return this.seedService.cleanDB()
  }

}
