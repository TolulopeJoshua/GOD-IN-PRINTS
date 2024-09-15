FROM node:14.5.0-alpine
WORKDIR /app
COPY package.json /app
RUN npm install
EXPOSE 5000
COPY . /app
CMD node index.js

#ENTRYPOINT ["node", "index.js"]
#COPY package.json /app