# Docker Development Environment

## Scripts for common Docker operations

### Windows PowerShell

#### Start Development
```powershell
# Copy environment file (first time only)
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created .env file. Please update with your settings."
}

# Build and start
docker-compose up -d --build

# Show status
docker-compose ps
```

#### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
```

#### Stop Development
```powershell
# Stop containers
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v
```

#### Database Operations
```powershell
# Run migrations
docker-compose exec server npx prisma migrate deploy

# Seed database
docker-compose exec server npx prisma db seed

# Reset database
docker-compose exec server npx prisma migrate reset

# Access database
docker-compose exec db psql -U participium -d participium
```

#### MinIO Operations
```powershell
# Restart MinIO initialization
docker-compose restart minio-init

# Access MinIO shell
docker-compose exec minio sh
```

#### Clean Everything
```powershell
# Stop all containers
docker-compose down -v

# Remove all unused containers, networks, images
docker system prune -a

# Rebuild from scratch
docker-compose up -d --build --force-recreate
```

### Linux/macOS Bash

#### Start Development
```bash
#!/bin/bash

# Copy environment file (first time only)
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please update with your settings."
fi

# Build and start
docker-compose up -d --build

# Show status
docker-compose ps
```

#### Helper Script (save as `docker-dev.sh`)
```bash
#!/bin/bash

case "$1" in
    start)
        docker-compose up -d --build
        docker-compose ps
        ;;
    stop)
        docker-compose down
        ;;
    restart)
        docker-compose restart ${2:-}
        ;;
    logs)
        docker-compose logs -f ${2:-}
        ;;
    clean)
        docker-compose down -v
        docker system prune -af
        ;;
    db-migrate)
        docker-compose exec server npx prisma migrate deploy
        ;;
    db-seed)
        docker-compose exec server npx prisma db seed
        ;;
    db-reset)
        docker-compose exec server npx prisma migrate reset
        ;;
    shell)
        docker-compose exec ${2:-server} sh
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|clean|db-migrate|db-seed|db-reset|shell} [service]"
        exit 1
        ;;
esac
```

Make it executable:
```bash
chmod +x docker-dev.sh
```

Use it:
```bash
./docker-dev.sh start
./docker-dev.sh logs server
./docker-dev.sh db-migrate
./docker-dev.sh shell server
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start in background |
| `docker-compose up -d --build` | Rebuild and start |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop and remove volumes |
| `docker-compose ps` | Show status |
| `docker-compose logs -f` | Follow logs |
| `docker-compose restart <service>` | Restart service |
| `docker-compose exec <service> <cmd>` | Run command in service |

## Environment Files

Copy and configure:
```bash
cp .env.example .env
```

Update passwords and secrets in `.env` before starting.
