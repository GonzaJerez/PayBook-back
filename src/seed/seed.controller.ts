import { Controller, Get } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@ApiForbiddenResponse({
  description: 'Only can be used in dev or test environment',
})
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  @ApiOkResponse({ description: 'Seed executed' })
  executeSeed() {
    return this.seedService.executeSeed();
  }

  @Get('clean')
  @ApiOkResponse({ description: 'DB cleaned' })
  cleanDB() {
    return this.seedService.cleanDB();
  }
}
