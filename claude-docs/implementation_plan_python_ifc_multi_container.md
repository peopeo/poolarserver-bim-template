# Implementierungsplan: Python IFC Intelligence Service (Multi-Container Production)

## Übersicht

Dieser Plan beschreibt die **Production-Ready Architektur** mit separaten Containern für Skalierbarkeit, Isolation und asynchroner Verarbeitung.

**Wichtig:** Dieser Plan ist eine **Erweiterung** des Single-Container Plans. Implementiere zuerst den Single-Container-Ansatz, dann migriere zu Multi-Container.

---

## Architektur-Übersicht

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend Container (nginx + React build)                   │
│  - Port 80/443                                              │
│  - Serviert statische React-App                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  ASP.NET API Container                                      │
│  - Port 5000                                                │
│  - REST API Endpoints                                       │
│  - Pusht Jobs in Redis Queue                               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Redis Container                                            │
│  - Port 6379                                                │
│  - Job Queue (Celery/RQ)                                    │
│  - Job Results Storage                                      │
│  - Cache Layer                                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Python Worker Containers (x3+)                             │
│  - IfcOpenShell + Python                                    │
│  - Celery Workers                                           │
│  - Horizontally skalierbar                                  │
│  - Shared Volume: /data/ifc-files                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Container                                       │
│  - Port 5432                                                │
│  - Job History, Models, Metadata                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  MinIO/S3 Container (Object Storage)                        │
│  - Port 9000                                                │
│  - IFC File Storage                                         │
│  - glTF Output Storage                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Container-Übersicht

### 1. Frontend Container
**Image:** `nginx:alpine` + React build
**Zweck:** Statische Dateien ausliefern
**Volumes:** Keine (build in image)

### 2. ASP.NET API Container
**Image:** `mcr.microsoft.com/dotnet/aspnet:9.0`
**Zweck:** REST API, Job Orchestration
**Dependencies:** Redis, PostgreSQL
**Volumes:** Shared IFC storage

### 3. Redis Container
**Image:** `redis:7-alpine`
**Zweck:** Message Queue, Cache
**Persistenz:** Optional (nur für Caching wichtig)

### 4. Python Worker Container(s)
**Image:** Custom (`python:3.11 + IfcOpenShell`)
**Zweck:** IFC Processing
**Skalierung:** 3-10 Instanzen (je nach Last)
**Volumes:** Shared IFC storage

### 5. PostgreSQL Container
**Image:** `postgres:16`
**Zweck:** Datenbank
**Volumes:** Persistent storage

### 6. MinIO Container (optional)
**Image:** `minio/minio`
**Zweck:** Object Storage für große Files
**Alternative:** AWS S3, Azure Blob Storage

---

## docker-compose.yml (Production)

