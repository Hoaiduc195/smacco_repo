const { defineConfig } = require('@prisma/config')

module.exports = defineConfig({
  migrate: {
    url: process.env.DATABASE_URL,
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})