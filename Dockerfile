FROM node:22-bookworm-slim AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
WORKDIR /app

ARG NEXT_PUBLIC_PLATFORM_URL=http://localhost:8000
ENV NEXT_PUBLIC_PLATFORM_URL=${NEXT_PUBLIC_PLATFORM_URL}

COPY app ./app
COPY components ./components
COPY lib ./lib
COPY next-env.d.ts tsconfig.json ./
RUN npm run build

FROM dependencies AS development
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["./node_modules/.bin/next", "start", "--hostname", "0.0.0.0"]
