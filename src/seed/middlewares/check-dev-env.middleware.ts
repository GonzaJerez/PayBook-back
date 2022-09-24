import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CheckDevEnv implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction) {
    
    if (process.env.STAGE !== 'dev')
      throw new ForbiddenException(`Option only can be used in dev environment`)

    next();
  }
}