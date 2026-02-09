import { PartialType } from '@nestjs/swagger';
import { CreateCaseDto } from './create-case.dto.js';

export class UpdateCaseDto extends PartialType(CreateCaseDto) {}
