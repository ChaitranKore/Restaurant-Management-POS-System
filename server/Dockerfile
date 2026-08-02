FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env.example ./.env.example
COPY src ./src

EXPOSE 5000

# `installSchema.js` is idempotent — safe to run on every container start.
# It builds indexes and seeds the default admin/menu/tables only if they
# don't already exist, so restarting the container never duplicates data.
CMD ["sh", "-c", "node src/scripts/installSchema.js && node src/index.js"]
