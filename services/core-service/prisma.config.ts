import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrate: {
    url: process.env.DATABASE_URL,
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
