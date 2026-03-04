# Multi-stage Dockerfile: Next.js + Remotion + Kokoro TTS

# -----------------------------------------------------------------------------
# Stage 1: Dependencies (production deps only)
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ cmake \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Install only runtime dependencies
RUN npm ci --omit=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder (full deps + build)
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ cmake \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# Compile whisper.cpp for Linux (replaces any macOS binaries)
# Use generic CPU target to avoid NEON FP16 intrinsic mismatches in Docker
RUN if [ -d "whisper.cpp" ]; then \
    cd whisper.cpp && \
    rm -f *.o main quantize server && \
    make -j2 UNAME_M=aarch64 \
    CFLAGS="-I. -O3 -DNDEBUG -std=c11 -fPIC -D_XOPEN_SOURCE=600 -D_GNU_SOURCE -pthread -DGGML_USE_FP16_NEON=0" \
    CXXFLAGS="-I. -I./examples -O3 -DNDEBUG -std=c++11 -fPIC -D_XOPEN_SOURCE=600 -D_GNU_SOURCE -pthread -DGGML_USE_FP16_NEON=0" && \
    mkdir -p models && \
    (mv *.bin models/ 2>/dev/null || true) && \
    echo "whisper.cpp compiled successfully" && \
    ls -la main; \
    fi

# -----------------------------------------------------------------------------
# Stage 3: Runner (production image)
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Chromium (Remotion), espeak-ng (Kokoro TTS), fonts and Chrome deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    espeak-ng \
    git \
    make g++ cmake \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libgbm1 \
    libxrandr2 \
    libxkbcommon0 \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libatk-bridge2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    libgl1 \
    libegl1 \
    libgl1-mesa-dri \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Non-root user
RUN groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Copy runtime deps and build output
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules        ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next               ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public              ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json        ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/postcss.config.mjs  ./postcss.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js      ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/src                 ./src
COPY --from=builder --chown=nextjs:nodejs /app/types               ./types
COPY --from=builder --chown=nextjs:nodejs /app/remotion.config.ts  ./remotion.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/styles              ./styles
COPY --from=builder --chown=nextjs:nodejs /app/scripts             ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/whisper.cpp        ./whisper.cpp

# Writable directories and full ownership /app for nextjs user
RUN mkdir -p /app/out /app/audio && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]

