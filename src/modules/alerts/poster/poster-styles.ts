/**
 * Shared Poster Styles
 *
 * Common styles for PDF poster generation using @react-pdf/renderer
 */

import { StyleSheet } from '@react-pdf/renderer';
import { WANTED_COLORS, AMBER_COLORS, POSTER_LAYOUT } from './poster.config';

export const baseStyles = StyleSheet.create({
  page: {
    padding: POSTER_LAYOUT.margin,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: 1,
    borderColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: POSTER_LAYOUT.header.logoSize,
    height: POSTER_LAYOUT.header.logoSize,
  },
  orgName: {
    fontSize: POSTER_LAYOUT.header.fontSize.orgName,
    fontWeight: 'bold',
  },
  bulletinNumber: {
    fontSize: POSTER_LAYOUT.header.fontSize.bulletinNumber,
    color: '#6B7280',
  },
  badgeContainer: {
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: POSTER_LAYOUT.badge.borderRadius,
    fontSize: POSTER_LAYOUT.badge.fontSize,
    fontWeight: 'bold',
  },
  banner: {
    height: POSTER_LAYOUT.banner.height,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  bannerText: {
    fontSize: POSTER_LAYOUT.banner.fontSize,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 20,
  },
  photoContainer: {
    width: 200,
    height: 260,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailsPanel: {
    flex: 1,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  detailValue: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
  },
  chargesSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  chargesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  chargesText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  advisorySection: {
    marginBottom: 12,
    padding: 10,
    borderLeft: 3,
  },
  advisoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  advisoryText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#374151',
  },
  helpSection: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  helpTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 10,
    marginBottom: 3,
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: POSTER_LAYOUT.margin,
    left: POSTER_LAYOUT.margin,
    right: POSTER_LAYOUT.margin,
    textAlign: 'center',
    fontSize: 9,
    color: '#6B7280',
    borderTop: 1,
    borderColor: '#E5E7EB',
    paddingTop: 10,
  },
});

export const wantedStyles = StyleSheet.create({
  banner: {
    ...baseStyles.banner,
    backgroundColor: WANTED_COLORS.primary,
  },
  bannerText: {
    ...baseStyles.bannerText,
    color: WANTED_COLORS.text,
  },
  badge: {
    ...baseStyles.badge,
    backgroundColor: WANTED_COLORS.badge,
    color: '#FFFFFF',
  },
  detailLabel: {
    ...baseStyles.detailLabel,
    backgroundColor: WANTED_COLORS.badge,
    color: '#FFFFFF',
  },
  detailValue: {
    ...baseStyles.detailValue,
    backgroundColor: '#FEF3C7',
  },
  advisorySection: {
    ...baseStyles.advisorySection,
    borderColor: WANTED_COLORS.primary,
    backgroundColor: WANTED_COLORS.secondary,
  },
  helpSection: {
    ...baseStyles.helpSection,
    backgroundColor: '#FEF9C3',
  },
  dangerBadgeLow: {
    ...baseStyles.badge,
    backgroundColor: '#FCD34D',
    color: '#1F2937',
  },
  dangerBadgeMedium: {
    ...baseStyles.badge,
    backgroundColor: '#FB923C',
    color: '#FFFFFF',
  },
  dangerBadgeHigh: {
    ...baseStyles.badge,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
  },
  dangerBadgeExtreme: {
    ...baseStyles.badge,
    backgroundColor: '#7C3AED',
    color: '#FFFFFF',
  },
});

export const amberStyles = StyleSheet.create({
  banner: {
    ...baseStyles.banner,
    backgroundColor: AMBER_COLORS.primary,
  },
  bannerText: {
    ...baseStyles.bannerText,
    color: AMBER_COLORS.text,
  },
  badge: {
    ...baseStyles.badge,
    backgroundColor: AMBER_COLORS.badge,
    color: '#FFFFFF',
  },
  detailLabel: {
    ...baseStyles.detailLabel,
    backgroundColor: AMBER_COLORS.badge,
    color: '#FFFFFF',
  },
  detailValue: {
    ...baseStyles.detailValue,
    backgroundColor: AMBER_COLORS.secondary,
  },
  advisorySection: {
    ...baseStyles.advisorySection,
    borderColor: AMBER_COLORS.accent,
    backgroundColor: AMBER_COLORS.secondary,
  },
  helpSection: {
    ...baseStyles.helpSection,
    backgroundColor: AMBER_COLORS.secondary,
  },
  urgencyBadgeCritical: {
    ...baseStyles.badge,
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
  },
  urgencyBadgeHigh: {
    ...baseStyles.badge,
    backgroundColor: '#F97316',
    color: '#FFFFFF',
  },
  urgencyBadgeMedium: {
    ...baseStyles.badge,
    backgroundColor: '#FBBF24',
    color: '#1F2937',
  },
});

export function getDangerBadgeStyle(level: string) {
  switch (level) {
    case 'extreme':
      return wantedStyles.dangerBadgeExtreme;
    case 'high':
      return wantedStyles.dangerBadgeHigh;
    case 'medium':
      return wantedStyles.dangerBadgeMedium;
    default:
      return wantedStyles.dangerBadgeLow;
  }
}

export function getUrgencyBadgeStyle(level: string) {
  switch (level) {
    case 'critical':
      return amberStyles.urgencyBadgeCritical;
    case 'high':
      return amberStyles.urgencyBadgeHigh;
    default:
      return amberStyles.urgencyBadgeMedium;
  }
}
