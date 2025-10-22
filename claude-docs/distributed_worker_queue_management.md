# Distributed Worker Queue Management - License Analysis & Implementation Options

**Date:** 2025-10-21
**Project:** IFC Server BIM Template
**Purpose:** Analysis of message queue systems for production-ready distributed IFC file processing

---

## Executive Summary

This document provides a comprehensive analysis of message queue systems suitable for distributed IFC file processing, with emphasis on:
- Open-source solutions
- Non-viral (permissive) licenses
- Free for commercial use
- Production-ready architecture

**Key Constraint:** Only use open-source tools without viral copyleft licenses that are free to use commercially.

---

## Current POC Implementation

### Status: Development/Testing ✅

**Architecture:**
```
Upload API → Task.Run() → Python Process (separate per file)
```

**Characteristics:**
- No queue management
- Unlimited concurrent processing
- Suitable for development on powerful hardware (20 cores, 62 GB RAM)
- Will be replaced with distributed queue in production

---

## License Analysis for Message Queue Systems

### 1. RabbitMQ - Mozilla Public License 2.0 (MPL 2.0)

**License Type:** Weak copyleft (NOT viral)
**Commercial Use:** ✅ Yes, completely free
**Key Characteristics:**
- Only modifications to RabbitMQ itself must be shared under MPL 2.0
- Your application code remains completely proprietary
- You can use RabbitMQ as a service without any license obligations
- Linking/using via client libraries does NOT require disclosure

**Verdict:** ✅ **Safe to use** - Highly recommended

**Reference:** https://www.mozilla.org/en-US/MPL/2.0/

---

### 2. MassTransit - Apache 2.0

**License Type:** Very permissive
**Commercial Use:** ✅ Yes, completely free
**Key Characteristics:**
- Can use, modify, and distribute freely
- No copyleft restrictions
- Patent grant included
- Very business-friendly

**Verdict:** ✅ **Perfect choice** - Recommended abstraction layer

**Reference:** https://github.com/MassTransit/MassTransit/blob/develop/LICENSE

---

### 3. RabbitMQ.Client (.NET Client) - Apache 2.0

**License Type:** Very permissive
**Commercial Use:** ✅ Yes, completely free
**Key Characteristics:**
- Official .NET client for RabbitMQ
- Apache 2.0 license (same as MassTransit)
- No restrictions on commercial use

**Verdict:** ✅ **Perfect choice**

**Reference:** https://github.com/rabbitmq/rabbitmq-dotnet-client

---

### 4. Hangfire - LGPL v3 (free) / Commercial (paid)

**License Type:** Copyleft (LGPL allows dynamic linking)
**Commercial Use:** ⚠️ LGPL v3 has restrictions
**Key Characteristics:**
- Free version: LGPL v3 (weaker than GPL, but still copyleft)
- Commercial license available (paid)
- LGPL allows dynamic linking without disclosure requirements
- More restrictive than Apache/MIT/BSD

**Verdict:** ⚠️ **Avoid if possible** - Use alternatives

**Note:** While LGPL is less restrictive than GPL, there are better fully permissive options available.

---

### 5. Redis - BSD 3-Clause

**License Type:** Very permissive
**Commercial Use:** ✅ Yes, completely free
**Key Characteristics:**
- One of the most permissive licenses
- No restrictions on commercial use
- No copyleft provisions
- Widely trusted in enterprise

**Verdict:** ✅ **Perfect choice**

**Reference:** https://redis.io/topics/license

---

### 6. Apache Kafka - Apache 2.0

**License Type:** Very permissive
**Commercial Use:** ✅ Yes, completely free
**Key Characteristics:**
- Apache 2.0 license
- Enterprise-grade
- No restrictions on commercial use

**Verdict:** ✅ **Perfect choice** (but may be overkill)

**Reference:** https://kafka.apache.org/

---

### 7. NATS - Apache 2.0

**License Type:** Very permissive
**Commercial Use:** ✅ Yes, completely free
**Key Characteristics:**
- Cloud-native messaging system
- Apache 2.0 license
- Very lightweight

**Verdict:** ✅ **Perfect choice**

**Reference:** https://nats.io/

---

### 8. PostgreSQL - PostgreSQL License

**License Type:** Very permissive (similar to MIT/BSD)
**Commercial Use:** ✅ Yes, completely free
**Key Characteristics:**
- One of the most permissive database licenses
- Can be used commercially without restrictions
- Already in use in the project

