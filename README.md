# Compliance Checker Service

AI-powered compliance analysis platform for ISO 27001/9001 compliance management.

## 🏗️ Architecture

This microservices-based application consists of:

- **Checklist Service** (Python/FastAPI) - Manages compliance checklists and progress tracking
- **Evidence Analyzer** (Node.js/Express) - AI-powered document analysis and matching
- **Frontend** (React/TypeScript) - Web interface for compliance management
- **Docker Compose** - Orchestrates all services

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd compliance-checker
   ```

2. **Configure AI API Key** (Optional)
   
   Create a `.env` file in the root directory:
   ```env
   AI_API_KEY=your-openai-api-key-here
   AI_BASE_URL=https://api.openai.com/v1
   AI_PROVIDER=openai
   ```
   
   *Note: The application will work with mock responses if no API key is provided.*

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   
   - Frontend: http://localhost:2000
   - Checklist Service API: http://localhost:2001
   - Evidence Analyzer API: http://localhost:2002

## 📋 Features

### Checklist Management
- View ISO 27001 simplified compliance requirements
- Track compliance status for each requirement
- Monitor overall compliance progress
- Update requirement status with evidence

### Document Analysis
- Upload compliance documents (drag & drop)
- AI-powered document analysis
- Automatic matching to compliance requirements
- Confidence scoring for matches

### Gap Analysis
- Identify compliance gaps
- Prioritize missing requirements
- Get suggested evidence for gaps
- Track improvement recommendations

## 🔧 API Endpoints

### Checklist Service (Port 2001)

- `GET /checklists` - List all available checklists
- `GET /checklists/{id}` - Get checklist details
- `POST /checklists/{id}/items/{itemId}/status` - Update item status
- `GET /checklists/{id}/progress` - Get compliance progress

### Evidence Analyzer (Port 2002)

- `POST /analyze/document` - Upload and analyze document
- `POST /analyze/match` - Match document to requirement
- `GET /analyze/gaps` - Get compliance gap analysis
- `GET /analyze/documents` - List analyzed documents

## 📁 Project Structure

```
compliance-checker/
├── checklist-service/          # Python/FastAPI service
│   ├── main.py                # Main application
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Docker configuration
├── evidence-analyzer/         # Node.js/Express service
│   ├── server.js             # Main application
│   ├── package.json          # Node.js dependencies
│   └── Dockerfile            # Docker configuration
├── frontend/                  # React TypeScript app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Main application
│   ├── public/              # Static files
│   ├── Dockerfile           # Docker configuration
│   └── nginx.conf            # Nginx configuration
├── sample-documents/          # Sample compliance documents
├── docker-compose.yml        # Service orchestration
├── README.md                 # This file
├── AI_USAGE.md              # AI usage documentation
└── ARCHITECTURE.md          # Architecture decisions
```

## 🧪 Testing with Sample Documents

The `sample-documents/` directory contains three example compliance documents:

1. **password-policy.txt** - Comprehensive password policy
2. **incident-response-plan.txt** - Incident response procedures
3. **backup-policy.txt** - Data backup and recovery policy

Upload these documents through the web interface to test the AI analysis and matching capabilities.

## 🔍 Development

### Running Services Individually

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

### Environment Variables

- `AI_API_KEY` - OpenAI API key (or other AI provider)
- `AI_BASE_URL` - AI service base URL
- `AI_PROVIDER` - AI provider (openai, claude, etc.)

## 🤖 AI Integration

This application uses AI for:

1. **Document Analysis** - Identifying security controls and compliance areas
2. **Requirement Matching** - Matching documents to compliance requirements
3. **Gap Analysis** - Identifying missing compliance evidence

See [`AI_USAGE.md`](AI_USAGE.md) for detailed AI implementation information.

## 📊 Compliance Framework

The application uses a simplified ISO 27001 framework with the following categories:

- **Access Control** - Password policies, user access reviews, admin logging
- **Incident Management** - Response plans, incident logs, recovery procedures
- **Data Protection** - Backup policies, encryption standards, data retention

## 🔒 Security Considerations

- All AI API calls are logged
- Document content is processed in memory only
- No persistent storage of sensitive document content
- API keys should be stored securely in environment variables

## 📈 Monitoring and Logging

- Each service provides health check endpoints
- Docker Compose logs all service activities
- Frontend displays real-time compliance progress

## 🐛 Troubleshooting

**Common Issues:**

1. **Services won't start**
   - Check Docker is running
   - Verify port availability (3000, 8001, 8002)

2. **AI analysis not working**
   - Verify AI_API_KEY is set correctly
   - Check network connectivity to AI provider
   - Application will use mock responses if AI service unavailable

3. **Frontend can't connect to backend**
   - Verify all services are running
   - Check Docker network configuration
   - Review nginx proxy configuration

## 📝 License

This project is for demonstration purposes as part of a technical assessment.

## 🤝 Support

For questions or issues, please refer to the documentation files:
- [`AI_USAGE.md`](AI_USAGE.md) - AI implementation details
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - Architecture decisions

---

**Note:** This is a POC/MVP demonstration, not production-ready code. For production use, implement proper authentication, database persistence, error handling, and security measures.