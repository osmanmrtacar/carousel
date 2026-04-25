FROM node:24-alpine

# Install ffmpeg for video generation
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
