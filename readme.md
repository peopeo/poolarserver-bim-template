# 🧱 PoolarServer BIM Template – Architectural Overview

## 🎯 Purpose

The **PoolarServer BIM Template** provides a fully reproducible development environment for experimenting with **BIM data processing**, **IFC file conversion**, and **API-driven workflows**.  
It is designed as a **modular full-stack system** where each component (backend, frontend, database, dev environment, and automation) can evolve independently but still work seamlessly together.

---

## 🏗️ System Architecture Overview

The project consists of three main layers:

1. **Backend (ifcserver)** – a .NET 9 API service that handles IFC processing tasks and manages job state.
    
2. **Frontend (`webui`)** – a **React-based single-page application** built with **Vite**.  
Node.js is used only for local development and bundling.  
The compiled frontend is served directly by the **.NET HTTP server**, ensuring both the API and UI run under the same address and deployment context.
    
3. **Infrastructure (devcontainer + Docker Compose)** – a containerized development environment that ensures the same setup works everywhere, including database, build tools, and environment configuration.
    

All layers are orchestrated through **Docker Compose** inside a **VS Code DevContainer**, so developers can simply “Reopen in Container” and start coding immediately.

---

## ⚙️ Backend – `ifcserver`

### Purpose

The backend provides an extensible web API for IFC-related operations such as:

- Submitting conversion jobs (e.g., to glTF or XKT)
    
- Tracking job status
    
- Managing stored conversion results
    

### Structure

The backend follows standard .NET architecture:

- `Program.cs` – entry point, sets up web host and dependency injection.
    
- `Data/AppDbContext.cs` – Entity Framework context for database access.
    
- `Models/ConversionJob.cs` – defines how conversion jobs are stored and tracked.
    
- `Services/` – contains business logic:
    
    - `IfcService.cs` – handles database and job management.
        
    - `ProcessRunner.cs` – runs external processes such as IFCConvert safely in the background.
        
    - `IIfcService.cs` – defines a clean interface for service injection.
        

At runtime, the API connects to a PostgreSQL instance defined in Docker Compose, using the connection string from `appsettings.json`.

---

## 🧩 Frontend – `webui` (React + Vite)

### Purpose

The **Web UI** is the user-facing entry point of the system.  
It’s a **React application** built with **Vite**, designed for fast development, modern component-based UI, and seamless API integration with the backend (`ifcserver`).

It will ultimately allow users to:

- Upload and manage IFC files.
    
- Trigger conversion jobs (e.g., IFC → GLTF/XKT).
    
- Monitor conversion progress in real time.
    
- Visualize and download results.
    

---

### Framework and Tooling

The frontend stack is intentionally lightweight and modern:

|Tool|Purpose|
|---|---|
|**React**|Component-based UI framework for building interactive views.|
|**Vite**|Development/build tool that provides hot-reload and optimized bundling.|
|**Node.js 20**|Runtime for development and package management.|
|**TypeScript (planned)**|Optional type safety for larger-scale frontend logic.|
|**REST API integration**|Communicates with the backend at `http://localhost:5000`.|

The devcontainer already includes **Node.js** and exposes port **5173**, so no additional local setup is required.

---