**Verdict:** ✅ **Perfect choice** (already using it!)

**Reference:** https://www.postgresql.org/about/licence/

---

## Recommended Solutions (All Permissive Licenses)

### Option 1: RabbitMQ + MassTransit (Recommended for Production)

**License Summary:**
- RabbitMQ: MPL 2.0 (weak copyleft, safe)
- MassTransit: Apache 2.0 (permissive)
- RabbitMQ.Client: Apache 2.0 (permissive)

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│ Upload API (ASP.NET Core)                           │
│  • Accept IFC file upload                          │
│  • Save to storage                                 │
│  • Create DB record (status: Queued)              │
│  • Publish message to RabbitMQ via MassTransit    │
│  • Return 202 Accepted immediately                │
└──────────────────┬────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   RabbitMQ Queue     │
        │  "ifc-processing"    │
        │                      │
        │  Features:           │
        │  • Persistence       │
        │  • Dead letter queue │
        │  • Priority queues   │
        │  • Message TTL       │
        └──────────┬───────────┘
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │Worker 1│ │Worker 2│ │Worker 3│  ← Can scale horizontally
    │(Node A)│ │(Node A)│ │(Node B)│  ← Can run on different servers
    │        │ │        │ │        │
    │Process │ │Process │ │Process │
    │IFC →   │ │IFC →   │ │IFC →   │
    │glTF +  │ │glTF +  │ │glTF +  │
    │Elements│ │Elements│ │Elements│
    └────┬───┘ └────┬───┘ └────┬───┘
         │         │         │
         └─────────┴─────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   PostgreSQL DB      │
        │  • Update status     │
        │  • Store elements    │
        │  • Store spatial tree│
        └──────────────────────┘
```

**Benefits:**
- ✅ Battle-tested, enterprise-grade
- ✅ Excellent .NET support via MassTransit
- ✅ Horizontal scaling (add more workers)
- ✅ Automatic retry with exponential backoff
- ✅ Dead letter queues for failed messages
- ✅ Priority queues (urgent files first)
- ✅ Message persistence (survives restarts)
- ✅ Monitoring and management UI
- ✅ Cloud-ready (AWS, Azure support)

**Dependencies:**
```xml
<PackageReference Include="MassTransit" Version="8.1.0" />
<PackageReference Include="MassTransit.RabbitMQ" Version="8.1.0" />
```

**Setup Complexity:** Medium (requires RabbitMQ server)

---

### Option 2: Redis + Custom Queue Logic (Simplest External Queue)

**License Summary:**
- Redis: BSD 3-Clause (very permissive)
- StackExchange.Redis: MIT License (very permissive)

**Architecture:**
```
┌──────────────────────┐
│ Upload API           │
│  LPUSH queue:ifc     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Redis List           │
│ "queue:ifc"          │
│                      │
│ [File1, File2, ...]  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Worker(s)            │
│  BRPOP queue:ifc     │
│  Process IFC file    │
└──────────────────────┘
```

**Benefits:**
- ✅ Very simple to set up and understand
- ✅ Extremely fast (in-memory)
- ✅ Widely used and well-supported
- ✅ Great for POC to production transition
- ✅ Can add Redis Streams for more features

**Dependencies:**
```xml
<PackageReference Include="StackExchange.Redis" Version="2.6.122" />
```

**Setup Complexity:** Low (Redis is lightweight)

**Simple Implementation:**
```csharp
// Upload endpoint
await redis.ListLeftPushAsync("queue:ifc", revisionId.ToString());

// Worker
while (true)
{
    var revisionId = await redis.ListRightPopAsync("queue:ifc");
    if (revisionId.HasValue)
    {
        await ProcessRevisionAsync(int.Parse(revisionId));
    }
}
```

---

### Option 3: PostgreSQL + SKIP LOCKED (Zero New Dependencies)

**License Summary:**
- PostgreSQL: PostgreSQL License (MIT-like, very permissive)
- Npgsql: PostgreSQL License (very permissive)

**Architecture:**
```
┌──────────────────────┐
│ Upload API           │
│  INSERT queue row    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PostgreSQL           │
│ ProcessingQueue      │
│                      │
│ Status: Queued       │
│ Status: Processing   │
│ Status: Completed    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Worker(s)            │
│ SELECT ... FOR       │
│ UPDATE SKIP LOCKED   │
└──────────────────────┘
```

**Database Schema:**
```sql
CREATE TABLE ProcessingQueue (
    Id SERIAL PRIMARY KEY,
    RevisionId INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'Queued',
    Priority INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    StartedAt TIMESTAMP NULL,
    CompletedAt TIMESTAMP NULL,
    WorkerId VARCHAR(50) NULL,
    RetryCount INT DEFAULT 0,
    ErrorMessage TEXT NULL,
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id) ON DELETE CASCADE
);

