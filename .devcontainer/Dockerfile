FROM node:20-slim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
       chromium \
       libatk-bridge2.0-0 \
       libgtk-3-0 \
       libasound2 \
       libgbm1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*