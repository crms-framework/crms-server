import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { WhatsappService } from './whatsapp.service';
import {
  CreateNewsletterDto,
  UpdateNewsletterDto,
} from './dto/whatsapp-webhook.dto';
import {
  NewsletterDetailDto,
  SubscriberFilterDto,
  PaginatedSubscribersDto,
  PaginatedBroadcastsDto,
} from './dto/newsletter-detail.dto';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'WhatsApp webhook endpoint (public — receives Whapi events)' })
  handleWebhook(@Body() body: Record<string, any>) {
    console.log('[WhatsApp Webhook] Incoming payload:', JSON.stringify(body, null, 2));
    return this.whatsappService.handleWebhook(body);
  }

  @Get('newsletters')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'List WhatsApp newsletters' })
  findAllNewsletters(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.whatsappService.findAllNewsletters(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post('newsletters')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'create', 'station')
  @ApiOperation({ summary: 'Create a WhatsApp newsletter' })
  createNewsletter(
    @Body() dto: CreateNewsletterDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.whatsappService.createNewsletter(dto, officerId);
  }

  @Patch('newsletters/:id')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Update a WhatsApp newsletter' })
  updateNewsletter(
    @Param('id') id: string,
    @Body() dto: UpdateNewsletterDto,
  ) {
    return this.whatsappService.updateNewsletter(id, dto);
  }

  @Post('newsletters/:id/broadcast')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'create', 'station')
  @ApiOperation({ summary: 'Broadcast a message to a newsletter channel' })
  broadcastNewsletter(
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return this.whatsappService.broadcastNewsletter(id, body.message);
  }

  @Get('newsletters/:id')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get newsletter details with subscribers and broadcasts' })
  @ApiResponse({ status: 200, type: NewsletterDetailDto })
  getNewsletterDetails(@Param('id') id: string) {
    return this.whatsappService.getNewsletterDetails(id);
  }

  @Delete('newsletters/:id')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'delete', 'station')
  @ApiOperation({ summary: 'Archive a newsletter' })
  archiveNewsletter(@Param('id') id: string) {
    return this.whatsappService.archiveNewsletter(id);
  }

  @Get('newsletters/:id/subscribers')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get newsletter subscribers' })
  @ApiResponse({ status: 200, type: PaginatedSubscribersDto })
  getNewsletterSubscribers(
    @Param('id') id: string,
    @Query() filters: SubscriberFilterDto,
  ) {
    return this.whatsappService.getNewsletterSubscribers(id, filters);
  }

  @Get('newsletters/:id/broadcasts')
  @ApiBearerAuth()
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get newsletter broadcast history' })
  @ApiResponse({ status: 200, type: PaginatedBroadcastsDto })
  getNewsletterBroadcasts(
    @Param('id') id: string,
    @Query() filters: SubscriberFilterDto,
  ) {
    return this.whatsappService.getNewsletterBroadcasts(id, filters);
  }
}
