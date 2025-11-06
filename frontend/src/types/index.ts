export interface ChecklistItem {
  id: string;
  category: string;
  requirement: string;
  hints: string[];
  status: 'Függőben' | 'in_progress' | 'completed';
  evidence: string[];
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface Progress {
  checklist_id: string;
  total_items: number;
  completed_items: number;
  progress_percentage: number;
}

export interface Document {
  id: string;
  filename: string;
  content: string;
  uploaded_at: string;
}

export interface AnalysisResult {
  document_type: string;
  security_controls: string[];
  compliance_areas: string[];
  completeness_score: number;
  key_points: string[];
}

export interface MatchResult {
  matches: boolean;
  confidence: number;
  relevant_sections: string[];
  reasoning: string;
  missing_elements: string;
}

export interface Gap {
  requirement_id: string;
  requirement: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggested_evidence: string[];
}

export interface GapAnalysis {
  checklist_id: string;
  total_gaps: number;
  gaps: Gap[];
  analyzed_at: string;
}