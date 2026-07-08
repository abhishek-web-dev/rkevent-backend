FROM ghcr.io/puppeteer/puppeteer:22.11.1

# Set environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Set working directory
WORKDIR /usr/src/app

# Copy package files with correct ownership
COPY --chown=pptruser:pptruser package*.json ./

# Install dependencies (this will skip downloading extra browsers since it's already in the base image)
RUN npm ci

# Copy application files
COPY --chown=pptruser:pptruser . .

# Expose server port
EXPOSE 5000

# Start Express server
CMD ["node", "server.js"]
