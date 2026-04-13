FROM node:22-alpine

WORKDIR /app

# Install dependencies (keep layer cache by copying manifests first)
COPY package.json package-lock.json* ./

# Make Prisma schema available for postinstall hooks (prisma generate)
COPY prisma ./prisma

RUN npm install

# Copy full source
COPY . .

# Ensure Prisma client is generated (postinstall may have already run)
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main"]
