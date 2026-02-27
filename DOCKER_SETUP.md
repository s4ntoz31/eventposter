# Docker Setup Instructions

## Prerequisites
- Docker Desktop must be installed and running on Windows

## Steps to Run the App in Docker

### 1. Start Docker Desktop
Make sure Docker Desktop is running on your Windows machine.

### 2. Build the Docker Image
```bash
docker-compose build
```

This will:
- Create a Node.js build environment
- Install dependencies
- Build the production version of your app
- Package it with Nginx web server

### 3. Run the Container
```bash
docker-compose up -d
```

The `-d` flag runs it in detached mode (background).

### 4. Access the App
Open your browser and go to:
- **http://localhost:3000**

### 5. View Logs (Optional)
```bash
docker-compose logs -f
```

### 6. Stop the Container
```bash
docker-compose down
```

## Alternative: Using Docker Commands Directly

### Build
```bash
docker build -t pedalpulse-app .
```

### Run
```bash
docker run -d -p 3000:80 --name pedalpulse-poster pedalpulse-app
```

### Stop
```bash
docker stop pedalpulse-poster
docker rm pedalpulse-poster
```

## What's Included

- **Dockerfile**: Multi-stage build (Node.js for building, Nginx for serving)
- **docker-compose.yml**: Easy orchestration with single command
- **.dockerignore**: Excludes unnecessary files from the image

## Production Deployment

For production, you can:
1. Push the image to Docker Hub or a container registry
2. Deploy to any cloud platform (AWS ECS, Azure Container Instances, Google Cloud Run, etc.)
3. Use Kubernetes for orchestration

## Troubleshooting

**Docker not found:**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop

**Port 3000 already in use:**
- Change the port in docker-compose.yml: `"8080:80"` instead of `"3000:80"`
- Then access at http://localhost:8080
