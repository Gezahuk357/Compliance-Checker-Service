import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Checklist, Document, AnalysisResult, MatchResult } from '../types';
import { evidenceAnalyzerAPI } from '../services';

interface DocumentUploadProps {
  checklist: Checklist | null;
  onStatusUpdate: (itemId: string, status: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ checklist, onStatusUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([]);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
  const [matchingResults, setMatchingResults] = useState<Record<string, MatchResult>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!checklist) return;

    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        // Analyze document
        const analysis = await evidenceAnalyzerAPI.analyzeDocument(file);
        
        // Store results
        setUploadedDocuments(prev => [...prev, {
          id: analysis.document_id,
          filename: analysis.filename,
          content: '', // We don't store the full content in frontend
          uploaded_at: new Date().toISOString()
        }]);
        
        setAnalysisResults(prev => ({
          ...prev,
          [analysis.document_id]: analysis.analysis
        }));

        // Try to match against checklist items
        for (const item of checklist.items) {
          if (item.status === 'pending') {
            try {
              const match = await evidenceAnalyzerAPI.matchDocument(
                analysis.document_id,
                item.requirement,
                item.hints
              );

              if (match.match_result.matches && match.match_result.confidence > 0.7) {
                setMatchingResults(prev => ({
                  ...prev,
                  [`${analysis.document_id}-${item.id}`]: match.match_result
                }));
                
                // Auto-update status if high confidence match
                if (match.match_result.confidence > 0.8) {
                  onStatusUpdate(item.id, 'completed');
                }
              }
            } catch (error) {
              console.error('Failed to match document:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to upload documents:', error);
    } finally {
      setUploading(false);
    }
  }, [checklist, onStatusUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
    <div className="document-upload">
      <h2>Dokumentum Feltöltés és Elemzés</h2>
      
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p>Dokumentumok feltöltése és elemzése...</p>
        ) : isDragActive ? (
          <p>Helyezze ide a fájlokat...</p>
        ) : (
          <p>Húzzon és ejtsen dokumentumokat ide, vagy kattintson fájlok kiválasztásához</p>
        )}
      </div>

      {uploadedDocuments.length > 0 && (
        <div className="uploaded-documents">
          <h3>Feltöltött Dokumentumok</h3>
          {uploadedDocuments.map(doc => (
            <div key={doc.id} className="document-card">
              <h4>{doc.filename}</h4>
              {analysisResults[doc.id] && (
                <div className="analysis-result">
                  <p><strong>Dokumentum Típus:</strong> {analysisResults[doc.id].document_type}</p>
                  <p><strong>Teljesség Pontszám:</strong> {(analysisResults[doc.id].completeness_score * 100).toFixed(1)}%</p>
                  <div className="security-controls">
                    <strong>Biztonsági Vezérlők:</strong>
                    <ul>
                      {analysisResults[doc.id].security_controls.map((control, index) => (
                        <li key={index}>{control}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {Object.entries(matchingResults)
                .filter(([key]) => key.startsWith(doc.id))
                .map(([key, match]) => {
                  const itemId = key.split('-')[1];
                  const item = checklist?.items.find(i => i.id === itemId);
                  return (
                    <div key={key} className="match-result">
                      <p><strong>Egyezik a következővel:</strong> {item?.requirement}</p>
                      <p><strong>Magabiztosság:</strong> {(match.confidence * 100).toFixed(1)}%</p>
                      <p><strong>Indoklás:</strong> {match.reasoning}</p>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;