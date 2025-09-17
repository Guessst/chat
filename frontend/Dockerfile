# build stage
FROM node:22 AS build
WORKDIR /app

# Define an ARG for build time
ARG VITE_BACKEND_SERVER_IP
ENV VITE_BACKEND_SERVER_IP=$VITE_BACKEND_SERVER_IP

COPY . .
RUN npm ci
RUN npm run build

# serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
