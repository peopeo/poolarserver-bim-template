# Poolarserver BIM PoC - Projekt-Kontext

## Überblick
Proof of Concept für eine moderne BIM-Infrastruktur als Fundament für die schrittweise Modernisierung der bestehenden xBIM-Lösung von Poolarserver (ca. 1800 Projekte, 880 Kunden).

## Projekt-Ziele
- **Primär:** Validierung einer neuen technologischen Architektur
- **Sekundär:** Risikominimierung für zukünftige Migration
- **Zeitrahmen:** 6 Wochen Entwicklung + 2 Wochen Testing

## Technologie-Stack

### Backend
- **IFC-Verarbeitung:** Python + IfcOpenshell
- **API:** .NET 9 REST API (zentrale Datendrehscheibe)
- **Datenbank:** PostgreSQL mit JSONB-Support
- **Output-Formate:** 
  - glTF (offenes Format für 3D-Geometrie)
  - JSON (Property Sets & Metadaten)

### Frontend (AKTUELLE ENTSCHEIDUNG)
- **Framework:** React + TypeScript
- **3D-Engine:** Three.js (NICHT xeokit - siehe unten)
- **Ziel:** Moderne, lizenzfreie Alternative

## Kritische Entscheidung: Three.js statt xeokit

### Hintergrund
Das ursprüngliche Konzept sah xeokit SDK vor. Nach Analyse wurde festgestellt:
- xeokit kommerzielle Lizenz ist sehr teuer
- Kunde könnte Lizenzkosten ablehnen
- Alternative notwendig, die dennoch signifikante Verbesserung bietet

### Gewählter Ansatz: Three.js mit Custom BIM-Features

**Vorteile:**
- ✅ MIT-Lizenz (komplett kostenfrei)
- ✅ Volle Kontrolle über Features
- ✅ Sehr aktive Community
- ✅ Exzellente Performance
- ✅ Native glTF-Unterstützung

**Herausforderungen:**
- ⚠️ BIM-spezifische Features müssen selbst implementiert werden
- ⚠️ Mehr Entwicklungsaufwand (geschätzt +7-11 Tage)

**Entscheidung begründet durch:**
- Kostenfreiheit übertrifft Entwicklungsaufwand
- Zeigt technische Kompetenz und Unabhängigkeit
- Zukunftssicher ohne Vendor Lock-in
- glTF-Pipeline bleibt wie geplant

## PoC-Scope: Features

### Must-Have (Abnahmekriterien)
1. **3D-Geometrie-Rendering**
   - Laden von glTF-Modellen aus Backend-API
   - Flüssige Navigation (orbit, pan, zoom)
   - Performance-Test mit realen IFC-Modellen

2. **2D-Schnitte mit Export**
   - Benutzer kann interaktiv horizontale Schnitte durch 3D-Modell legen
   - Resultierende 2D-Ansicht als Bilddatei (PNG) exportieren
   - Implementierung mit Three.js Clipping Planes

3. **Property-Anzeige**
   - Selektion von Bauteilen im 3D-Modell
   - Abruf der Properties aus Backend-API
   - Anzeige von Attributen und IFC-Properties

4. **Filterung**
   - Nach Typ (z.B. "nur Wände")
   - Nach beliebigen Properties (z.B. "Brandschutzklasse F90")
   - Visibility-Toggle basierend auf Filterkriterien

### Optional (Nice-to-Have)
- IFC-Hierarchie Tree-View
- Geschoss-Ansichten (StoreyViews)
- Distanz-Messungen
- BCF Viewpoints
- Annotations

## Wichtige Constraints

### Lizenz-Compliance
**KRITISCH:** xeokit SDK ist AGPL-3.0 lizenziert

**Erlaubt:**
- ✅ Code lesen und Konzepte verstehen (Reverse Engineering)
- ✅ Algorithmen in eigenen Worten neu implementieren
- ✅ Mathematische Formeln nutzen

**VERBOTEN:**
- ❌ Code kopieren (auch nicht teilweise)
- ❌ Code mit minimalen Änderungen übernehmen
- ❌ Exakte Klassennamen/Strukturen kopieren

