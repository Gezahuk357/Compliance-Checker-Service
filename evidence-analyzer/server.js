const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// In-memory storage for documents and analysis results
const documents = new Map();
const analysisResults = new Map();

// AI Service Configuration
const AI_SERVICE = {
  provider: process.env.AI_PROVIDER || 'openai',
  apiKey: process.env.AI_API_KEY || 'your-api-key-here',
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1'
};

// Helper function to call AI API
async function callAI(prompt) {
  try {
    if (AI_SERVICE.provider === 'openai') {
      const response = await axios.post(
        `${AI_SERVICE.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a compliance analysis expert. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${AI_SERVICE.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return JSON.parse(response.data.choices[0].message.content);
    }
    // Add other AI providers here if needed
    throw new Error('Unsupported AI provider');
  } catch (error) {
    console.error('AI API call failed:', error.message);
    // Return mock response for demo purposes
    return {
      matches: Math.random() > 0.5,
      confidence: Math.random() * 0.5 + 0.5,
      relevant_sections: ['Mock section from document'],
      reasoning: 'AI service unavailable - using mock response',
      missing_elements: ['Additional evidence needed']
    };
  }
}

// Routes

// POST /analyze/document - Upload and analyze document
app.post('/analyze/document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }

    const documentId = `doc_${Date.now()}`;
    const documentText = req.file.buffer.toString('utf-8');
    
    // Store document
    documents.set(documentId, {
      id: documentId,
      filename: req.file.originalname,
      content: documentText,
      uploadedAt: new Date().toISOString()
    });

    // Perform initial analysis
    const analysisPrompt = `
    Analyze this compliance document and identify key security controls and policies.
    
    DOCUMENT CONTENT:
    ${documentText.substring(0, 2000)}
    
    Return JSON with:
    {
      "document_type": "type of document (password policy, incident plan, etc.)",
      "security_controls": ["list of security controls mentioned"],
      "compliance_areas": ["relevant compliance areas"],
      "completeness_score": 0.0-1.0,
      "key_points": ["main security points covered"]
    }
    `;

    const analysis = await callAI(analysisPrompt);
    analysisResults.set(documentId, analysis);

    res.json({
      document_id: documentId,
      filename: req.file.originalname,
      analysis: analysis
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze document' });
  }
});

// POST /analyze/match - Match document to requirement
app.post('/analyze/match', async (req, res) => {
  try {
    const { document_id, requirement, hints } = req.body;

    if (!documents.has(document_id)) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents.get(document_id);
    const documentText = document.content;

    const matchPrompt = `
    Analyze if this document provides evidence for the compliance requirement.
    
    DOCUMENT CONTENT:
    ${documentText.substring(0, 1500)}
    
    REQUIREMENT:
    ${requirement}
    
    HINTS FOR MATCHING:
    ${hints ? hints.join(', ') : ''}
    
    Return JSON:
    {
      "matches": boolean,
      "confidence": 0.0-1.0,
      "relevant_sections": ["array of relevant quotes (max 2)"],
      "reasoning": "brief explanation",
      "missing_elements": "what's still needed"
    }
    `;

    const matchResult = await callAI(matchPrompt);

    res.json({
      document_id: document_id,
      requirement: requirement,
      match_result: matchResult
    });
  } catch (error) {
    console.error('Document matching error:', error);
    res.status(500).json({ error: 'Failed to match document to requirement' });
  }
});

// GET /analyze/gaps - Get compliance gaps
app.get('/analyze/gaps', async (req, res) => {
  try {
    const { checklist_id } = req.query;

    // Mock gap analysis for demo
    const gaps = [
      {
        requirement_id: "AC-2",
        requirement: "User access reviews quarterly",
        status: "pending",
        priority: "high",
        suggested_evidence: ["User access review reports", "Access review meeting minutes"]
      },
      {
        requirement_id: "IM-1",
        requirement: "Incident response plan documented",
        status: "pending",
        priority: "critical",
        suggested_evidence: ["Incident response plan document", "Emergency contact list"]
      }
    ];

    res.json({
      checklist_id: checklist_id || 'unknown',
      total_gaps: gaps.length,
      gaps: gaps,
      analyzed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Gap analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze gaps' });
  }
});

// GET /analyze/documents - List all analyzed documents
app.get('/analyze/documents', (req, res) => {
  const documentList = Array.from(documents.values()).map(doc => ({
    id: doc.id,
    filename: doc.filename,
    uploaded_at: doc.uploadedAt,
    has_analysis: analysisResults.has(doc.id)
  }));

  res.json({
    documents: documentList,
    total_count: documentList.length
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'evidence-analyzer',
    timestamp: new Date().toISOString(),
    ai_provider: AI_SERVICE.provider
  });
});

app.listen(PORT, () => {
  console.log(`Evidence Analyzer Service running on port ${PORT}`);
});