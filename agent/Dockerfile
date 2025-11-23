FROM node:25.2.1-alpine3.21 AS builder

RUN npm install -g pnpm@10.6.5

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:25.2.1-alpine3.21

RUN npm install -g pnpm@10.6.5

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY json-loader.mjs ./
COPY tsconfig.json ./

EXPOSE 8001
EXPOSE 3000

ENV NODE_ENV=production

CMD ["pnpm", "start"]