```yaml
version: "3.9"

services:
  # ==========================================
  # Frontend
  # ==========================================
  frontend:
    build:
      context: ./src/webui
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    networks:
      - frontend-net
    restart: unless-stopped

  # ==========================================
  # ASP.NET API
  # ==========================================
  api:
    build:
      context: ./src/ifcserver
      dockerfile: Dockerfile.prod
    ports:
      - "5000:5000"
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://0.0.0.0:5000
      ConnectionStrings__DefaultConnection: Host=db;Port=5432;Database=ifcdb;Username=postgres;Password=${DB_PASSWORD}
      Redis__ConnectionString: redis:6379
      Storage__Type: minio
      Storage__MinioEndpoint: minio:9000
      Storage__MinioAccessKey: ${MINIO_ACCESS_KEY}
      Storage__MinioSecretKey: ${MINIO_SECRET_KEY}
    depends_on:
      - db
      - redis
      - minio
    networks:
      - frontend-net
      - backend-net
    volumes:
      - ifc-uploads:/data/uploads
    restart: unless-stopped

  # ==========================================
  # Redis (Queue + Cache)
  # ==========================================
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - backend-net
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  # ==========================================
  # Python Workers (scalable)
  # ==========================================
  python-worker:
    build:
      context: ./src/python-service
      dockerfile: Dockerfile.worker
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/ifcdb
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      WORKER_CONCURRENCY: 2
    depends_on:
      - redis
      - db
      - minio
    networks:
      - backend-net
    volumes:
      - ifc-uploads:/data/uploads
      - ifc-cache:/data/cache
    restart: unless-stopped
    # Scale with: docker-compose up -d --scale python-worker=5
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  # ==========================================
  # PostgreSQL
  # ==========================================
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ifcdb
    ports:
      - "5432:5432"
    networks:
      - backend-net
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  # ==========================================
  # MinIO (Object Storage)
  # ==========================================
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    networks:
      - backend-net
    volumes:
      - minio-data:/data
    restart: unless-stopped

  # ==========================================
  # Celery Flower (optional - Job Monitoring)
  # ==========================================
  flower:
    build:
      context: ./src/python-service
      dockerfile: Dockerfile.worker
    command: celery -A worker flower --port=5555
    ports:
      - "5555:5555"
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis
    networks:
      - backend-net
    restart: unless-stopped

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  minio-data:
  ifc-uploads:
  ifc-cache:
```

---

## Neue Dockerfiles

### Frontend: `src/webui/Dockerfile.prod`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### API: `src/ifcserver/Dockerfile.prod`

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["IfcServer.csproj", "./"]
RUN dotnet restore "IfcServer.csproj"

COPY . .
RUN dotnet build "IfcServer.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IfcServer.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "IfcServer.dll"]
```

### Python Worker: `src/python-service/Dockerfile.worker`

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install IfcConvert binary
RUN wget -O /tmp/ifcconvert.zip \
    "https://github.com/IfcOpenShell/IfcOpenShell/releases/download/ifcconvert-0.8.3.post1/ifcconvert-0.8.3.post1-linux64.zip" \
    && unzip /tmp/ifcconvert.zip -d /tmp/ifcconvert \
    && mv /tmp/ifcconvert/IfcConvert /usr/local/bin/IfcConvert \
    && chmod +x /usr/local/bin/IfcConvert \
    && rm -rf /tmp/ifcconvert /tmp/ifcconvert.zip

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Install package
RUN pip install -e .

# Create data directories
RUN mkdir -p /data/uploads /data/cache

# Run Celery worker
CMD ["celery", "-A", "worker", "worker", "--loglevel=info", "--concurrency=${WORKER_CONCURRENCY:-2}"]
```

---

## Code-Änderungen für Multi-Container

### Python Worker mit Celery

**`src/python-service/worker.py`:**
```python
from celery import Celery
import os
from ifc_intelligence.parser import IfcParser
from ifc_intelligence.gltf_exporter import GltfExporter
from ifc_intelligence.property_extractor import PropertyExtractor
from ifc_intelligence.spatial_tree import SpatialTreeExtractor

# Configure Celery
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
app = Celery('ifc_worker', broker=redis_url, backend=redis_url)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@app.task(name='worker.parse_ifc')
def parse_ifc(ifc_file_path: str):
    """Celery task: Parse IFC file"""
    parser = IfcParser()
    metadata = parser.parse_file(ifc_file_path)
    return metadata.__dict__

@app.task(name='worker.export_gltf')
def export_gltf(ifc_file_path: str, output_path: str, binary: bool = True):
    """Celery task: Convert IFC to glTF"""
    exporter = GltfExporter()
    result = exporter.export_gltf(ifc_file_path, output_path, binary)
    return result

@app.task(name='worker.extract_properties')
def extract_properties(ifc_file_path: str, element_guid: str):
    """Celery task: Extract element properties"""
    extractor = PropertyExtractor()
    properties = extractor.extract_properties_dict(ifc_file_path, element_guid)
    return properties

@app.task(name='worker.extract_spatial_tree')
def extract_spatial_tree(ifc_file_path: str):
    """Celery task: Extract spatial hierarchy"""
    extractor = SpatialTreeExtractor()
    tree = extractor.extract_tree(ifc_file_path)
    return tree.to_dict()
```

