FROM postgres:9.5.6

COPY fixtures /docker-entrypoint-initdb.d/

ENV POSTGRES_USER forest
ENV POSTGRES_PASSWORD secret
ENV POSTGRES_DB forest