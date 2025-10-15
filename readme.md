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


## 🧑‍💻 Developer Setup (Windows + WSL + Docker Desktop)

This guide explains how to clone and run the **Poolarserver BIM Template** inside a reproducible development container using **Docker Desktop** and **Visual Studio Code** with **WSL 2**.

---

### 🪟 1. Prerequisites

Ensure the following are installed:

|Tool|Version|Notes|
|---|---|---|
|**Windows 10/11**|with WSL 2|enable through “Windows Features → Windows Subsystem for Linux”|
|**Ubuntu 20.04+** (or newer)|running under WSL 2|preferred distro for container development|
|**Docker Desktop**|≥ 4.25|WSL 2 integration must be enabled for your Ubuntu distro|
|**Visual Studio Code**|latest|install the extensions below|
|**VS Code Extensions**||🧩 `Dev Containers`, 🧩 `C#`, 🧩 `Prettier`, 🧩 `ESLint`|
|**Git**|latest|needed for cloning & committing|

---

### 🧰 2. Clone the Repository (in WSL)

Open your **Ubuntu terminal** (not PowerShell!) and run:

`cd ~/projects git clone https://github.com/peopeo/poolarserver-bim-template.git cd poolarserver-bim-template`

Confirm that Docker Desktop is running and that your Ubuntu distro is checked under  
**Settings → Resources → WSL Integration**.

---

### ⚙️ 3. Open in VS Code & Launch Dev Container

From WSL:

`code .`

VS Code will detect the `.devcontainer` folder and ask to **“Reopen in Container”**.  
Click **Yes** (or press `F1 → Dev Containers: Rebuild and Reopen in Container`).

VS Code then:

1. Builds the Docker images (`.devcontainer/Dockerfile.ifcserver` + PostgreSQL service).
    
2. Runs `post_create.sh` to restore and build the .NET backend.
    
3. Executes `post_start.sh` to configure Git and other environment tweaks.
    

---

### 🧩 4. Start the Application (in Debug Mode)

Once the container is ready:

1. Open the **Run and Debug** panel (`Ctrl + Shift + D`).
    
2. Select the configuration:  
    🟢 **Launch IFC Server**
    
3. Press **F5**.
    

The backend (`ifcserver`) starts on  
👉 `http://localhost:5000/swagger`  
where Swagger UI lists all available endpoints.

---

### 💡 5. (Frontend) React App Development

The `webui` folder contains the React + Vite frontend.  
To run it live inside the container:

`cd src/webui npm install       # only the first time npm run dev       # starts vite on http://localhost:5173`

In production, you’ll instead build once and let the .NET server serve the static files:

`npm run build cp -r dist/* ../ifcserver/wwwroot/`

---

### 🧱 6. Database (PostgreSQL)

A ready-to-use Postgres 16 container is included and auto-started via Docker Compose.  
Connection string (also available as env var):

`Host=db;Port=5432;Database=ifcdb;Username=postgres;Password=postgres`

Access it with:

`psql -h localhost -U postgres -d ifcdb`

---

### 🧹 7. Stopping and Cleaning Up

When you finish your session:

`# Stop containers but keep volumes docker compose -f .devcontainer/docker-compose.yml down  # Or remove everything (including DB data) devcontainer down --remove-existing-container`

---

### ✅ 8. Verification

|Service|Expected URL|Status Check|
|---|---|---|
|**Backend API**|`http://localhost:5000/swagger`|Swagger loads without error|
|**Frontend Dev Server**|`http://localhost:5173`|React Vite banner visible|
|**PostgreSQL**|port 5432|`docker ps` shows postgres:16|

---

Would you like me to extend this section with a short **troubleshooting table** (e.g. “Port 5000 already in use”, “Docker socket permission denied”, “WSL integration disabled”)?  
That’s often the next stumbling block for first-time contributors.

##### You said:

yes please

###### ChatGPT said:

Perfect 👌 — here’s the **extended section** with a compact but powerful **troubleshooting table**.  
You can append it directly to the end of your developer setup in your Obsidian or GitHub README.  
It uses pure Markdown, no code blocks inside code blocks, so it renders cleanly everywhere.

---

## 🧩 Troubleshooting (Windows + WSL + Docker + VS Code)

Below is a list of the most common issues developers encounter when setting up or running the **Poolarserver BIM Template**, along with quick solutions.

|🧠 Problem|💬 Cause|🛠️ Solution|
|---|---|---|
|**VS Code says “Dev Container build failed”**|Docker not running, or WSL integration disabled|Start **Docker Desktop** and ensure your WSL distro (e.g., Ubuntu) is enabled under **Settings → Resources → WSL Integration**.|
|**“The detected Git repository is potentially unsafe”**|Folder ownership mismatch between host and container|Inside the container, run:  <br>`git config --global --add safe.directory /workspaces/poolarserver-bim-template`|
|**Swagger shows “No operations defined”**|No controllers registered yet|This is expected until controllers are added under `src/ifcserver/Controllers/`.|
|**`dotnet run` works manually, but the Dev Container doesn’t start automatically**|Auto-start was intentionally disabled for development|Use the VS Code debug config **“Launch IFC Server”** (`F5`) to start it manually.|
|**`fatal: --local can only be used inside a git repository` during post-create**|Container started before Git was initialized|This was fixed by moving setup to `.devcontainer/post_start.sh`. You can safely ignore it on first run.|
|**Port 5000 or 5173 already in use**|Another instance of the app or Vite dev server is still running|Run `docker ps` and stop the container or kill the process using:  <br>`sudo lsof -i :5000` or `sudo lsof -i :5173`|
|**“Cannot connect to db:5432”**|PostgreSQL container still initializing|Wait a few seconds after `Waiting for PostgreSQL…` message; the startup script retries automatically.|
|**`npm install` extremely slow**|Windows file I/O slowness in bind mounts|Run `npm install` inside the container (not in Windows) — or configure a **Docker volume** for `node_modules`.|
|**Line endings or encoding issues**|Git auto-converts LF/CRLF differently on Windows|`.gitattributes` already enforces `* text=auto eol=lf`, ensuring consistency across platforms.|
|**Cannot edit files inside container**|Wrong file permissions|Run `sudo chown -R $(whoami):$(whoami) /workspaces/poolarserver-bim-template` once inside container.|
|**Changes not reflected after rebuild**|Container cache not cleared|Rebuild fresh:  <br>`devcontainer up --workspace-folder . --remove-existing-container`|

