# FineGuard - Explainable AI Financial Risk Intelligence Platform
# Multi-stage production build: Node.js (Frontend) + Python 3.11 (Backend & ML)

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Explainable AI Engine
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (build-essential for scientific wheels if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, and policy samples
COPY backend/ ./backend/
COPY sample_policies/ ./sample_policies/

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Expose web service port
EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Start FastAPI application (serves both API & Frontend SPA)
CMD ["sh", "-c", "cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
