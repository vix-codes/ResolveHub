FROM node:18-alpine AS build
WORKDIR /app
ARG VITE_APP_BASE_PATH=/resolvehub
ENV VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html/resolvehub
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location /resolvehub/ { \
    alias /usr/share/nginx/html/resolvehub/; \
    try_files $uri $uri/ /resolvehub/index.html; \
  } \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
