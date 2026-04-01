import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  return {
    port: isNaN(port) ? 3001 : port,
    environment: process.env.NODE_ENV || 'development',
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    recommendationServiceUrl: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8001',
  };
});
