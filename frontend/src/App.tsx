import React, { useState, useEffect } from 'react';
import { Checklist, Progress, ChecklistItem } from './types';
import { checklistAPI } from './services';
import { ChecklistView, DocumentUpload, GapAnalysis } from './components';
import './App.css';

const App: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeTab, setActiveTab] = useState<'checklist' | 'documents' | 'gaps'>('checklist');

  useEffect(() => {
    loadChecklists();
  }, []);

  useEffect(() => {
    if (selectedChecklist) {
      loadProgress();
    }
  }, [selectedChecklist]);

  const loadChecklists = async () => {
    try {
      const data = await checklistAPI.getChecklists();
      setChecklists(data);
      if (data.length > 0 && !selectedChecklist) {
        setSelectedChecklist(data[0]);
      }
    } catch (error) {
      console.error('Failed to load checklists:', error);
    }
  };

  const loadProgress = async () => {
    if (!selectedChecklist) return;
    
    try {
      const data = await checklistAPI.getProgress(selectedChecklist.id);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const handleStatusUpdate = async (itemId: string, status: string) => {
    if (!selectedChecklist) return;

    try {
      await checklistAPI.updateItemStatus(selectedChecklist.id, itemId, status);
      
      // Update local state
      const updatedChecklist = {
        ...selectedChecklist,
        items: selectedChecklist.items.map(item =>
          item.id === itemId ? { ...item, status: status as 'Függőben' | 'in_progress' | 'completed' } : item
        )
      };
      setSelectedChecklist(updatedChecklist);
      
      // Reload progress
      await loadProgress();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Compliance Ellenőrző Szolgáltatás</h1>
        <p>AI-alapú compliance elemző platform</p>
      </header>

      <div className="tabs">
        <button
          className={activeTab === 'checklist' ? 'active' : ''}
          onClick={() => setActiveTab('checklist')}
        >
          Ellenőrzőlista
        </button>
        <button
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          Dokumentumok
        </button>
        <button
          className={activeTab === 'gaps' ? 'active' : ''}
          onClick={() => setActiveTab('gaps')}
        >
          Hiányosság Elemzés
        </button>
      </div>

      <div className="content">
        {activeTab === 'checklist' && selectedChecklist && (
          <ChecklistView
            checklist={selectedChecklist}
            progress={progress}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentUpload
            checklist={selectedChecklist}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        {activeTab === 'gaps' && selectedChecklist && (
          <GapAnalysis checklistId={selectedChecklist.id} />
        )}
      </div>
    </div>
  );
};

export default App;