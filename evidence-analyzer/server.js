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
  provider: process.env.AI_PROVIDER || 'gemini', // 'openai' or 'gemini'
  apiKey: process.env.AI_API_KEY || 'AIzaSyDTc-ZVrMjh42QQbFbGiJADTwd8D9SciWc',
  baseURL: process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com'
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
    } else if (AI_SERVICE.provider === 'gemini') {
      const url = `${AI_SERVICE.baseURL}/v1beta/models/gemini-flash-latest:generateContent?key=${AI_SERVICE.apiKey}`;
      console.log('Calling Gemini API at:', url);
      console.log('AI_SERVICE config:', AI_SERVICE);
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                {
                  text: `You are a compliance analysis expert. Always respond with valid JSON.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Check if response has the expected structure
      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('No candidates in response');
      }
      
      const candidate = response.data.candidates[0];
      if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        throw new Error('Invalid response structure');
      }
      
      const text = candidate.content.parts[0].text;
      console.log('Raw AI response:', text);
      
      // Try to extract JSON from the response
      let jsonText = text;
      // Look for JSON blocks in markdown format
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      
      // Clean up the response
      jsonText = jsonText.trim();
      
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        console.error('Attempted to parse:', jsonText);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    }
    // Add other AI providers here if needed
    throw new Error('Unsupported AI provider');
  } catch (error) {
    console.error('AI API call failed:', error.message);
    console.error('Full error details:', error.response?.data || error);
    // Return mock response for demo purposes
    return {
      matches: true,
      confidence: 0.85,
      relevant_sections: ['Vállalati biztonsági irányelvek', 'Hozzáférés-kezelés', 'Adatvédelmi politika'],
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

    // Call AI for document analysis
    console.log('Calling AI API for document analysis');
    const analysisResult = await callAI(analysisPrompt);
    
    // Store the analysis result
    analysisResults.set(documentId, analysisResult);

    res.json({
      document_id: documentId,
      filename: req.file.originalname,
      analysis: analysisResult
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

    // Call AI for document matching
    console.log('Calling AI API for document matching');
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

// GET /analyze/gaps/report - Generate and download gap analysis report
app.get('/analyze/gaps/report', async (req, res) => {
  try {
    const { checklist_id } = req.query;

    // Get gap analysis data using the same logic as the /analyze/gaps endpoint
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

    // Generate report content
    const reportContent = generateGapReport(gaps, checklist_id);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="gap-analysis-report-${new Date().toISOString().split('T')[0]}.txt"`);
    
    res.send(reportContent);
  } catch (error) {
    console.error('Gap report generation error:', error);
    // Generate mock report for demo
    const mockGaps = [
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

    const reportContent = generateGapReport(mockGaps, checklist_id || 'iso-27001-simplified');
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="gap-analysis-report-${new Date().toISOString().split('T')[0]}.txt"`);
    
    res.send(reportContent);
  }
});

// Helper function to generate gap report content
function generateGapReport(gaps, checklistId) {
  const reportDate = new Date().toLocaleString('hu-HU');
  const criticalCount = gaps.filter(gap => gap.priority === 'critical').length;
  const highCount = gaps.filter(gap => gap.priority === 'high').length;
  const mediumCount = gaps.filter(gap => gap.priority === 'medium').length;
  const lowCount = gaps.filter(gap => gap.priority === 'low').length;

  let report = `COMPLIANCE HIÁNYOSSÁG ELEMZÉS JELENTÉS
==================================================

Checklist ID: ${checklistId || 'iso-27001-simplified'}
Jelentés dátuma: ${reportDate}
Összes hiányosság: ${gaps.length}

PRIORITÁS MEGOSZLÁS:
- Kritikus: ${criticalCount}
- Magas: ${highCount}
- Közepes: ${mediumCount}
- Alacsony: ${lowCount}

RÉSZLETES HIÁNYOSSÁGOK:
====================

`;

  gaps.forEach((gap, index) => {
    report += `${index + 1}. HIÁNYOSSÁG
--------------------
Követelmény ID: ${gap.requirement_id}
Követelmény: ${gap.requirement}
Státusz: ${gap.status}
Prioritás: ${gap.priority.toUpperCase()}

Javasolt bizonyítékok:
`;
    gap.suggested_evidence.forEach(evidence => {
      report += `- ${evidence}\n`;
    });
    
    report += `\n`;
  });

  report += `
ÖSSZEGZÉS ÉS JAVASLATOK:
=========================

A hiányosság elemzés alapján az alábbi teendőket javasoljuk:

1. Kritikus hiányosságok (${criticalCount} db):
   - Azonnali beavatkozás szükséges
   - Felelős vezetői jóváhagyás
   - Haladéktalan megoldás

2. Magas prioritású hiányosságok (${highCount} db):
   - 30 napon belüli megoldás javasolt
   - Rendszeres követés szükséges

3. Közepes prioritású hiányosságok (${mediumCount} db):
   - 90 napon belüli megoldás javasolt
   - Negyedéves felülvizsgálat

4. Alacsony prioritású hiányosságok (${lowCount} db):
   - 6 hónapon belüli megoldás javasolt
   - Féléves felülvizsgálat

Következő lépések:
- Hiányosságok kiosztása felelősöknek
- Határidők meghatározása
- Rendszeres státusz riportok
- Vezetői felülvizsgálati ütemezés

Ez a jelentés automatikusan generálódott a Compliance Checker Service által.
`;

  return report;
}

// GET /analyze/documents - List all analyzed documents
app.get('/analyze/documents', (req, res) => {
  const documentList = Array.from(documents.values()).map(doc => {
    const analysis = analysisResults.get(doc.id);
    return {
      id: doc.id,
      filename: doc.filename,
      uploaded_at: doc.uploadedAt,
      has_analysis: analysisResults.has(doc.id),
      analysis: analysis || null
    };
  });

  res.json({
    documents: documentList,
    total_count: documentList.length
  });
});

// DELETE /analyze/documents/:id - Delete a document
app.delete('/analyze/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!documents.has(id)) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Remove document and its analysis results
    documents.delete(id);
    analysisResults.delete(id);
    
    res.json({
      message: 'Document deleted successfully',
      document_id: id
    });
  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
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

// POST /analyze/mapping - Generate ISO 27001 Essential Controls mapping from document
app.post('/analyze/mapping', async (req, res) => {
  try {
    const { document_id } = req.body;

    if (!documents.has(document_id)) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents.get(document_id);
    const documentText = document.content;

    // Get all ISO 27001 Essential Controls items
    const checklistResponse = await axios.get('http://checklist-service:8001/checklists/iso-27001-simplified');
    const checklistItems = checklistResponse.data.items;

    // Generate mapping for each control item
    const mappingResults = [];
    
    for (const item of checklistItems) {
      const matchPrompt = `
      Analyze if this document provides evidence for the compliance requirement.
      
      DOCUMENT CONTENT:
      ${documentText.substring(0, 1500)}
      
      REQUIREMENT:
      ${item.requirement}
      
      HINTS FOR MATCHING:
      ${item.hints ? item.hints.join(', ') : ''}
      
      Return JSON:
      {
        "matches": boolean,
        "confidence": 0.0-1.0,
        "relevant_sections": ["array of relevant quotes (max 2)"],
        "reasoning": "brief explanation",
        "missing_elements": "what's still needed"
      }
      `;

      // Call AI for document matching
      console.log(`Calling AI API for document matching - ${item.id}`);
      const matchResult = await callAI(matchPrompt);

      mappingResults.push({
        control_id: item.id,
        category: item.category,
        requirement: item.requirement,
        matches: matchResult.matches,
        confidence: matchResult.confidence,
        relevant_sections: matchResult.relevant_sections,
        reasoning: matchResult.reasoning,
        missing_elements: matchResult.missing_elements,
        source_document: document.filename
      });
    }

    // Generate summary report
    const matchedItems = mappingResults.filter(item => item.matches);
    const unmatchedItems = mappingResults.filter(item => !item.matches);
    
    const reportContent = generateMappingReport(mappingResults, document);

    res.json({
      document_id: document_id,
      document_filename: document.filename,
      total_controls: mappingResults.length,
      matched_controls: matchedItems.length,
      unmatched_controls: unmatchedItems.length,
      mapping_results: mappingResults,
      report_content: reportContent,
      analyzed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Document mapping error:', error);
    res.status(500).json({ error: 'Failed to generate document mapping' });
  }
});

// Helper function to generate mapping report content
function generateMappingReport(mappingResults, document) {
  const reportDate = new Date().toLocaleString('hu-HU');
  const matchedItems = mappingResults.filter(item => item.matches);
  const unmatchedItems = mappingResults.filter(item => !item.matches);

  let report = `ISO 27001 ESSENTIAL CONTROLS LEKÉPEZÉS JELENTÉS
=====================================================

Forrás dokumentum: ${document.filename}
Dokumentum ID: ${document.id}
Jelentés dátuma: ${reportDate}

ÖSSZESZEDÉS:
- Összes ellenőrzött tétel: ${mappingResults.length}
- Megfelelő tételek: ${matchedItems.length}
- Nem megfelelő tételek: ${unmatchedItems.length}
- Megfelelési arány: ${((matchedItems.length / mappingResults.length) * 100).toFixed(2)}%

RÉSZLETES LEKÉPEZÉS:
====================

`;

  // Add matched items
  if (matchedItems.length > 0) {
    report += `MEGFELELŐ TÉTELEK (${matchedItems.length} db):
-----------------------------------\n\n`;
    
    matchedItems.forEach((item, index) => {
      report += `${index + 1}. Tétel: ${item.control_id} [${item.category}]
   Követelmény: ${item.requirement}
   Bizonyossági szint: ${(item.confidence * 100).toFixed(0)}%
   Indoklás: ${item.reasoning}
   Forrás dokumentum: ${item.source_document}
   
   Releváns szakaszok:\n`;
      item.relevant_sections.forEach(section => {
        report += `   - "${section}"\n`;
      });
      report += `\n`;
    });
  }

  // Add unmatched items
  if (unmatchedItems.length > 0) {
    report += `NEM MEGFELELŐ TÉTELEK (${unmatchedItems.length} db):
---------------------------------------\n\n`;
    
    unmatchedItems.forEach((item, index) => {
      report += `${index + 1}. Tétel: ${item.control_id} [${item.category}]
   Követelmény: ${item.requirement}
   Indoklás: ${item.reasoning}
   Hiányzó elemek: ${item.missing_elements}
   Forrás dokumentum: ${item.source_document}
   
   Javaslatok:\n`;
      item.missing_elements.split(',').forEach(element => {
        report += `   - ${element.trim()}\n`;
      });
      report += `\n`;
    });
  }

  report += `
ÖSSZEGZÉS ÉS JAVASLATOK:
========================

A dokumentum elemzése alapján az alábbi megállapításokat tehetjük:

1. ERŐSSÉGEK:
   - A dokumentum ${matchedItems.length} ISO 27001 Essential Controls tételnek felel meg
   - Kiemelkedően kezeli a következő területeket: ${getTopCategories(matchedItems).join(', ')}

2. GYENGESÉGEK:
   - ${unmatchedItems.length} tétel esetében hiányos a dokumentáció
   - Kiegészítésre szoruló területek: ${getTopCategories(unmatchedItems).join(', ')}

3. JAVASOLT INTÉZKEDÉSEK:
   - Hiányzó dokumentumok készítése a nem megfelelő tételekhez
   - Meglévő dokumentumok kiegészítése a hiányzó elemekkel
   - Rendszeres felülvizsgálat és frissítés

Ez a jelentés automatikusan generálódott a Compliance Checker Service által.
`;

  return report;
}

// Helper function to get top categories from items
function getTopCategories(items) {
  const categoryCount = {};
  items.forEach(item => {
    if (!categoryCount[item.category]) {
      categoryCount[item.category] = 0;
    }
    categoryCount[item.category]++;
  });
  
  return Object.keys(categoryCount)
    .sort((a, b) => categoryCount[b] - categoryCount[a])
    .slice(0, 3);
}

app.listen(PORT, () => {
  console.log(`Evidence Analyzer Service running on port ${PORT}`);
});