CREATE INDEX idx_queue_status_priority
ON ProcessingQueue(Status, Priority DESC, CreatedAt);
```

**Worker Query (Race-condition safe):**
```sql
-- Atomically claim next job
BEGIN;

SELECT Id, RevisionId FROM ProcessingQueue
WHERE Status = 'Queued'
ORDER BY Priority DESC, CreatedAt ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;

UPDATE ProcessingQueue
SET Status = 'Processing',
    StartedAt = NOW(),
    WorkerId = 'worker-1'
WHERE Id = ?;

COMMIT;
```

**Benefits:**
- ✅ Zero new infrastructure
- ✅ ACID guarantees
- ✅ Already using PostgreSQL
- ✅ Simple to implement
- ✅ Good for low-to-medium throughput
- ✅ Built-in persistence and reliability

**Limitations:**
- ⚠️ Not as performant as dedicated queue systems
- ⚠️ Manual retry logic required
- ⚠️ No built-in monitoring UI
- ⚠️ Workers must poll (not push-based)

**Setup Complexity:** Very Low (already have PostgreSQL)

---

### Option 4: Apache Kafka (For High-Throughput Future)

**License Summary:**
- Apache Kafka: Apache 2.0 (very permissive)
- Confluent.Kafka (.NET): Apache 2.0 (very permissive)

**Architecture:**
```
┌──────────────────────┐
│ Upload API           │
│  Produce to topic    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Kafka Topic          │
│ "ifc-processing"     │
│                      │
│ Partitions: 10       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Consumer Group       │
│ Workers (auto-scale) │
└──────────────────────┘
```

**Benefits:**
- ✅ Massive throughput (millions of messages/sec)
- ✅ Event sourcing capabilities
- ✅ Excellent for microservices
- ✅ Built-in partitioning and scaling
- ✅ Strong ordering guarantees

**Limitations:**
- ⚠️ Overkill for simple queues
- ⚠️ More complex to set up and operate
- ⚠️ Requires Zookeeper (or KRaft mode)
- ⚠️ Higher operational overhead

**Setup Complexity:** High

**When to use:** When you need >10,000 messages/sec or event sourcing

---

## Comparison Matrix

| Feature | RabbitMQ + MassTransit | Redis | PostgreSQL | Kafka |
|---------|----------------------|-------|------------|-------|
| **License** | MPL 2.0 / Apache 2.0 | BSD 3-Clause | PostgreSQL | Apache 2.0 |
| **Throughput** | High (10k-50k/sec) | Very High (100k+/sec) | Medium (1k-5k/sec) | Massive (1M+/sec) |
| **Setup** | Medium | Low | Very Low | High |
| **Learning Curve** | Medium | Low | Very Low | High |
| **Persistence** | Yes | Optional | Yes | Yes |
| **Retry Logic** | Built-in | Manual | Manual | Manual |
| **Monitoring** | Excellent UI | Good | Manual | Excellent |
| **Horizontal Scale** | Excellent | Good | Limited | Excellent |
| **Message Order** | Per queue | Yes | Yes | Per partition |
| **Dead Letter** | Built-in | Manual | Manual | Manual |
| **Priority Queues** | Built-in | Manual | Easy (SQL ORDER BY) | No |
| **New Dependencies** | RabbitMQ server | Redis server | None | Kafka cluster |

---

## Implementation Roadmap

### Phase 1: POC (Current)
- ✅ Task.Run() background processing
- ✅ No queue management
- ✅ Suitable for development

### Phase 2: Simple Production (Option 3 - PostgreSQL)
- Implement ProcessingQueue table
- Add worker polling logic
- No new infrastructure
- **Timeline:** 1-2 days

### Phase 3: Scalable Production (Option 1 - RabbitMQ)
- Set up RabbitMQ server
- Implement MassTransit consumers
- Add retry and dead letter queues
- **Timeline:** 3-5 days

### Phase 4: Enterprise Scale (Option 4 - Kafka)
- Only if needed (>10k files/day)
- Full event sourcing
- Microservices architecture
- **Timeline:** 2-3 weeks

---

## Recommendation

### For Your Use Case:

**Immediate (POC):** Keep current `Task.Run()` implementation ✅

**Short-term (MVP):** PostgreSQL-based queue
- Reason: Zero new dependencies, simple, reliable
- Effort: Minimal (1-2 days)
- Good for: Testing production patterns

**Long-term (Production):** RabbitMQ + MassTransit
- Reason: Battle-tested, excellent .NET support, scalable
- Effort: Medium (3-5 days)
- Good for: Enterprise production use

**Future (If needed):** Kafka
- Reason: Only if you need massive throughput or event sourcing
- Effort: High (2-3 weeks)

---

## License Compliance Summary

All recommended solutions use **permissive, non-viral licenses**:

| Solution | License | Commercial Use | Viral? | Safe? |
|----------|---------|----------------|--------|-------|
| RabbitMQ | MPL 2.0 | ✅ Yes | ❌ No (weak copyleft) | ✅ Safe |
| MassTransit | Apache 2.0 | ✅ Yes | ❌ No | ✅ Safe |
| Redis | BSD 3-Clause | ✅ Yes | ❌ No | ✅ Safe |
| PostgreSQL | PostgreSQL | ✅ Yes | ❌ No | ✅ Safe |
| Kafka | Apache 2.0 | ✅ Yes | ❌ No | ✅ Safe |
| NATS | Apache 2.0 | ✅ Yes | ❌ No | ✅ Safe |

**What to avoid:**
- ❌ Hangfire (LGPL v3) - Use alternatives instead
- ❌ Any GPL-licensed software (strongly copyleft/viral)

---

## Code Examples

### Example 1: PostgreSQL Queue Implementation

```csharp
// QueueService.cs
public class QueueService
{
    private readonly AppDbContext _context;
    private readonly ILogger<QueueService> _logger;

