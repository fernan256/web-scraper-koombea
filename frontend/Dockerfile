FROM node:22-alpine

WORKDIR /app

# Copy all frontend files
COPY . .

# Expose port
EXPOSE 3000

# Start the static file server
CMD ["node", "server.js"]
