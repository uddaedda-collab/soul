FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY services/api/package.json services/api/package.json
RUN npm install --workspace services/api

FROM deps AS build
COPY tsconfig.base.json tsconfig.base.json
COPY services/api services/api
RUN npm run build --workspace services/api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/services/api/node_modules services/api/node_modules
COPY --from=build /app/services/api/dist services/api/dist
COPY services/api/package.json services/api/package.json
WORKDIR /app/services/api
EXPOSE 8080
CMD ["node", "dist/index.js"]
