# Development stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL (needed for Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Copy Prisma schema (needed for postinstall script)
COPY prisma ./prisma

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Start the application in development mode
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
