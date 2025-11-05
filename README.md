# Compliance Checker Service

AI-alapú compliance elemző platform ISO 27001/9001 compliance menedzsmenthez.

## 🏗️ Architektúra

Ez a mikroszerviz-alapú alkalmazás a következőkből áll:

- **Checklist Service** (Python/FastAPI) - Compliance checklist-ek és progress követés kezelése
- **Evidence Analyzer** (Node.js/Express) - AI-alapú dokumentum elemzés és illesztés
- **Frontend** (React/TypeScript) - Web felület compliance menedzsmenthez
- **Docker Compose** - Minden szolgáltatás orchestrálása

## 🚀 Gyors Kezdés

### Előfeltételek

- Docker és Docker Compose
- Git

### Telepítési Útmutató

1. **Repository klónozása**
   ```bash
   git clone <repository-url>
   cd compliance-checker
   ```

2. **AI API Kulcs Konfigurálása** (Opcionális)
   
   Hozzon létre egy `.env` fájlt a gyökérkönyvtárban:
   ```env
   AI_API_KEY=your-openai-api-key-here
   AI_BASE_URL=https://api.openai.com/v1
   AI_PROVIDER=openai
   ```
   
   *Megjegyzés: Az alkalmazás mock válaszokkal fog működni, ha nincs API kulcs megadva.*

3. **Minden szolgáltatás indítása**
   ```bash
   docker-compose up --build
   ```

4. **Alkalmazás elérése**
   
   - Frontend: http://localhost:2000
   - Checklist Service API: http://localhost:2001
   - Evidence Analyzer API: http://localhost:2002

## 📋 Funkciók

### Checklist Menedzsment
- ISO 27001 egyszerűsített compliance követelmények megtekintése
- Compliance státusz követése minden követelményhez
- Összesített compliance progress monitorozása
- Követelmény státusz frissítése bizonyítékokkal

### Dokumentum Elemzés
- Compliance dokumentumok feltöltése (drag & drop)
- AI-alapú dokumentum elemzés
- Automatikus illesztés compliance követelményekhez
- Confidence scoring az illesztésekhez

### Hiányosság Elemzés
- Compliance hiányosságok azonosítása
- Hiányzó követelmények prioritizálása
- Javasolt bizonyítékok a hiányosságokhoz
- Fejlesztési javaslatok követése

## 🔧 API Endpoint-ok

### Checklist Service (Port 2001)

- `GET /checklists` - Minden elérhető checklist listázása
- `GET /checklists/{id}` - Checklist részleteinek lekérése
- `POST /checklists/{id}/items/{itemId}/status` - Elem státusz frissítése
- `GET /checklists/{id}/progress` - Compliance progress lekérése

### Evidence Analyzer (Port 2002)

- `POST /analyze/document` - Dokumentum feltöltés és elemzés
- `POST /analyze/match` - Dokumentum illesztése követelményhez
- `GET /analyze/gaps` - Compliance hiányosság elemzés lekérése
- `GET /analyze/documents` - Elemzett dokumentumok listázása

## 📁 Projekt Struktúra

```
compliance-checker/
├── checklist-service/          # Python/FastAPI szolgáltatás
│   ├── main.py                # Fő alkalmazás
│   ├── requirements.txt       # Python függőségek
│   └── Dockerfile            # Docker konfiguráció
├── evidence-analyzer/         # Node.js/Express szolgáltatás
│   ├── server.js             # Fő alkalmazás
│   ├── package.json          # Node.js függőségek
│   └── Dockerfile            # Docker konfiguráció
├── frontend/                  # React TypeScript app
│   ├── src/
│   │   ├── components/       # React komponensek
│   │   ├── services/        # API szolgáltatások
│   │   ├── types/           # TypeScript típusok
│   │   └── App.tsx          # Fő alkalmazás
│   ├── public/              # Statikus fájlok
│   ├── Dockerfile           # Docker konfiguráció
│   └── nginx.conf            # Nginx konfiguráció
├── sample-documents/          # Mint compliance dokumentumok
├── docker-compose.yml        # Szolgáltatás orchestrálás
├── README.md                 # Ez a fájl
├── AI_USAGE.md              # AI használati dokumentáció
└── ARCHITECTURE.md          # Architektúráli döntések
```

