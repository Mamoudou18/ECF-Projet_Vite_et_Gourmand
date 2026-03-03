FROM php:8.2-fpm-alpine

# Installer les extensions nécessaires
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Définir le répertoire de travail
WORKDIR /var/www/html

# Copier les fichiers PHP
COPY ./Backend /var/www/html/backend

# Permissions
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

# Exposer le port PHP-FPM
EXPOSE 9000

CMD ["php-fpm"]
