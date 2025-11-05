# Compliance Checker Service - Otthoni Feladat

## 📋 Áttekintés
**Pozíció:** Full-Stack Developer - FluentaOne  
**Időkeret:** 3-4 óra  
**Szint:** POC/MVP (proof of concept, nem production kód!)

## 🎯 Feladat célja
Építs egy AI-támogatott compliance ellenőrző rendszert, amely demonstrálja képességeidet a mikroszerviz architektúrában és az AI eszközök hatékony használatában. A FluentaOne-nál kritikus az ISO 27001/9001 compliance, így ez egy releváns üzleti probléma.

## 📖 Szcenárió
Készíts egy egyszerűsített compliance platform POC-ot, amely:
- Kezeli compliance checklist-eket
- AI-val elemzi a feltöltött dokumentumokat
- Azonosítja a compliance gap-eket
- Javaslatokat ad a hiányosságok pótlására

## 🔧 Kötelező komponensek

### 1. **Checklist Service** (Backend - választott nyelv)
Compliance követelmények kezelése

**Minimális funkciók:**
- GET `/checklists` - Elérhető checklist-ek
- GET `/checklists/{id}` - Checklist részletei
- POST `/checklists/{id}/items/{itemId}/status` - Status update
- GET `/checklists/{id}/progress` - Compliance % 

**Példa checklist struktura:**
```json
{
  "id": "iso-27001-simplified",
  "name": "ISO 27001 Essential Controls",
  "items": [
    {
      "id": "AC-1",
      "category": "Access Control",
      "requirement": "Password policy documented and enforced",
      "hints": ["password policy", "security guidelines"],
      "status": "pending",
      "evidence": []
    }
  ]
}
```

### 2. **Evidence Analyzer** (Backend - MÁSIK nyelv kötelező!)
AI-alapú dokumentum elemzés

**Minimális funkciók:**
- POST `/analyze/document` - Dokumentum feltöltés és elemzés
- POST `/analyze/match` - Document-requirement matching
- GET `/analyze/gaps` - Mi hiányzik még?

**AI matching példa:**
```python
# Input: document text + requirement
# Output: 
{
  "matches": true,
  "confidence": 0.85,
  "relevant_sections": ["Section 3.2: Password Requirements"],
  "reasoning": "Document contains specific password policy rules"
}
```

### 3. **Report Generator** (Ugyanaz vagy 3. nyelv - opcionális)
Compliance report készítés

**Minimális funkciók:**
- GET `/report/compliance/{checklistId}` - Összefoglaló
- GET `/report/gaps/{checklistId}` - Hiányosságok
- POST `/report/suggestions` - AI-alapú javaslatok

### 4. **Dashboard UI** (React + TypeScript)
- Checklist áttekintő compliance státusszal
- Dokumentum feltöltés (drag & drop)
- AI elemzés eredményei
- Progress vizualizáció (pl. progress bar)
- Gap analysis megjelenítése

### 5. **Infrastructure**
- Docker Compose minden szolgáltatáshoz
- `docker-compose up` paranccsal indítható

## 📊 Simplified Compliance Framework

### Használj egyszerűsített ISO követelményeket (10-15 pont):

```json
{
  "iso_27001_simplified": {
    "categories": [
      {
        "name": "Access Control",
        "items": [
          "Password policy exists",
          "User access reviews quarterly",
          "Admin access logged"
        ]
      },
      {
        "name": "Incident Management",
        "items": [
          "Incident response plan documented",
          "Incident log maintained",
          "Recovery procedures tested"
        ]
      },
      {
        "name": "Data Protection",
        "items": [
          "Backup policy defined",
          "Encryption standards documented",
          "Data retention policy exists"
        ]
      }
    ]
  }
}
```

## 🤖 AI használati követelmények

### Kötelező AI funkciók:

1. **Smart Evidence Matching**
```javascript
// Példa prompt:
const evidenceMatchPrompt = `
Analyze if this document provides evidence for the compliance requirement.

DOCUMENT CONTENT:
${documentText}

REQUIREMENT:
${requirement}

HINTS FOR MATCHING:
${hints.join(', ')}

Return JSON:
{
  "matches": boolean,
  "confidence": 0.0-1.0,
  "relevant_sections": array of relevant quotes (max 2),
  "reasoning": brief explanation,
  "missing_elements": what's still needed
}
`;
```

2. **Gap Analysis**
```javascript
// AI azonosítja mi hiányzik
const gapAnalysisPrompt = `
Based on these compliance requirements and current evidence:

REQUIREMENTS: ${JSON.stringify(requirements)}
EVIDENCE PROVIDED: ${JSON.stringify(evidenceList)}

Identify:
1. Uncovered requirements
2. Partially covered items
3. Priority gaps (critical vs nice-to-have)
4. Suggested next steps
`;
```

