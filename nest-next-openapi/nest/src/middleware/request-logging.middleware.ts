// src/middleware/request-logging.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private logger = new Logger('RequestLogger')

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`)
    this.logger.log(`Cookies: ${JSON.stringify(req.cookies)}`)
    next()
  }
}
