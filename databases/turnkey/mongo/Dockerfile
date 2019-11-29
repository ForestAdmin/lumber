FROM mongo:bionic

COPY fixtures /docker-entrypoint-initdb.d/

ENV MONGO_INITDB_ROOT_USERNAME forest
ENV MONGO_INITDB_ROOT_PASSWORD secret
ENV MONGO_INITDB_DATABASE forest

