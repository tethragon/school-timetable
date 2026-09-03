import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Download, Upload, List, X, Users, BookOpen, Printer, Settings, Search } from 'lucide-react';
import { useValidation } from './hooks/useValidation';
import { ScheduleData, Teacher, SubjectRule, DEFAULT_SUBJECT_RULES } from './types';
import { exportToCSV, importFromCSV } from './utils/csv';
import { SettingsModal } from './components/SettingsModal';

const DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

const CLASS_COLORS = [
  'bg-red-100 text-red-800 border-red-200 hover:bg-red-200/60',
  'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200/60',
  'bg-green-100 text-green-800 border-green-200 hover:bg-green-200/60',
  'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/60',
  'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200/60',
  'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200/60',
  'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200/60',
  'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/60',
  'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200/60',
  'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200/60',
  'bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-200/60',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-200/60',
  'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200/60',
  'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200/60',
  'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200/60'
];

const normalizeGreek = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .replace(/ς/g, "σ"); // Normalize final sigma
};

export default function App() {
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem('school_teachers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load teachers', e);
    }
    return [];
  });

  const [classes, setClasses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('school_classes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load classes', e);
    }
    return [];
  });

  const [subjectRules, setSubjectRules] = useState<SubjectRule[]>(() => {
    try {
      const saved = localStorage.getItem('school_subject_rules');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load subject rules', e);
    }
    return DEFAULT_SUBJECT_RULES;
  });

  const [schedule, setSchedule] = useState<ScheduleData>(() => {
    try {
      const saved = localStorage.getItem('school_schedule_auto_save');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load auto-save', e);
    }
    return {};
  });
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'teacher' | 'teacher-grid' | 'class-horizontal' | 'class-grid'>('teacher');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('school_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('school_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('school_subject_rules', JSON.stringify(subjectRules));
  }, [subjectRules]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('school_schedule_auto_save', JSON.stringify(schedule));
      } catch (e) {
        console.error('Failed to auto-save', e);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [schedule]);

  const getClassColor = (cId: string) => {
    const idx = classes.indexOf(cId);
    if (idx === -1) return 'bg-blue-50/40 text-blue-700'; // fallback
    return CLASS_COLORS[idx % CLASS_COLORS.length];
  };

  const getTeacherColor = (tId: string) => {
    const teacher = teachers.find(t => t.id === tId);
    const nameToHash = teacher ? teacher.name.trim() : tId.trim();
    
    let hash = 0;
    for (let i = 0; i < nameToHash.length; i++) {
      hash = nameToHash.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash);
    return CLASS_COLORS[idx % CLASS_COLORS.length];
  };

  // Keyboard nav state
  const [focusedCell, setFocusedCell] = useState<{rowIdx: number, cIdx: number} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(0);
  const [internalClipboard, setInternalClipboard] = useState<{type: string, val: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const errors = useValidation(schedule, teachers, classes, subjectRules);

  const ALLOWED_SPECIAL_SUBJECTS = ["ΑΓΓΛΙΚΑ", "Β' ΞΕΝΗ ΓΛΩΣΣΑ", "ΠΛΗΡΟΦΟΡΙΚΗ"];
  const displayTeachers = [
    ...teachers,
    ...subjectRules
      .filter(sr => ALLOWED_SPECIAL_SUBJECTS.includes(sr.name) && !teachers.some(t => t.name === sr.name || t.subject === sr.name))
      .map(sr => ({
        id: sr.name,
        name: sr.name,
        maxHours: 0,
        subject: sr.name,
        abbreviation: sr.abbreviation
      }))
  ].sort((a, b) => a.name.localeCompare(b.name, 'el'));

  const numCols = 40; // 5 days * 8 hours
  const numRows = ['teacher', 'teacher-grid'].includes(viewMode) ? displayTeachers.length : classes.length;

  useEffect(() => {
    if (focusedCell && !isEditing) {
      const el = document.getElementById(`cell-${focusedCell.rowIdx}-${focusedCell.cIdx}`);
      if (el) el.focus({ preventScroll: false });
    }
  }, [focusedCell, isEditing, viewMode]);

  // Derived state for Class View
  const classSchedule: Record<string, Record<number, Record<number, string>>> = {};
  classes.forEach(c => classSchedule[c] = {});
  Object.entries(schedule).forEach(([tId, days]) => {
    Object.entries(days).forEach(([d, hours]) => {
      Object.entries(hours).forEach(([h, classes]) => {
        (classes as string[]).forEach(cId => {
          if (!classSchedule[cId]) classSchedule[cId] = {};
          if (!classSchedule[cId][Number(d)]) classSchedule[cId][Number(d)] = {};
          classSchedule[cId][Number(d)][Number(h)] = tId;
        });
      });
    });
  });

  const updateCell = (teacherId: string, day: number, hour: number, classId: string) => {
    setSchedule(prev => {
      const newState = { ...prev };
      if (!newState[teacherId]) newState[teacherId] = {};
      if (!newState[teacherId][day]) newState[teacherId][day] = {};

      if (classId === "") {
         delete newState[teacherId][day][hour];
      } else {
         const teacher = teachers.find(t => t.id === teacherId);
         const isSpecial = (teacher && teacher.maxHours === 0) || teacherId === "ΑΓΓΛΙΚΑ" || teacherId === "Β' ΞΕΝΗ ΓΛΩΣΣΑ";
         
         const getPrefix = (c: string) => c.match(/^[^\d]+/)?.[0] || c;
         const classesToAssign = isSpecial 
            ? classes.filter(c => getPrefix(c) === getPrefix(classId))
            : [classId];

         newState[teacherId][day][hour] = classesToAssign;
      }
      return newState;
    });
  };

  const updateClassCell = (classId: string, day: number, hour: number, newTeacherId: string) => {
    setSchedule(prev => {
      const newState = { ...prev };
      
      // Remove any teacher currently assigned to this class at this day/hour
      Object.keys(newState).forEach(tId => {
         if (newState[tId]?.[day]?.[hour]) {
            newState[tId][day][hour] = newState[tId][day][hour].filter(c => c !== classId);
            if (newState[tId][day][hour].length === 0) {
                delete newState[tId][day][hour];
            }
         }
      });

      // Assign to new teacher
      if (newTeacherId) {
         const teacher = teachers.find(t => t.id === newTeacherId);
         const isSpecial = (teacher && teacher.maxHours === 0) || newTeacherId === "ΑΓΓΛΙΚΑ" || newTeacherId === "Β' ΞΕΝΗ ΓΛΩΣΣΑ";
         
         const getPrefix = (c: string) => c.match(/^[^\d]+/)?.[0] || c;
         const classesToAssign = isSpecial 
            ? classes.filter(c => getPrefix(c) === getPrefix(classId))
            : [classId];

         if (!newState[newTeacherId]) newState[newTeacherId] = {};
         if (!newState[newTeacherId][day]) newState[newTeacherId][day] = {};
         
         if (isSpecial) {
             classesToAssign.forEach(sibClass => {
                 Object.keys(newState).forEach(tId => {
                     if (tId !== newTeacherId && newState[tId]?.[day]?.[hour]) {
                         newState[tId][day][hour] = newState[tId][day][hour].filter(c => c !== sibClass);
                         if (newState[tId][day][hour].length === 0) delete newState[tId][day][hour];
                     }
                 });
             });
         }

         newState[newTeacherId][day][hour] = classesToAssign;
      }
      return newState;
    });
  };

  const getPrefix = (c: string) => c.match(/^[^\d]+/)?.[0] || c;
  const classesByGrade: Record<string, string[]> = {};
  classes.forEach(c => {
    const p = getPrefix(c);
    if (!classesByGrade[p]) classesByGrade[p] = [];
    classesByGrade[p].push(c);
  });

  const getOptionLabel = (val: string) => {
    if (!val) return "Κενό";
    if (['teacher', 'teacher-grid'].includes(viewMode)) return val; // it's a classId
    const t = teachers.find(x => x.id === val);
    return t ? t.name : val;
  };

  const formatCellText = (val: string) => {
    if (!val) return "";
    
    // Check if it's a teacher
    const teacherObj = teachers.find(t => t.id === val);
    if (teacherObj) {
      if (teacherObj.subject) {
        // Teacher has a specialty
        const rule = subjectRules.find(sr => sr.name === teacherObj.subject);
        const subjAbbr = rule?.abbreviation;
        const teachAbbr = teacherObj.abbreviation;
        
        if (subjAbbr && teachAbbr) {
          return `${subjAbbr} (${teachAbbr})`;
        } else if (subjAbbr) {
          return `${subjAbbr} (${teacherObj.name})`;
        } else if (teachAbbr) {
          return `${teacherObj.subject} (${teachAbbr})`;
        }
      }
      return teacherObj.abbreviation || teacherObj.name;
    }
    
    // Check if it's a subject directly
    const rule = subjectRules.find(sr => sr.id === val || sr.name === val);
    if (rule) {
      return rule.abbreviation || rule.name;
    }
    
    return val;
  };

  const sortedOptions = ['teacher', 'teacher-grid'].includes(viewMode)
    ? ["", ...[...classes].sort((a, b) => a.localeCompare(b, 'el'))] 
    : ["", ...displayTeachers.map(t => t.id)];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedCell) return;

    if ((e.code === 'KeyC' || e.code === 'KeyV') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      let dIdx, hIdx;
      if (['class-grid', 'teacher-grid'].includes(viewMode)) {
        dIdx = focusedCell.cIdx % 5;
        hIdx = Math.floor(focusedCell.cIdx / 5);
      } else {
        dIdx = Math.floor(focusedCell.cIdx / 8);
        hIdx = focusedCell.cIdx % 8;
      }
      
      let currentVal = "";
      if (['teacher', 'teacher-grid'].includes(viewMode)) {
        const cellClasses = schedule[displayTeachers[focusedCell.rowIdx].id]?.[dIdx]?.[hIdx] || [];
        currentVal = cellClasses[0] || "";
      } else {
        currentVal = classSchedule[classes[focusedCell.rowIdx]]?.[dIdx]?.[hIdx] || "";
      }

      if (e.code === 'KeyC' && currentVal) {
        setInternalClipboard({ type: ['teacher', 'teacher-grid'].includes(viewMode) ? 'class' : 'teacher', val: currentVal });
      } else if (e.code === 'KeyV' && internalClipboard) {
        if (['teacher', 'teacher-grid'].includes(viewMode) && internalClipboard.type === 'class') {
           updateCell(displayTeachers[focusedCell.rowIdx].id, dIdx, hIdx, internalClipboard.val);
        } else if (!['teacher', 'teacher-grid'].includes(viewMode) && internalClipboard.type === 'teacher') {
           updateClassCell(classes[focusedCell.rowIdx], dIdx, hIdx, internalClipboard.val);
        }
      }
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      let dIdx, hIdx;
      if (['class-grid', 'teacher-grid'].includes(viewMode)) {
        dIdx = focusedCell.cIdx % 5;
        hIdx = Math.floor(focusedCell.cIdx / 5);
      } else {
        dIdx = Math.floor(focusedCell.cIdx / 8);
        hIdx = focusedCell.cIdx % 8;
      }
      if (['teacher', 'teacher-grid'].includes(viewMode)) {
        updateCell(displayTeachers[focusedCell.rowIdx].id, dIdx, hIdx, "");
      } else {
        updateClassCell(classes[focusedCell.rowIdx], dIdx, hIdx, "");
      }
      setIsEditing(false);
      return;
    }

    if (isEditing) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setEditIndex(prev => Math.min(prev + 1, sortedOptions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setEditIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        let dIdx, hIdx;
        if (['class-grid', 'teacher-grid'].includes(viewMode)) {
          dIdx = focusedCell.cIdx % 5;
          hIdx = Math.floor(focusedCell.cIdx / 5);
        } else {
          dIdx = Math.floor(focusedCell.cIdx / 8);
          hIdx = focusedCell.cIdx % 8;
        }

        const selectedVal = sortedOptions[editIndex];
        
        if (['teacher', 'teacher-grid'].includes(viewMode)) {
          updateCell(displayTeachers[focusedCell.rowIdx].id, dIdx, hIdx, selectedVal);
        } else {
          updateClassCell(classes[focusedCell.rowIdx], dIdx, hIdx, selectedVal);
        }
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const char = normalizeGreek(e.key);
        let matchIdx = sortedOptions.findIndex((opt, idx) => {
           if (idx <= editIndex) return false;
           const label = normalizeGreek(getOptionLabel(opt));
           return label.startsWith(char);
        });
        if (matchIdx === -1) {
           matchIdx = sortedOptions.findIndex(opt => {
              const label = normalizeGreek(getOptionLabel(opt));
              return label.startsWith(char);
           });
        }
        if (matchIdx !== -1) {
           setEditIndex(matchIdx);
           document.getElementById(`edit-opt-${matchIdx}`)?.scrollIntoView({ block: 'nearest' });
        }
      }
      return;
    }

    // Grid Navigation
    let nextRow = focusedCell.rowIdx;
    let nextCol = focusedCell.cIdx;

    if (viewMode === 'class-grid') {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const gradeKeys = Object.keys(classesByGrade);
        let gradeIdx = 0;
        let classInGradeIdx = 0;
        for (let i = 0; i < gradeKeys.length; i++) {
            const idx = classesByGrade[gradeKeys[i]].indexOf(classes[focusedCell.rowIdx]);
            if (idx !== -1) {
                gradeIdx = i;
                classInGradeIdx = idx;
                break;
            }
        }
        
        const dIdx = focusedCell.cIdx % 5;
        const hIdx = Math.floor(focusedCell.cIdx / 5);
        
        let x = gradeIdx * 5 + dIdx;
        let y = classInGradeIdx * 8 + hIdx;
        
        if (e.key === 'ArrowRight') x++;
        else if (e.key === 'ArrowLeft') x--;
        else if (e.key === 'ArrowDown') y++;
        else if (e.key === 'ArrowUp') y--;
        
        // Bounds for X
        const maxX = gradeKeys.length * 5 - 1;
        if (x < 0) x = 0;
        if (x > maxX) x = maxX;
        
        // Calculate new grade to constrain Y
        const newGradeIdx = Math.floor(x / 5);
        const targetGradeClasses = classesByGrade[gradeKeys[newGradeIdx]];
        const maxY = targetGradeClasses.length * 8 - 1;
        
        if (y < 0) y = 0;
        if (y > maxY) y = maxY;
        
        const newDIdx = x % 5;
        const newClassInGradeIdx = Math.floor(y / 8);
        const newHIdx = y % 8;
        
        nextRow = classes.indexOf(targetGradeClasses[newClassInGradeIdx]);
        nextCol = newHIdx * 5 + newDIdx;
      }
    } else if (viewMode === 'teacher-grid') {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        
        let rIdx = focusedCell.rowIdx;
        let cIdx = focusedCell.cIdx;
        const dIdx = cIdx % 5;
        const hIdx = Math.floor(cIdx / 5);

        if (e.key === 'ArrowRight') {
            if (dIdx < 4) cIdx++; else if (rIdx < numRows - 1) { rIdx++; cIdx -= 4; }
        } else if (e.key === 'ArrowLeft') {
            if (dIdx > 0) cIdx--; else if (rIdx > 0) { rIdx--; cIdx += 4; }
        } else if (e.key === 'ArrowDown') {
            if (hIdx < 7) cIdx += 5; else if (rIdx < numRows - 1) { rIdx++; cIdx = dIdx; } 
        } else if (e.key === 'ArrowUp') {
            if (hIdx > 0) cIdx -= 5; else if (rIdx > 0) { rIdx--; cIdx = 35 + dIdx; }
        }
        
        nextRow = rIdx;
        nextCol = cIdx;
      }
    } else {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextCol = Math.min(nextCol + 1, numCols - 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextCol = Math.max(nextCol - 1, 0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextRow = Math.min(nextRow + 1, numRows - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextRow = Math.max(nextRow - 1, 0);
      }
    }

    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      setFocusedCell({ rowIdx: nextRow, cIdx: nextCol });
    } else if (e.key === 'Enter' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)) {
      e.preventDefault();
      setIsEditing(true);
      let dIdx, hIdx;
      if (['class-grid', 'teacher-grid'].includes(viewMode)) {
        dIdx = focusedCell.cIdx % 5;
        hIdx = Math.floor(focusedCell.cIdx / 5);
      } else {
        dIdx = Math.floor(focusedCell.cIdx / 8);
        hIdx = focusedCell.cIdx % 8;
      }
      
      let currentVal = "";
      if (['teacher', 'teacher-grid'].includes(viewMode)) {
        const cellClasses = schedule[displayTeachers[focusedCell.rowIdx].id]?.[dIdx]?.[hIdx] || [];
        currentVal = cellClasses[0] || "";
      } else {
        currentVal = classSchedule[classes[focusedCell.rowIdx]]?.[dIdx]?.[hIdx] || "";
      }
      
      if (e.key === 'Enter') {
        setEditIndex(Math.max(0, sortedOptions.indexOf(currentVal)));
      } else {
        const char = normalizeGreek(e.key);
        const matchIdx = sortedOptions.findIndex(opt => {
          const label = normalizeGreek(getOptionLabel(opt));
          return label.startsWith(char);
        });
        if (matchIdx !== -1) {
          setEditIndex(matchIdx);
          // Auto-scroll when the component renders is handled by useEffect or can just let the focus handle it
          setTimeout(() => {
            document.getElementById(`edit-opt-${matchIdx}`)?.scrollIntoView({ block: 'nearest' });
          }, 0);
        } else {
          setEditIndex(Math.max(0, sortedOptions.indexOf(currentVal)));
        }
      }
    }
  };

  const handleCellClick = (rowIdx: number, cIdx: number, currentVal: string) => {
    setFocusedCell({ rowIdx, cIdx });
    setIsEditing(true);
    setEditIndex(Math.max(0, sortedOptions.indexOf(currentVal)));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const data = await importFromCSV(e.target.files[0], teachers);
        if (data.teachers && data.classes) {
          if (window.confirm('Το αρχείο περιέχει Ρυθμίσεις Σχολείου. Θέλετε να αντικατασταθούν τα τρέχοντα δεδομένα (Εκπαιδευτικοί, Τμήματα, Κανόνες);')) {
            setTeachers(data.teachers);
            setClasses(data.classes);
            if (data.subjectRules) {
              setSubjectRules(data.subjectRules);
            }
          }
        }
        setSchedule(data.schedule);
      } catch (err) {
        alert('Υπήρξε σφάλμα κατά την ανάγνωση του αρχείου.');
        console.error(err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearAll = () => {
    if (window.confirm('ΠΡΟΣΟΧΗ: Είστε σίγουροι; Αυτή η ενέργεια θα διαγράψει ΟΛΑ τα δεδομένα (Εκπαιδευτικούς, Τμήματα, Πρόγραμμα). Η ενέργεια ΔΕΝ αναιρείται!')) {
      setTeachers([]);
      setClasses([]);
      setSchedule({});
      localStorage.removeItem('school_teachers');
      localStorage.removeItem('school_classes');
      localStorage.removeItem('school_schedule_auto_save');
      setShowSettingsModal(false);
    }
  };

  return (
    <div 
      className="h-screen bg-slate-50 font-sans text-slate-800 outline-none flex flex-col overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (isEditing && editContainerRef.current && !editContainerRef.current.contains(e.target as Node)) {
          setIsEditing(false);
        }
      }}
    >
      <header className="shrink-0 bg-white shadow-sm border-b border-slate-200 px-4 xl:px-6 py-3 xl:py-4 z-40 flex flex-wrap justify-between items-center relative gap-4">
        <div className="flex flex-wrap items-center gap-3 xl:gap-6">
          <div className="hidden lg:block">
            <h1 className="text-lg xl:text-xl font-bold text-slate-900 leading-tight">Πρόγραμμα Σχολικής Μονάδας</h1>
            <p className="text-xs xl:text-sm text-slate-500 mt-0.5">Διαμόρφωση εβδομαδιαίου προγράμματος</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 xl:gap-3 lg:ml-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 p-2 xl:px-4 xl:py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium text-sm transition-colors shadow-sm"
              title="Ρυθμίσεις Σχολείου"
            >
              <Settings className="w-4 h-4" /> <span className="hidden xl:inline">Ρυθμίσεις Σχολείου</span>
            </button>
            <div className="hidden xl:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => { setViewMode('teacher'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'teacher' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                title="Προβολή Ανά Εκπαιδευτικό (Γραμμικά)"
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline">Εκπαιδευτικοί (Γραμμικά)</span>
              </button>
              <button
                onClick={() => { setViewMode('teacher-grid'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'teacher-grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                title="Προβολή Ανά Εκπαιδευτικό (Πλέγμα)"
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline">Εκπαιδευτικοί (Πλέγμα)</span>
              </button>
              <button
                onClick={() => { setViewMode('class-horizontal'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'class-horizontal' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                title="Προβολή Τμημάτων (Γραμμικά)"
              >
                <List className="w-4 h-4" />
                <span className="hidden lg:inline">Τμήματα (Γραμμικά)</span>
              </button>
              <button
                onClick={() => { setViewMode('class-grid'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'class-grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                title="Προβολή Τμημάτων (Πλέγμα)"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden lg:inline">Τμήματα (Πλέγμα)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={['teacher', 'teacher-grid'].includes(viewMode) ? 'Αναζήτηση Εκπαιδευτικού...' : 'Αναζήτηση Τμήματος...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-40 sm:w-48 xl:w-64 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors shrink-0"
            title="Πληροφορίες Προγράμματος"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          
          <div className="hidden xl:block w-px h-6 bg-slate-200 mx-1"></div>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 p-2 xl:px-4 xl:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm shrink-0"
            title="Εκτύπωση"
          >
            <Printer className="w-4 h-4" /> <span className="hidden 2xl:inline">Εκτύπωση</span>
          </button>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 p-2 xl:px-4 xl:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-sm transition-colors shrink-0"
            title="Εισαγωγή"
          >
            <Upload className="w-4 h-4" /> <span className="hidden xl:inline">Εισαγωγή</span>
          </button>
          <button 
            onClick={() => exportToCSV(schedule, teachers, classes, subjectRules)}
            className="flex items-center gap-2 p-2 xl:px-4 xl:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors shadow-sm shrink-0"
            title="Εξαγωγή"
          >
            <Download className="w-4 h-4" /> <span className="hidden xl:inline">Εξαγωγή</span>
          </button>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 relative flex flex-col overflow-hidden">
        <div className={`p-6 w-full flex-1 flex flex-col min-w-0 ${['class-grid', 'teacher-grid'].includes(viewMode) ? 'overflow-auto' : 'overflow-hidden'}`}>
          {['class-grid', 'teacher-grid'].includes(viewMode) ? (
            <div className={viewMode === 'class-grid' ? "flex gap-8 items-start w-max pb-12" : "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 pb-12 items-start"}>
            {viewMode === 'class-grid' ? ( Object.entries(classesByGrade).map(([grade, gradeClasses]) => {
              const filteredClasses = gradeClasses.filter(cls => normalizeGreek(cls).includes(normalizeGreek(searchQuery)));
              if (filteredClasses.length === 0) return null;
              
              return (
              <div key={grade} className="flex flex-col gap-6 shrink-0">
                {filteredClasses.map(cls => {
                  const rowIdx = classes.indexOf(cls);
                  const cSchedule = classSchedule[cls] || {};
                  const clsColor = getClassColor(cls);

                  return (
                    <div key={cls} className="bg-white border border-slate-200 rounded-lg shadow-sm w-max relative">
                      <div className={`px-4 py-2 font-bold text-center border-b border-slate-200 rounded-t-lg ${clsColor}`}>
                        Τμήμα {cls}
                      </div>
                      <table className="border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="w-12 h-10 border-b border-r border-slate-200 bg-slate-50 text-slate-500 font-normal">Ώρα</th>
                            {DAYS.map(d => (
                              <th key={d} className="w-24 h-10 border-b border-r last:border-r-0 border-slate-200 bg-slate-50 text-slate-700 p-1 font-semibold">
                                {d.substring(0,3)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...Array(8)].map((_, hIdx) => (
                            <tr key={hIdx}>
                              <td className="border-r border-b border-slate-200 bg-slate-50 text-center text-xs text-slate-500 font-medium h-12">
                                {hIdx + 1}η
                              </td>
                              {[...Array(5)].map((_, dIdx) => {
                                const cIdx = hIdx * 5 + dIdx;
                                const val = cSchedule[dIdx]?.[hIdx] || "";
                                const teacherObj = teachers.find(t => t.id === val);
                                const teacherName = formatCellText(val);
                                const teacherColorClass = val ? getTeacherColor(val) : "";
                                const isFocused = focusedCell?.rowIdx === rowIdx && focusedCell?.cIdx === cIdx;
                                
                                return (
                                  <td key={dIdx} className="p-0 relative h-12 border-b border-r last:border-r-0 border-slate-200 bg-white">
                                    <div
                                      id={`cell-${rowIdx}-${cIdx}`}
                                      tabIndex={-1}
                                      draggable={!!val}
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'teacher', val }));
                                      }}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        try {
                                          const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                          if (data.type === 'teacher' && data.val) {
                                            updateClassCell(cls, dIdx, hIdx, data.val);
                                          }
                                        } catch (err) {}
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCellClick(rowIdx, cIdx, val);
                                      }}
                                      className={`w-full h-full px-1 flex items-center justify-center text-xs text-center cursor-pointer outline-none select-none transition-colors
                                        ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10 bg-blue-50' : ''}
                                        ${!isFocused && val ? `${teacherColorClass} font-medium` : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                      <span className="line-clamp-2 leading-tight">{teacherName}</span>
                                    </div>
                                    
                                    {isFocused && isEditing && (
                                      <div 
                                        ref={editContainerRef}
                                        className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 overflow-y-auto"
                                      >
                                        {sortedOptions.map((optVal, idx) => (
                                          <div 
                                            key={idx}
                                            id={`edit-opt-${idx}`}
                                            className={`px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-0 ${editIndex === idx ? 'bg-blue-600 text-white font-medium sticky top-0 bottom-0' : 'hover:bg-slate-50 text-slate-700'}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateClassCell(cls, dIdx, hIdx, optVal);
                                              setIsEditing(false);
                                              document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus();
                                            }}
                                          >
                                            {getOptionLabel(optVal) || <span className="text-slate-400 italic">Κενό</span>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            );
          })) : (
            displayTeachers.filter(t => normalizeGreek(t.name).includes(normalizeGreek(searchQuery))).map((teacher) => {
              const rowIdx = displayTeachers.findIndex(t => t.id === teacher.id);
              const tSchedule = schedule[teacher.id] || {};
              let currentHours = 0;
              for (let d = 0; d < 5; d++) {
                if (tSchedule[d]) currentHours += Object.keys(tSchedule[d]).length;
              }
              const isOverHours = teacher.maxHours > 0 && currentHours > teacher.maxHours;
              const hoursDisplay = teacher.maxHours === 0 ? currentHours : `${currentHours}/${teacher.maxHours}`;
              return (
                <div key={teacher.id} className="bg-white border border-slate-200 rounded-lg shadow-sm w-max relative shrink-0">
                  <div className="px-4 py-2 font-bold text-center border-b border-slate-200 rounded-t-lg bg-slate-100 text-slate-700 flex justify-between items-center gap-4">
                    <span className="truncate max-w-[12rem]">{teacher.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${isOverHours ? 'bg-red-100 text-red-700' : 'bg-white border border-slate-200'}`}>{hoursDisplay}</span>
                  </div>
                  <table className="border-collapse text-sm">
                    <thead><tr><th className="w-12 h-10 border-b border-r border-slate-200 bg-slate-50 text-slate-500 font-normal">Ώρα</th>
                    {DAYS.map(d => <th key={d} className="w-24 h-10 border-b border-r last:border-r-0 border-slate-200 bg-slate-50 text-slate-700 p-1 font-semibold">{d.substring(0,3)}</th>)}
                    </tr></thead>
                    <tbody>
                      {[...Array(8)].map((_, hIdx) => (
                        <tr key={hIdx}>
                          <td className="border-r border-b border-slate-200 bg-slate-50 text-center text-xs text-slate-500 font-medium h-12">{hIdx + 1}η</td>
                          {[...Array(5)].map((_, dIdx) => {
                            const cIdx = hIdx * 5 + dIdx;
                            const cellClasses = tSchedule[dIdx]?.[hIdx] || [];
                            const val = cellClasses[0] || "";
                            const clsColor = val ? getClassColor(val) : "";
                            const isFocused = focusedCell?.rowIdx === rowIdx && focusedCell?.cIdx === cIdx;
                            return (
                              <td key={dIdx} className="p-0 relative h-12 border-b border-r last:border-r-0 border-slate-200 bg-white">
                                <div
                                  id={`cell-${rowIdx}-${cIdx}`}
                                  tabIndex={-1}
                                  draggable={!!val}
                                  onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'class', val }))}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    try { const data = JSON.parse(e.dataTransfer.getData('application/json')); if (data.type === 'class' && data.val) updateCell(teacher.id, dIdx, hIdx, data.val); } catch (err) {}
                                  }}
                                  onClick={(e) => { e.stopPropagation(); handleCellClick(rowIdx, cIdx, val); }}
                                  className={`w-full h-full px-1 flex items-center justify-center text-xs text-center cursor-pointer outline-none select-none transition-colors
                                    ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10 bg-blue-50' : ''}
                                    ${!isFocused && val ? `${clsColor} font-bold` : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                  <span className="line-clamp-2 leading-tight">{val}</span>
                                </div>
                                {isFocused && isEditing && (
                                  <div ref={editContainerRef} className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 overflow-y-auto">
                                    {sortedOptions.map((optVal, idx) => (
                                      <div key={idx} id={`edit-opt-${idx}`} className={`px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-0 ${editIndex === idx ? 'bg-blue-600 text-white font-medium sticky top-0 bottom-0' : 'hover:bg-slate-50 text-slate-700'}`}
                                        onClick={(e) => {
                                          e.stopPropagation(); updateCell(teacher.id, dIdx, hIdx, optVal); setIsEditing(false); document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus();
                                        }}
                                      >
                                        {getOptionLabel(optVal) || <span className="text-slate-400 italic">Κενό</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 relative flex-1 flex flex-col overflow-hidden w-full">
          <div className="overflow-auto flex-1 pb-32">
            <table className="w-full border-collapse text-sm min-w-max">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-40 h-10 bg-slate-100 border-b border-b-slate-300 border-r-2 border-r-slate-400 p-2 w-64 min-w-[16rem] text-left shadow-[1px_1px_0_0_#cbd5e1]">
                    {['teacher', 'teacher-grid'].includes(viewMode) ? 'Εκπαιδευτικός' : 'Τμήμα'}
                  </th>
                  {DAYS.map((day, dIdx) => (
                    <th key={dIdx} colSpan={8} className="sticky top-0 z-30 h-10 bg-slate-100 border-b border-b-slate-300 border-r-2 border-r-slate-400 p-2 text-center font-semibold text-slate-700">
                      {day}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="sticky top-10 left-0 z-40 h-10 bg-slate-100 border-b border-b-slate-300 border-r-2 border-r-slate-400 p-2 text-left shadow-[1px_1px_0_0_#cbd5e1]">
                    <span className="text-xs text-slate-500 font-normal">
                      {['teacher', 'teacher-grid'].includes(viewMode) ? 'Όνομα (Ωρ.)' : 'Όνομα Τμήματος'}
                    </span>
                  </th>
                  {DAYS.map((_, dIdx) => (
                    <React.Fragment key={dIdx}>
                      {[...Array(8)].map((_, hIdx) => {
                        const isLastHour = hIdx === 7;
                        return (
                          <th key={hIdx} className={`sticky top-10 z-30 h-10 bg-slate-50 border-b border-b-slate-300 p-1 min-w-[60px] text-xs text-slate-500 text-center ${isLastHour ? 'border-r-2 border-r-slate-400' : 'border-r border-r-slate-300'}`}>
                            {hIdx + 1}η
                          </th>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['teacher', 'teacher-grid'].includes(viewMode) ? (
                  /* --- TEACHER VIEW --- */
                  displayTeachers.filter(t => normalizeGreek(t.name).includes(normalizeGreek(searchQuery))).map((teacher) => {
                    const rowIdx = displayTeachers.findIndex(t => t.id === teacher.id);
                    const tSchedule = schedule[teacher.id] || {};
                    let currentHours = 0;
                    for (let d = 0; d < 5; d++) {
                      if (tSchedule[d]) {
                        currentHours += Object.keys(tSchedule[d]).length;
                      }
                    }
                    const isOverHours = teacher.maxHours > 0 && currentHours > teacher.maxHours;
                    const hoursDisplay = teacher.maxHours === 0 ? currentHours : `${currentHours}/${teacher.maxHours}`;

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="sticky left-0 z-20 h-10 bg-white group-hover:bg-slate-50/50 border-b border-b-slate-300 border-r-2 border-r-slate-400 p-2 font-medium text-slate-700 shadow-[1px_0_0_0_#cbd5e1] truncate max-w-[16rem]">
                          <div className="flex justify-between items-center">
                            <span className="truncate pr-2">{teacher.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${isOverHours ? 'bg-red-100 text-red-700 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                              {hoursDisplay}
                            </span>
                          </div>
                        </td>
                        {DAYS.map((_, dIdx) => (
                          <React.Fragment key={dIdx}>
                            {[...Array(8)].map((_, hIdx) => {
                              const cIdx = dIdx * 8 + hIdx;
                              const cellClasses = schedule[teacher.id]?.[dIdx]?.[hIdx] || [];
                              const val = cellClasses.join(', ');
                              const firstClass = cellClasses[0] || "";
                              
                              const isFocused = focusedCell?.rowIdx === rowIdx && focusedCell?.cIdx === cIdx;
                              const isLastHour = hIdx === 7;
                              const cellColorClass = firstClass ? getClassColor(firstClass) : 'text-slate-600';
                              
                              return (
                                <td key={hIdx} className={`p-0 relative h-10 min-w-[60px] bg-white border-b border-b-slate-200 ${isLastHour ? 'border-r-2 border-r-slate-400' : 'border-r border-r-slate-200'}`}>
                                  <div
                                    id={`cell-${rowIdx}-${cIdx}`}
                                    tabIndex={-1}
                                    draggable={!!firstClass}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'class', val: firstClass }));
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      try {
                                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                        if (data.type === 'class' && data.val) {
                                          updateCell(teacher.id, dIdx, hIdx, data.val);
                                        }
                                      } catch (err) {}
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCellClick(rowIdx, cIdx, firstClass);
                                    }}
                                    className={`w-full h-full flex items-center justify-center text-sm cursor-pointer outline-none select-none transition-colors
                                      ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}
                                      ${val ? cellColorClass : 'hover:bg-slate-100'}`}
                                  >
                                    <span className="font-medium text-xs line-clamp-2 leading-tight text-center px-0.5">{val}</span>
                                  </div>
                                  
                                  {isFocused && isEditing && (
                                    <div 
                                      ref={editContainerRef}
                                      className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 overflow-y-auto"
                                    >
                                      {sortedOptions.map((c, idx) => (
                                        <div 
                                          key={idx}
                                          id={`edit-opt-${idx}`}
                                          className={`px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-0 ${editIndex === idx ? 'bg-blue-600 text-white font-medium sticky top-0 bottom-0' : 'hover:bg-slate-50 text-slate-700'}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCell(teacher.id, dIdx, hIdx, c);
                                            setIsEditing(false);
                                            document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus();
                                          }}
                                        >
                                          {getOptionLabel(c) || <span className="text-slate-400 italic">Κενό</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  /* --- CLASS VIEW --- */
                  classes.filter(cls => normalizeGreek(cls).includes(normalizeGreek(searchQuery))).map((cls) => {
                    const rowIdx = classes.indexOf(cls);
                    const cSchedule = classSchedule[cls] || {};
                    const clsColor = getClassColor(cls);

                    return (
                      <tr key={cls} className="hover:bg-slate-50/50 transition-colors group">
                        <td className={`sticky left-0 z-20 h-10 border-b border-b-slate-300 border-r-2 border-r-slate-400 p-2 font-bold shadow-[1px_0_0_0_#cbd5e1] truncate max-w-[16rem] ${clsColor}`}>
                           {cls}
                        </td>
                        {DAYS.map((_, dIdx) => (
                          <React.Fragment key={dIdx}>
                            {[...Array(8)].map((_, hIdx) => {
                              const cIdx = dIdx * 8 + hIdx;
                              const val = cSchedule[dIdx]?.[hIdx] || "";
                              const teacherObj = teachers.find(t => t.id === val);
                              const teacherName = formatCellText(val);
                              const teacherColorClass = val ? getTeacherColor(val) : "";
                              const isFocused = focusedCell?.rowIdx === rowIdx && focusedCell?.cIdx === cIdx;
                              const isLastHour = hIdx === 7;
                              
                              return (
                                <td key={hIdx} className={`p-0 relative h-10 min-w-[80px] bg-white border-b border-b-slate-200 ${isLastHour ? 'border-r-2 border-r-slate-400' : 'border-r border-r-slate-200'}`}>
                                  <div
                                    id={`cell-${rowIdx}-${cIdx}`}
                                    tabIndex={-1}
                                    draggable={!!val}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'teacher', val }));
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      try {
                                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                        if (data.type === 'teacher' && data.val) {
                                          updateClassCell(cls, dIdx, hIdx, data.val);
                                        }
                                      } catch (err) {}
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCellClick(rowIdx, cIdx, val);
                                    }}
                                    className={`w-full h-full px-1 flex items-center justify-center text-xs text-center cursor-pointer outline-none select-none transition-colors
                                      ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10 bg-blue-50' : ''}
                                      ${!isFocused && val ? `${teacherColorClass} font-medium` : 'text-slate-500 hover:bg-slate-50'}`}
                                  >
                                    <span className="line-clamp-2 leading-tight">{teacherName}</span>
                                  </div>
                                  
                                  {isFocused && isEditing && (
                                    <div 
                                      ref={editContainerRef}
                                      className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 overflow-y-auto"
                                    >
                                      {sortedOptions.map((optVal, idx) => (
                                        <div 
                                          key={idx} 
                                          id={`edit-opt-${idx}`}
                                          className={`px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-0 ${editIndex === idx ? 'bg-blue-600 text-white font-medium sticky top-0 bottom-0' : 'hover:bg-slate-50 text-slate-700'}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateClassCell(cls, dIdx, hIdx, optVal);
                                            setIsEditing(false);
                                            document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus();
                                          }}
                                        >
                                          {getOptionLabel(optVal) || <span className="text-slate-400 italic">Κενό</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
        </div>
      </main>

      {/* Footer Validation Bar */}
      <footer className="shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16 flex items-center px-6 z-50 justify-between relative">
        <div className="flex-1 flex items-center gap-4 overflow-hidden whitespace-nowrap h-full">
           {errors.length === 0 ? (
             <div className="flex items-center gap-2 text-emerald-600 font-medium">
               <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
               <span>Κανένα σφάλμα. Το πρόγραμμα είναι σωστό!</span>
             </div>
           ) : (
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 text-red-600 font-bold shrink-0">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <span>Σφάλματα ({errors.length}):</span>
               </div>
               <div className="text-red-700 font-medium text-sm truncate max-w-lg">
                 {errors[0]?.message} {errors.length > 1 && "..."}
               </div>
             </div>
           )}
        </div>
        
        {errors.length > 0 && (
           <button 
             onClick={() => setShowErrorsModal(true)}
             className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md font-medium text-sm transition-colors border border-red-200 ml-4 shrink-0"
           >
             <List className="w-4 h-4" />
             Προβολή όλων
           </button>
        )}
      </footer>

      {/* All Errors Modal */}
      {showErrorsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowErrorsModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-red-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Λίστα Σφαλμάτων ({errors.length})
              </h2>
              <button onClick={() => setShowErrorsModal(false)} className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-white/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {errors.map(err => (
                <div key={err.id} className="p-4 bg-red-50/50 border border-red-100 rounded-lg text-red-800 font-medium text-sm">
                  {err.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                Πληροφορίες
              </h2>
              <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <div>
                <p className="text-xs text-slate-400 font-medium tracking-wider mb-1">PROGRAM ARCHITECT</p>
                <p className="text-lg font-bold text-slate-800">George Petrakis</p>
              </div>
              <div className="w-full h-px bg-slate-100 my-2"></div>
              <div>
                <p className="text-xs text-slate-400 font-medium tracking-wider mb-1">ΕΚΔΟΣΗ</p>
                {/* Version Number - Update this manually when deploying new versions */}
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-sm">v.0.93b.20260903</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        teachers={teachers}
        setTeachers={setTeachers}
        classes={classes}
        setClasses={setClasses}
        subjectRules={subjectRules}
        setSubjectRules={setSubjectRules}
        schedule={schedule}
        setSchedule={setSchedule}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
