# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies based on lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Configure Vite API base URL for Nginx reverse proxy
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy source code and build the production bundle
COPY . .
RUN npm run build

# Stage 2: Serve the production static files with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration supporting React Router SPA fallback and /api/ proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
