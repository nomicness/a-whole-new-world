#############################################
#   AI UI SERVER DOCKER CONFIGURATION    #
#############################################

FROM node

MAINTAINER ArchmageInc "http://archmageinc.com"

#############################################
#         CREATE WORKING DIRECTORY          #
#############################################

RUN mkdir -p /nomic-bot

COPY ./ /nomic-bot/

WORKDIR /nomic-bot

RUN npm install

RUN npm run build

EXPOSE 80

CMD npm run serve