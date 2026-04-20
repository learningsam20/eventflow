# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
# Use environment variable to set base path during build
ENV NODE_ENV=production
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Final Runtime ---
FROM python:3.11-slim

LABEL maintainer="EventFlow Team"
LABEL description="AI-Native Physical Event Orchestration Platform"

WORKDIR /app

# Install system dependencies (needed for Pillow and other libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend to backend's static directory
# Mapped to /app in main.py
RUN mkdir -p /app/backend/static/frontend
COPY --from=frontend-builder /app/frontend/dist /app/backend/static/frontend

# Create directories for documentation, database, and uploads
# Ensure these exist before the app starts
RUN mkdir -p /app/docs /app/db /app/backend/static/uploads

# Copy documentation (Depends on .dockerignore allowing 'docs/')
COPY docs/ /app/docs/

# Default environment variables
ENV PORT=8080
ENV DATABASE_URL=sqlite:////app/db/eventflow.db
ENV CORS_ORIGINS=http://localhost:5173,http://localhost:8080
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8080

# Start backend from the backend directory to match relative paths in main.py
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
