# ─────────────────────────────────────────────────────────
# Stage 1: Base — Node.js + Python + yt-dlp + ffmpeg
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS base

RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

RUN pip3 install --no-cache-dir --break-system-packages --root-user-action=ignore yt-dlp

# Verify installations and ensure yt-dlp is on PATH for all users
RUN yt-dlp --version && ffmpeg -version | head -1
ENV PATH="/usr/local/bin:${PATH}"

# ─────────────────────────────────────────────────────────
# Stage 2: Install npm dependencies
# ─────────────────────────────────────────────────────────
FROM base AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ─────────────────────────────────────────────────────────
# Stage 3: Production image
# ─────────────────────────────────────────────────────────
FROM base AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S nodeuser -G nodejs

WORKDIR /app

COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

RUN mkdir -p logs && chown nodeuser:nodejs logs

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

ENV NODE_ENV=production

CMD ["node", "server.js"]
