# Dockerfile for PUPBC CareLink Backend (Laravel 8 / PHP)
# This Dockerfile is used for Render deployment and local development.
# Build context is the backend/ directory (rootDir in render.yaml).

FROM php:8.1-cli

# Install system dependencies
# Note: ctype, fileinfo, tokenizer, json, session, openssl are built-in to php:8.1-cli
# We only need to install extensions that require compilation from source
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libssl-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd zip \
    && docker-php-ext-install xml simplexml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (for better layer caching)
COPY composer.json composer.lock ./

# Install PHP dependencies (no dev dependencies, no scripts to avoid .env dependency)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy application files
COPY . .

# Create storage directories and set permissions
RUN mkdir -p storage/framework/{sessions,views,cache,data} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create a default .env file for the build process
# (Render will override with real env vars at runtime)
RUN cp .env.example .env 2>/dev/null || true

# Generate APP_KEY and run package discovery
RUN php artisan key:generate --force 2>/dev/null || true
RUN php artisan package:discover --ansi 2>/dev/null || true

# Generate storage symlink
RUN php artisan storage:link 2>/dev/null || true

# Expose the port (Render sets $PORT env var)
EXPOSE $PORT

# Run database migrations on startup, then serve the application
CMD ["sh", "-c", "php artisan migrate --force 2>/dev/null; php artisan serve --host=0.0.0.0 --port=$PORT"]