```plaintext
poolarserver-bim-template/
├── .devcontainer/                    # VS Code Dev Container setup
│   ├── docker-compose.yml            # Defines containers for .NET + Postgres
│   ├── Dockerfile.ifcserver          # Build for .NET backend
│   ├── Dockerfile.webui              # Build for frontend (Node/Vite)
│   ├── devcontainer.json             # Container configuration and hooks
│   ├── post_create.sh                # Run after container creation (build, restore)
│   └── post_start.sh                 # Post-start tasks (e.g., git setup)
│
├── .vscode/                          # VS Code workspace setup
│   ├── launch.json                   # Debug configuration for .NET server
│   └── tasks.json                    # Build tasks for .NET
│
├── src/
│   ├── ifcserver/                    # ASP.NET Core backend (API + static hosting)
│   │   ├── Data/
│   │   │   └── AppDbContext.cs       # EF Core DB context
│   │   ├── Models/
│   │   │   └── ConversionJob.cs      # Job entity for IFC conversion
│   │   ├── Services/
│   │   │   ├── IfcService.cs         # Business logic for job processing
│   │   │   ├── IIfcService.cs        # Service interface
│   │   │   └── ProcessRunner.cs      # Handles external IFC conversion processes
│   │   ├── appsettings.json          # Backend configuration (DB, logging)
│   │   ├── IfcServer.csproj          # Project file
│   │   └── Program.cs                # Application entry point
│   │
│   └── webui/                        # React + Vite frontend
│       ├── public/                   # Static assets (icons, manifest, etc.)
│       ├── src/
│       │   ├── components/           # Reusable React components
│       │   ├── pages/                # Page layouts and routes
│       │   ├── hooks/                # Custom React hooks
│       │   ├── services/             # API abstraction layer
│       │   ├── App.jsx               # Root component
│       │   └── main.jsx              # Entry point
│       ├── index.html
│       ├── package.json
│       └── vite.config.js
│
├── .gitignore                        # Git ignore rules
├── .gitattributes                    # Cross-platform line endings
├── .gitmessage.txt                   # Commit message template
├── .editorconfig                     # Code formatting conventions
├── dotnet.log                        # Runtime log (ignored by git)
├── poolarserver-bim-template.sln     # Visual Studio solution file
└── README.md                         # Project documentation
```


---

### Integration with the Backend

The React frontend communicates directly with the `.NET` backend API through HTTP calls:

- `POST /api/jobs` – submit a new IFC conversion job.
    
- `GET /api/jobs/:id` – check the status of a job.
    
- `GET /api/jobs` – list all existing jobs.
    

This simple REST interface allows the frontend to display job queues, progress states, and results dynamically.

---

### Development Workflow

1. **Start backend:**  
    In VS Code, run the debug configuration **“Launch IFC Server”** to start the API on port `5000`.
    
2. **Start frontend:**  
    Inside the container:
    
    `cd src/webui npm install npm run dev`
    
    Vite will serve React on port `5173`.
    
