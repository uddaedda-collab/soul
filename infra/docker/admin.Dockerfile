FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/admin/package.json apps/admin/package.json
RUN npm install --workspace apps/admin

FROM deps AS build
COPY tsconfig.base.json tsconfig.base.json
COPY apps/admin apps/admin
RUN npm run build --workspace apps/admin

FROM nginx:1.27-alpine
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
