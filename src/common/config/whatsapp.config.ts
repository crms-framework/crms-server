import { registerAs } from '@nestjs/config';

export default registerAs('whatsapp', () => ({
  whapiUrl: process.env.WHAPI_URL || 'https://gate.whapi.cloud',
  whapiToken: process.env.WHAPI_TOKEN || '',
  enabled: process.env.ENABLE_WHATSAPP === 'true',
}));
