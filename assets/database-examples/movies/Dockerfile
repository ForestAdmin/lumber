FROM postgres:11-alpine
ENV POSTGRES_USER=lumber
ENV POSTGRES_PASSWORD=secret
ENV POSTGRES_DB=movies
RUN apk add --no-cache curl
RUN curl https://raw.githubusercontent.com/ForestAdmin/lumber/devel/assets/database-examples/movies/dump.sql -o /docker-entrypoint-initdb.d/dump.sql
