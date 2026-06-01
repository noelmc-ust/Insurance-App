FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE=http://localhost:5000
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
