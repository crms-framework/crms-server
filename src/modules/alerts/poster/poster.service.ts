/**
 * Poster Service
 *
 * NestJS service for generating alert posters (PDF and images)
 * Handles poster generation, branding configuration, and audit logging
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { AlertsRepository } from '../alerts.repository';
import {
  PosterFormat,
  PosterGenerationResult,
  WantedPosterData,
  AmberAlertPosterData,
  PosterBranding,
} from './poster.types';
import { getPosterConfig } from './poster.config';
import {
  generateWantedPosterImage,
  generateAmberAlertPosterImage,
} from './poster-image-generator';

@Injectable()
export class PosterService {
  private readonly logger = new Logger(PosterService.name);

  constructor(
    private readonly alertsRepository: AlertsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Validate poster format parameter
   */
  validateFormat(format: string): PosterFormat {
    if (format !== 'pdf' && format !== 'image') {
      throw new BadRequestException(
        `Invalid format: ${format}. Supported formats: pdf, image`,
      );
    }
    return format as PosterFormat;
  }

  /**
   * Generate a Wanted Person poster
   */
  async generateWantedPoster(
    id: string,
    format: PosterFormat,
    officerId: string,
  ): Promise<PosterGenerationResult> {
    const wanted = await this.alertsRepository.findWantedPersonById(id);
    if (!wanted) {
      throw new NotFoundException(`Wanted person not found: ${id}`);
    }

    const config = getPosterConfig();
    const branding = config.branding;
    const posterData = this.transformWantedPerson(wanted);

    let result: PosterGenerationResult;

    if (format === 'pdf') {
      result = await this.generateWantedPDF(posterData, branding);
    } else {
      result = await generateWantedPosterImage(posterData, branding);
    }

    await this.logAudit(officerId, 'export_wanted_poster', id, {
      format,
      filename: result.filename,
      size: result.size,
    });

    return result;
  }

  /**
   * Generate an Amber Alert poster
   */
  async generateAmberAlertPoster(
    id: string,
    format: PosterFormat,
    officerId: string,
  ): Promise<PosterGenerationResult> {
    const alert = await this.alertsRepository.findAmberAlertById(id);
    if (!alert) {
      throw new NotFoundException(`Amber alert not found: ${id}`);
    }

    const config = getPosterConfig();
    const branding = config.branding;
    const posterData = this.transformAmberAlert(alert);

    let result: PosterGenerationResult;

    if (format === 'pdf') {
      result = await this.generateAmberAlertPDF(posterData, branding);
    } else {
      result = await generateAmberAlertPosterImage(posterData, branding);
    }

    await this.logAudit(officerId, 'export_amber_poster', id, {
      format,
      filename: result.filename,
      size: result.size,
      urgencyLevel: posterData.urgencyLevel,
    });

    return result;
  }

  /**
   * Transform Prisma WantedPerson to poster data
   */
  private transformWantedPerson(wanted: any): WantedPosterData {
    const dangerLevel = wanted.dangerLevel || 'medium';
    const dangerLevelDisplayMap: Record<string, string> = {
      low: 'LOW RISK',
      medium: 'MEDIUM RISK',
      high: 'HIGH RISK - APPROACH WITH CAUTION',
      extreme: 'EXTREME DANGER - DO NOT APPROACH',
    };

    const name = wanted.name;
    let publicAdvisory: string;
    if (dangerLevel === 'extreme' || dangerLevel === 'high') {
      publicAdvisory = `WARNING: ${name} is considered ${dangerLevel === 'extreme' ? 'extremely dangerous' : 'dangerous'}. Do NOT attempt to apprehend. Contact law enforcement immediately if sighted.`;
    } else {
      publicAdvisory = `If you have any information about the whereabouts of ${name}, please contact local law enforcement. Do not approach directly.`;
    }

    const reward = wanted.reward ? Number(wanted.reward) : null;

    return {
      id: wanted.id,
      name,
      nin: wanted.person?.nationalId || null,
      warrantNumber: wanted.warrantNumber || 'N/A',
      charges: wanted.charges || [],
      primaryCharge: wanted.charges?.[0] || 'Unknown',
      dangerLevel: dangerLevel as WantedPosterData['dangerLevel'],
      dangerLevelDisplay: dangerLevelDisplayMap[dangerLevel] || 'UNKNOWN',
      physicalDescription: wanted.description || '',
      photoUrl: wanted.photoMediumUrl || wanted.photoUrl || null,
      rewardAmount: reward,
      rewardDisplay: reward ? `REWARD: $${reward.toLocaleString()}` : null,
      lastSeenLocation: wanted.lastSeenLocation || null,
      lastSeenDate: wanted.lastSeenDate
        ? new Date(wanted.lastSeenDate).toLocaleDateString()
        : null,
      contactPhone: 'Contact local authorities',
      isRegionalAlert: wanted.regionalAlert || false,
      issuedDate: new Date(wanted.createdAt).toLocaleDateString(),
      publicAdvisory,
    };
  }

  /**
   * Transform Prisma AmberAlert to poster data
   */
  private transformAmberAlert(alert: any): AmberAlertPosterData {
    const daysMissing = alert.lastSeenDate
      ? Math.floor(
          (Date.now() - new Date(alert.lastSeenDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    let urgencyLevel: AmberAlertPosterData['urgencyLevel'] = 'medium';
    if (daysMissing !== null && daysMissing <= 2) {
      urgencyLevel = 'critical';
    } else if (daysMissing !== null && daysMissing <= 7) {
      urgencyLevel = 'high';
    }

    const urgencyDisplayMap: Record<string, string> = {
      critical: 'CRITICAL - IMMEDIATE ACTION REQUIRED',
      high: 'HIGH PRIORITY',
      medium: 'MEDIUM PRIORITY',
    };

    const ageDisplay = alert.age ? `${alert.age} years old` : 'Unknown age';
    const genderDisplay = alert.gender
      ? alert.gender.charAt(0).toUpperCase() + alert.gender.slice(1)
      : 'Unknown';

    let publicAdvisory = `The public is requested to assist in locating ${alert.personName}`;
    if (alert.lastSeenLocation) {
      publicAdvisory += ` who was last seen in ${alert.lastSeenLocation}`;
    }
    if (daysMissing !== null && daysMissing <= 2) {
      publicAdvisory +=
        '. Time is critical. Any information could help bring this child home safely.';
    } else {
      publicAdvisory +=
        '. Any information, no matter how small, could be vital.';
    }

    return {
      id: alert.id,
      personName: alert.personName,
      age: alert.age,
      ageDisplay,
      gender: alert.gender,
      genderDisplay,
      description: alert.description,
      photoUrl: alert.photoMediumUrl || alert.photoUrl || null,
      lastSeenLocation: alert.lastSeenLocation || null,
      lastSeenDate: alert.lastSeenDate
        ? new Date(alert.lastSeenDate).toLocaleDateString()
        : null,
      daysMissing,
      urgencyLevel,
      urgencyDisplay: urgencyDisplayMap[urgencyLevel],
      contactPhone: alert.contactPhone,
      publicAdvisory,
      createdAt: new Date(alert.createdAt).toLocaleDateString(),
    };
  }

  /**
   * Generate Wanted Person PDF using dynamic import
   */
  private async generateWantedPDF(
    data: WantedPosterData,
    branding: PosterBranding,
  ): Promise<PosterGenerationResult> {
    const React = await import('react');
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { WantedPosterPDF } = await import('./wanted-poster-pdf.js');

    const element = React.createElement(WantedPosterPDF, { data, branding });
    const pdfBuffer = await (renderToBuffer as any)(element);
    const buffer = Buffer.from(pdfBuffer);

    return {
      buffer,
      contentType: 'application/pdf',
      filename: `wanted-${data.id.substring(0, 8)}.pdf`,
      size: buffer.byteLength,
    };
  }

  /**
   * Generate Amber Alert PDF using dynamic import
   */
  private async generateAmberAlertPDF(
    data: AmberAlertPosterData,
    branding: PosterBranding,
  ): Promise<PosterGenerationResult> {
    const React = await import('react');
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { AmberAlertPosterPDF } = await import('./amber-alert-poster-pdf.js');

    const element = React.createElement(AmberAlertPosterPDF, { data, branding });
    const pdfBuffer = await (renderToBuffer as any)(element);
    const buffer = Buffer.from(pdfBuffer);

    return {
      buffer,
      contentType: 'application/pdf',
      filename: `amber-alert-${data.id.substring(0, 8)}.pdf`,
      size: buffer.byteLength,
    };
  }

  private async logAudit(
    officerId: string,
    action: string,
    entityId: string,
    details: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'alert',
          entityId,
          officerId,
          action,
          success: true,
          details,
        },
      });
    } catch (err) {
      this.logger.error('Audit log write failed', err);
    }
  }
}