### .NET Service mit Queue

**`src/ifcserver/Services/PythonIfcQueueService.cs`:**
```csharp
using StackExchange.Redis;
using System.Text.Json;

namespace ifcserver.Services
{
    public class PythonIfcQueueService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<PythonIfcQueueService> _logger;

        public PythonIfcQueueService(
            IConnectionMultiplexer redis,
            ILogger<PythonIfcQueueService> logger)
        {
            _redis = redis;
            _logger = logger;
        }

        public async Task<string> EnqueueParseIfc(string ifcFilePath)
        {
            var db = _redis.GetDatabase();

            // Create job
            var jobId = Guid.NewGuid().ToString();
            var job = new
            {
                task = "worker.parse_ifc",
                args = new[] { ifcFilePath },
                id = jobId
            };

            // Push to Redis queue
            var jobJson = JsonSerializer.Serialize(job);
            await db.ListLeftPushAsync("celery", jobJson);

            _logger.LogInformation($"Enqueued parse job: {jobId}");

            return jobId;
        }

        public async Task<T?> GetJobResult<T>(string jobId, int timeoutSeconds = 300)
        {
            var db = _redis.GetDatabase();
            var startTime = DateTime.UtcNow;

            while ((DateTime.UtcNow - startTime).TotalSeconds < timeoutSeconds)
            {
                var resultKey = $"celery-task-meta-{jobId}";
                var result = await db.StringGetAsync(resultKey);

                if (!result.IsNullOrEmpty)
                {
                    var taskResult = JsonSerializer.Deserialize<CeleryTaskResult<T>>(result!);

                    if (taskResult?.Status == "SUCCESS")
                    {
                        return taskResult.Result;
                    }
                    else if (taskResult?.Status == "FAILURE")
                    {
                        throw new Exception($"Job failed: {taskResult.Traceback}");
                    }
                }

                await Task.Delay(1000); // Poll every second
            }

            throw new TimeoutException($"Job {jobId} did not complete within {timeoutSeconds} seconds");
        }
    }

    public class CeleryTaskResult<T>
    {
        public string Status { get; set; } = string.Empty;
        public T? Result { get; set; }
        public string? Traceback { get; set; }
    }
}
```

**Controller mit Async/Await:**
```csharp
[HttpPost("parse-async")]
public async Task<IActionResult> ParseIfcAsync(IFormFile file)
{
    // Save file to MinIO/shared storage
    var filePath = await SaveToStorage(file);

    // Enqueue job
    var jobId = await _queueService.EnqueueParseIfc(filePath);

    // Return job ID immediately
    return Accepted(new { jobId, status = "processing" });
}

[HttpGet("job/{jobId}")]
public async Task<IActionResult> GetJobStatus(string jobId)
{
    try
    {
        var result = await _queueService.GetJobResult<IfcMetadata>(jobId, timeoutSeconds: 5);

        if (result != null)
        {
            return Ok(new { status = "completed", result });
        }
        else
        {
            return Ok(new { status = "processing" });
        }
    }
    catch (TimeoutException)
    {
        return Ok(new { status = "processing" });
    }
    catch (Exception ex)
    {
        return Ok(new { status = "failed", error = ex.Message });
    }
}
```

---

## Migration vom Single- zum Multi-Container

### Phase 1: Single Container (1-2 Wochen)
- Implementiere alle Tasks aus Single-Container Plan
- Teste vollständig
- Deployment in Dev-Umgebung

### Phase 2: Vorbereitung Multi-Container (1 Woche)
1. **Task MC-1: Redis hinzufügen**
   - docker-compose.yml updaten
   - Redis Container hinzufügen
   - .NET Redis Client installieren