---

### 💡 Pro Tips

- Always open the project from **inside WSL** (`code .`), not from a Windows path like `C:\...`.
    
- You can open a terminal _inside_ the container via:  
    `Ctrl + Shift + P → Dev Containers: Open Container in Terminal`.
    
- To debug backend logs, tail the log file inside container:
    
    `tail -f /workspaces/poolarserver-bim-template/dotnet.log`
    
- To check that the container network works, ping the DB service:
    
    `nc -z db 5432 && echo "DB reachable"`



## 🤝 Team Workflow & Git Conventions

The **Poolarserver BIM Template** project follows a lightweight, professional Git workflow that ensures readable commit history, stable main branches, and consistent coding standards across all contributors.

---

### 🪴 1. Branching Model

We use a simplified **Git Flow** variant tailored for small, fast-moving teams.

`main                ← always stable, deployable │ ├── feature/...     ← new functionality (merged via PR) ├── fix/...         ← bug fixes ├── chore/...       ← maintenance / refactor / dependency updates └── docs/...        ← documentation or readme changes`

Examples:

`git checkout -b feature/add-job-controller git checkout -b fix/db-connection-timeout`

After review and testing:

`git checkout main git pull git merge feature/add-job-controller git push origin main`

---

### 🧾 2. Commit Message Conventions

All commits follow the **Conventional Commits** style — enforced by the `.gitmessage.txt` template:

`<type>(<scope>): <short summary>  <body: optional detailed explanation>  <footer: optional issue links or notes>`

**Types:**

- `feat` → new feature
    
- `fix` → bug fix
    
- `chore` → maintenance or build changes
    
- `docs` → documentation updates
    
- `refactor` → internal code rework
    
- `test` → test additions or changes
    
- `style` → formatting only (no code logic)
    

**Example commits:**

`feat(api): add job controller with conversion queue fix(db): correct PostgreSQL connection string for container setup chore(ci): update .devcontainer build order docs(readme): add developer setup section`

👉 **Tip:** When running `git commit` (without `-m`), Git opens a template message automatically, thanks to `.gitmessage.txt`.

---

### 🪶 3. Code Style & Formatting

Consistency across environments is enforced through shared configuration:

|File|Purpose|
|---|---|
|`.editorconfig`|Defines indentation, charset, and line endings across IDEs|
|`.gitattributes`|Normalizes line endings (LF) and enforces UTF-8|
|`.gitconfig`|Includes shared commit template and safe-directory rules|
|`.gitmessage.txt`|Provides default structure for commit messages|

Inside the **Dev Container**, formatting tools are preinstalled:

- `dotnet format` for C# code
    
- `eslint` + `prettier` for React (Vite)
    
- `black` or `isort` for any Python utility scripts
    

---

### 🧩 4. Pre-Commit Checks (optional but recommended)

To maintain consistency, developers can optionally enable **pre-commit hooks** that auto-format code and validate commits before they’re added.

Add this to `.devcontainer/post_start.sh` if you want auto-setup in the future:

`# Optional: install pre-commit hooks if [ -f ".git/hooks/pre-commit" ]; then   echo "✅ Pre-commit hook already installed." else   echo "🔧 Installing pre-commit hooks..."   cat <<'EOF' > .git/hooks/pre-commit #!/bin/bash dotnet format --verify-no-changes || { echo "❌ C# formatting failed"; exit 1; } npx eslint src/webui/src --max-warnings=0 || { echo "❌ ESLint errors"; exit 1; } EOF   chmod +x .git/hooks/pre-commit fi`

This ensures your code is properly formatted before every commit.

---

### 🌐 5. Pull Requests & Code Reviews

1. Push your feature branch:
    
    `git push -u origin feature/add-job-controller`
    
2. Create a **Pull Request** (PR) on GitHub targeting `main`.
    
3. Use **squash merge** after approval — to keep history clean and readable.
    

Each PR should:

- Reference any related issue (e.g. `Closes #12`)
    
- Include meaningful commit messages
    
- Pass automated build/tests before merging
    

---

### ✅ 6. Summary for New Contributors

|Step|Action|
|---|---|
|1️⃣|Fork or clone the repo|
|2️⃣|Open in VS Code → Reopen in Container|
|3️⃣|Create a feature branch|
|4️⃣|Code → Commit → Push|
|5️⃣|Open a Pull Request|
|6️⃣|After review, merge (squash) into main|
