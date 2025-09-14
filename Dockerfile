# Use nginx alpine for a lightweight web server
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the game files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY debug-game.html /usr/share/nginx/html/
COPY debug.html /usr/share/nginx/html/
COPY nocache.html /usr/share/nginx/html/
COPY test-game.html /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/

# Create nginx configuration for the app
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Handle HTML files with no cache for development \
    location ~* \.(html)$ { \
        expires -1; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
    \
    # Handle root requests \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Labels for better Docker Hub presentation
LABEL maintainer="taekwondo-tech" \
      description="Taekwondo Robot Builder - A side-scrolling martial arts game" \
      version="1.0.0"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
