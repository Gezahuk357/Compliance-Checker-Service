# Architektúra Dokumentáció

## 🏗️ Rendszerarchitektúra Áttekintés

A Compliance Checker Service mikroszerviz architektúraként lett tervezve a következő kulcselvekkel:

- **Szerviz Szétválasztás:** Minden üzleti domain különálló szolgáltatás
- **Technológiai Sokszínűség:** Több programozási nyelv szükség szerint
- **Konténerizáció:** Minden szolgáltatás Docker konténerekben fut
- **AI Integráció:** AI szolgáltatások integrálva dokumentum elemzésre
- **API-First:** Minden szolgáltatás REST API-t tesz elérhetővé

## 📋 Architektúra Komponensek

### 1. Checklist Service (Python/FastAPI)
**Felelősségi körök:**
- Compliance checklist-ek kezelése
- Követelmény státusz követése
- Compliance progress számítása
- Checklist CRUD műveletek biztosítása

**Technológiai Stack:**
- Python 3.11
- FastAPI keretrendszer
- Pydantic adat validálásra
- Uvicorn ASGI szerver

**Kulcs Tervezési Döntések:**
- **In-memory tárolás:** POC egyszerűsége miatt választva
- **RESTful API:** Standard HTTP metódusok CRUD műveletekhez
- **JSON válaszok:** Könnyű frontend integráció
- **Health check endpoint:** Monitorozásra és load balancing-ra

### 2. Evidence Analyzer (Node.js/Express)
**Felelősségi körök:**
- Dokumentum feltöltés és feldolgozás
- AI-alapú dokumentum elemzés
- Dokumentum-követelmény illesztés
- Hiányosság elemzés és javaslatok

**Technológiai Stack:**
- Node.js 18
- Express.js keretrendszer
- Multer fájl feltöltésre
- Axios HTTP kérésekhez

**Kulcs Tervezési Döntések:**
- **Memory storage:** Dokumentumok memóriában tárolva elemzés közben
- **AI absztrakció:** Cserélhető AI provider interfész
- **Mock fallback:** Elegáns degradálás amikor AI nem elérhető
- **Fájl típus támogatás:** Több dokumentum formátum (TXT, PDF, DOC, DOCX)

### 3. Frontend (React/TypeScript)
**Felelősségi körök:**
- Felhasználói felület compliance menedzsmenthez
- Dokumentum feltöltés és vizualizáció
- Progress követés és riportálás
- Hiányosság elemzés megjelenítés

**Technológiai Stack:**
- React 18
- TypeScript típusbiztonságra
- React Dropzone fájl feltöltésre
- Axios API kommunikációra

**Kulcs Tervezési Döntések:**
- **Komponens alapú architektúra:** Újrahasznosítható UI komponensek
- **Típusbiztonság:** TypeScript jobb fejlesztői élményért
- **Reszponzív design:** Mobilbarát felület
- **Real-time frissítések:** Progress követés oldalfrissítés nélkül

## 🔗 Szerviz Kommunikáció

### API Gateway Minta
A frontend nginx-et használ reverse proxy-ként a kérések megfelelő backend szolgáltatásokhoz való irányítására:

```
Frontend (nginx:3000)
├── /api/* → Checklist Service (8001)
└── /analyze/* → Evidence Analyzer (8002)
```

### Szerviz-közti Kommunikáció
- **Szinkron kommunikáció:** Közvetlen HTTP hívások
- **JSON formátum:** Standard adatcsere formátum
- **Error handling:** HTTP státusz kódok és hibaüzenetek

## 🗄️ Adatarchitektúra

### Adattárolási Stratégia
**Jelenlegi Implementáció (POC):**
- In-memory tárolás minden szolgáltatásnál
- Nincs perzisztens adatbázis
- Adatok elvesznek szolgáltatás újraindításkor

**Production Megfontolások:**
- PostgreSQL a checklist service-hez
- MongoDB az evidence analyzer-hez
- Redis cache-elés és session menedzsmenthez
- S3 dokumentum tárolásra

### Adatmodellek

#### Checklist Service
```python
Checklist {
  id: string
  name: string
  items: ChecklistItem[]
}

ChecklistItem {
  id: string
  category: string
  requirement: string
  hints: string[]
  status: "pending" | "in_progress" | "completed"
  evidence: string[]
}
```

#### Evidence Analyzer
```javascript
Document {
  id: string
  filename: string
  content: string
  uploaded_at: string
}

AnalysisResult {
  document_type: string
  security_controls: string[]
  compliance_areas: string[]
  completeness_score: number
  key_points: string[]
}
```

## 🤖 AI Integrációs Architektúra

### AI Provider Absztrakció
Az evidence analyzer provider mintát implementál több AI szolgáltatás támogatására:

```javascript
class AIProvider {
  async analyze(prompt) {
    // Provider-specifikus implementáció
  }
}

class OpenAIProvider extends AIProvider {
  // OpenAI-specifikus implementáció
}

class ClaudeProvider extends AIProvider {
  // Claude-specifikus implementáció
}
```

### AI Prompt Stratégia
- **Strukturált prompt-ok:** Egyértelmű utasítások és várt kimeneti formátum
- **Kontext korlátozás:** Dokumentum csonkolás token menedzsmenthez
- **Fallback válaszok:** Mock válaszok amikor AI nem elérhető
- **Error handling:** Elegáns degradálás AI hibák esetén

## 🔒 Biztonsági Architektúra

### Jelenlegi Implementáció (POC)
- **Nincs authentikáció:** Egyszerűsítve bemutatásra
- **API kulcs menedzsment:** Environment változók AI szolgáltatásokhoz
- **Input validálás:** Alapvető validálás minden szolgáltatásnál
- **CORS konfiguráció:** Cross-origin kérés kezelése

