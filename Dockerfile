FROM node:lts-jessie

WORKDIR /usr/src/app
RUN npm install -g lumber-cli -s

VOLUME /usr/src/app

EXPOSE $APPLICATION_PORT
CMD lumber generate "$APP_NAME" -c $DATABASE_URL && \
  cd "$APP_NAME" && \
  npm install -s