3. **Access the app:**  
    Visit → [http://localhost:5173](http://localhost:5173)
    
4. **Hot Reload:**  
    Any file changes in React components trigger instant refresh through Vite.
    

---

### Future Features

The Web UI will evolve towards a lightweight BIM dashboard:

- ✅ File upload with drag-and-drop.
    
- ✅ Progress visualization of running jobs.
    
- 🔜 3D preview of converted GLTF/XKT models (via xeokit).
    
- 🔜 User authentication and session handling.
    
- 🔜 API error logging and retry mechanisms.
    

---

### Architectural Notes

The frontend remains intentionally **decoupled** from the backend:

- It uses REST APIs, not server-side rendering.
    
- It can be developed, built, and deployed separately.
    
- It communicates through shared environment variables (e.g., `VITE_API_URL`).
    

This makes the system cloud-ready: the same frontend can later run on a CDN or a containerized web server.

---

## 🐘 Database – PostgreSQL

### Purpose

Stores all backend data, including job records and future user-specific metadata.

### Configuration

- The service is declared in `.devcontainer/docker-compose.yml`.
    
- Database credentials and schema initialization are handled automatically.
    
- Data persistence is ensured through a named Docker volume (`postgres-data`).
    

When the environment starts, the backend automatically connects to `db:5432`.

---

## 🧰 Development Environment – `.devcontainer`

### Purpose

Ensures that every contributor works in an identical, isolated environment — regardless of host OS or local tool versions.

### Key Files

- **`docker-compose.yml`**  
    Defines the `devcontainer` and `db` services, networks, and volume bindings.
    
- **`Dockerfile.ifcserver`**  
    Builds the development image, installing:
    
    - .NET 9 SDK
        
    - Node.js 20
        
    - Python 3 (for IFCOpenShell and IFCConvert)
        
- **`devcontainer.json`**  
    The entry point for VS Code’s remote container configuration.  
    It references lifecycle scripts and forwards ports 5000 and 5173.
    

### Lifecycle Scripts

- **`post_create.sh`**  
    Runs once after the container is built.  
    It waits for PostgreSQL, restores dependencies, and builds the backend.
    
- **`post_start.sh`**  
    Runs every time the container starts.  
    It configures Git to use a shared `.gitconfig` and commit template.
    

Together, they ensure that after the first container start, the developer can immediately build, run, and debug the backend API.

---

## 🧠 Git & Repository Conventions

### Purpose

The repository enforces **consistent commits**, **cross-platform compatibility**, and **clean coding standards**.

### Key Files

- **`.gitconfig`** – defines project-wide Git settings and links the commit message template.
    
- **`.gitmessage.txt`** – provides a Conventional Commit format guide (e.g., `feat(api): add job controller`).
    
- **`.editorconfig`** – enforces consistent indentation and line endings across all editors.
    
- **`.gitattributes`** – normalizes line endings and excludes binaries from diffs.
    
- **`.gitignore`** – excludes generated folders (`bin/`, `obj/`, `node_modules/`, `__pycache__/`, etc.).
    

All Git configuration is automatically applied inside the container at startup, so no manual setup is needed.

---

## 🧭 Development Workflow

The standard workflow is simple and predictable:

1. **Reopen in Container**  
    VS Code automatically builds and attaches to the environment.
    
2. **Wait for setup**  
    `post_create.sh` builds the backend and ensures database readiness.
    
3. **Run the API**  
    Use the built-in VS Code debug configuration “Launch IFC Server” to start the .NET service.
    
4. **Open Swagger UI**  
    Navigate to `http://localhost:5000/swagger` to verify the API.
    
5. **Make changes**  
    Code, test, and commit using the predefined Conventional Commit structure.
    
6. **Push to GitHub**  
    Changes are versioned cleanly with consistent formatting and commit metadata.
    

---

## 🧩 Automation & Integration

While the backend is currently minimal, the architecture anticipates further integration, such as:

- **Queue jobs and background workers** for IFC conversion
    
- **RESTful endpoints** for submitting jobs and polling status
    
- **File storage layer** (local or S3-compatible)
    
- **Frontend integration** to visualize model previews
    
- **CI/CD pipeline** based on the same Docker configuration
    

---

## 🚧 Error Handling and Recovery Philosophy

Every major process (container build, database startup, Git setup) is designed to be **idempotent**:  
you can safely re-run it without breaking the system.

Typical recovery workflow:

1. Stop and remove all containers.
    
2. Prune unused Docker resources.
    
3. Rebuild the environment via `devcontainer up --remove-existing-container`.
    
4. Reopen the workspace — everything self-repairs through the lifecycle scripts.
    

---

## 🧭 Design Goals

|Goal|Description|
|---|---|
|**Reproducibility**|Anyone can clone and start the full environment with one command.|
|**Isolation**|No dependencies or configuration leaks to the host system.|
|**Portability**|Same setup works on Linux, macOS, or Windows.|
|**Transparency**|All scripts and configurations are explicit and versioned.|
|**Extensibility**|Easy to add new services (e.g., AI pipelines, IFC parsers, file storage).|
|**Consistency**|Enforced by `.editorconfig`, `.gitmessage.txt`, and commit automation.|

---

## 🧩 Current State

|Area|Status|Notes|
|---|---|---|
|DevContainer|✅ Operational|Builds cleanly and attaches automatically|
|Database|✅ Working|Persistent PostgreSQL volume|
|.NET API|✅ Compiles|No controllers yet defined|
|Swagger UI|✅ Accessible|Runs at `http://localhost:5000/swagger`|
|Git Automation|✅ Stable|Shared config and commit template apply automatically|
|Auto-start|🚧 Planned|Will be implemented later for production mode|

---

## 📘 Summary

The **PoolarServer BIM Template** is not just a .NET project — it’s a **complete development framework** for building, testing, and deploying BIM-related server applications in a reproducible, isolated way.

Every piece — from the Docker infrastructure to the Git conventions — contributes to the same goal:  
**make IFC processing development effortless, consistent, and scalable**.