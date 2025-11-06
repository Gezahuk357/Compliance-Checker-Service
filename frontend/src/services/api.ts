import axios from 'axios';
import { Checklist, Progress, Document, AnalysisResult, MatchResult, GapAnalysis } from '../types';

const CHECKLIST_SERVICE_URL = process.env.REACT_APP_CHECKLIST_SERVICE || 'http://localhost:2001';
const EVIDENCE_ANALYZER_URL = process.env.REACT_APP_EVIDENCE_ANALYZER || 'http://localhost:2002';

// Checklist Service API
export const checklistAPI = {
  getChecklists: async (): Promise<Checklist[]> => {
    const response = await axios.get(`${CHECKLIST_SERVICE_URL}/checklists`);
    return response.data;
  },

  getChecklist: async (id: string): Promise<Checklist> => {
    const response = await axios.get(`${CHECKLIST_SERVICE_URL}/checklists/${id}`);
    return response.data;
  },

  updateItemStatus: async (checklistId: string, itemId: string, status: string, evidence: string[] = []): Promise<void> => {
    await axios.post(`${CHECKLIST_SERVICE_URL}/checklists/${checklistId}/items/${itemId}/status`, {
      status,
      evidence
    });
  },

  getProgress: async (checklistId: string): Promise<Progress> => {
    const response = await axios.get(`${CHECKLIST_SERVICE_URL}/checklists/${checklistId}/progress`);
    return response.data;
  }
};

// Evidence Analyzer Service API
export const evidenceAnalyzerAPI = {
  analyzeDocument: async (file: File): Promise<{ document_id: string; filename: string; analysis: AnalysisResult }> => {
    const formData = new FormData();
    formData.append('document', file);
    
    const response = await axios.post(`${EVIDENCE_ANALYZER_URL}/analyze/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  matchDocument: async (documentId: string, requirement: string, hints: string[]): Promise<{ document_id: string; requirement: string; match_result: MatchResult }> => {
    const response = await axios.post(`${EVIDENCE_ANALYZER_URL}/analyze/match`, {
      document_id: documentId,
      requirement,
      hints
    });
    return response.data;
  },

  getGaps: async (checklistId: string): Promise<GapAnalysis> => {
    const response = await axios.get(`${EVIDENCE_ANALYZER_URL}/analyze/gaps?checklist_id=${checklistId}`);
    return response.data;
  },

  getDocuments: async (): Promise<{ documents: Document[]; total_count: number }> => {
    const response = await axios.get(`${EVIDENCE_ANALYZER_URL}/analyze/documents`);
    return response.data;
  },

  downloadGapReport: async (checklistId: string): Promise<void> => {
    const response = await axios.get(`${EVIDENCE_ANALYZER_URL}/analyze/gaps/report?checklist_id=${checklistId}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gap-analysis-report-${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};