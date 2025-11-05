import React from 'react';
import { Checklist, Progress, ChecklistItem } from '../types';

interface ChecklistViewProps {
  checklist: Checklist;
  progress: Progress | null;
  onStatusUpdate: (itemId: string, status: string) => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ checklist, progress, onStatusUpdate }) => {
  const getStatusColor = (status: 'pending' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const groupedItems = checklist.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="checklist-view">
      <div className="checklist-header">
        <h2>{checklist.name}</h2>
        {progress && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
            <span className="progress-text">
              {progress.completed_items}/{progress.total_items} ({progress.progress_percentage.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      <div className="checklist-items">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="category-section">
            <h3>{category}</h3>
            {items.map(item => (
              <div key={item.id} className="checklist-item">
                <div className="item-header">
                  <span className="item-id">{item.id}</span>
                  <span
                    className="item-status"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="item-requirement">{item.requirement}</div>
                {item.evidence.length > 0 && (
                  <div className="item-evidence">
                    <strong>Bizonyíték:</strong>
                    <ul>
                      {item.evidence.map((evidence, index) => (
                        <li key={index}>{evidence}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="item-actions">
                  <select
                    value={item.status}
                    onChange={(e) => onStatusUpdate(item.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Függőben</option>
                    <option value="in_progress">Folyamatban</option>
                    <option value="completed">Befejezve</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistView;