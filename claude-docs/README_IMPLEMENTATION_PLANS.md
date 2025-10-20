# Implementation Plans Overview

This directory contains detailed implementation plans for the Poolar IFC Server BIM PoC project.

---

## 📋 Available Plans

### 1. **Three.js Parallel Viewer** ✅ COMPLETED
**File:** `implementation_plan.md`

**Status:** ✅ All tasks completed and merged to main

**What was implemented:**
- Three.js viewer alongside xeokit
- glTF model loading
- Object selection & highlighting
- Property panel for BIM elements
- Type-based filtering
- Clipping planes (section cuts)
- 2D export (PNG/JPEG)
- 3D navigation gizmo (Blender-style)
- URL input for custom models
- Dark mode support

**Key Achievements:**
- 39 files changed, 5,231 lines added
- 12 tasks completed
- Zero modifications to existing xeokit code
- Clean room implementation
- MIT-licensed dependencies only

---

### 2. **Python IFC Intelligence Service (Single Container)** ⬜ PENDING
**File:** `implementation_plan_python_ifc_single_container.md`

**Status:** ⬜ Ready to implement

**What will be implemented:**
- Python-based IFC processing backend
- Parsing IFC files (metadata extraction)
- glTF export from IFC (using IfcConvert)
- Property extraction (PropertySets)
- Spatial tree extraction (hierarchy)
- RAM caching for performance
- ASP.NET ↔ Python integration via ProcessRunner
- All within existing devcontainer (no new containers)

**Architecture:**
```
Frontend → ASP.NET API → Python Scripts → JSON Output → Database
```

**Time Estimate:** 38-49 hours (1-2 weeks)

**Key Benefits:**
- ✅ Uses existing container setup
- ✅ IfcOpenShell already installed
- ✅ ProcessRunner already implemented
- ✅ Zero infrastructure changes
- ✅ Start immediately

---

### 3. **Python IFC Intelligence Service (Multi-Container)** ⬜ FUTURE
**File:** `implementation_plan_python_ifc_multi_container.md`

**Status:** ⬜ Production architecture (implement after Single Container)

**What will be added:**
- Separate Python Worker containers (scalable)
- Redis for job queue
- Celery for async processing
- MinIO/S3 for object storage
- Production-grade monitoring (Flower, Prometheus, Grafana)
- Horizontal scaling capabilities
- High availability setup

**Architecture:**
```
Frontend Container
    ↓
ASP.NET API Container
    ↓
Redis Queue
    ↓
Python Worker Containers (x3+) → Celery
    ↓
PostgreSQL + MinIO
```

**Time Estimate:** +88-129 hours (3-4 weeks additional)

**When to migrate:**
- > 100 concurrent users
- IFC files > 100MB regularly
- Parsing takes > 30 seconds
- Need high availability

---

## 🎯 Recommended Implementation Order

### Phase 1: Foundation (DONE ✅)
1. ✅ Three.js Viewer Implementation
2. ✅ Frontend BIM viewer capabilities
3. ✅ Mock data integration

### Phase 2: Backend Intelligence (CURRENT 🔄)
1. ⬜ Python IFC Service (Single Container)
   - Start with Task 0: Bonsai Analysis
   - Implement Tasks 1-11 sequentially
   - Test each task before moving to next
   - Target: Real IFC processing in Three.js viewer

### Phase 3: Production Scaling (FUTURE 📅)
1. ⬜ Multi-Container Architecture
   - Add Redis + Celery
   - Separate Worker containers
   - MinIO object storage
   - Monitoring & observability

---

## 📊 Comparison Matrix

| Feature | Three.js Viewer ✅ | Single Container ⬜ | Multi-Container ⬜ |
|---------|-------------------|---------------------|-------------------|
| **Status** | Completed | Ready to implement | Future |
| **Time** | ~30 hours | 38-49 hours | +88-129 hours |
| **Complexity** | ⭐⭐ Medium | ⭐⭐ Medium | ⭐⭐⭐ High |
| **Dependencies** | None | Python (installed) | Redis, Celery, MinIO |
| **Scalability** | N/A | Single process | Horizontal |
| **Use Case** | Frontend viewer | PoC/MVP backend | Production |

---

