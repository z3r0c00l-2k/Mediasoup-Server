FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN apk add --no-cache linux-headers make g++ python3 py3-pip &&\
  ln -sf python3 /usr/bin/python &&\
  ln -sf pip3 /usr/bin/pip

RUN yarn install

COPY . .

EXPOSE 8000

CMD [ "yarn", "dev" ]
