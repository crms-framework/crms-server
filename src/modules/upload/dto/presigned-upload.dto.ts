import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PresignedUploadDto {
  @ApiProperty({ description: 'S3 object key (path/filename)' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'MIME content type of the file' })
  @IsString()
  @IsNotEmpty()
  contentType: string;
}