    public async Task EnqueueRevisionAsync(int revisionId, int priority = 0)
    {
        var queueItem = new ProcessingQueue
        {
            RevisionId = revisionId,
            Status = "Queued",
            Priority = priority,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProcessingQueue.Add(queueItem);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Enqueued revision {RevisionId} for processing", revisionId);
    }

    public async Task<ProcessingQueue?> DequeueNextJobAsync(string workerId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Claim next job atomically using SKIP LOCKED
            var job = await _context.ProcessingQueue
                .FromSqlRaw(@"
                    SELECT * FROM ""ProcessingQueue""
                    WHERE ""Status"" = 'Queued'
                    ORDER BY ""Priority"" DESC, ""CreatedAt"" ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                ")
                .FirstOrDefaultAsync();

            if (job != null)
            {
                job.Status = "Processing";
                job.StartedAt = DateTime.UtcNow;
                job.WorkerId = workerId;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Worker {WorkerId} claimed job {JobId}", workerId, job.Id);
                return job;
            }

            await transaction.CommitAsync();
            return null;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task CompleteJobAsync(int jobId)
    {
        var job = await _context.ProcessingQueue.FindAsync(jobId);
        if (job != null)
        {
            job.Status = "Completed";
            job.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Completed job {JobId}", jobId);
        }
    }

    public async Task FailJobAsync(int jobId, string errorMessage)
    {
        var job = await _context.ProcessingQueue.FindAsync(jobId);
        if (job != null)
        {
            job.RetryCount++;

            if (job.RetryCount < 3)
            {
                // Retry
                job.Status = "Queued";
                job.StartedAt = null;
                _logger.LogWarning("Job {JobId} failed, retrying (attempt {Retry})", jobId, job.RetryCount);
            }
            else
            {
                // Failed permanently
                job.Status = "Failed";
                job.ErrorMessage = errorMessage;
                job.CompletedAt = DateTime.UtcNow;
                _logger.LogError("Job {JobId} failed permanently: {Error}", jobId, errorMessage);
            }

            await _context.SaveChangesAsync();
        }
    }
}

// Worker.cs (Background Service)
public class RevisionProcessorWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RevisionProcessorWorker> _logger;
    private readonly string _workerId = $"worker-{Environment.MachineName}-{Guid.NewGuid():N}";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Worker {WorkerId} started", _workerId);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var queueService = scope.ServiceProvider.GetRequiredService<QueueService>();

                var job = await queueService.DequeueNextJobAsync(_workerId);

                if (job != null)
                {
                    try
                    {
                        // Process the revision
                        var processor = scope.ServiceProvider.GetRequiredService<RevisionProcessor>();
                        await processor.ProcessAsync(job.RevisionId);

                        await queueService.CompleteJobAsync(job.Id);
                    }
                    catch (Exception ex)
                    {
                        await queueService.FailJobAsync(job.Id, ex.Message);
                    }
                }
                else
                {
                    // No jobs available, wait before polling again
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Worker {WorkerId} encountered error", _workerId);
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("Worker {WorkerId} stopped", _workerId);
    }
}
```

### Example 2: MassTransit + RabbitMQ Implementation

```csharp
// Messages/ProcessRevisionCommand.cs
public record ProcessRevisionCommand
{
    public int RevisionId { get; init; }
    public string IfcFilePath { get; init; }
    public DateTime QueuedAt { get; init; }
}

// Consumers/ProcessRevisionConsumer.cs
public class ProcessRevisionConsumer : IConsumer<ProcessRevisionCommand>
{
    private readonly RevisionProcessor _processor;
    private readonly ILogger<ProcessRevisionConsumer> _logger;

    public async Task Consume(ConsumeContext<ProcessRevisionCommand> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Processing revision {RevisionId} (queued at {QueuedAt})",
            message.RevisionId,
            message.QueuedAt
        );

        try
        {
            await _processor.ProcessAsync(message.RevisionId);

            _logger.LogInformation("Successfully processed revision {RevisionId}", message.RevisionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process revision {RevisionId}", message.RevisionId);
            throw; // Will trigger retry policy
        }
    }
}

// Program.cs - Configuration
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<ProcessRevisionConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("localhost", "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ReceiveEndpoint("ifc-processing", e =>
        {
            e.ConfigureConsumer<ProcessRevisionConsumer>(context);

            // Retry policy
            e.UseMessageRetry(r => r.Exponential(
                retryLimit: 3,
                minInterval: TimeSpan.FromSeconds(5),
                maxInterval: TimeSpan.FromMinutes(5),
                intervalDelta: TimeSpan.FromSeconds(10)
            ));

            // Concurrency limit (max 6 concurrent on this machine)
            e.PrefetchCount = 6;
            e.ConcurrentMessageLimit = 6;
        });
    });
});

