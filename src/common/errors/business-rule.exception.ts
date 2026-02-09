import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class BusinessRuleException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
