FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY src/package*.json ./
RUN npm install

# Bundle app source (this includes public directory already)
COPY src/ .

# Expose port
EXPOSE 8080

# Create a volume mount point
VOLUME /app/data

# Start command
CMD ["npm", "start"]