// RevisionsController.cs - Publishing
public class RevisionsController : ControllerBase
{
    private readonly IPublishEndpoint _publishEndpoint;

    [HttpPost("upload")]
    public async Task<IActionResult> UploadRevision(IFormFile file)
    {
        // ... save file, create DB record ...

        // Publish to queue instead of Task.Run()
        await _publishEndpoint.Publish(new ProcessRevisionCommand
        {
            RevisionId = revision.Id,
            IfcFilePath = savedIfcPath,
            QueuedAt = DateTime.UtcNow
        });

        return Accepted(new {
            message = "Revision queued for processing",
            revisionId = revision.Id
        });
    }
}
```

---

## Monitoring and Observability

### RabbitMQ
- Built-in management UI: `http://localhost:15672`
- Metrics: Queue depth, message rates, consumer count
- Prometheus integration available

### Redis
- Redis CLI: `redis-cli INFO stats`
- Redis Insight (GUI)
- Custom metrics via StackExchange.Redis

### PostgreSQL
- Query ProcessingQueue table for statistics
- Custom monitoring dashboard
```sql
-- Current queue status
SELECT
    Status,
    COUNT(*) as Count,
    AVG(EXTRACT(EPOCH FROM (NOW() - CreatedAt))) as AvgWaitSeconds
FROM ProcessingQueue
GROUP BY Status;
```

---

## References

- RabbitMQ: https://www.rabbitmq.com/
- MassTransit: https://masstransit.io/
- Redis: https://redis.io/
- Apache Kafka: https://kafka.apache.org/
- NATS: https://nats.io/
- PostgreSQL SKIP LOCKED: https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE

---

## Conclusion

For your IFC BIM Template project:

1. **Current POC:** Keep `Task.Run()` - works fine on powerful hardware ✅
2. **First production step:** PostgreSQL queue - zero new dependencies ✅
3. **Scalable production:** RabbitMQ + MassTransit - industry standard ✅
4. **Future (if needed):** Kafka - only for massive scale ✅

All options use **permissive, non-viral licenses** suitable for commercial use.

---

*Document created: 2025-10-21*
*Author: Claude Code (Anthropic)*
