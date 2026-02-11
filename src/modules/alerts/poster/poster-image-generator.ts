/**
 * Poster Image Generator
 *
 * Uses Sharp to generate poster images by compositing SVG overlays
 * Optimized for social media sharing (1080x1350 PNG)
 */

import sharp from 'sharp';
import {
  WantedPosterData,
  AmberAlertPosterData,
  PosterBranding,
  PosterGenerationResult,
} from './poster.types';
import {
  getPosterConfig,
  getImageDimensions,
  generateBulletinNumber,
  WANTED_COLORS,
  AMBER_COLORS,
} from './poster.config';
import {
  generateHeaderSvg,
  generateBannerSvg,
  generateMissingDurationSvg,
  generateDetailsPanelSvg,
  generateTextSectionSvg,
  generateAdvisorySvg,
  generateHelpSectionSvg,
  generateFooterSvg,
  generatePhotoPlaceholderSvg,
} from './poster-svg-templates';

const dims = getImageDimensions();

async function fetchPhoto(
  photoUrl: string | null,
  width: number,
  height: number,
): Promise<Buffer> {
  if (!photoUrl) {
    const placeholderSvg = generatePhotoPlaceholderSvg(width, height);
    return sharp(Buffer.from(placeholderSvg)).png().toBuffer();
  }

  try {
    const response = await fetch(photoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch photo: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return sharp(buffer)
      .resize(width, height, { fit: 'cover', position: 'attention' })
      .png()
      .toBuffer();
  } catch (error) {
    console.error('Error fetching photo:', error);
    const placeholderSvg = generatePhotoPlaceholderSvg(width, height);
    return sharp(Buffer.from(placeholderSvg)).png().toBuffer();
  }
}

async function svgToBuffer(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function generateWantedPosterImage(
  data: WantedPosterData,
  branding?: PosterBranding,
): Promise<PosterGenerationResult> {
  const config = getPosterConfig();
  const posterBranding = branding || config.branding;
  const bulletinNumber = generateBulletinNumber(data.id, 'wanted');

  const badgeColors: Record<string, string> = {
    low: '#FCD34D',
    medium: '#FB923C',
    high: '#EF4444',
    extreme: '#7C3AED',
  };
  const badgeColor = badgeColors[data.dangerLevel] || '#7C3AED';

  const canvas = sharp({
    create: {
      width: dims.width,
      height: dims.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  });

  const headerSvg = generateHeaderSvg(
    posterBranding,
    bulletinNumber,
    data.dangerLevelDisplay,
    badgeColor,
  );
  const bannerSvg = generateBannerSvg('WANTED', WANTED_COLORS.primary, WANTED_COLORS.text);

  const details = [
    { label: 'NAME', value: data.name },
    { label: 'LAST SEEN', value: data.lastSeenLocation || 'Unknown' },
    { label: 'CLASSIFICATION', value: data.dangerLevelDisplay },
    { label: 'CONTACT', value: `${posterBranding.hotline} | ${data.contactPhone}` },
  ];
  const detailsSvg = generateDetailsPanelSvg(details, '#7C3AED', '#FEF3C7');

  const chargesSvg = generateTextSectionSvg(
    'CHARGES',
    data.charges.join(' | ') || 'Charges pending',
    '#F9FAFB',
  );
  const advisorySvg = generateAdvisorySvg(
    data.publicAdvisory,
    WANTED_COLORS.primary,
    WANTED_COLORS.secondary,
  );
  const helpSvg = generateHelpSectionSvg(
    data.contactPhone,
    posterBranding.hotline,
    data.rewardDisplay,
    '#FEF9C3',
  );
  const footerSvg = generateFooterSvg(
    posterBranding,
    `Warrant No: ${data.warrantNumber} | Issued: ${data.issuedDate}`,
  );

  const photoBuffer = await fetchPhoto(data.photoUrl, 320, 420);

  const [headerBuf, bannerBuf, detailsBuf, chargesBuf, advisoryBuf, helpBuf, footerBuf] =
    await Promise.all([
      svgToBuffer(headerSvg),
      svgToBuffer(bannerSvg),
      svgToBuffer(detailsSvg),
      svgToBuffer(chargesSvg),
      svgToBuffer(advisorySvg),
      svgToBuffer(helpSvg),
      svgToBuffer(footerSvg),
    ]);

  const result = await canvas
    .composite([
      { input: headerBuf, top: 0, left: 0 },
      { input: bannerBuf, top: 85, left: 0 },
      { input: photoBuffer, top: 190, left: 50 },
      { input: detailsBuf, top: 190, left: 0 },
      { input: chargesBuf, top: 630, left: 0 },
      { input: advisoryBuf, top: 740, left: 0 },
      { input: helpBuf, top: 860, left: 0 },
      { input: footerBuf, top: dims.height - 65, left: 0 },
    ])
    .png()
    .toBuffer();

  return {
    buffer: result,
    contentType: 'image/png',
    filename: `wanted-${data.id.substring(0, 8)}.png`,
    size: result.length,
  };
}

export async function generateAmberAlertPosterImage(
  data: AmberAlertPosterData,
  branding?: PosterBranding,
): Promise<PosterGenerationResult> {
  const config = getPosterConfig();
  const posterBranding = branding || config.branding;
  const bulletinNumber = generateBulletinNumber(data.id, 'amber');

  const badgeColors: Record<string, string> = {
    critical: '#DC2626',
    high: '#F97316',
    medium: '#FBBF24',
  };
  const badgeColor = badgeColors[data.urgencyLevel] || '#DC2626';

  const canvas = sharp({
    create: {
      width: dims.width,
      height: dims.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  });

  const headerSvg = generateHeaderSvg(
    posterBranding,
    bulletinNumber,
    data.urgencyDisplay,
    badgeColor,
  );
  const bannerSvg = generateBannerSvg('AMBER ALERT', AMBER_COLORS.primary, AMBER_COLORS.text);

  const missingDurationSvg =
    data.daysMissing !== null ? generateMissingDurationSvg(data.daysMissing) : null;

  const details = [
    { label: 'NAME', value: data.personName },
    { label: 'AGE / GENDER', value: `${data.ageDisplay} | ${data.genderDisplay}` },
    { label: 'LAST SEEN', value: data.lastSeenLocation || 'Unknown' },
    { label: 'EMERGENCY', value: `Call: ${data.contactPhone}` },
  ];
  const detailsSvg = generateDetailsPanelSvg(details, '#DC2626', AMBER_COLORS.secondary);

  const descriptionSvg = generateTextSectionSvg('DESCRIPTION', data.description, '#F9FAFB');
  const advisorySvg = generateAdvisorySvg(
    data.publicAdvisory,
    AMBER_COLORS.accent,
    AMBER_COLORS.secondary,
  );
  const helpSvg = generateHelpSectionSvg(
    data.contactPhone,
    posterBranding.hotline,
    null,
    AMBER_COLORS.secondary,
  );
  const footerSvg = generateFooterSvg(
    posterBranding,
    'Help bring our children home - Share this alert',
  );

  const photoBuffer = await fetchPhoto(data.photoUrl, 320, 420);

  const svgBuffers = await Promise.all([
    svgToBuffer(headerSvg),
    svgToBuffer(bannerSvg),
    missingDurationSvg ? svgToBuffer(missingDurationSvg) : null,
    svgToBuffer(detailsSvg),
    svgToBuffer(descriptionSvg),
    svgToBuffer(advisorySvg),
    svgToBuffer(helpSvg),
    svgToBuffer(footerSvg),
  ]);

  const [headerBuf, bannerBuf, missingBuf, detailsBuf, descBuf, advisoryBuf, helpBuf, footerBuf] =
    svgBuffers;

  const layers: sharp.OverlayOptions[] = [
    { input: headerBuf!, top: 0, left: 0 },
    { input: bannerBuf!, top: 85, left: 0 },
  ];

  let currentTop = 180;

  if (missingBuf) {
    layers.push({ input: missingBuf, top: currentTop, left: 0 });
    currentTop += 50;
  }

  layers.push({ input: photoBuffer, top: currentTop, left: 50 });
  layers.push({ input: detailsBuf!, top: currentTop, left: 0 });
  currentTop += 440;

  layers.push({ input: descBuf!, top: currentTop, left: 0 });
  currentTop += 110;

  layers.push({ input: advisoryBuf!, top: currentTop, left: 0 });
  currentTop += 120;

  layers.push({ input: helpBuf!, top: currentTop, left: 0 });
  layers.push({ input: footerBuf!, top: dims.height - 65, left: 0 });

  const result = await canvas.composite(layers).png().toBuffer();

  return {
    buffer: result,
    contentType: 'image/png',
    filename: `amber-alert-${data.id.substring(0, 8)}.png`,
    size: result.length,
  };
}
