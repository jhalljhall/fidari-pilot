# Dockerfile for Fidari Pizza Harper Local Runtime
FROM node:25-bookworm-slim

# Install basic build tools for any native modules if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Harper CLI globally
RUN npm install -g harper@5.2.13

# Initialize Harper non-interactively so it does not prompt on first run
ENV HDB_ADMIN_USERNAME=admin \
    HDB_ADMIN_PASSWORD=Password123! \
    ROOTPATH=/root/harper \
    TC_AGREEMENT=yes \
    DEFAULTS_MODE=dev

RUN harper install

WORKDIR /app

# Install project dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose Harper HTTP/REST and static web port
EXPOSE 9926

# Run in development mode (auto-reload, foreground logging)
CMD ["harper", "dev", "."]
