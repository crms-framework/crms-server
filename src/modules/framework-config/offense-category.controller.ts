import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FrameworkConfigService } from './framework-config.service';
import { CreateOffenseCategoryDto, UpdateOffenseCategoryDto } from './dto/create-offense-category.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Offense Categories')
@ApiBearerAuth()
@Controller('offense-categories')
export class OffenseCategoryController {
  constructor(private readonly configService: FrameworkConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List all offense categories (tree structure)' })
  findAll() {
    return this.configService.findAllOffenseCategories();
  }

  @Post()
  @RequirePermissions('stations', 'create', 'national')
  @ApiOperation({ summary: 'Create offense category' })
  create(@Body() dto: CreateOffenseCategoryDto) {
    return this.configService.createOffenseCategory(dto);
  }

  @Patch(':id')
  @RequirePermissions('stations', 'update', 'national')
  @ApiOperation({ summary: 'Update offense category' })
  update(@Param('id') id: string, @Body() dto: UpdateOffenseCategoryDto) {
    return this.configService.updateOffenseCategory(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('stations', 'delete', 'national')
  @ApiOperation({ summary: 'Soft delete offense category' })
  remove(@Param('id') id: string) {
    return this.configService.softDeleteOffenseCategory(id);
  }
}
