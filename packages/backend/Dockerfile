FROM node:12.15

ENV APP_HOME /app

RUN mkdir $APP_HOME
WORKDIR $APP_HOME

COPY package.json $APP_HOME

COPY . $APP_HOME

RUN yarn && yarn build

ENV HOST=0.0.0.0 PORT=4200

EXPOSE ${PORT}
CMD [ "yarn", "start:prod" ]
