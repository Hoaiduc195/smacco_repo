import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  return {
    port: isNaN(port) ? 3001 : port,
    environment: process.env.NODE_ENV || 'development',
    publicBaseUrl: process.env.APP_PUBLIC_BASE_URL || '',
  };
});
