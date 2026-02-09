import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
  ) {
    super(message, statusCode);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}