3. **Improvement Suggestions**
- AI javaslatok a compliance javítására
- Template dokumentumok ajánlása
- Best practice javaslatok

### AI_USAGE.md kötelező tartalma:
```markdown
# AI Használat Dokumentáció

## Eszközök és használatuk
- [Tool]: [Specific use case]
- Példa: Cursor - Service boilerplate és API endpoint generálás
- Példa: Claude - Architecture design és prompt engineering

## Prompt példák
[Minimum 3 konkrét, használt prompt]

## AI limitációk és workaround-ok
[Hol nem működött jól az AI és hogyan oldotta meg]

## Fejlesztési sebesség
[Mennyi időt spórolt az AI használattal]
```

## ⚙️ Technikai elvárások

### Kötelező:
- ✅ Minimum 2 különböző backend nyelv
- ✅ AI API integráció (OpenAI/Claude/Gemini/Groq)
- ✅ React + TypeScript frontend
- ✅ Docker Compose
- ✅ REST API (vagy GraphQL)

### Opcionális extrák:
- Real-time updates (WebSocket)
- PDF report export
- Bulk document processing
- Confidence score visualization

## 📦 Beadandók

1. **GitHub Repository**
```
compliance-checker/
├── checklist-service/     # Nyelv 1
├── evidence-analyzer/     # Nyelv 2  
├── report-generator/      # Opcionális 3. szolgáltatás
├── frontend/             # React app
├── docker-compose.yml
├── sample-documents/     # Példa dokumentumok
├── README.md            # Setup és futtatás
├── AI_USAGE.md         # AI dokumentáció
└── ARCHITECTURE.md     # Tervezési döntések
```

2. **Példa dokumentumok**
- Legalább 3 minta dokumentum (password policy, incident plan, etc.)
- Lehet AI-generált!

3. **Demo videó** (max 3 perc)
- Mutasd be a teljes flow-t
- Említsd az AI használatot
- Loom vagy hasonló tool

## 💡 Tippek és trükkök

### DO:
- 🎯 Kezdj 5-6 compliance ponttal
- 🤖 Használj AI-t a példa dokumentumok generálására is
- 📊 Egyszerű vizualizáció (progress bar elég)
- 🔄 Gyors iteráció AI-val
- 💾 In-memory storage tökéletes POC-hoz

### DON'T:
- ❌ Ne építs teljes ISO 27001 framework-öt
- ❌ Ne implementálj user management-et
- ❌ Ne foglalkozz PDF parsing library-kkal (plain text elég)
- ❌ Ne írj omfattó teszteket
- ❌ Ne építs production-ready error handling-et

## 🚀 Quickstart Guide

### Step 1: Projekt generálás AI-val
```
"Create a microservices project structure:
- checklist-service (Python/FastAPI)
- evidence-analyzer (Node.js/Express)  
- frontend (React/TypeScript)
- Docker Compose setup
Generate boilerplate with basic CRUD endpoints."
```

### Step 2: Core funkciók
1. Checklist CRUD (30 perc)
2. AI integration (45 perc)
3. Evidence matching (45 perc)
4. Basic UI (60 perc)
5. Docker setup (30 perc)
6. Dokumentáció (30 perc)

### Step 3: AI prompt példák
```python
# Evidence analyzer setup
def analyze_document(doc_text, requirement):
    prompt = f"""
    Check if this document satisfies the requirement:
    
    Document: {doc_text[:1000]}
    Requirement: {requirement}
    
    Return: {{"matches": bool, "confidence": float, "reason": str}}
    """
    # Call AI API
```

## 📝 Példa dokumentumok

### Password Policy példa (AI generálható):
```
ACME Corp Password Policy v2.0

1. Minimum Requirements:
- Length: 12 characters minimum
- Complexity: Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- No personal information

2. Password Rotation:
- Every 90 days for standard users
- Every 60 days for administrators

3. Account Lockout:
- 5 failed attempts triggers 30-minute lockout
```

## ❓ GYIK

**K: Melyik nyelveket használjam?**  
V: Amit ismersz + amit AI-val tudsz. Jó kombók: Python+Node, Go+Java, Elixir+TypeScript

**K: Milyen AI API-t használjak?**  
V: Bármelyik működik. Free tier elég: OpenAI, Anthropic, Google, Groq

**K: Kell valódi ISO dokumentáció?**  
V: Nem! Simplified, common-sense követelmények tökéletesek

**K: Mi ha túlfutok az időn?**  
V: Dokumentáld mit értél el. Pragmatizmus > tökéletesség

**K: Kell authentication?**  
V: Nem, skip it. Max egy hardcoded API key

---

## 🏁 Kezdj neki!

**Emlékezz:** 
- Ez POC, nem production kód
- AI a te copilot-od - használd bátran
- Dokumentáld az AI használatot
- A működő demo fontosabb mint a tiszta kód

**Beküldés:** GitHub repository link elküldése

**Sok sikert! 🚀**