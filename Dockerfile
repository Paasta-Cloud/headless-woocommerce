FROM node:22-bookworm-slim AS build

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends zip && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN node scripts/package-connector.mjs && npm run build

FROM gcr.io/distroless/nodejs22-debian13:nonroot AS runtime
# Runtime needs Node, not npm, a shell or OS administration tools.
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=65532:65532 /app/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=build --chown=65532:65532 /app/public ./public
USER 65532:65532
EXPOSE 3000
CMD ["server.js"]