## 🧪 Tesztelés Mint Dokumentumokkal

A `sample-documents/` könyvtár három példa compliance dokumentumot tartalmaz:

1. **password-policy.txt** - Átfogó jelszó szabályzat
2. **incident-response-plan.txt** - Incidens válasz eljárások
3. **backup-policy.txt** - Adatmentés és helyreállítási szabályzat

Töltse fel ezeket a dokumentumokat a web felületen keresztül az AI elemzés és illesztési képességek teszteléséhez.

## 🔍 Fejlesztés

### Szolgáltatások Egyéni Futtatása

**Checklist Service:**
```bash
cd checklist-service
pip install -r requirements.txt
python main.py
```

**Evidence Analyzer:**
```bash
cd evidence-analyzer
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Environment Változók

- `AI_API_KEY` - OpenAI API kulcs (vagy más AI provider)
- `AI_BASE_URL` - AI szolgáltatás base URL
- `AI_PROVIDER` - AI provider (openai, claude, etc.)

## 🤖 AI Integráció

Ez az alkalmazás AI-t használ a következőkre:

1. **Dokumentum Elemzés** - Biztonsági vezérlők és compliance területek azonosítása
2. **Követelmény Illesztés** - Dokumentumok illesztése compliance követelményekhez
3. **Hiányosság Elemzés** - Hiányzó compliance bizonyítékok azonosítása

Részletes AI implementációs információkért lásd az [`AI_USAGE.md`](AI_USAGE.md) fájlt.

## 📊 Compliance Keretrendszer

Az alkalmazás egyszerűsített ISO 27001 keretrendszert használ a következő kategóriákkal:

- **Hozzáférés Kezelés** - Jelszó szabályzatok, felhasználói hozzáférés felülvizsgálatok, admin logging
- **Incidens Menedzsment** - Válasz tervek, incidens log-ok, helyreállítási eljárások
- **Adatvédelem** - Mentési szabályzatok, titkosítási standardok, adatmegőrzés

## 🔒 Biztonsági Megfontolások

- Minden AI API hívás naplózásra kerül
- Dokumentum tartalom csak memóriában kerül feldolgozásra
- Nincs perzisztens tárolása az érzékeny dokumentum tartalomnak
- API kulcsokat biztonságosan kell tárolni environment változókban

## 📈 Monitorozás és Logging

- Minden szolgáltatás biztosít health check endpoint-okat
- A Docker Compose naplózza minden szolgáltatás aktivitását
- A frontend megjeleníti a valós idejű compliance progress-t

## 🐛 Hibaelhárítás

**Gyakori Problémák:**

1. **Szolgáltatások nem indulnak**
   - Ellenőrizze, hogy a Docker fut-e
   - Verifikálja a portok elérhetőségét (3000, 8001, 8002)

2. **AI elemzés nem működik**
   - Ellenőrizze, hogy az AI_API_KEY helyesen van-e beállítva
   - Ellenőrizze a hálózati kapcsolatot az AI provider-hez
   - Az alkalmazás mock válaszokat használ, ha az AI szolgáltatás nem elérhető

3. **A frontend nem tud csatlakozni a backend-hez**
   - Ellenőrizze, hogy minden szolgáltatás fut-e
   - Ellenőrizze a Docker hálózati konfigurációt
   - Nézze át az nginx proxy konfigurációt

## 📝 Licenc

Ez a projekt bemutatási célokat szolgál technikai felmérés részeként.

## 🤝 Támogatás

Kérdések vagy problémák esetén, kérjük, hivatkozzon a dokumentációs fájlokra:
- [`AI_USAGE.md`](AI_USAGE.md) - AI implementációs részletek
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - Architektúráli döntések

---

**Megjegyzés:** Ez egy POC/MVP bemutató, nem production-ready kód. Production használatra implementáljon megfelelő authentikációt, adatbázis perzisztenciát, error handling-t és biztonsági intézkedéseket.