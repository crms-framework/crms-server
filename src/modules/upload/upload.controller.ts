import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { UploadService } from './upload.service';
import { PresignedUploadDto } from './dto/presigned-upload.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned')
  @RequirePermissions('evidence', 'create', 'station')
  @ApiOperation({ summary: 'Generate a presigned URL for file upload' })
  generatePresignedUploadUrl(@Body() dto: PresignedUploadDto) {
    return this.uploadService.generatePresignedUploadUrl(dto.key, dto.contentType);
  }

  @Post('presigned-download')
  @RequirePermissions('evidence', 'read', 'station')
  @ApiOperation({ summary: 'Generate a presigned URL for file download' })
  generatePresignedDownloadUrl(@Body() body: { key: string }) {
    return this.uploadService.generatePresignedDownloadUrl(body.key);
  }

  @Delete(':key')
  @RequirePermissions('evidence', 'delete', 'station')
  @ApiOperation({ summary: 'Delete a file from S3' })
  deleteObject(@Param('key') key: string) {
    return this.uploadService.deleteObject(key);
  }
}