**Ansatz:** Clean Room Implementation
- Analyse von xeokit-Konzepten
- Dokumentation in eigenen Worten
- Komplette Neuimplementierung mit Three.js

### Performance-Anforderungen
- Große IFC-Modelle (mehrere hundert MB)
- Schnelles Laden (Target: "Time-to-view" messbar)
- Flüssige Interaktion (60 FPS angestrebt)

### Container-Umgebung
- Entwicklung in Docker DevContainer
- VS Code als primäre IDE
- Reproduzierbare Entwicklungsumgebung

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │         React App (TypeScript)                     │ │
│  │  ┌──────────────┐  ┌─────────────────────────────┐ │ │
│  │  │ Three.js     │  │  UI Components              │ │ │
│  │  │ Viewer       │  │  - Property Panel           │ │ │
│  │  │              │  │  - Filter Controls          │ │ │
│  │  │              │  │  - Clipping Controls        │ │ │
│  │  └──────────────┘  └─────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↕ REST API
┌─────────────────────────────────────────────────────────┐
│              .NET 9 API (Steuerungs-API)                │
│  - Model Upload                                         │
│  - Geometry Retrieval (glTF)                            │
│  - Property Data (JSON)                                 │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│           Python IFC-Verarbeitungsdienst                │
│  - IFC → glTF Konvertierung (IfcOpenshell)             │
│  - Property-Extraktion                                  │
│  - Speicherung in PostgreSQL                            │
└─────────────────────────────────────────────────────────┘
```

## Entwicklungs-Strategie

### Phase 1: Analyse & Design (bereits teilweise erledigt)
- xeokit-Features analysiert
- Three.js-Äquivalente identifiziert
- Architektur-Entscheidungen getroffen

### Phase 2: Basis-Setup (nächster Schritt)
- Three.js in bestehendes React-Projekt integrieren
- Basis-Viewer-Component erstellen
- API-Integration für glTF-Loading

### Phase 3: Feature-Implementierung
1. **3D-Rendering** (einfach - Three.js nativ)
2. **Clipping Planes & 2D-Export** (mittel - 3-5 Tage)
3. **Property-Display** (einfach - 2-3 Tage)
4. **Filterung** (einfach - 2-3 Tage)

### Phase 4: Testing & Optimierung
- Performance-Benchmarking
- Real-World IFC-Tests
- UX-Refinement

## Erfolgsmetriken

### Technisch
- ✅ Stabile Verarbeitung von Test-IFC-Dateien
- ✅ Alle Must-Have Features funktional
- ✅ "Time-to-view" Metrik gemessen (Benchmark-Daten)

### Geschäftlich
- ✅ Technologische Machbarkeit validiert
- ✅ Kostenvorteil durch Lizenzfreiheit demonstriert
- ✅ Fundament für weitere Entwicklung gelegt

## Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Performance bei großen Modellen | Mittel | Benchmark early, Optimierung einplanen |
| Unterschätzter Aufwand für BIM-Features | Mittel | Priorisierung, MVP-Ansatz |
| Integration mit Backend komplexer als erwartet | Niedrig | API bereits definiert, frühes Testen |
| Lizenz-Compliance-Fehler | Niedrig | Strikte Clean Room Implementation |

## Offene Fragen (zu klären)
- [ ] Konkrete API-Endpunkte (URLs, Payload-Struktur)
- [ ] Authentifizierung/Autorisierung
- [ ] Bestehende Frontend-Architektur Details
- [ ] State Management Präferenz
- [ ] UI/UX Design-Vorgaben

## Nächste Schritte
1. Bestehendes Projekt analysieren (Struktur, Dependencies, APIs)
2. Three.js Integration planen (parallel zu xeokit oder Migration?)
3. Basis-Viewer implementieren
4. Backend-Integration testen
5. Feature-by-Feature Entwicklung

## Kontakt & Ressourcen
- **Projektstart:** VSCode mit DevContainer
- **Zielsetzung:** Produktions-reifer PoC in 8 Wochen
- **Dokumentation:** https://threejs.org/docs/
- **xeokit Referenz:** Nur zur Konzept-Analyse, nicht zum Code-Kopieren