## 🚀 Quick Start: Next Steps

### To Start Phase 2 (Python IFC Service):

```bash
# 1. Read the Bonsai analysis plan
cat claude-docs/implementation_plan_python_ifc_single_container.md

# 2. Create feature branch
git checkout main
git checkout -b feature/python-ifc-intelligence

# 3. Start with Task 0
git checkout -b task/00-bonsai-analysis

# 4. Follow the detailed instructions in:
# claude-docs/implementation_plan_python_ifc_single_container.md
```

### Key Documents to Read Before Starting:

1. **Implementation Plan (Single Container)** - Detailed task breakdown
2. **Bonsai Concepts Plan** - Task 0 instructions
3. **Current Architecture** - `.devcontainer/docker-compose.yml`
4. **Existing Backend** - `src/ifcserver/Services/IfcService.cs`

---

## 🔑 Key Principles Across All Plans

### 1. Additive Development
- ✅ Never break existing functionality
- ✅ New features are opt-in
- ✅ Old and new systems coexist

### 2. Testing at Every Step
- ✅ Each task is independently testable
- ✅ Manual tests before merge
- ✅ API tests via Swagger/curl

### 3. Git Workflow
- ✅ Feature branch per major feature
- ✅ Task branch per task
- ✅ Merge only after successful tests
- ✅ Structured commit messages

### 4. License Compliance
- ✅ Bonsai: Concept-inspired only (AGPL-3.0)
- ✅ IfcOpenShell: LGPL (OK for use)
- ✅ Own code: MIT or similar
- ✅ **NEVER copy code from AGPL projects**

### 5. Documentation
- ✅ README per component
- ✅ API documentation (Swagger)
- ✅ Architecture diagrams
- ✅ Testing instructions

---

## 📁 Project Structure After All Plans

```
poolarserver-bim-template/
├── .devcontainer/
│   ├── docker-compose.yml           # Development containers
│   ├── Dockerfile.ifcserver         # .NET + Python + Node
│   └── Dockerfile.webui             # Frontend dev
├── src/
│   ├── ifcserver/                   # ASP.NET Backend
│   │   ├── Controllers/
│   │   │   ├── IfcTestDataController.cs      (existing)
│   │   │   └── IfcIntelligenceController.cs  (NEW - Phase 2)
│   │   ├── Services/
│   │   │   ├── IfcService.cs                 (existing)
│   │   │   ├── PythonIfcService.cs           (NEW - Phase 2)
│   │   │   └── PythonIfcQueueService.cs      (NEW - Phase 3)
│   │   └── Program.cs
│   ├── python-service/              # NEW - Phase 2
│   │   ├── ifc_intelligence/
│   │   │   ├── parser.py
│   │   │   ├── gltf_exporter.py
│   │   │   ├── property_extractor.py
│   │   │   ├── spatial_tree.py
│   │   │   └── cache_manager.py
│   │   ├── scripts/
│   │   │   ├── parse_ifc.py
│   │   │   ├── export_gltf.py
│   │   │   ├── extract_properties.py
│   │   │   └── extract_spatial.py
│   │   └── worker.py                (NEW - Phase 3)
│   └── webui/                       # React Frontend
│       ├── src/
│       │   ├── viewers/
│       │   │   ├── xeokit-viewer/   (existing)
│       │   │   └── threejs-viewer/  (Phase 1 ✅)
│       │   ├── components/
│       │   │   ├── threejs/         (Phase 1 ✅)
│       │   │   └── shared/          (Phase 1 ✅)
│       │   └── services/
│       │       └── api/
│       │           └── ifcIntelligenceApi.ts  (NEW - Phase 2)
│       └── public/
├── docs/
│   ├── bonsai-concepts.md           (NEW - Phase 2, Task 0)
│   └── EXISTING_STRUCTURE.md        (Phase 1 ✅)
└── claude-docs/
    ├── implementation_plan.md                              (Phase 1 ✅)
    ├── implementation_plan_python_ifc_single_container.md  (Phase 2 ⬜)
    ├── implementation_plan_python_ifc_multi_container.md   (Phase 3 ⬜)
    └── README_IMPLEMENTATION_PLANS.md                      (This file)
```

---

## 🧪 Testing Strategy

