import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Teacher } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  classes: string[];
  setClasses: React.Dispatch<React.SetStateAction<string[]>>;
  onClearAll: () => void;
}

export function SettingsModal({
  isOpen, onClose, teachers, setTeachers, classes, setClasses, onClearAll
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'teachers' | 'classes'>('teachers');
  
  // Local state for editing
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>([...teachers]);
  const [localClasses, setLocalClasses] = useState<string[]>([...classes]);

  React.useEffect(() => {
    if (isOpen) {
      setLocalTeachers([...teachers]);
      setLocalClasses([...classes]);
      setActiveTab('teachers');
    }
  }, [isOpen, teachers, classes]);

  if (!isOpen) return null;

  const handleSave = () => {
    setTeachers(localTeachers.filter(t => t.name.trim() !== ''));
    setClasses(localClasses.filter(c => c.trim() !== ''));
    onClose();
  };

  const addTeacher = () => {
    if (localTeachers.length > 0) {
      if (!localTeachers[localTeachers.length - 1].name.trim()) return;
    }
    const id = `t${Date.now()}`;
    setLocalTeachers([...localTeachers, { id, name: '', maxHours: 24 }]);
    setTimeout(() => {
      document.getElementById(`teacher-name-${id}`)?.focus();
    }, 10);
  };

  const removeTeacher = (id: string) => {
    setLocalTeachers(localTeachers.filter(t => t.id !== id));
  };

  const updateTeacher = (id: string, field: 'name' | 'maxHours', value: string | number) => {
    setLocalTeachers(localTeachers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addClass = () => {
    if (localClasses.length > 0) {
      if (!localClasses[localClasses.length - 1].trim()) return;
    }
    setLocalClasses([...localClasses, '']);
    setTimeout(() => {
      document.getElementById(`class-input-${localClasses.length}`)?.focus();
    }, 10);
  };

  const removeClass = (idx: number) => {
    const newClasses = [...localClasses];
    newClasses.splice(idx, 1);
    setLocalClasses(newClasses);
  };

  const updateClass = (idx: number, value: string) => {
    const newClasses = [...localClasses];
    newClasses[idx] = value;
    setLocalClasses(newClasses);
  };

  // Validation
  const duplicateTeacherNames = localTeachers
    .map(t => t.name.trim())
    .filter((name, index, arr) => arr.indexOf(name) !== index && name !== '');

  const duplicateClasses = localClasses
    .map(c => c.trim())
    .filter((name, index, arr) => arr.indexOf(name) !== index && name !== '');

  const hasErrors = duplicateTeacherNames.length > 0 || duplicateClasses.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Ρυθμίσεις Σχολείου</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'teachers' ? 'bg-white border-t-2 border-t-blue-600 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Εκπαιδευτικοί
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'classes' ? 'bg-white border-t-2 border-t-blue-600 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Τμήματα
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-600">Διαχειριστείτε τους εκπαιδευτικούς και τις μέγιστες ώρες τους.</p>
                <button onClick={addTeacher} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                  <Plus className="w-4 h-4" /> Προσθήκη
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localTeachers.map((t, idx) => {
                  const isDuplicate = duplicateTeacherNames.includes(t.name.trim()) && t.name.trim() !== '';
                  return (
                  <div key={t.id} className={`flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm ${isDuplicate ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
                    <span className="w-6 text-right text-slate-400 font-mono text-sm">{idx + 1}.</span>
                    <input 
                      id={`teacher-name-${t.id}`}
                      type="text" 
                      value={t.name}
                      onChange={(e) => updateTeacher(t.id, 'name', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTeacher();
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDuplicate ? 'border-red-400 text-red-900 bg-white' : 'border-slate-300'}`}
                      placeholder="Όνομα Εκπαιδευτικού"
                    />
                    <div className="flex items-center gap-2 w-24">
                      <input 
                        type="number" 
                        value={t.maxHours}
                        onChange={(e) => updateTeacher(t.id, 'maxHours', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        min="0"
                      />
                      <span className="text-xs text-slate-500">ώρες</span>
                    </div>
                    <button onClick={() => removeTeacher(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-600">Διαχειριστείτε τα τμήματα του σχολείου.</p>
                <button onClick={addClass} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                  <Plus className="w-4 h-4" /> Προσθήκη
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
                {localClasses.map((cls, idx) => {
                  const isDuplicate = duplicateClasses.includes(cls.trim()) && cls.trim() !== '';
                  return (
                  <div key={idx} className={`flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm ${isDuplicate ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
                    <span className="w-6 shrink-0 text-right text-slate-400 font-mono text-sm">{idx + 1}.</span>
                    <input 
                      id={`class-input-${idx}`}
                      type="text" 
                      value={cls}
                      onChange={(e) => updateClass(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addClass();
                        }
                      }}
                      className={`flex-1 w-full px-2 py-1.5 border rounded-md text-sm text-center font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDuplicate ? 'border-red-400 text-red-900 bg-white' : 'border-slate-300'}`}
                      placeholder="Τμήμα"
                      maxLength={8}
                    />
                    <button onClick={() => removeClass(idx)} className="p-1.5 shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Διαγραφή">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center gap-3">
          <button onClick={onClearAll} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Καθαρισμός Δεδομένων
          </button>
          <div className="flex items-center gap-3">
            {hasErrors && (
              <span className="text-sm text-red-600 font-medium">Υπάρχουν διπλοεγγραφές!</span>
            )}
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Ακύρωση
            </button>
            <button onClick={handleSave} disabled={hasErrors} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${hasErrors ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <Save className="w-4 h-4" /> Αποθήκευση Αλλαγών
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