2. **Task MC-2: Celery Worker Setup**
   - `worker.py` erstellen
   - Celery-Tasks implementieren
   - Dockerfile.worker erstellen

3. **Task MC-3: Queue Service in .NET**
   - `PythonIfcQueueService.cs` implementieren
   - Controller auf Async umstellen
   - Job-Status-Polling

### Phase 3: Deployment & Skalierung (3-5 Tage)
4. **Task MC-4: MinIO Setup**
   - MinIO Container hinzufügen
   - File Upload zu MinIO umstellen
   - Storage Service abstrahieren

5. **Task MC-5: Production Dockerfiles**
   - Frontend Dockerfile.prod
   - API Dockerfile.prod
   - Worker Dockerfile.worker
   - Multi-stage builds optimieren

6. **Task MC-6: Orchestration**
   - Kubernetes Manifests (optional)
   - Docker Swarm (alternative)
   - Health Checks
   - Auto-Scaling Policies

---

## Monitoring & Observability

### Empfohlene Tools

1. **Celery Flower**
   - Web-UI für Job-Monitoring
   - Port 5555
   - Zeigt Worker-Status, Queue-Länge, Fehlgeschlagene Jobs

2. **Prometheus + Grafana**
   - Metrics von allen Containern
   - Custom Metrics (IFC-Parsing-Zeit, Queue-Länge, etc.)
   - Alerting

3. **Logging (ELK Stack)**
   - Elasticsearch
   - Logstash
   - Kibana
   - Zentrales Logging aller Container

4. **Sentry**
   - Error Tracking
   - Performance Monitoring

---

## Skalierungs-Strategie

### Horizontales Skalieren

**Python Workers skalieren:**
```bash
# Docker Compose
docker-compose up -d --scale python-worker=10

# Kubernetes
kubectl scale deployment python-worker --replicas=10
```

**Auto-Scaling basierend auf:**
- Redis Queue Länge
- CPU-Auslastung
- Memory-Nutzung
- Durchschnittliche Job-Dauer

### Load Balancing

- **API:** Nginx/Traefik vor mehreren API-Instanzen
- **Workers:** Celery verteilt automatisch über alle Worker
- **Database:** PostgreSQL Read-Replicas für Queries

---

## Kosten-Schätzung (Cloud Deployment)

### AWS Beispiel

| Service | Typ | Kosten/Monat |
|---------|-----|--------------|
| Frontend | CloudFront + S3 | $10-30 |
| API | ECS Fargate (2 tasks) | $60-100 |
| Workers | ECS Fargate (3 tasks) | $90-150 |
| Redis | ElastiCache t3.small | $30-50 |
| PostgreSQL | RDS t3.small | $40-70 |
| S3 Storage | 100GB | $2-5 |
| **GESAMT** | | **$232-405/Monat** |

### Günstigere Alternative: Hetzner/DigitalOcean

| Service | Typ | Kosten/Monat |
|---------|-----|--------------|
| Server | 8 vCPU, 16GB RAM | $60-80 |
| Storage | 200GB Block Storage | $10-20 |
| Backups | | $10-15 |
| **GESAMT** | | **$80-115/Monat** |

---

## Performance-Ziele

### Benchmarks (Production)

| Operation | Target | Acceptable |
|-----------|--------|------------|
| IFC Parse (small 1MB) | < 5s | < 10s |
| IFC Parse (large 100MB) | < 60s | < 120s |
| glTF Export (small) | < 10s | < 20s |
| glTF Export (large) | < 120s | < 300s |
| Property Extraction | < 2s | < 5s |
| Spatial Tree | < 5s | < 15s |
| Queue Latency | < 1s | < 3s |

### Optimierungen

1. **Caching:**
   - Redis für Metadaten
   - CDN für glTF-Files

2. **Database:**
   - Indizes auf häufige Queries
   - Connection Pooling

3. **Workers:**
   - Process Pooling (Multiprocessing)
   - Memory Limits pro Worker

