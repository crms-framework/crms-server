/**
 * Poster Configuration
 *
 * Centralized configuration for alert poster generation
 * Supports country-configurable branding via environment variables
 */

import {
  PosterConfig,
  PosterColorTheme,
  PosterBranding,
  PosterDimensions,
} from './poster.types';

/**
 * Default color theme for Wanted posters (Red theme)
 */
export const WANTED_COLORS: PosterColorTheme = {
  primary: '#DC2626',
  secondary: '#FEE2E2',
  accent: '#991B1B',
  text: '#FFFFFF',
  textDark: '#1F2937',
  badge: '#7C3AED',
};

/**
 * Default color theme for Amber Alert posters (Amber/Yellow theme)
 */
export const AMBER_COLORS: PosterColorTheme = {
  primary: '#F59E0B',
  secondary: '#FEF3C7',
  accent: '#B45309',
  text: '#1F2937',
  textDark: '#1F2937',
  badge: '#DC2626',
};

/**
 * Poster dimensions
 */
export const DIMENSIONS: Record<string, PosterDimensions> = {
  a4: { width: 595, height: 842 },
  a4_print: { width: 2480, height: 3508 },
  social: { width: 1080, height: 1350 },
  social_landscape: { width: 1200, height: 630 },
};

/**
 * Get branding configuration from environment variables
 */
function getBranding(): PosterBranding {
  return {
    organizationName: process.env.POSTER_ORG_NAME || 'Police Department',
    organizationAbbreviation: process.env.POSTER_ORG_ABBREV || 'PD',
    hotline: process.env.POSTER_HOTLINE || '999',
    logoPath: process.env.POSTER_LOGO_PATH || null,
    logoUrl: process.env.POSTER_LOGO_URL || null,
    website: process.env.POSTER_WEBSITE || null,
  };
}

/**
 * Get complete poster configuration
 */
export function getPosterConfig(): PosterConfig {
  return {
    branding: getBranding(),
    colors: {
      wanted: WANTED_COLORS,
      amber: AMBER_COLORS,
    },
    dimensions: {
      a4: DIMENSIONS.a4,
      social: DIMENSIONS.social,
    },
    fonts: {
      primary: 'Helvetica',
      bold: 'Helvetica-Bold',
    },
  };
}

/**
 * Get color theme for alert type
 */
export function getColorTheme(
  alertType: 'wanted' | 'amber',
): PosterColorTheme {
  const config = getPosterConfig();
  return alertType === 'wanted' ? config.colors.wanted : config.colors.amber;
}

/**
 * Get dimensions for poster size
 */
export function getPosterDimensions(
  size: 'a4' | 'social',
): PosterDimensions {
  return DIMENSIONS[size] || DIMENSIONS.social;
}

/**
 * Get high-resolution dimensions for image generation
 */
export function getImageDimensions(): PosterDimensions {
  return DIMENSIONS.social;
}

/**
 * Layout constants for poster design
 */
export const POSTER_LAYOUT = {
  margin: 40,
  padding: 20,
  sectionGap: 15,
  header: {
    height: 60,
    logoSize: 40,
    fontSize: { orgName: 14, bulletinNumber: 10 },
  },
  badge: { height: 35, fontSize: 12, borderRadius: 4 },
  banner: { height: 70, fontSize: 42, fontWeight: 'bold' },
  photo: {
    width: 300,
    height: 400,
    borderRadius: 8,
    placeholderColor: '#E5E7EB',
  },
  details: { labelFontSize: 11, valueFontSize: 13, rowHeight: 50 },
  charges: { height: 60, fontSize: 11 },
  advisory: { height: 80, fontSize: 10, lineHeight: 1.4 },
  help: { height: 60, fontSize: 11 },
  footer: { height: 40, fontSize: 9 },
} as const;

/**
 * Generate a unique bulletin number for posters
 */
export function generateBulletinNumber(
  alertId: string,
  alertType: 'wanted' | 'amber',
): string {
  const prefix = alertType === 'wanted' ? 'WP' : 'AA';
  const year = new Date().getFullYear();
  const shortId = alertId.substring(0, 8).toUpperCase();
  return `${year}-${prefix}-${shortId}`;
}

/**
 * Format date for poster display
 */
export function formatPosterDate(date: Date | string | null): string {
  if (!date) return 'Unknown';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncate text with ellipsis if too long
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
