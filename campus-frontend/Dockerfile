FROM node:18-alpine AS build
WORKDIR /app
ARG VITE_APP_BASE_PATH=/apartment
ENV VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
