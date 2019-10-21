FROM node:lts-jessie

WORKDIR /usr/src/app
RUN npm install -g lumber-cli@2 -s

VOLUME /usr/src/app

EXPOSE $APPLICATION_PORT
CMD lumber generate "${APPLICATION_NAME:-$APP_NAME}" -c $DATABASE_URL && \
  cd "${APPLICATION_NAME:-$APP_NAME}" && \
  npm install -s
