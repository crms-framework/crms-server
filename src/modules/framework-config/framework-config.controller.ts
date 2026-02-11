import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FrameworkConfigService } from './framework-config.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Framework Config')
@ApiBearerAuth()
@Controller('framework-config')
export class FrameworkConfigController {
  constructor(private readonly configService: FrameworkConfigService) {}

  @Get()
  @RequirePermissions('settings', 'read', 'station')
  @ApiOperation({ summary: 'List all config grouped by category' })
  findAll(@Query('category') category?: string) {
    if (category) return this.configService.findByCategory(category);
    return this.configService.findAll();
  }

  @Get('deployment')
  @RequirePermissions('settings', 'read', 'station')
  @ApiOperation({ summary: 'Get all deployment configuration' })
  async getDeploymentConfig() {
    const keys = [
      'deployment.country',
      'deployment.national_id',
      'deployment.language',
      'deployment.currency',
      'deployment.police_structure',
      'deployment.legal_framework',
      'deployment.telecom',
      'deployment.integrations',
      'deployment.features',
    ];
    const results = await Promise.all(
      keys.map((k) => this.configService.findByKey(k).catch(() => null)),
    );
    return {
      country: results[0],
      nationalId: results[1],
      language: results[2],
      currency: results[3],
      policeStructure: results[4],
      legalFramework: results[5],
      telecom: results[6],
      integrations: results[7],
      features: results[8],
    };
  }

  @Get(':key')
  @RequirePermissions('settings', 'read', 'station')
  @ApiOperation({ summary: 'Get config by key' })
  findByKey(@Param('key') key: string) {
    return this.configService.findByKey(key);
  }

  @Put(':key')
  @RequirePermissions('settings', 'update', 'national')
  @ApiOperation({ summary: 'Upsert config (SuperAdmin/Admin only)' })
  upsert(@Param('key') key: string, @Body() dto: UpsertConfigDto) {
    return this.configService.upsert(key, dto);
  }

  @Delete(':key')
  @RequirePermissions('settings', 'delete', 'national')
  @ApiOperation({ summary: 'Delete config (non-system only)' })
  delete(@Param('key') key: string) {
    return this.configService.delete(key);
  }
}
