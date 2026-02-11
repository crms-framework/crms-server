/**
 * Poster Generation Types
 *
 * TypeScript interfaces for alert poster generation
 * Supports both PDF and image output formats
 */

/**
 * Supported poster output formats
 */
export type PosterFormat = 'pdf' | 'image';

/**
 * Poster size presets
 */
export type PosterSize = 'a4' | 'social';

/**
 * Alert type for poster generation
 */
export type AlertType = 'wanted' | 'amber';

/**
 * Poster dimensions in pixels
 */
export interface PosterDimensions {
  width: number;
  height: number;
}

/**
 * Color theme for posters
 */
export interface PosterColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textDark: string;
  badge: string;
}

/**
 * Branding configuration from environment
 */
export interface PosterBranding {
  organizationName: string;
  organizationAbbreviation: string;
  hotline: string;
  logoPath: string | null;
  logoUrl: string | null;
  website: string | null;
}

/**
 * Complete poster configuration
 */
export interface PosterConfig {
  branding: PosterBranding;
  colors: {
    wanted: PosterColorTheme;
    amber: PosterColorTheme;
  };
  dimensions: {
    a4: PosterDimensions;
    social: PosterDimensions;
  };
  fonts: {
    primary: string;
    bold: string;
  };
}

/**
 * Data for Wanted Person poster
 */
export interface WantedPosterData {
  id: string;
  name: string;
  nin: string | null;
  warrantNumber: string;
  charges: string[];
  primaryCharge: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'extreme';
  dangerLevelDisplay: string;
  physicalDescription: string;
  photoUrl: string | null;
  rewardAmount: number | null;
  rewardDisplay: string | null;
  lastSeenLocation: string | null;
  lastSeenDate: string | null;
  contactPhone: string;
  isRegionalAlert: boolean;
  issuedDate: string;
  publicAdvisory: string;
}

/**
 * Data for Amber Alert poster
 */
export interface AmberAlertPosterData {
  id: string;
  personName: string;
  age: number | null;
  ageDisplay: string;
  gender: string | null;
  genderDisplay: string;
  description: string;
  photoUrl: string | null;
  lastSeenLocation: string | null;
  lastSeenDate: string | null;
  daysMissing: number | null;
  urgencyLevel: 'critical' | 'high' | 'medium';
  urgencyDisplay: string;
  contactPhone: string;
  publicAdvisory: string;
  createdAt: string;
}

/**
 * Result from poster generation
 */
export interface PosterGenerationResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
  size: number;
}

/**
 * Options for poster generation
 */
export interface PosterGenerationOptions {
  format: PosterFormat;
  size?: PosterSize;
  includeQRCode?: boolean;
}
