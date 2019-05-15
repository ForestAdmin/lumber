FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install lumber-cli -g
RUN npm install
COPY . .
EXPOSE <%= port %>
CMD ["npm", "start"]
