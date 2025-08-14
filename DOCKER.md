# Docker Guide for terminalgame

This project includes Docker configurations for containerized deployment.

## Quick Start

### Development
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Production Build
```bash
# Build production image
docker build -t terminalgame .

# Run production container
docker run -p 3000:3000 terminalgame
```

## Available Scripts

### npm Scripts
```bash
npm run docker:build   # Build Docker image
npm run docker:run     # Start with Docker Compose
npm run docker:stop    # Stop Docker Compose
npm run docker:logs    # View container logs
npm run docker:shell   # Access container shell
```

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

### Docker Compose
- **app**: Main application container
- **Port**: 3000
- **Health checks**: Automatic container health monitoring
- **Restart policy**: Automatically restart unless stopped

## Multi-stage Build

This Dockerfile uses multi-stage builds for optimized production images:

1. **deps**: Install dependencies
2. **builder**: Build application
3. **runner**: Lightweight production image

## Security Features

- Non-root user execution
- Minimal Alpine Linux base images
- Health checks for container monitoring
- Comprehensive .dockerignore for smaller builds

## Troubleshooting

### Container Won't Start
```bash
# Check container logs
docker-compose logs app

# Access container shell for debugging
docker-compose exec app sh
```

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Stop existing containers
docker-compose down
```

### Build Issues
```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```