---

## Security Considerations

### Production Checklist

- [ ] HTTPS für alle externen Endpoints (Let's Encrypt)
- [ ] API Rate Limiting (Redis-basiert)
- [ ] File Upload Größen-Limits (max 500MB)
- [ ] File-Type Validation (nur .ifc erlaubt)
- [ ] Virus-Scanning für Uploads (ClamAV)
- [ ] Network Isolation (Frontend/Backend Networks)
- [ ] Secrets Management (Vault/AWS Secrets Manager)
- [ ] Container Image Scanning (Trivy/Grype)
- [ ] User Authentication (JWT)
- [ ] CORS konfiguriert
- [ ] Database Encryption at Rest
- [ ] Backup-Strategy

---

## Disaster Recovery

### Backup-Strategie

1. **PostgreSQL:**
   - Daily Snapshots
   - Point-in-Time Recovery
   - 30-Tage Retention

2. **MinIO/S3:**
   - Versioning aktiviert
   - Cross-Region Replication

3. **Redis:**
   - AOF Persistence
   - Snapshots alle 6h

4. **Container Images:**
   - Private Registry
   - Image Tags nie überschreiben

### Recovery Procedures

**Database Restore:**
```bash
# PostgreSQL Backup
docker exec db pg_dump -U postgres ifcdb > backup.sql

# Restore
docker exec -i db psql -U postgres ifcdb < backup.sql
```

**Full System Restore:**
```bash
# 1. Pull latest images
docker-compose pull

# 2. Restore database
cat backup.sql | docker exec -i db psql -U postgres ifcdb

# 3. Restart services
docker-compose down
docker-compose up -d
```

---

## Zeitplan Multi-Container Migration

| Phase | Tasks | Aufwand | Abhängigkeiten |
|-------|-------|---------|----------------|
| Phase 1 | Single-Container komplett | 38-49h | Keine |
| Phase 2 | MC-1 bis MC-3 | 20-30h | Phase 1 ✅ |
| Phase 3 | MC-4 bis MC-6 | 15-25h | Phase 2 ✅ |
| Testing | Integration Tests | 10-15h | Phase 3 ✅ |
| Deploy | Production Setup | 5-10h | Testing ✅ |
| **GESAMT** | | **88-129h** | |

**Realistische Planung:** 3-4 Wochen zusätzlich zum Single-Container Plan

---

## Entscheidungsmatrix: Single vs Multi-Container

| Kriterium | Single Container | Multi-Container |
|-----------|------------------|-----------------|
| **Setup-Zeit** | 1-2 Wochen | 3-4 Wochen |
| **Komplexität** | ⭐ Einfach | ⭐⭐⭐ Komplex |
| **Kosten (Cloud)** | $20-40/Monat | $80-400/Monat |
| **Skalierbarkeit** | ❌ Keine | ✅ Horizontal |
| **Async Processing** | ❌ Blockierend | ✅ Queue |
| **Failure Isolation** | ❌ Alles crasht | ✅ Isoliert |
| **Monitoring** | ⭐⭐ Basic | ⭐⭐⭐ Advanced |
| **Maintenance** | ⭐⭐⭐ Einfach | ⭐ Aufwendig |
| **Prod-Ready** | ⭐⭐ PoC/Small | ⭐⭐⭐ Enterprise |

---

## Empfehlung

### Für PoC/MVP:
✅ **Start mit Single-Container Plan**
- Schneller Time-to-Market
- Einfacheres Debugging
- Niedrigere Kosten
- Ausreichend für < 100 User

### Migration zu Multi-Container wenn:
- ⚠️ > 100 gleichzeitige User
- ⚠️ IFC-Files > 100MB regulär
- ⚠️ Parsing dauert > 30 Sekunden
- ⚠️ Single Container CPU/Memory-Limits erreicht
- ⚠️ High-Availability erforderlich

---

**Ende des Multi-Container Production Plans**