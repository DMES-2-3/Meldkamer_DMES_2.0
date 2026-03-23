FROM php:8.4-apache

# Apache modules
RUN a2enmod rewrite headers

# System deps + PHP extensions
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zlib1g-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    unzip \
    git \
  && docker-php-ext-configure zip \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install zip mysqli pdo pdo_mysql gd \
  && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . /var/www/html

RUN mkdir -p /var/www/html/var/proxies \
  && chown -R www-data:www-data /var/www/html/var \
  && chmod -R 775 /var/www/html/var