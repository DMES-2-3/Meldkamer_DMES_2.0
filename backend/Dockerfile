FROM php:8.4-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN a2enmod rewrite
RUN a2enmod headers

RUN apt-get update && apt-get install -y \
    libzip-dev \
    zlib1g-dev \
    && docker-php-ext-configure zip \
    && docker-php-ext-install zip mysqli pdo pdo_mysql \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /var/www/html

COPY . /var/www/html
