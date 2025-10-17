# Use an official Node.js runtime as a parent image
FROM node:20-bullseye-slim

# Create app directory
WORKDIR /app

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Copy manifest files first for better caching
COPY package.json package-lock.json* ./
COPY tsconfig.json vite.config.ts ./

# Copy the rest of the repository
COPY . .

# Install dependencies (including dev deps because we run Vite/tsx at runtime)
RUN npm ci --no-audit --no-fund

# Build the client with Vite (outputs to dist/public per vite.config.ts)
RUN npx vite build --mode production

# Expose the port the server listens on
EXPOSE 5000

# Run the TypeScript server directly with tsx (avoids separate transpile step)
# This requires dev dependencies to be present in the image (tsx is in devDependencies)
CMD ["npx", "tsx", "server/index.ts"]
