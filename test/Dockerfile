# Select source image
FROM node:wheezy

# Install all dependencies
RUN apt-get update -q && apt-get upgrade -y --no-install-recommends

# Create app directories
RUN mkdir -p /usr/app/config
WORKDIR /usr/app

# Bundle app
COPY ./package.json /usr/app/
COPY ./src /usr/app/src

COPY ./config/opal.algoservice.test.config.js /usr/app/config/opal.algoservice.config.js

WORKDIR /usr/app

# We create the folder for the savePath
RUN mkdir data

# Install opal-algoservice npm dependencies
RUN npm install; exit 0;
RUN cat /root/.npm/_logs/*; exit 0;


# Run compute service
EXPOSE 80
