FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY src ./src

# Ensure runtime directories exist
RUN mkdir -p uploads logs

EXPOSE 3000

CMD ["node", "src/app.js"]


