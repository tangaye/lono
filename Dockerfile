# Install node
FROM node:10.4.1

# Set the working directory to /app
WORKDIR /usr/src/lono

COPY package*.json ./

# Turns debug off and run app in production
RUN npm ci --only-production

# Copy the current directory contents into the container .
COPY . .

# Make port 80 available to the world outside this container
EXPOSE 4000

# Run the app when the container launches
CMD ["npm", "start"]