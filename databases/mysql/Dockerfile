FROM mysql/mysql-server:5.7

COPY fixtures /docker-entrypoint-initdb.d/

ENV MYSQL_ROOT_PASSWORD secret
ENV MYSQL_DATABASE forest
ENV MYSQL_USER forest
ENV MYSQL_PASSWORD secret
