FROM mcr.microsoft.com/mssql/server:2017-CU8-ubuntu

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY fixtures .
COPY entrypoint.sh .
RUN chmod +x import-data.sh

ENV ACCEPT_EULA "Y"
ENV SA_PASSWORD "forest2019:"

CMD /bin/bash ./entrypoint.sh

#docker build -t forestadmin/turnkey-mssql .
#docker run -p 1432:1433 forestadmin/turnkey-mssql
