FROM php:8.2-fpm-alpine

# Extensions PHP
RUN docker-php-ext-install pdo pdo_mysql mysqli

# MongoDB
RUN apk add --no-cache $PHPIZE_DEPS openssl-dev && \
    pecl install mongodb && \
    docker-php-ext-enable mongodb

# Config upload
RUN echo "upload_max_filesize = 10M" > /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size = 10M" >> /usr/local/etc/php/conf.d/uploads.ini

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copier les sources
COPY ./backend /var/www/html/backend
COPY ./frontend /var/www/html/frontend
COPY .env* /var/www/html/

# Installer les dépendances PHP
WORKDIR /var/www/html/backend
RUN composer install --no-dev --optimize-autoloader 2>&1

WORKDIR /var/www/html

# Permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    mkdir -p /var/www/html/backend/public/uploads && \
    chmod -R 777 /var/www/html/backend/public/uploads

EXPOSE 9000

CMD ["php-fpm"]
