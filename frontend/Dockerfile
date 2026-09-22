# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
# npm install, not npm ci: the lockfile was generated on Windows and its
# optionalDependencies resolution for native binaries (lightningcss, used by
# Tailwind v4) doesn't carry over cleanly to linux/musl in this Docker image.
RUN npm install
COPY frontend .
RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
