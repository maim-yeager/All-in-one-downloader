FROM node:20-alpine

# Install system deps
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Install yt-dlp via pip
RUN pip3 install --no-cache-dir \
    --break-system-packages \
    --root-user-action=ignore \
    yt-dlp

# Ensure yt-dlp is on PATH for all users
ENV PATH="/usr/local/bin:${PATH}"

# Verify tools
RUN yt-dlp --version && ffmpeg -version | head -1

WORKDIR /app

# Copy package.json and install Node deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# Create non-root user and transfer ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S nodeuser -G nodejs && \
    chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENV NODE_ENV=production

CMD ["node", "server.js"]
