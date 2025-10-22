# Lizenz-Analyse: IfcOpenShell & Bonsai

**Erstellt:** 2025-01-20
**Zweck:** Rechtliche Klarheit für Python IFC Intelligence Service

---

## 🔍 Recherche-Ergebnisse

### Offizielle Lizenzen

| Komponente | Lizenz | Quelle |
|------------|--------|--------|
| **IfcOpenShell Library** | LGPL-3.0-or-later | GitHub COPYING.LESSER |
| **Bonsai (ehemals BlenderBIM)** | GPL-3.0-or-later | GitHub Issue #1082 |
| **IfcSverchok** | GPL-3.0-or-later | Offizielle Docs |

**Quellen:**
- https://github.com/IfcOpenShell/IfcOpenShell/blob/master/COPYING.LESSER
- https://github.com/IfcOpenShell/IfcOpenShell/issues/1082
- Web-Suche: "Bonsai GPL-3.0" site:github.com/IfcOpenShell

---

## ⚠️ KRITISCH: Fehlerhafte Dokumentation

### Dokument: `claude-docs/bonsai-quick-start-min.md`

**Behauptung (FALSCH):**
```diff
- Bonsai/BlenderBIM: Apache 2.0 ✅ Code kopieren/adaptieren erlaubt
```

**Tatsache:**
```diff
+ Bonsai: GPL-3.0-or-later ❌ Code kopieren macht dein Projekt GPL
```

**Konsequenz:**
- ❌ Dokument enthält gefährliche Fehlinformationen
- ❌ Folgen der Anleitung → rechtliche Probleme
- ✅ Dokument sollte korrigiert oder gelöscht werden

---

## 📋 Was bedeuten die Lizenzen?

### LGPL-3.0 (IfcOpenShell Library)

**✅ ERLAUBT:**
- Library als Dependency nutzen
- Via `pip install ifcopenshell`
- Dynamic Linking (Import)
- Kommerzielle Nutzung
- Closed-Source eigener Code

**⚠️ BEDINGUNG:**
- Wenn du IfcOpenShell **modifizierst** → Änderungen offenlegen
- Aber: Du modifizierst nur NUTZEN → keine Offenlegung nötig

**Beispiel (OK):**
```python
import ifcopenshell  # ✅ OK - Dynamic Linking

ifc_file = ifcopenshell.open("model.ifc")  # ✅ OK - Library nutzen
```

**Dein Service kann:**
- ✅ MIT/Apache/Proprietary lizenziert sein
- ✅ Closed-Source bleiben
- ✅ Kommerziell genutzt werden

---

### GPL-3.0 (Bonsai/BlenderBIM)

**GPL ist "viral"** - bedeutet:

**❌ VERBOTEN:**
```python
# Code aus Bonsai kopieren/adaptieren
from bonsai.tool.spatial import SpatialTool  # ❌ Macht dein Projekt GPL!

# Bonsai-Code übersetzen
def my_function():
    # Algorithmus aus Bonsai kopiert
    # → Dein Projekt wird GPL!
    pass
```

**Konsequenz wenn du GPL-Code nutzt:**
- ⚠️ **Dein GESAMTES Projekt wird GPL-3.0**
- ⚠️ Du MUSST kompletten Source-Code offenlegen
- ⚠️ Keine kommerzielle Closed-Source Nutzung möglich
- ⚠️ Alle Nutzer dürfen deinen Code kopieren/modifizieren

---

## ✅ Was darfst du TATSÄCHLICH tun?

### Szenario 1: IfcOpenShell Library nutzen (EMPFOHLEN)

```python
# ✅ LEGAL & SAFE
import ifcopenshell
import ifcopenshell.util.element

# Eigene Implementierung mit IfcOpenShell API
def my_spatial_tree_extractor(ifc_file_path):
    """
    Eigenständige Implementierung.
    Nutzt nur IfcOpenShell Library (LGPL - OK!)
    """
    ifc_file = ifcopenshell.open(ifc_file_path)
    project = ifc_file.by_type("IfcProject")[0]

    # Eigener Algorithmus
    decomposition = ifcopenshell.util.element.get_decomposition(project)
    # ... etc

    return result
```

**Status:**
- ✅ Dein Code bleibt dein Code
- ✅ Lizenz: MIT/Apache/Proprietary (deine Wahl)
- ✅ Closed-Source OK
- ✅ Kommerziell OK

---

### Szenario 2: Bonsai-Code kopieren (VERBOTEN)

