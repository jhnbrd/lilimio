# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
ARG APP_BUILD_SHA=unknown
ENV APP_BUILD_SHA=$APP_BUILD_SHA

# Install Linux dependencies from the lockfile, never the copied Windows modules.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json vite.config.ts index.html ./
COPY TERMS.md PRIVACY.md LICENSE.md THIRD_PARTY_NOTICES.md ./
COPY src/ ./src/
COPY tests/ ./tests/
COPY server/ ./server/
COPY public/art/ ./public/art/
COPY public/fonts/ ./public/fonts/
COPY public/images/brand/lilimio/png/ ./public/images/brand/lilimio/png/
COPY public/images/brand/lilimio/pwa/ ./public/images/brand/lilimio/pwa/
COPY public/images/brand/lilimio/apple/ ./public/images/brand/lilimio/apple/
COPY public/images/brand/lilimio/favicon/ ./public/images/brand/lilimio/favicon/
COPY public/_redirects ./public/_redirects

RUN npm test && npm run build

FROM node:24-alpine AS observations
WORKDIR /app
COPY server/ ./server/
ENV HOST=0.0.0.0 PORT=8090
USER node
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8090/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.mjs"]

FROM nginx:stable-alpine AS production
ARG APP_BUILD_SHA=unknown
LABEL org.opencontainers.image.revision=$APP_BUILD_SHA
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

# Configuration is complete at build time; no entrypoint template writes needed.
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
