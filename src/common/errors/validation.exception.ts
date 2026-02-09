import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class ValidationException extends AppException {
  constructor(message: string = 'Validation failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