```python
# ❌ ILLEGAL ohne GPL-Compliance
from bonsai.tool.spatial import SpatialTool

# Auch falsch: Bonsai-Code "übersetzen"
def my_tool():
    # Algorithmus aus Bonsai Zeile-für-Zeile übersetzt
    # → Copyright-Verletzung!
    pass
```

**Status:**
- ❌ Copyright-Verletzung
- ❌ GPL-Infektion deines Projekts
- ❌ Rechtliche Konsequenzen

---

### Szenario 3: Bonsai LESEN, eigenständig implementieren (LEGAL)

```python
# ✅ LEGAL - Clean-Room Approach

# Schritt 1: Bonsai analysieren (außerhalb Projekt)
cd /tmp
git clone https://github.com/IfcOpenShell/IfcOpenShell.git
# Lese bonsai/tool/spatial.py
# Verstehe Konzepte
# Schließe Editor

# Schritt 2: Dokumentiere Konzepte (EIGENE Worte)
# → claude-docs/bonsai-concepts.md
# "Bonsai nutzt rekursive Traversierung mit get_decomposition()"
# "Algorithmus: 1. Start bei IfcProject, 2. Rekursion, 3. Filter Spatial"

# Schritt 3: Implementiere EIGENSTÄNDIG mit IfcOpenShell API
def extract_spatial_tree(ifc_file_path):
    """
    Eigenständige Implementierung basierend auf IFC-Konzepten.

    Inspiriert von Bonsai-Architektur, aber eigenständig implementiert.
    Nutzt nur IfcOpenShell LGPL Library.
    """
    ifc_file = ifcopenshell.open(ifc_file_path)
    # Eigene Logik mit IfcOpenShell API
    # ...
```

**Status:**
- ✅ Legal (Clean-Room Implementation)
- ✅ Dein Code gehört dir
- ✅ Lizenz: Deine Wahl
- ✅ Keine GPL-Infektion

**Wichtig:**
- ✅ Konzepte lernen ist OK
- ✅ IFC-Standard ist öffentlich (nicht geschützt)
- ✅ IfcOpenShell API nutzen ist OK (LGPL)
- ❌ Bonsai-Code darf NICHT im Projekt sein

---

## 🎯 Empfohlene Strategie

### Clean-Room Implementation (Mein Plan)

**Wie in `implementation_plan_python_ifc_single_container.md` beschrieben:**

#### Task 0: Bonsai Konzeptanalyse (RICHTIG)

```bash
# 1. Clone AUSSERHALB Projekt
cd /tmp  # NICHT im Projekt!
git clone https://github.com/IfcOpenShell/IfcOpenShell.git

# 2. Analysiere Module
cd IfcOpenShell/src/bonsai
# Lese:
# - bonsai/tool/spatial.py
# - bonsai/tool/pset.py
# - bonsai/bim/module/geometry/

# 3. Dokumentiere KONZEPTE (nicht Code!)
vim /workspaces/poolarserver-bim-template/claude-docs/bonsai-concepts.md

# Schreibe:
# - "Bonsai verwendet folgende Architektur..."
# - "Algorithmus: Schritt 1, Schritt 2, ..."
# - "IFC-Konzept: IfcRelAggregates für Hierarchie"
# - Pseudocode (KEIN echter Bonsai-Code)

# 4. SCHLIEẞE Bonsai
cd /workspaces/poolarserver-bim-template
rm -rf /tmp/IfcOpenShell  # Optional: löschen

# 5. Implementiere mit IfcOpenShell API Docs
# https://blenderbim.org/docs-python/ifcopenshell-python/code_examples.html
# → Nutze IfcOpenShell API
# → Eigene Algorithmen
# → Keine Bonsai-Code-Kopien
```

**Ergebnis:**
- ✅ Legal
- ✅ Keine GPL-Infektion
- ✅ Dein Code gehört dir
- ✅ IfcOpenShell API optimal genutzt

---

## 📊 Vergleich: Verschiedene Ansätze

| Ansatz | Legal? | Lizenz | Risiko | Aufwand |
|--------|--------|--------|--------|---------|
| **IfcOpenShell API only** | ✅ Ja | MIT/Apache | ⬜ Kein | ⭐⭐ Mittel |
| **Clean-Room (Bonsai-inspiriert)** | ✅ Ja | MIT/Apache | ⬜ Kein | ⭐⭐⭐ Hoch |
| **Bonsai-Code kopieren** | ❌ Nein | GPL-3.0 (viral) | 🚨 Sehr hoch | ⭐ Niedrig |
| **"bonsai-quick-start-min.md" folgen** | ❌ Gefährlich | Unklar | 🚨 Sehr hoch | ⭐ Niedrig |

