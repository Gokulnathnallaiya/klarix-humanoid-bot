FROM node:18-alpine

WORKDIR /app

# Copy everything
COPY . .

# Clean install
RUN rm -rf node_modules package-lock.json && \
    npm install && \
    npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]