import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';


export const CheckDevEnv = (_req: Request, _res: Response, next: NextFunction)=> {

    if (process.env.NODE_ENV === 'prod')
      throw new ForbiddenException(`Option only can be used in dev or test environment`)

    next();
}
