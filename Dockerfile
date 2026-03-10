FROM node:20-alpine

RUN apk add --no-cache ffmpeg python3 curl

# install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
-o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./

ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node","server.js"]
