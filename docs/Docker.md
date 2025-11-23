# Docker


## Docker components access

- **Frontend (Client)**: http://localhost:3000

- **Backend (API)**: http://localhost:4000
- **API Documentation (Swagger)**: http://localhost:4000/api-docs

- **MinIO Console**: http://localhost:9001
    - Username: `minioadmin`
    - Password: `minioadmin`

- **PostgreSQL Database**: `localhost:5432`
    - User: `participium`
    - Password: `participium_password`
    - Database: `participium`


## Docker scripts

### Build and start
```Powershell
docker-compose up -d --build
```

### Show status
```Powershell
docker-compose ps
```

### Log
```Powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
```

### Stop containers
```Powershell
# Stop
docker-compose down

# Stop and remove (deletes all data)
docker-compose down -v
```

### Rebuild from scratch
```Powershell
docker-compose up -d --build --force-recreate
```