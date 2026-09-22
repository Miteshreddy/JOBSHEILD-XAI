FROM node:22-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
# npm install, not npm ci: see frontend/Dockerfile for why (cross-platform
# optionalDependencies lockfile mismatch, Windows host vs Linux image).
RUN npm install --omit=dev

COPY backend .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