### Phase 1 (Three.js) - Completed ✅
- [x] Unit tests for React components
- [x] Manual testing in browser
- [x] Dark mode toggle
- [x] Model loading from URL
- [x] Object selection
- [x] Property display
- [x] Filtering
- [x] Clipping planes
- [x] 2D export

### Phase 2 (Python Single Container)
- [ ] Python unit tests (pytest)
- [ ] CLI script tests (standalone)
- [ ] .NET API tests (curl/Swagger)
- [ ] Frontend integration tests
- [ ] End-to-end: Upload IFC → View in Three.js

### Phase 3 (Multi-Container)
- [ ] Load tests (JMeter/k6)
- [ ] Queue performance tests
- [ ] Scaling tests (docker-compose scale)
- [ ] Failure recovery tests
- [ ] Monitoring dashboards

---

## 📞 Support & Questions

### When implementing Phase 2:

**Common Questions:**
1. **"IfcOpenShell not working?"** → Check it's installed: `python3 -c "import ifcopenshell"`
2. **"Python script not found?"** → Check path in `PythonIfcService.cs`
3. **"JSON parsing failed?"** → Check Python stdout format
4. **"Bonsai license concerns?"** → Read concepts only, implement independently

**Debugging Tips:**
- Enable verbose logging in .NET
- Print Python script args before execution
- Check temp file paths (are files actually there?)
- Test Python scripts standalone first
- Use Swagger UI for API testing

---

## 📈 Success Metrics

### Phase 1 (ACHIEVED ✅)
- ✅ Three.js viewer loads glTF models
- ✅ Users can select objects and view properties
- ✅ Filtering and clipping work
- ✅ 2D export generates PNGs
- ✅ No xeokit code was modified
- ✅ Build passes in < 6 seconds

### Phase 2 (TARGET)
- [ ] Users can upload IFC files
- [ ] IFC converts to glTF in < 30s (small files)
- [ ] Real BIM properties display in PropertyPanel
- [ ] Spatial tree shows building hierarchy
- [ ] Cache improves repeat operations by > 50%
- [ ] API response time < 5s (excluding conversion)

### Phase 3 (ASPIRATIONAL)
- [ ] System handles > 100 concurrent users
- [ ] IFC files up to 500MB process successfully
- [ ] Queue processes jobs < 2s latency
- [ ] 99.9% uptime
- [ ] Auto-scaling works (3-10 workers)
- [ ] Monitoring dashboards operational

---

## 🎓 Learning Resources

### IFC & BIM
- [buildingSMART IFC Specification](https://technical.buildingsmart.org/standards/ifc/)
- [IfcOpenShell Documentation](https://docs.ifcopenshell.org/)
- [IfcOpenShell Academy](https://academy.ifcopenshell.org/)

### Bonsai/BlenderBIM (concept learning only)
- [Bonsai GitHub](https://github.com/IfcOpenShell/IfcOpenShell/tree/v0.8.0/src/bonsai)
- **Remember:** Read for concepts, NEVER copy code (AGPL-3.0)

### Three.js
- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)

### .NET + Python Integration
- [Python.NET](https://github.com/pythonnet/pythonnet)
- [Process.Start() Best Practices](https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process)

### Celery (Phase 3)
- [Celery Documentation](https://docs.celeryq.dev/)
- [Flower Monitoring](https://flower.readthedocs.io/)

---

## 📝 Changelog

### 2025-01-20
- ✅ Completed Three.js Viewer (12 tasks)
- ✅ Added 3D navigation gizmo
- ✅ Merged to main branch
- 📄 Created Python IFC Service plans (Single & Multi-Container)
- 📄 Created this overview document

---

## 🏁 Conclusion

You now have **three detailed implementation plans**:

1. ✅ **Three.js Viewer** - Foundation complete
2. ⬜ **Python IFC Service (Single Container)** - Next step (38-49h)
3. ⬜ **Multi-Container Production** - Future scaling (88-129h)

**Recommendation:** Start with **Phase 2 (Single Container)** to get real IFC processing working quickly. The multi-container architecture can wait until you actually need the scalability.

**First Action:** Read `implementation_plan_python_ifc_single_container.md` and start with **Task 0: Bonsai Analysis**.

Good luck! 🚀