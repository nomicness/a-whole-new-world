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

EXPOSE 80

CMD node index.js