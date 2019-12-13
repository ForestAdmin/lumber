**How to change some data?**
**ie. How to add a version of an image on hub.docker?**

Edit fixtures files, build, then push.

**Build image from the sources**
`docker build -t forestadmin/turnkey-mongo:1.0.x .`

**Push image into docker registry (http://hub.docker.com)**
`docker push forestadmin/turnkey-mongo:1.0.x`

**Download image from docker repository**
`docker pull forestadmin/turnkey-mongo:1.0.x`

**Create and start a container from the image (pull image if not present locally)**
`docker run -p 27000:27017 forestadmin/turnkey-mongo:1.0.x`

**Start all services (==containers) defined in docker-compose.yml**
`docker-compose up`

**TO RUN INDIVIDUALLY---**
`docker run -p 27000:27017 forestadmin/turnkey-mongo`

**TO RUN ALL IN BACKGROUND**
`docker-compose up -d`
