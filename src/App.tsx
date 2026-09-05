import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Star, AlertCircle, Lock, Unlock, LayoutGrid, LayoutTemplate, CheckCircle2, Download, Upload, List, X, Users, BookOpen, Printer, Settings, Search, Undo2, ChevronDown, Ban } from 'lucide-react';
import { useValidation } from './hooks/useValidation';
import { ScheduleData, Teacher, SubjectRule, DEFAULT_SUBJECT_RULES, HistoryAction } from './types';
import { exportToCSV, importFromCSV } from './utils/csv';
import { SettingsModal } from './components/SettingsModal';

const DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

const CLASS_COLORS = [
  'bg-red-50 text-red-900 border-l-4 border-l-red-500 hover:bg-red-100',
  'bg-blue-50 text-blue-900 border-l-4 border-l-blue-500 hover:bg-blue-100',
  'bg-emerald-50 text-emerald-900 border-l-4 border-l-emerald-500 hover:bg-emerald-100',
  'bg-amber-50 text-amber-900 border-l-4 border-l-amber-500 hover:bg-amber-100',
  'bg-purple-50 text-purple-900 border-l-4 border-l-purple-500 hover:bg-purple-100',
  'bg-pink-50 text-pink-900 border-l-4 border-l-pink-500 hover:bg-pink-100',
  'bg-cyan-50 text-cyan-900 border-l-4 border-l-cyan-500 hover:bg-cyan-100',
  'bg-orange-50 text-orange-900 border-l-4 border-l-orange-500 hover:bg-orange-100',
  'bg-indigo-50 text-indigo-900 border-l-4 border-l-indigo-500 hover:bg-indigo-100',
  'bg-lime-50 text-lime-900 border-l-4 border-l-lime-500 hover:bg-lime-100',
  'bg-fuchsia-50 text-fuchsia-900 border-l-4 border-l-fuchsia-500 hover:bg-fuchsia-100',
  'bg-sky-50 text-sky-900 border-l-4 border-l-sky-500 hover:bg-sky-100',
  'bg-rose-50 text-rose-900 border-l-4 border-l-rose-500 hover:bg-rose-100',
  'bg-teal-50 text-teal-900 border-l-4 border-l-teal-500 hover:bg-teal-100',
  'bg-violet-50 text-violet-900 border-l-4 border-l-violet-500 hover:bg-violet-100',
  'bg-yellow-50 text-yellow-900 border-l-4 border-l-yellow-500 hover:bg-yellow-100'
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

  const [classTutors, setClassTutors] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('school_class_tutors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load class tutors', e);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('school_class_tutors', JSON.stringify(classTutors));
  }, [classTutors]);


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
  const [viewMode, setViewMode] = useState<'teacher' | 'teacher-grid' | 'class-horizontal' | 'class-grid'>(() => {
    const saved = localStorage.getItem('school_view_mode');
    if (saved && ['teacher', 'teacher-grid', 'class-horizontal', 'class-grid'].includes(saved)) {
      return saved as 'teacher' | 'teacher-grid' | 'class-horizontal' | 'class-grid';
    }
    return 'teacher';
  });
    const [showInfoModal, setShowInfoModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [lockedAssignments, setLockedAssignments] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('school_locked_assignments');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  
  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('school_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('school_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('school_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('school_locked_assignments', JSON.stringify(lockedAssignments));
  }, [lockedAssignments]);
  
  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'school_schedule_auto_save' && e.newValue) setSchedule(JSON.parse(e.newValue));
      if (e.key === 'school_teachers' && e.newValue) setTeachers(JSON.parse(e.newValue));
      if (e.key === 'school_classes' && e.newValue) setClasses(JSON.parse(e.newValue));
      if (e.key === 'school_class_tutors' && e.newValue) setClassTutors(JSON.parse(e.newValue));
      if (e.key === 'school_subject_rules' && e.newValue) setSubjectRules(JSON.parse(e.newValue));
      if (e.key === 'school_locked_assignments' && e.newValue) setLockedAssignments(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  type SelectedCell = { r: number, c: number, tId: string, d: number, h: number, cId: string };
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);

  const toggleCellSelection = (r: number, c: number, tId: string, d: number, h: number, cId: string) => {
    setSelectedCells(prev => {
      const exists = prev.some(cell => cell.r === r && cell.c === c);
      if (exists) return prev.filter(cell => cell.r !== r || cell.c !== c);
      return [...prev, { r, c, tId, d, h, cId }];
    });
  };

  const blockSelected = () => {
    const isTeacherView = ['teacher', 'teacher-grid'].includes(viewMode);
    
    setHistory(prev => {
      const newHistory = [{ id: Date.now().toString(), description: `Μαζικός αποκλεισμός (${selectedCells.length} ώρες)`, oldSchedule: JSON.parse(JSON.stringify(schedule)) }, ...prev];
      return newHistory.slice(0, 30);
    });

    setSchedule(prev => {
      const newState = JSON.parse(JSON.stringify(prev));

      const getPrefixLocal = (c) => c.match(/^[^d]+/)?.[0] || c;

      selectedCells.forEach(cell => {
         const d = cell.d;
         const h = cell.h;
         
         if (isTeacherView) {
            const tId = cell.tId;
            const classId = "BLOCK";
            if (!newState[tId]) newState[tId] = {};
            if (!newState[tId][d]) newState[tId][d] = {};
            newState[tId][d][h] = ["BLOCK"];
         } else {
            const classId = cell.cId;
            const newTeacherId = "BLOCK";
            
            // Remove any teacher currently assigned
            Object.keys(newState).forEach(t => {
               if (newState[t]?.[d]?.[h] && newState[t][d][h].includes(classId)) {
                  newState[t][d][h] = newState[t][d][h].filter(c => c !== classId);
                  if (newState[t][d][h].length === 0) delete newState[t][d][h];
               }
            });

            if (!newState[newTeacherId]) newState[newTeacherId] = {};
            if (!newState[newTeacherId][d]) newState[newTeacherId][d] = {};
            const existing = newState[newTeacherId][d][h] || [];
            newState[newTeacherId][d][h] = Array.from(new Set([...existing, classId]));
         }
      });
      return newState;
    });
    setSelectedCells([]);
  };

  const lockSelected = () => {
    setLockedAssignments(prev => {
      const next = { ...prev };
      selectedCells.forEach(cell => {
        next[`${cell.tId}-${cell.d}-${cell.h}-${cell.cId}`] = true;
      });
      return next;
    });
    setSelectedCells([]);
  };

  const unlockSelected = () => {
    setLockedAssignments(prev => {
      const next = { ...prev };
      selectedCells.forEach(cell => {
        delete next[`${cell.tId}-${cell.d}-${cell.h}-${cell.cId}`];
      });
      return next;
    });
    setSelectedCells([]);
  };

  useEffect(() => {
    setSelectedCells([]);
  }, [viewMode, searchQuery]);

  const toggleLock = (teacherId: string, day: number, hour: number, classId: string) => {
    setLockedAssignments(prev => {
      const key = `${teacherId}-${day}-${hour}-${classId}`;
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const isLocked = (teacherId: string, day: number, hour: number, classId: string) => {
    if (!teacherId || !classId) return false;
    return lockedAssignments[`${teacherId}-${day}-${hour}-${classId}`] === true;
  };


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
  const [conflictPending, setConflictPending] = useState<{type: 'class' | 'teacher'; day: number; hour: number; teacherId: string; classId: string; conflictClasses?: string[]; conflictTeacherId?: string;} | null>(null);
  const [dragConflict, setDragConflict] = useState<{
    type: 'class' | 'teacher';
    source: { id: string; day: number; hour: number; val: string };
    target: { id: string; day: number; hour: number; val: string };
  } | null>(null);
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

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastAction = history[0];
    setSchedule(lastAction.oldSchedule);
    setHistory(prev => prev.slice(1));
  }, [history, setSchedule, setHistory]);

  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'ζ' || e.code === 'KeyZ')) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, [handleUndo]);

  const updateCell = (teacherId: string, day: number, hour: number, classId: string) => {
    if (!classId) {
      executeCellUpdate(teacherId, day, hour, classId, 'move');
      return;
    }
    if (!isVirtualTeacher(teacherId)) {
      const busyClasses = schedule[teacherId]?.[day]?.[hour] || [];
      const actualBusy = busyClasses.filter(c => c !== classId);
      if (actualBusy.length > 0) {
        setConflictPending({
          type: 'teacher', day, hour, teacherId, classId, conflictClasses: actualBusy
        });
        return;
      }
    }
    executeCellUpdate(teacherId, day, hour, classId, 'move');
  };

  const executeCellUpdate = (teacherId: string, day: number, hour: number, classId: string, mode: 'move' | 'coteach' = 'move') => {
    const teacher = teachers.find(t => t.id === teacherId);
    const teacherName = teacher ? teacher.name : teacherId;
    const description = classId === "" 
      ? `Διαγραφή μαθήματος - ${teacherName} (${DAYS[day]} ${hour + 1}η)`
      : classId === "BLOCK" ? `Αποκλεισμός ώρας - ${teacherName} (${DAYS[day]} ${hour + 1}η)` : `Ανάθεση ${classId} στον/στην ${teacherName} (${DAYS[day]} ${hour + 1}η)`;
    
    setHistory(prev => {
      const newHistory = [{ id: Date.now().toString() + Math.random(), description, oldSchedule: JSON.parse(JSON.stringify(schedule)) }, ...prev];
      return newHistory.slice(0, 30);
    });

    setSchedule(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      if (!newState[teacherId]) newState[teacherId] = {};
      if (!newState[teacherId][day]) newState[teacherId][day] = {};

      if (classId === "") {
         delete newState[teacherId][day][hour];
      } else {
         const isVirtual = isVirtualTeacher(teacherId);
         const isCrossClassGroup = teacherId === "ΑΓΓΛΙΚΑ" || teacherId === "Β' ΞΕΝΗ ΓΛΩΣΣΑ";
         
         const getPrefix = (c: string) => c.match(/^[^\d]+/)?.[0] || c;
         const classesToAssign = (isCrossClassGroup && classId !== 'BLOCK')
            ? classes.filter(c => getPrefix(c) === getPrefix(classId))
            : [classId];

         if (mode === 'coteach' || isVirtual) {
             const existing = newState[teacherId][day][hour] || [];
             newState[teacherId][day][hour] = Array.from(new Set([...existing, ...classesToAssign]));
         } else {
             newState[teacherId][day][hour] = classesToAssign;
         }
      }
      return newState;
    });
  };

  const isVirtualTeacher = (tId: string) => {
    if (tId === 'BLOCK') return true;
    const t = teachers.find(x => x.id === tId);
    return (t && t.maxHours === 0) || tId === "ΑΓΓΛΙΚΑ" || tId === "Β' ΞΕΝΗ ΓΛΩΣΣΑ" || tId === "ΠΛΗΡΟΦΟΡΙΚΗ";
  };

  const updateClassCell = (classId: string, day: number, hour: number, newTeacherId: string) => {
    if (!newTeacherId) {
      executeClassCellUpdate(classId, day, hour, newTeacherId, 'move');
      return;
    }
    if (!isVirtualTeacher(newTeacherId)) {
      const busyClasses = schedule[newTeacherId]?.[day]?.[hour] || [];
      const actualBusy = busyClasses.filter(c => c !== classId);
      if (actualBusy.length > 0) {
        setConflictPending({
          type: 'class', day, hour, teacherId: newTeacherId, classId, conflictClasses: actualBusy
        });
        return;
      }
    }
    executeClassCellUpdate(classId, day, hour, newTeacherId, 'move');
  };

  const executeClassCellUpdate = (classId: string, day: number, hour: number, newTeacherId: string, mode: 'move' | 'coteach' = 'move') => {
    const teacher = teachers.find(t => t.id === newTeacherId);
    const teacherName = teacher ? teacher.name : newTeacherId;
    const description = newTeacherId === ""
      ? `Διαγραφή ώρας - ${classId} (${DAYS[day]} ${hour + 1}η)`
      : newTeacherId === "BLOCK" ? `Αποκλεισμός ώρας - ${classId} (${DAYS[day]} ${hour + 1}η)` : `Ανάθεση ${teacherName} στο ${classId} (${DAYS[day]} ${hour + 1}η)`;
    
    setHistory(prev => {
      const newHistory = [{ id: Date.now().toString() + Math.random(), description, oldSchedule: JSON.parse(JSON.stringify(schedule)) }, ...prev];
      return newHistory.slice(0, 30);
    });

    setSchedule(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      
      const getPrefixLocal = (c: string) => c.match(/^[^\d]+/)?.[0] || c;
      
      // Remove any teacher currently assigned to this class at this day/hour
      Object.keys(newState).forEach(tId => {
         if (newState[tId]?.[day]?.[hour] && newState[tId][day][hour].includes(classId)) {
            const isCrossClassGroupRemove = tId === "ΑΓΓΛΙΚΑ" || tId === "Β' ΞΕΝΗ ΓΛΩΣΣΑ";
            
            if (isCrossClassGroupRemove) {
                const sisterClasses = classes.filter(c => getPrefixLocal(c) === getPrefixLocal(classId));
                newState[tId][day][hour] = newState[tId][day][hour].filter(c => !sisterClasses.includes(c));
            } else {
                newState[tId][day][hour] = newState[tId][day][hour].filter(c => c !== classId);
            }
            
            if (newState[tId][day][hour].length === 0) {
                delete newState[tId][day][hour];
            }
         }
      });

      // Assign to new teacher
      if (newTeacherId) {
         const teacher = teachers.find(t => t.id === newTeacherId);
         const isVirtual = isVirtualTeacher(newTeacherId);
         const isCrossClassGroup = newTeacherId === "ΑΓΓΛΙΚΑ" || newTeacherId === "Β' ΞΕΝΗ ΓΛΩΣΣΑ";
         
         const getPrefix = (c: string) => c.match(/^[^\d]+/)?.[0] || c;
         const classesToAssign = (isCrossClassGroup && classId !== 'BLOCK')
            ? classes.filter(c => getPrefix(c) === getPrefix(classId))
            : [classId];

         if (!newState[newTeacherId]) newState[newTeacherId] = {};
         if (!newState[newTeacherId][day]) newState[newTeacherId][day] = {};
         
         if (isCrossClassGroup) {
             classesToAssign.forEach(sibClass => {
                 Object.keys(newState).forEach(tId => {
                     if (tId !== newTeacherId && newState[tId]?.[day]?.[hour]) {
                         newState[tId][day][hour] = newState[tId][day][hour].filter(c => c !== sibClass);
                         if (newState[tId][day][hour].length === 0) delete newState[tId][day][hour];
                     }
                 });
             });
         }
         
         if (mode === 'coteach' || isVirtual) {
             const existing = newState[newTeacherId][day][hour] || [];
             newState[newTeacherId][day][hour] = Array.from(new Set([...existing, ...classesToAssign]));
         } else {
             newState[newTeacherId][day][hour] = classesToAssign;
         }
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

  
  const renderOptionContent = (optVal: string, d: number, h: number) => {
    if (!optVal) return <span className="text-slate-400 italic">Κενό</span>;
    if (optVal === 'BLOCK') return <span className="text-red-500 font-semibold flex items-center gap-1.5"><Ban className="w-3.5 h-3.5"/> Αποκλεισμός (Χ)</span>;
    const label = getOptionLabel(optVal);
    
    if (['class-grid', 'class-horizontal'].includes(viewMode)) {
      if (!isVirtualTeacher(optVal)) {
        const busyClasses = schedule[optVal]?.[d]?.[h] || [];
        if (busyClasses.length > 0) {
          return (
            <div className="flex justify-between items-center text-slate-400">
              <span className="truncate pr-2">{label}</span>
              <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded truncate max-w-[80px]">στο {busyClasses.join(', ')}</span>
            </div>
          );
        }
      }
    }
    return <span>{label}</span>;
  };

  const getOptionLabel = (val: string) => {
    if (!val) return "Κενό";
    if (val === 'BLOCK') return "Αποκλεισμός Ώρας (Χ)";
    if (['teacher', 'teacher-grid'].includes(viewMode)) return val; // it's a classId
    const t = teachers.find(x => x.id === val);
    return t ? t.name : val;
  };

  const formatCellText = (val: string) => {
    if (!val) return "";
    if (val === 'BLOCK') return "Αποκλεισμός Ώρας (Χ)";
    
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
    ? ["", "BLOCK", ...[...classes].sort((a, b) => a.localeCompare(b, 'el'))] 
    : ["", ...displayTeachers.map(t => t.id)];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
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
      
      // Check if locked
      if (['teacher', 'teacher-grid'].includes(viewMode)) {
        const tId = displayTeachers[focusedCell.rowIdx].id;
        const currentClasses = schedule[tId]?.[dIdx]?.[hIdx] || [];
        if (currentClasses.some(c => isLocked(tId, dIdx, hIdx, c))) return;
      } else {
        const cId = classes[focusedCell.rowIdx];
        const val = classSchedule[cId]?.[dIdx]?.[hIdx];
        if (val && isLocked(val, dIdx, hIdx, cId)) return;
      }

      let _dummy;
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
        
        const msg = (data.teachers && data.classes)
          ? 'ΠΡΟΣΟΧΗ: Η φόρτωση θα αντικαταστήσει το τρέχον πρόγραμμα ΚΑΙ όλες τις ρυθμίσεις (Εκπαιδευτικοί, Τμήματα). Θέλετε να συνεχίσετε;'
          : 'ΠΡΟΣΟΧΗ: Η φόρτωση θα αντικαταστήσει το τρέχον πρόγραμμα. Θέλετε να συνεχίσετε;';
          
        if (!window.confirm(msg)) {
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // Apply new data (which will automatically overwrite local storage via useEffects)
        if (data.teachers && data.classes) {
          setTeachers(data.teachers);
          setClasses(data.classes);
          if (data.subjectRules) {
            setSubjectRules(data.subjectRules);
          } else {
            setSubjectRules(DEFAULT_SUBJECT_RULES);
          }
          if (data.classTutors) {
            setClassTutors(data.classTutors);
          } else {
            setClassTutors({});
          }
        }
        
        setSchedule(data.schedule);
        setHistory([]);
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
      setHistory([]);
      localStorage.removeItem('school_teachers');
      localStorage.removeItem('school_classes');
      localStorage.removeItem('school_schedule_auto_save');
      setShowSettingsModal(false);
    }
  };

  const doesClassMatchSearch = useCallback((cls: string, q: string) => {
    if (!q) return true;
    const normQ = normalizeGreek(q);
    if (normalizeGreek(cls).includes(normQ)) return true;

    const cSchedule = classSchedule[cls] || {};
    for (let d = 0; d < 5; d++) {
      for (let h = 0; h < 8; h++) {
        const val = cSchedule[d]?.[h];
        if (val) {
          const teacherObj = teachers.find(t => t.id === val);
          const teacherName = teacherObj ? teacherObj.name : val;
          if (normalizeGreek(val).includes(normQ) || normalizeGreek(teacherName).includes(normQ)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [classSchedule, teachers]);


  const renderClassCard = (cls: string) => {
    const rowIdx = classes.indexOf(cls);
    const cSchedule = classSchedule[cls] || {};
    const clsColor = getClassColor(cls);
    
    let filledHours = 0;
    for (let d = 0; d < 5; d++) {
      for (let h = 0; h < 8; h++) {
        if (cSchedule[d] && cSchedule[d][h] && cSchedule[d][h] !== 'BLOCK') {
          filledHours++;
        }
      }
    }
    const isComplete = filledHours === 40;

    return (
      <div key={cls} className="bg-white border border-slate-200 rounded-lg shadow-sm w-max relative">
        <div className={`px-3 py-2 flex items-center justify-between border-b border-slate-200 rounded-t-lg ${clsColor} gap-4`}>
          <div className="flex items-center gap-2">
             <span className="font-bold text-slate-800 text-sm">Τμήμα {cls}</span>
             <select 
                value={classTutors[cls] || ""} 
                onChange={(e) => setClassTutors(prev => ({...prev, [cls]: e.target.value}))}
                className="text-[11px] bg-white/60 border border-black/10 rounded-md px-1.5 py-0.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-black/20 hover:bg-white/80 cursor-pointer w-[120px] truncate shadow-sm transition-colors"
                title="Ορισμός Υπευθύνου Τμήματος"
             >
                <option value="">👤 Ορισμός Υπευθύνου</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
             </select>
          </div>
          <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 ${isComplete ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : (filledHours === 0 ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-100 text-blue-700 border-blue-200')}`} title={`Συμπληρωμένες Ώρες: ${filledHours} από 40`}>
             {isComplete && <span>✨</span>} {filledHours}/40
          </div>
        </div>
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-12 h-8 border-b border-r border-slate-200 bg-slate-50 text-slate-500 font-normal">Ώρα</th>
              {DAYS.map(d => (
                <th key={d} className="w-24 h-8 border-b border-r last:border-r-0 border-slate-200 bg-slate-50 text-slate-700 p-1 font-semibold">
                  {d.substring(0,3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, hIdx) => (
              <tr key={hIdx}>
                <td className="border-r border-b border-slate-200 bg-slate-50 text-center text-xs text-slate-500 font-medium h-10">
                  {hIdx + 1}η
                </td>
                {[...Array(5)].map((_, dIdx) => {
                  const cIdx = hIdx * 5 + dIdx;
                  const val = cSchedule[dIdx]?.[hIdx] || "";
                  const teacherObj = teachers.find(t => t.id === val);
                  const teacherName = formatCellText(val);
                  const isBlocked = val === 'BLOCK';
                  const isTutor = classTutors[cls] === val && val !== '';
                  const teacherColorClass = isBlocked ? "bg-slate-200 text-slate-400" : (val ? (isTutor ? "bg-yellow-300 text-yellow-950 font-bold border-l-4 border-yellow-500 shadow-inner" : getTeacherColor(val)) : "");
                  const isFocused = focusedCell?.rowIdx === rowIdx && focusedCell?.cIdx === cIdx;
                  const isSearchMatch = searchQuery && val && (normalizeGreek(val).includes(normalizeGreek(searchQuery)) || (teacherObj && normalizeGreek(teacherObj.name).includes(normalizeGreek(searchQuery))));
                  
                  return (
                    <td key={dIdx} className="p-0 relative h-10 border-b border-r last:border-r-0 border-slate-200 bg-white">
                      <div
                        id={`cell-${rowIdx}-${cIdx}`}
                        tabIndex={-1}
                        draggable={!!val && val !== 'BLOCK' && !isLocked(val, dIdx, hIdx, cls)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'teacher', val, source: { id: cls, day: dIdx, hour: hIdx, val } }));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          if (val === 'BLOCK' || (val && isLocked(val, dIdx, hIdx, cls))) return;
                          e.preventDefault();
                          try {
                            const data = JSON.parse(e.dataTransfer.getData('application/json'));
                            if (data.type === 'teacher' && data.val) {
                              if (val && val !== data.val && data.source) {
                                setDragConflict({ type: 'teacher', source: data.source, target: { id: cls, day: dIdx, hour: hIdx, val } });
                              } else {
                                updateClassCell(cls, dIdx, hIdx, data.val);
                              }
                            }
                          } catch (err) {}
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (e.ctrlKey || e.metaKey) {
                            toggleCellSelection(rowIdx, cIdx, val || "", dIdx, hIdx, cls);
                            return;
                          }
                          setSelectedCells([]);
                          handleCellClick(rowIdx, cIdx, val);
                        }}
                        className={`w-full h-full px-1 flex items-center justify-center text-xs text-center cursor-pointer outline-none select-none transition-colors
                          ${selectedCells.some(sc => sc.r === rowIdx && sc.c === cIdx) ? '!ring-2 !ring-inset !ring-blue-600 !bg-blue-200 !text-blue-900 font-bold z-20' : ''}
                          ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10 bg-blue-50' : ''}
                          ${isSearchMatch && !isFocused ? 'ring-2 ring-inset ring-amber-400 bg-amber-100 z-10 font-bold text-amber-900' : (!isFocused && val ? `${teacherColorClass} font-medium` : 'text-slate-500 hover:bg-slate-50')}`}
                      >
                        <span className="line-clamp-2 leading-tight">
                          {isBlocked ? <X className="w-5 h-5 opacity-50 mx-auto"/> : teacherName}
                        </span>
                        {val && isLocked(val, dIdx, hIdx, cls) && <Lock className="w-2.5 h-2.5 absolute bottom-0.5 right-0.5 text-slate-700/60" />}
                      </div>
                      
                      {isFocused && isEditing && (
                        <div 
                           ref={editContainerRef}
                          className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 flex flex-col"
                        >
                          <div className="flex-1 overflow-y-auto">
                            {val && isLocked(val, dIdx, hIdx, cls) ? (
                              <div className="p-3 text-center text-slate-500 text-xs italic">
                                Η ανάθεση είναι κλειδωμένη
                              </div>
                            ) : (
                              sortedOptions.map((optVal, idx) => (
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
                                  {renderOptionContent(optVal, dIdx, hIdx)}
                                </div>
                              ))
                            )}
                          </div>
                          {val && (
                            <div className="border-t border-slate-200">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleLock(val, dIdx, hIdx, cls); setIsEditing(false); document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus(); }}
                                className="w-full px-3 py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-50 transition-colors text-slate-700"
                              >
                                {isLocked(val, dIdx, hIdx, cls) ? <><Unlock className="w-4 h-4"/> Ξεκλείδωμα Ώρας</> : <><Lock className="w-4 h-4"/> Κλείδωμα Ώρας</>}
                              </button>
                            </div>
                          )}
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
      <header className="shrink-0 bg-white shadow-sm border-b border-slate-200 px-4 py-2 z-40 flex items-center justify-between gap-4">
        {/* Left Section: App Icon + Views */}
        <div className="flex items-center gap-2">
          {/* App Info Button */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors shrink-0"
            title="Πληροφορίες Προγράμματος"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          {/* View Modes */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => { setViewMode('teacher'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'teacher' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
              title="Εκπαιδευτικοί (Γραμμικά)"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('teacher-grid'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'teacher-grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
              title="Εκπαιδευτικοί (Πλέγμα)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('class-horizontal'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'class-horizontal' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
              title="Τμήματα (Γραμμικά)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('class-grid'); setFocusedCell(null); setIsEditing(false); setSearchQuery(''); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'class-grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
              title="Τμήματα (Πλέγμα)"
            >
              <LayoutTemplate className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={['teacher', 'teacher-grid'].includes(viewMode) ? 'Αναζήτηση Εκπαιδευτικού...' : 'Αναζήτηση τμήματος, εκπαιδευτικού...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setFocusedCell(null)}
              className="pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-full transition-all placeholder:text-slate-400"
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
        </div>

        {/* Right Section: Tools */}
        <div className="flex items-center gap-2">
          {/* Multi-Select Action Bar */}
          {selectedCells.length > 0 && (
            <div className="flex items-center bg-blue-50 rounded-lg border border-blue-200 p-1 relative shadow-sm">
              <span className="text-xs text-blue-800 font-semibold px-2">{selectedCells.length} επιλεγμένα</span>
              <div className="w-px h-4 bg-blue-200 mx-1"></div>
              {['teacher', 'teacher-grid'].includes(viewMode) && (
                <>
                  <button onClick={blockSelected} className="p-1.5 text-red-600 hover:bg-white rounded-md transition-colors" title="Αποκλεισμός επιλεγμένων (Χ)"><Ban className="w-4 h-4"/></button>
                  <div className="w-px h-4 bg-blue-200 mx-1"></div>
                </>
              )}
              <button onClick={lockSelected} className="p-1.5 text-blue-700 hover:bg-white rounded-md transition-colors" title="Κλείδωμα επιλεγμένων"><Lock className="w-4 h-4"/></button>
              <button onClick={unlockSelected} className="p-1.5 text-blue-700 hover:bg-white rounded-md transition-colors" title="Ξεκλείδωμα επιλεγμένων"><Unlock className="w-4 h-4"/></button>
              <div className="w-px h-4 bg-blue-200 mx-1"></div>
              <button onClick={() => setSelectedCells([])} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white"><X className="w-4 h-4"/></button>
            </div>
          )}

          {/* Undo Action Bar */}
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-1 relative">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${history.length > 0 ? 'text-slate-700 hover:bg-white hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
              title="Αναίρεση (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              disabled={history.length === 0}
              className={`flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-md transition-colors min-w-[12rem] max-w-[16rem] ${history.length > 0 ? 'text-slate-600 hover:bg-white hover:shadow-sm cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}
            >
              <span className="truncate flex-1 text-left">
                {history.length > 0 ? history[0].description : 'Καμία ενέργεια'}
              </span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>

            {showHistoryDropdown && history.length > 0 && (
              <div 
                className="absolute top-full right-0 mt-1 w-64 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden z-50"
                onMouseLeave={() => setShowHistoryDropdown(false)}
              >
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 font-semibold text-xs text-slate-500 uppercase tracking-wider">
                  Ιστορικό Ενεργειών (Τελευταίες {history.length})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {history.slice(0, 10).map((action, idx) => (
                    <button 
                      key={action.id} 
                      onClick={() => {
                        const targetAction = history[idx];
                        setSchedule(targetAction.oldSchedule);
                        setHistory(prev => prev.slice(idx + 1));
                        setShowHistoryDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs border-b border-slate-50 last:border-0 hover:bg-slate-50 text-slate-600 focus:outline-none focus:bg-slate-100 transition-colors"
                      title="Επαναφορά σε αυτό το σημείο"
                    >
                      <span className="opacity-50 mr-2">{idx + 1}.</span> {action.description}
                    </button>
                  ))}
                  {history.length > 10 && (
                    <div className="px-3 py-2 text-xs text-center text-slate-400 bg-slate-50 italic">
                      ...και άλλες {history.length - 10}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md transition-colors shadow-sm shrink-0"
            title="Ρυθμίσεις Σχολείου"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => window.print()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm shrink-0"
            title="Εκτύπωση"
          >
            <Printer className="w-4 h-4" />
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
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors shrink-0"
            title="Εισαγωγή CSV"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => exportToCSV(schedule, teachers, classes, subjectRules, classTutors)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm shrink-0"
            title="Εξαγωγή CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 relative flex flex-col overflow-hidden">
        <div className={`p-6 w-full flex-1 flex flex-col min-w-0 ${['class-grid', 'teacher-grid'].includes(viewMode) ? 'overflow-auto' : 'overflow-hidden'}`}>
          {['class-grid', 'teacher-grid'].includes(viewMode) ? (
            <div className={viewMode === 'class-grid' ? "flex gap-5 items-start w-max pb-8" : "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 pb-8 items-start"}>
            {viewMode === 'class-grid' ? ( Object.entries(classesByGrade).map(([grade, gradeClasses]) => {
              const filteredClasses = gradeClasses.filter(cls => doesClassMatchSearch(cls, searchQuery));
              if (filteredClasses.length === 0) return null;
              
              return (
              <div key={grade} className="flex flex-col gap-4 shrink-0">
                {filteredClasses.map(cls => {
                  return renderClassCard(cls);
                })}
              </div>
            );
          })) : (
            displayTeachers.filter(t => normalizeGreek(t.name).includes(normalizeGreek(searchQuery))).map((teacher) => {
              const rowIdx = displayTeachers.findIndex(t => t.id === teacher.id);
              const tSchedule = schedule[teacher.id] || {};
              let currentHours = 0;
              for (let d = 0; d < 5; d++) {
                if (tSchedule[d]) {
                  currentHours += Object.values(tSchedule[d]).filter(classes => classes.length > 0 && !classes.includes('BLOCK')).length;
                }
              }
              const isOverHours = teacher.maxHours > 0 && currentHours > teacher.maxHours;
              const hoursDisplay = teacher.maxHours === 0 ? currentHours : `${currentHours}/${teacher.maxHours}`;
              return (
                <div key={teacher.id} className="bg-white border border-slate-200 rounded-lg shadow-sm w-max relative shrink-0">
                  <div className="px-4 py-1.5 font-bold text-center border-b border-slate-200 rounded-t-lg bg-slate-100 text-slate-700 flex justify-between items-center gap-4">
                    <span className="truncate max-w-[12rem]">{teacher.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${isOverHours ? 'bg-red-100 text-red-700' : 'bg-white border border-slate-200'}`}>{hoursDisplay}</span>
                  </div>
                  <table className="border-collapse text-sm">
                    <thead><tr><th className="w-12 h-8 border-b border-r border-slate-200 bg-slate-50 text-slate-500 font-normal">Ώρα</th>
                    {DAYS.map(d => <th key={d} className="w-24 h-8 border-b border-r last:border-r-0 border-slate-200 bg-slate-50 text-slate-700 p-1 font-semibold">{d.substring(0,3)}</th>)}
                    </tr></thead>
                    <tbody>
                      {[...Array(8)].map((_, hIdx) => (
                        <tr key={hIdx}>
                          <td className="border-r border-b border-slate-200 bg-slate-50 text-center text-xs text-slate-500 font-medium h-10">{hIdx + 1}η</td>
                          {[...Array(5)].map((_, dIdx) => {
                            const cIdx = hIdx * 5 + dIdx;
                            const cellClasses = tSchedule[dIdx]?.[hIdx] || [];
                            const val = cellClasses[0] || "";
                            const isBlocked = val === 'BLOCK';
                            const clsColor = isBlocked ? "bg-slate-200 text-slate-400" : (val ? getClassColor(val) : "");
                            const isFocused = focusedCell?.rowIdx === rowIdx && focusedCell?.cIdx === cIdx;
                            return (
                              <td key={dIdx} className="p-0 relative h-10 border-b border-r last:border-r-0 border-slate-200 bg-white">
                                <div
                                  id={`cell-${rowIdx}-${cIdx}`}
                                  tabIndex={-1}
                                  draggable={!!val && val !== 'BLOCK' && !isLocked(teacher.id, dIdx, hIdx, val)}
                                  onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'class', val, source: { id: teacher.id, day: dIdx, hour: hIdx, val } }))}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    if (val === 'BLOCK' || (val && isLocked(teacher.id, dIdx, hIdx, val))) return;
                                    e.preventDefault();
                                    try { 
                                      const data = JSON.parse(e.dataTransfer.getData('application/json')); 
                                      if (data.type === 'class' && data.val) {
                                        if (val && val !== data.val && data.source) {
                                          setDragConflict({ type: 'class', source: data.source, target: { id: teacher.id, day: dIdx, hour: hIdx, val } });
                                        } else {
                                          updateCell(teacher.id, dIdx, hIdx, data.val); 
                                        }
                                      }
                                    } catch (err) {}
                                  }}
                                  onClick={(e) => { 
                                      e.stopPropagation();
                                      if (e.ctrlKey || e.metaKey) {
                                        toggleCellSelection(rowIdx, cIdx, teacher.id, dIdx, hIdx, val || "");
                                        return;
                                      }
                                      setSelectedCells([]);
                                      handleCellClick(rowIdx, cIdx, val); 
                                  }}
                                  className={`w-full h-full px-1 flex items-center justify-center text-xs text-center cursor-pointer outline-none select-none transition-colors
                                    ${selectedCells.some(sc => sc.r === rowIdx && sc.c === cIdx) ? '!ring-2 !ring-inset !ring-blue-600 !bg-blue-200 !text-blue-900 font-bold z-20' : ''}
                                    ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10 bg-blue-50' : ''}
                                    ${!isFocused && val ? `${clsColor} font-bold` : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                  <span className="line-clamp-2 leading-tight">{isBlocked ? <X className="w-5 h-5 opacity-50 mx-auto"/> : val}</span>
                                  {val && isLocked(teacher.id, dIdx, hIdx, val) && <Lock className="w-2.5 h-2.5 absolute bottom-0.5 right-0.5 text-slate-700/60" />}
                                </div>
                                {isFocused && isEditing && (
                                  <div ref={editContainerRef} className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 flex flex-col">
                                    <div className="flex-1 overflow-y-auto">
                                      {val && isLocked(teacher.id, dIdx, hIdx, val) ? (
                                        <div className="p-3 text-center text-slate-500 text-xs italic">Η ανάθεση είναι κλειδωμένη</div>
                                      ) : (
                                        sortedOptions.map((optVal, idx) => (
                                          <div key={idx} id={`edit-opt-${idx}`} className={`px-3 py-2 text-sm cursor-pointer border-b border-slate-100 last:border-0 ${editIndex === idx ? 'bg-blue-600 text-white font-medium sticky top-0 bottom-0' : 'hover:bg-slate-50 text-slate-700'}`}
                                            onClick={(e) => {
                                              e.stopPropagation(); updateCell(teacher.id, dIdx, hIdx, optVal); setIsEditing(false); document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus();
                                            }}
                                          >
                                            {renderOptionContent(optVal, dIdx, hIdx)}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                    {val && (
                                      <div className="border-t border-slate-200">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); toggleLock(teacher.id, dIdx, hIdx, val); setIsEditing(false); document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus(); }}
                                          className="w-full px-3 py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-50 transition-colors text-slate-700"
                                        >
                                          {isLocked(teacher.id, dIdx, hIdx, val) ? <><Unlock className="w-4 h-4"/> Ξεκλείδωμα Ώρας</> : <><Lock className="w-4 h-4"/> Κλείδωμα Ώρας</>}
                                        </button>
                                      </div>
                                    )}
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
                        currentHours += Object.values(tSchedule[d]).filter(classes => classes.length > 0 && !classes.includes('BLOCK')).length;
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
                              const isBlocked = firstClass === 'BLOCK';
                              const cellColorClass = isBlocked ? 'bg-slate-200 text-slate-400' : (firstClass ? getClassColor(firstClass) : 'hover:bg-slate-100 text-slate-600');
                              
                              return (
                                <td key={hIdx} className={`p-0 relative h-10 min-w-[60px] bg-white border-b border-b-slate-200 ${isLastHour ? 'border-r-2 border-r-slate-400' : 'border-r border-r-slate-200'}`}>
                                  <div
                                    id={`cell-${rowIdx}-${cIdx}`}
                                    tabIndex={-1}
                                    draggable={!!firstClass && firstClass !== 'BLOCK' && !isLocked(teacher.id, dIdx, hIdx, firstClass)}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'class', val: firstClass, source: { id: teacher.id, day: dIdx, hour: hIdx, val: firstClass } }));
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      if (firstClass === 'BLOCK' || (firstClass && isLocked(teacher.id, dIdx, hIdx, firstClass))) return;
                                      e.preventDefault();
                                      try {
                                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                        if (data.type === 'class' && data.val) {
                                          if (firstClass && firstClass !== data.val && data.source) {
                                            setDragConflict({ type: 'class', source: data.source, target: { id: teacher.id, day: dIdx, hour: hIdx, val: firstClass } });
                                          } else {
                                            updateCell(teacher.id, dIdx, hIdx, data.val);
                                          }
                                        }
                                      } catch (err) {}
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (e.ctrlKey || e.metaKey) {
                                        toggleCellSelection(rowIdx, cIdx, teacher.id, dIdx, hIdx, firstClass || "");
                                        return;
                                      }
                                      setSelectedCells([]);
                                      handleCellClick(rowIdx, cIdx, firstClass);
                                    }}
                                    className={`w-full h-full flex items-center justify-center text-sm cursor-pointer outline-none select-none transition-colors
                                      ${selectedCells.some(sc => sc.r === rowIdx && sc.c === cIdx) ? '!ring-2 !ring-inset !ring-blue-600 !bg-blue-200 !text-blue-900 font-bold z-20' : ''}
                                      ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}
                                      ${cellColorClass}`}
                                  >
                                    <span className="font-medium text-xs line-clamp-2 leading-tight text-center px-0.5">{isBlocked ? <X className="w-4 h-4 mx-auto opacity-50"/> : firstClass}</span>
                                  </div>
                                  
                                  {isFocused && isEditing && (
                                    <div 
                                      ref={editContainerRef}
                                      className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 flex flex-col"
                                    >
                                      <div className="flex-1 overflow-y-auto">
                                        {firstClass && isLocked(teacher.id, dIdx, hIdx, firstClass) ? (
                                          <div className="p-3 text-center text-slate-500 text-xs italic">Η ανάθεση είναι κλειδωμένη</div>
                                        ) : (
                                          sortedOptions.map((c, idx) => (
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
                                              {renderOptionContent(c, dIdx, hIdx)}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                      {firstClass && (
                                        <div className="border-t border-slate-200">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); toggleLock(teacher.id, dIdx, hIdx, firstClass); setIsEditing(false); document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus(); }}
                                            className="w-full px-3 py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-50 transition-colors text-slate-700"
                                          >
                                            {isLocked(teacher.id, dIdx, hIdx, firstClass) ? <><Unlock className="w-4 h-4"/> Ξεκλείδωμα Ώρας</> : <><Lock className="w-4 h-4"/> Κλείδωμα Ώρας</>}
                                          </button>
                                        </div>
                                      )}
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
                  classes.filter(cls => doesClassMatchSearch(cls, searchQuery)).map((cls) => {
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
                              const isBlocked = val === 'BLOCK';
                              const isTutor = classTutors[cls] === val && val !== '';
                              const teacherColorClass = isBlocked ? "bg-slate-200 text-slate-400" : (val ? (isTutor ? "bg-yellow-300 text-yellow-950 font-bold border-l-4 border-yellow-500 shadow-inner" : getTeacherColor(val)) : "");
                              const isFocused = focusedCell?.rowIdx === rowIdx && focusedCell?.cIdx === cIdx;
                              const isLastHour = hIdx === 7;
                              const isSearchMatch = searchQuery && val && (normalizeGreek(val).includes(normalizeGreek(searchQuery)) || (teacherObj && normalizeGreek(teacherObj.name).includes(normalizeGreek(searchQuery))));
                              
                              return (
                                <td key={hIdx} className={`p-0 relative h-10 min-w-[80px] bg-white border-b border-b-slate-200 ${isLastHour ? 'border-r-2 border-r-slate-400' : 'border-r border-r-slate-200'}`}>
                                  <div
                                    id={`cell-${rowIdx}-${cIdx}`}
                                    tabIndex={-1}
                                    draggable={!!val && val !== 'BLOCK' && !isLocked(val, dIdx, hIdx, cls)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'teacher', val, source: { id: cls, day: dIdx, hour: hIdx, val } }));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          if (val === 'BLOCK' || (val && isLocked(val, dIdx, hIdx, cls))) return;
                                      e.preventDefault();
                                      try {
                                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                        if (data.type === 'teacher' && data.val) {
                                          if (val && val !== data.val && data.source) {
                                            setDragConflict({ type: 'teacher', source: data.source, target: { id: cls, day: dIdx, hour: hIdx, val } });
                                          } else {
                                            updateClassCell(cls, dIdx, hIdx, data.val);
                                          }
                                        }
                                      } catch (err) {}
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (e.ctrlKey || e.metaKey) {
                                        toggleCellSelection(rowIdx, cIdx, val || "", dIdx, hIdx, cls);
                                        return;
                                      }
                                      setSelectedCells([]);
                                      handleCellClick(rowIdx, cIdx, val);
                                    }}
                                    className={`w-full h-full px-1 flex items-center justify-center text-xs text-center cursor-pointer outline-none select-none transition-colors
                                      ${selectedCells.some(sc => sc.r === rowIdx && sc.c === cIdx) ? '!ring-2 !ring-inset !ring-blue-600 !bg-blue-200 !text-blue-900 font-bold z-20' : ''}
                                      ${isFocused && !isEditing ? 'ring-2 ring-inset ring-blue-500 z-10 bg-blue-50' : ''}
                                      ${isSearchMatch && !isFocused ? 'ring-2 ring-inset ring-amber-400 bg-amber-100 z-10 font-bold text-amber-900' : (!isFocused && val ? `${teacherColorClass} font-medium` : 'text-slate-500 hover:bg-slate-50')}`}
                                  >
                                    <span className="line-clamp-2 leading-tight">
                                      {isBlocked ? <X className="w-5 h-5 opacity-50 mx-auto"/> : teacherName}
                                    </span>
                        {val && isLocked(val, dIdx, hIdx, cls) && <Lock className="w-2.5 h-2.5 absolute bottom-0.5 right-0.5 text-slate-700/60" />}
                      </div>
                                  
                                  {isFocused && isEditing && (
                                    <div 
                                      ref={editContainerRef}
                                      className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md z-50 w-48 max-h-64 flex flex-col"
                                    >
                                      <div className="flex-1 overflow-y-auto">
                                        {val && isLocked(val, dIdx, hIdx, cls) ? (
                                          <div className="p-3 text-center text-slate-500 text-xs italic">Η ανάθεση είναι κλειδωμένη</div>
                                        ) : (
                                          sortedOptions.map((optVal, idx) => (
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
                                              {renderOptionContent(optVal, dIdx, hIdx)}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                      {val && (
                                        <div className="border-t border-slate-200">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); toggleLock(val, dIdx, hIdx, cls); setIsEditing(false); document.getElementById(`cell-${rowIdx}-${cIdx}`)?.focus(); }}
                                            className="w-full px-3 py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-50 transition-colors text-slate-700"
                                          >
                                            {isLocked(val, dIdx, hIdx, cls) ? <><Unlock className="w-4 h-4"/> Ξεκλείδωμα Ώρας</> : <><Lock className="w-4 h-4"/> Κλείδωμα Ώρας</>}
                                          </button>
                                        </div>
                                      )}
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

      
      {/* Conflict Modal */}
      {conflictPending && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-amber-500">⚠️</span> Πιθανή Επικάλυψη
            </h3>
            <p className="text-slate-600 mb-6 text-sm">
              Ο/Η εκπαιδευτικός <strong>{teachers.find(t => t.id === conflictPending.teacherId)?.name || conflictPending.teacherId}</strong> διδάσκει ήδη στο/στα τμήμα/τα <strong>{conflictPending.conflictClasses?.join(', ')}</strong> την {conflictPending.hour + 1}η ώρα της {DAYS[conflictPending.day]}. Τι θέλετε να κάνετε;
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (conflictPending.type === 'class') {
                    executeClassCellUpdate(conflictPending.classId, conflictPending.day, conflictPending.hour, conflictPending.teacherId, 'move');
                  } else {
                    executeCellUpdate(conflictPending.teacherId, conflictPending.day, conflictPending.hour, conflictPending.classId, 'move');
                  }
                  setConflictPending(null);
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <div className="font-semibold text-blue-700 group-hover:text-blue-800">Μετακίνηση (Προεπιλογή)</div>
                <div className="text-xs text-blue-600/80 mt-1">Αφαίρεση από το παλιό τμήμα και προσθήκη στο νέο.</div>
              </button>
              
              <button
                onClick={() => {
                  if (conflictPending.type === 'class') {
                    executeClassCellUpdate(conflictPending.classId, conflictPending.day, conflictPending.hour, conflictPending.teacherId, 'coteach');
                  } else {
                    executeCellUpdate(conflictPending.teacherId, conflictPending.day, conflictPending.hour, conflictPending.classId, 'coteach');
                  }
                  setConflictPending(null);
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-colors group"
              >
                <div className="font-semibold text-purple-700 group-hover:text-purple-800">Συνδιδασκαλία / Συνένωση</div>
                <div className="text-xs text-purple-600/80 mt-1">Διατήρηση ΚΑΙ στο παλιό ΚΑΙ στο νέο τμήμα ταυτόχρονα.</div>
              </button>

              <button
                onClick={() => setConflictPending(null)}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-center"
              >
                Ακύρωση
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Drop Conflict Modal */}
      {dragConflict && (() => {
        const dragSourceText = dragConflict.type === 'teacher' 
          ? (teachers.find(t => t.id === dragConflict.source.val)?.name || dragConflict.source.val)
          : dragConflict.source.val;
        const dragTargetText = dragConflict.type === 'teacher'
          ? (teachers.find(t => t.id === dragConflict.target.val)?.name || dragConflict.target.val)
          : dragConflict.target.val;
        return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-blue-500">ℹ️</span> Κατειλημμένο Κελί
            </h3>
            <p className="text-slate-600 mb-6 text-sm">
              Το κελί προορισμού δεν είναι άδειο (περιέχει: <strong>{dragTargetText}</strong>). Τι θέλετε να κάνετε με τη νέα ανάθεση (<strong>{dragSourceText}</strong>);
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (dragConflict.type === 'class') {
                    updateCell(dragConflict.target.id, dragConflict.target.day, dragConflict.target.hour, dragConflict.source.val);
                  } else {
                    updateClassCell(dragConflict.target.id, dragConflict.target.day, dragConflict.target.hour, dragConflict.source.val);
                  }
                  setDragConflict(null);
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-red-200 hover:border-red-500 hover:bg-red-50 transition-colors group"
              >
                <div className="font-semibold text-red-700 group-hover:text-red-800">Επικάλυψη / Αντικατάσταση</div>
                <div className="text-xs text-red-600/80 mt-1">Η παλιά εγγραφή θα διαγραφεί και θα μπει η νέα.</div>
              </button>
              
              <button
                onClick={() => {
                  if (dragConflict.type === 'class') {
                    // Update target first
                    updateCell(dragConflict.target.id, dragConflict.target.day, dragConflict.target.hour, dragConflict.source.val);
                    // Update source
                    updateCell(dragConflict.source.id, dragConflict.source.day, dragConflict.source.hour, dragConflict.target.val);
                  } else {
                    updateClassCell(dragConflict.target.id, dragConflict.target.day, dragConflict.target.hour, dragConflict.source.val);
                    updateClassCell(dragConflict.source.id, dragConflict.source.day, dragConflict.source.hour, dragConflict.target.val);
                  }
                  setDragConflict(null);
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
              >
                <div className="font-semibold text-emerald-700 group-hover:text-emerald-800">Αμοιβαία Αλλαγή (Αντιμετάθεση)</div>
                <div className="text-xs text-emerald-600/80 mt-1">Οι δύο αναθέσεις θα αλλάξουν θέσεις μεταξύ τους.</div>
              </button>

              <button
                onClick={() => setDragConflict(null)}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-center"
              >
                Ακύρωση
              </button>
            </div>
          </div>
        </div>
        );
      })()}

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
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">Πρόγραμμα Σχολικής Μονάδας</h3>
                <p className="text-sm text-slate-500 mt-1">Διαμόρφωση εβδομαδιαίου προγράμματος</p>
              </div>
              <div className="w-full h-px bg-slate-100 my-2"></div>
              <div>
                <p className="text-xs text-slate-400 font-medium tracking-wider mb-1">PROGRAM ARCHITECT</p>
                <p className="text-lg font-bold text-slate-800">George Petrakis</p>
              </div>
              <div className="w-full h-px bg-slate-100 my-2"></div>
              <div>
                <p className="text-xs text-slate-400 font-medium tracking-wider mb-1">ΕΚΔΟΣΗ</p>
                {/* Version Number - Update this manually when deploying new versions */}
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-sm">v.1.8.20260905</span>
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
        onSave={() => setHistory([])}
      />
    </div>
  );
}
