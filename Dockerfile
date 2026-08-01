FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm ci --workspace=server --workspace=client

COPY server/ ./server/
RUN cd server && npx tsc

COPY client/ ./client/
RUN cd client && npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache sqlite

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/server/dist ./server/dist/
COPY --from=builder /app/server/src ./server/src/
COPY --from=builder /app/client/dist ./client/dist/

RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/dist/index.js"]
