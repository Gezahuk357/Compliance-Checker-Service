import React, { useState, useEffect } from 'react';
import { GapAnalysis, Gap } from '../types';
import { evidenceAnalyzerAPI } from '../services/api';

interface GapAnalysisProps {
  checklistId: string;
}

const GapAnalysis: React.FC<GapAnalysisProps> = ({ checklistId }) => {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
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
    return <div className="gap-analysis">Loading gap analysis...</div>;
  }

  if (!gapAnalysis) {
    return <div className="gap-analysis">Failed to load gap analysis</div>;
  }

  return (
    <div className="gap-analysis">
      <h2>Compliance Gap Analysis</h2>
      
      <div className="gap-summary">
        <div className="gap-stats">
          <div className="stat-item">
            <span className="stat-value">{gapAnalysis.total_gaps}</span>
            <span className="stat-label">Total Gaps</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {gapAnalysis.gaps.filter(gap => gap.priority === 'critical').length}
            </span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {gapAnalysis.gaps.filter(gap => gap.priority === 'high').length}
            </span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
      </div>

      <div className="gaps-list">
        <h3>Identified Gaps</h3>
        {gapAnalysis.gaps.length === 0 ? (
          <p className="no-gaps">No gaps identified. Great job!</p>
        ) : (
          gapAnalysis.gaps.map(gap => (
            <div key={gap.requirement_id} className="gap-card">
              <div className="gap-header">
                <span className="gap-id">{gap.requirement_id}</span>
                <span
                  className="gap-priority"
                  style={{ backgroundColor: getPriorityColor(gap.priority) }}
                >
                  {gap.priority.toUpperCase()}
                </span>
              </div>
              
              <div className="gap-requirement">
                <strong>Requirement:</strong> {gap.requirement}
              </div>
              
              <div className="gap-status">
                <strong>Status:</strong> {gap.status}
              </div>
              
              <div className="suggested-evidence">
                <strong>Suggested Evidence:</strong>
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
            Analysis performed on: {new Date(gapAnalysis.analyzed_at).toLocaleString()}
          </small>
        </p>
        <button onClick={loadGapAnalysis} className="refresh-btn">
          Refresh Analysis
        </button>
      </div>
    </div>
  );
};

export default GapAnalysis;