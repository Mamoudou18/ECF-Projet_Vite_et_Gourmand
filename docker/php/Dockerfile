FROM php:8.2-fpm-alpine

# Installer les extensions nécessaires
RUN docker-php-ext-install pdo pdo_mysql mysqli

RUN apk add --no-cache $PHPIZE_DEPS openssl-dev && pecl install mongodb && docker-php-ext-enable mongodb

# Config upload
RUN echo "upload_max_filesize = 10M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 10M" >> /usr/local/etc/php/conf.d/uploads.ini

# Définir le répertoire de travail
WORKDIR /var/www/html

# Copier les fichiers PHP
COPY ./backend /var/www/html/backend

#composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Permissions
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

# Exposer le port PHP-FPM
EXPOSE 9000

CMD ["php-fpm"]