### Production Biztonsági Megfontolások
- **OAuth 2.0/JWT:** Felhasználói authentikáció és autorizáció
- **API rate limiting:** Visszaélés megelőzése és költségek menedzselése
- **Adat titkosítás:** Nyugvó és tranzitban lévő adatokhoz
- **Audit logging:** Biztonsági esemény követés
- **Hálózati szegmentáció:** Szerviz izoláció

## 🚀 Telepítési Architektúra

### Konténer Stratégia
- **Multi-stage build-ök:** Optimalizált Docker képek
- **Alpine Linux:** Minimális base képek biztonságért
- **Health check-ek:** Konténer health monitorozás
- **Erőforrás korlátok:** Memória és CPU megszorítások

### Docker Compose Konfiguráció
```yaml
services:
  checklist-service:
    build: ./checklist-service
    ports: ["8001:8001"]
    
  evidence-analyzer:
    build: ./evidence-analyzer
    ports: ["8002:8002"]
    environment:
      - AI_API_KEY=${AI_API_KEY}
    
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [checklist-service, evidence-analyzer]
```

### Production Telepítési Opciók
- **Kubernetes:** Konténer orchestráció és skálázás
- **AWS ECS:** Menedzselt konténer szolgáltatás
- **Docker Swarm:** Egyszerű konténer klaszterezés
- **Cloud Run:** Serverless konténer telepítés

## 📊 Monitorozás és Megfigyelhetőség

### Jelenlegi Implementáció
- **Health check endpoint-ök:** Szerviz elérhetőség monitorozása
- **Docker log-ok:** Konténer log aggregáció
- **Error handling:** Alapvető hiba logging

### Production Monitorozási Stratégia
- **Alkalmazás metrikák:** Prometheus/Grafana
- **Distributed tracing:** Jaeger/Zipkin
- **Log aggregáció:** ELK Stack
- **APM integráció:** New Relic/DataDog

## 🔄 Skálázhatósági Architektúra

### Horizontális Skálázás
- **Stateless szolgáltatások:** Könnyű skálázás load balancer-ekkel
- **Konténer orchestráció:** Automatikus skálázás load alapján
- **Adatbázis sharding:** Adat elosztás nagy adathalmazokhoz

### Teljesítmény Optimalizálás
- **Cache stratégia:** Redis gyakran elérhető adatokhoz
- **CDN integráció:** Statikus asset kiszolgálás
- **Adatbázis indexelés:** Lekérdezés teljesítmény optimalizálás
- **Async feldolgozás:** Háttér feladat sorok

## 🧪 Tesztelési Architektúra

### Jelenlegi Tesztelés (POC)
- **Manuális tesztelés:** Web felületen keresztül
- **API tesztelés:** Közvetlen endpoint tesztelés
- **Integrációs tesztelés:** Szerviz interakció validálás

### Production Tesztelési Stratégia
- **Unit tesztek:** Szerviz szintű tesztelés
- **Integrációs tesztek:** Kereszt-szerviz tesztelés
- **End-to-end tesztek:** Teljes felhasználói út tesztelés
- **Teljesítmény tesztek:** Load és stress tesztelés

## 📈 Evolúciós Útiterv

### 1. Fázis: POC (Jelenlegi)
- Alapvető funkcionalitás
- In-memory tárolás
- Egy AI provider
- Manuális telepítés

### 2. Fázis: MVP
- Perzisztens tárolás
- Felhasználói authentikáció
- Több AI provider
- Automatizált telepítés

### 3. Fázis: Production
- Fejlett biztonság
- Teljesítmény optimalizálás
- Átfogó monitorozás
- Multi-tenant támogatás

### 4. Fázis: Enterprise
- Fejlett AI funkciók
- Egyedi compliance keretrendszerek
- Fejlett riportálás
- Harmadik fél integrációk

## 🎯 Architektúra Kompromisszumok

### Technológiai Választások
| Döntés | Indoklás | Kompromisszum |
|--------|----------|--------------|
| Python a Checklist Service-hez | Gyors fejlesztés, jó API keretrendszerek | Teljesítmény vs fordított nyelvek |
| Node.js az Evidence Analyzer-hez | AI SDK elérhetőség, async feldolgozás | Egyszálú korlátok |
| React TypeScript Frontend | Típusbiztonság, ökoszisztéma | Tanulási görbe vs plain JavaScript |
| Docker Compose | Egyszerű telepítés, fejlesztői paritás | Production skálázási korlátok |

### Tervezési Döntések
| Döntés | Indoklás | Kompromisszum |
|--------|----------|--------------|
| In-memory tárolás | POC egyszerűsége, gyors fejlesztés | Adat perzisztencia, skálázhatóság |
| REST API-k | Standardizáció, tooling | Real-time korlátok |
| Mock AI válaszok | Demonstrációs képesség | Csökkentett funkcionalitás |
| Nincs authentikáció | Egyszerűsített fejlesztés | Biztonsági korlátok |

## 📚 Használt Architektúráli Minták

1. **Mikroszerviz Minta:** Szerviz szétválasztás üzleti domain szerint
2. **API Gateway Minta:** Egyetlen belépési pont a frontend számára
3. **Repository Minta:** Adat hozzáférés absztrakció (jövő)
4. **Provider Minta:** AI szolgáltatás absztrakció
5. **Circuit Breaker Minta:** AI szolgáltatás hiba kezelése
6. **Observer Minta:** Real-time UI frissítések

---

**Megjegyzés:** Ez az architektúra dokumentáció a jelenlegi POC implementációra vonatkozik. A production környezetben további biztonsági, skálázhatósági és megbízhatósági rétegek implementálása szükséges.