import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Teacher } from '../types';

type CrossClassGroups = Record<string, Record<string, string[]>>;

interface GroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  crossClassGroups: CrossClassGroups;
  setCrossClassGroups: React.Dispatch<React.SetStateAction<CrossClassGroups>>;
  teachers: Teacher[];
}

export function GroupsModal({ isOpen, onClose, crossClassGroups, setCrossClassGroups, teachers }: GroupsModalProps) {
  if (!isOpen) return null;

  const subjects = ["ΑΓΓΛΙΚΑ", "Β' ΞΕΝΗ ΓΛΩΣΣΑ", "ΠΛΗΡΟΦΟΡΙΚΗ"];
  const grades = ["Α", "Β", "Γ", "Δ", "Ε", "ΣΤ"];

  const handleTeacherChange = (subject: string, grade: string, index: number, newTeacherId: string) => {
    setCrossClassGroups(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      if (!newState[subject]) newState[subject] = {};
      if (!newState[subject][grade]) newState[subject][grade] = [];
      newState[subject][grade][index] = newTeacherId;
      return newState;
    });
  };

  const addTeacherToGroup = (subject: string, grade: string) => {
    setCrossClassGroups(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      if (!newState[subject]) newState[subject] = {};
      if (!newState[subject][grade]) newState[subject][grade] = [];
      newState[subject][grade].push("");
      return newState;
    });
  };

  const removeTeacherFromGroup = (subject: string, grade: string, index: number) => {
    setCrossClassGroups(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState[subject][grade].splice(index, 1);
      return newState;
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Ομάδες Ξένων Γλωσσών & Πληροφορικής</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <p className="text-sm text-slate-600 mb-6">
            Ορίστε ποιες/ποιοι εκπαιδευτικοί διδάσκουν τα μαθήματα που χωρίζονται σε επίπεδα/γκρουπ.
            Όταν αναθέτετε στο πρόγραμμα (π.χ.) το μάθημα "ΑΓΓΛΙΚΑ" σε ένα τμήμα, οι ώρες θα πιστώνονται αυτόματα στους εκπαιδευτικούς της αντίστοιχης τάξης και θα ελέγχονται για συγκρούσεις.
          </p>

          <div className="space-y-8">
            {subjects.map(subject => (
              <div key={subject} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 border-b border-slate-100 pb-2 mb-4">{subject}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {grades.map(grade => {
                    const currentTeachers = crossClassGroups[subject]?.[grade] || [];
                    return (
                      <div key={grade} className="space-y-3">
                        <div className="font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md text-center">
                          Τάξη {grade}'
                        </div>
                        <div className="space-y-2">
                          {currentTeachers.map((tId, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <select
                                value={tId}
                                onChange={(e) => handleTeacherChange(subject, grade, idx, e.target.value)}
                                className="flex-1 text-sm border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">-- Επιλογή --</option>
                                {teachers.filter(t => (t.subject === subject || t.id === tId) && (!currentTeachers.includes(t.id) || t.id === tId)).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => removeTeacherFromGroup(subject, grade, idx)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addTeacherToGroup(subject, grade)}
                          className="w-full py-1.5 flex items-center justify-center gap-1 text-sm font-medium text-blue-600 border border-blue-200 border-dashed rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Προσθήκη
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
}
