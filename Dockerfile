# Stage 1: Base with system deps
FROM node:20-alpine AS base

RUN apk add --no-cache python3 py3-pip ffmpeg ca-certificates curl
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp
RUN yt-dlp --version && ffmpeg -version | head -1

# Stage 2: App
FROM base AS app
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN addgroup -S apigroup && adduser -S apiuser -G apigroup
USER apiuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