---

## 🚨 Korrektur-Empfehlung: `bonsai-quick-start-min.md`

### Option A: Löschen (empfohlen)

```bash
rm claude-docs/bonsai-quick-start-min.md
```

**Begründung:**
- Enthält falsche Lizenz-Informationen
- Suggeriert Code-Kopieren ist erlaubt
- Rechtliches Risiko

### Option B: Korrigieren

Falls du das Dokument behalten willst:

```diff
- Bonsai/BlenderBIM: Apache 2.0 ✅ Code kopieren/adaptieren
+ Bonsai/BlenderBIM: GPL-3.0 ❌ Nur Konzepte lernen!

- ✅ ERLAUBT: Code kopieren und anpassen
+ ❌ VERBOTEN: Code kopieren/adaptieren
+ ✅ ERLAUBT: Konzepte lernen, eigenständig implementieren
```

### Option C: Ignorieren + Warnung

```bash
echo "⚠️ VERALTET - NICHT NUTZEN!" > claude-docs/bonsai-quick-start-min.md.warning
```

---

## ✅ Finale Empfehlung

### Für dein Projekt:

**1. Nutze meinen Implementation Plan:**
- `claude-docs/implementation_plan_python_ifc_single_container.md`
- Task 0: Bonsai Konzeptanalyse (Clean-Room Methode)
- Tasks 1-11: Eigenständige Implementierung

**2. Lizenz-Strategie:**
```
IfcOpenShell (LGPL)
    ↓ (Dynamic Linking - OK)
Dein Python Service
    ↓ (Eigenständiger Code)
Lizenz: MIT oder Apache 2.0
    ↓
Closed-Source möglich ✅
Kommerziell möglich ✅
```

**3. Bonsai-Nutzung:**
- ✅ Konzepte lernen (außerhalb Projekt)
- ✅ IFC-Standard verstehen
- ✅ IfcOpenShell API nutzen
- ❌ KEIN Bonsai-Code im Projekt

**4. Dokument korrigieren/löschen:**
```bash
# Entscheide selbst:
rm claude-docs/bonsai-quick-start-min.md
# ODER
git mv claude-docs/bonsai-quick-start-min.md claude-docs/DEPRECATED_bonsai-quick-start-min.md
```

---

## 📚 Ressourcen

### IfcOpenShell Dokumentation (NUTZE DIESE!)
- **API Docs:** https://blenderbim.org/docs-python/ifcopenshell-python/code_examples.html
- **IfcOpenShell Academy:** https://academy.ifcopenshell.org/
- **Code Examples:** https://wiki.osarch.org/index.php?title=IfcOpenShell_code_examples

### IFC Standard (Öffentlich)
- **buildingSMART:** https://technical.buildingsmart.org/standards/ifc/
- **IFC4 Documentation:** https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/

### Bonsai (NUR zum Konzepte lernen)
- **GitHub:** https://github.com/IfcOpenShell/IfcOpenShell/tree/v0.8.0/src/bonsai
- **Docs:** https://docs.bonsaibim.org/
- **⚠️ Warnung:** GPL-3.0 - Code NICHT kopieren!

---

## 🎓 Zusammenfassung

### ✅ Was ist SICHER:
1. IfcOpenShell als Library nutzen (`import ifcopenshell`)
2. Eigene Algorithmen mit IfcOpenShell API schreiben
3. Bonsai-Konzepte lesen, eigenständig implementieren (Clean-Room)
4. Dein Service: MIT/Apache/Proprietary lizenzieren

### ❌ Was ist GEFÄHRLICH:
1. Bonsai-Code kopieren/adaptieren
2. Dokument `bonsai-quick-start-min.md` folgen
3. GPL-Code ins Projekt nehmen
4. Lizenz-Frage ignorieren

### 🎯 Nächste Schritte:
1. **Entscheidung:** `bonsai-quick-start-min.md` löschen/korrigieren?
2. **Start:** Task 0 aus meinem Implementation Plan
3. **Methode:** Clean-Room Approach
4. **Ziel:** Legal, eigenständig, IfcOpenShell-basiert

---

**Fazit:** Du kannst einen vollständigen IFC Intelligence Service bauen der legal, eigenständig und frei lizenzierbar ist - solange du IfcOpenShell API nutzt und KEINEN GPL-Code kopierst! ✅
