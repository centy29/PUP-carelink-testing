# Dockerfile for PUPBC CareLink Backend (Laravel 8 / PHP)
# This Dockerfile is used for Render deployment and local development.
# Build context is the backend/ directory (rootDir in render.yaml).

FROM php:8.1-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (for better layer caching)
COPY composer.json composer.lock ./

# Install PHP dependencies (no dev dependencies for production)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy application files
COPY . .

# Create storage directories and set permissions
RUN mkdir -p storage/framework/{sessions,views,cache,data} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Generate storage symlink
RUN php artisan storage:link

# Expose the port (Render sets $PORT env var)
EXPOSE $PORT

# Run database migrations on startup, then serve the application
CMD ["sh", "-c", "php artisan migrate --force 2>/dev/null; php artisan serve --host=0.0.0.0 --port=$PORT"]
