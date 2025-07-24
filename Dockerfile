# Base image: Debian-based Node.js
FROM node:22-bullseye

# Install system-level dependencies for tfjs-node
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port (optional: sesuai yang digunakan di app)
EXPOSE 3000

# Run app
# CMD ["node", "src/index.js"]
CMD ["npm", "run", "dev"]

