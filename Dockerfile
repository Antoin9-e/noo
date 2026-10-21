# --- Build du front ---
FROM oven/bun:1 AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

# --- Backend + front statique ---
FROM oven/bun:1
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile
COPY backend/ ./
RUN bunx prisma generate
COPY --from=frontend /app/frontend/dist /app/frontend/dist
ENV FRONTEND_DIST=/app/frontend/dist
EXPOSE 3000
# Applique les migrations puis démarre
CMD ["sh", "-c", "bunx prisma migrate deploy && bun index.ts"]
