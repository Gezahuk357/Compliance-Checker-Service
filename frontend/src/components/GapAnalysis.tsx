import React, { useState, useEffect } from 'react';
import { GapAnalysis as GapAnalysisType, Gap } from '../types';
import { evidenceAnalyzerAPI } from '../services';

interface GapAnalysisProps {
  checklistId: string;
}

const GapAnalysis: React.FC<GapAnalysisProps> = ({ checklistId }) => {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGapAnalysis();
  }, [checklistId]);

  const loadGapAnalysis = async () => {
    try {
      setLoading(true);
      const analysis = await evidenceAnalyzerAPI.getGaps(checklistId);
      setGapAnalysis(analysis);
    } catch (error) {
      console.error('Failed to load gap analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  if (loading) {
    return <div className="gap-analysis">Hiányosság elemzés betöltése...</div>;
  }

  if (!gapAnalysis) {
    return <div className="gap-analysis">A hiányosság elemzés betöltése sikertelen</div>;
  }

  return (
    <div className="gap-analysis">
      <h2>Compliance Hiányosság Elemzés</h2>
      
      <div className="gap-summary">
        <div className="gap-stats">
          <div className="stat-item">
            <span className="stat-value">{gapAnalysis.total_gaps}</span>
            <span className="stat-label">Összes Hiányosság</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {gapAnalysis.gaps.filter(gap => gap.priority === 'critical').length}
            </span>
            <span className="stat-label">Kritikus</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {gapAnalysis.gaps.filter(gap => gap.priority === 'high').length}
            </span>
            <span className="stat-label">Magas Prioritású</span>
          </div>
        </div>
      </div>

      <div className="gaps-list">
        <h3>Azonosított Hiányosságok</h3>
        {gapAnalysis.gaps.length === 0 ? (
          <p className="no-gaps">Nincsenek hiányosságok. Szép munka!</p>
        ) : (
          gapAnalysis.gaps.map(gap => (
            <div key={gap.requirement_id} className="gap-card">
              <div className="gap-header">
                <span className="gap-id">{gap.requirement_id}</span>
                <span
                  className="gap-priority"
                  style={{ backgroundColor: getPriorityColor(gap.priority) }}
                >
                  {gap.priority === 'critical' ? 'KRITIKUS' :
                   gap.priority === 'high' ? 'MAGAS' :
                   gap.priority === 'medium' ? 'KÖZEPES' : 'ALACSONY'}
                </span>
              </div>
              
              <div className="gap-requirement">
                <strong>Követelmény:</strong> {gap.requirement}
              </div>
              
              <div className="gap-status">
                <strong>Státusz:</strong> {gap.status}
              </div>
              
              <div className="suggested-evidence">
                <strong>Javasolt Bizonyíték:</strong>
                <ul>
                  {gap.suggested_evidence.map((evidence, index) => (
                    <li key={index}>{evidence}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="analysis-footer">
        <p>
          <small>
            Elemzés végrehajtva: {new Date(gapAnalysis.analyzed_at).toLocaleString()}
          </small>
        </p>
        <div className="footer-buttons">
          <button onClick={loadGapAnalysis} className="refresh-btn">
            Elemzés Frissítése
          </button>
          <button
            onClick={() => evidenceAnalyzerAPI.downloadGapReport(checklistId)}
            className="download-btn"
          >
            Jelentés Letöltése
          </button>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysis;