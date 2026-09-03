import { ScheduleData, Teacher, SubjectRule } from '../types';

export function exportToCSV(schedule: ScheduleData, teachers: Teacher[], classes: string[], subjectRules: SubjectRule[]) {
    const header = ['Εκπαιδευτικός', 'Max Ώρες'];
    const DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
    for (let d = 0; d < 5; d++) {
        for (let h = 0; h < 8; h++) {
            header.push(`${DAYS[d]} ${h + 1}η`);
        }
    }
    const rows = [header.join(',')];

    const ALLOWED_SPECIAL_SUBJECTS = ["ΑΓΓΛΙΚΑ", "Β' ΞΕΝΗ ΓΛΩΣΣΑ", "ΠΛΗΡΟΦΟΡΙΚΗ"];
    const specialSubjects = subjectRules.filter(sr => ALLOWED_SPECIAL_SUBJECTS.includes(sr.name));
    const allRowEntities = [
        ...teachers,
        ...specialSubjects.map(sr => ({ id: sr.name, name: sr.name, maxHours: 0, subject: sr.name }))
    ];

    allRowEntities.forEach(t => {
        const row = [`"${t.name}"`, t.maxHours.toString()];
        for (let d = 0; d < 5; d++) {
            for (let h = 0; h < 8; h++) {
                const val = schedule[t.id]?.[d]?.[h] || [];
                row.push(`"${val.join(', ')}"`);
            }
        }
        rows.push(row.join(','));
    });

    // Append SYSTEM DATA for settings
    rows.push('');
    rows.push('---SYSTEM_DATA---');
    teachers.forEach(t => {
        rows.push(`TEACHER,"${t.id}","${t.name}",${t.maxHours},"${t.subject || ''}"`);
    });
    classes.forEach(c => {
        rows.push(`CLASS,"${c}"`);
    });
    subjectRules.forEach(r => {
        rows.push(`SUBJECT_RULE,"${r.id}","${r.name}",${r.maxHours.join(',')}`);
    });

    // Add BOM for Excel/Calc greek characters support
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_schedule_project_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function parseCSVRow(str: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '"') {
            inQuotes = !inQuotes;
        } else if (str[i] === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += str[i];
        }
    }
    result.push(cur.trim());
    return result.map(s => s.replace(/^"|"$/g, '').trim());
}

export function importFromCSV(file: File, currentTeachers: Teacher[]): Promise<{ schedule: ScheduleData, teachers?: Teacher[], classes?: string[], subjectRules?: SubjectRule[] }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(l => l.trim());
                
                let loadedTeachers: Teacher[] = [];
                let loadedClasses: string[] = [];
                let loadedSubjectRules: SubjectRule[] = [];
                let hasSystemData = false;

                // Pass 1: Find system data
                const systemDataIdx = lines.findIndex(l => l.trim() === '---SYSTEM_DATA---');
                if (systemDataIdx !== -1) {
                    hasSystemData = true;
                    for (let i = systemDataIdx + 1; i < lines.length; i++) {
                        const cols = parseCSVRow(lines[i]);
                        if (cols[0] === 'TEACHER' && cols.length >= 4) {
                            loadedTeachers.push({ 
                                id: cols[1], 
                                name: cols[2], 
                                maxHours: parseInt(cols[3], 10) || 0,
                                subject: cols[4] || undefined
                            });
                        } else if (cols[0] === 'CLASS' && cols.length >= 2) {
                            loadedClasses.push(cols[1]);
                        } else if (cols[0] === 'SUBJECT_RULE' && cols.length >= 9) {
                            loadedSubjectRules.push({
                                id: cols[1],
                                name: cols[2],
                                maxHours: cols.slice(3, 9).map(n => parseInt(n, 10) || 0)
                            });
                        }
                    }
                }

                const effectiveTeachers = hasSystemData ? loadedTeachers : currentTeachers;
                const newSchedule: ScheduleData = {};

                // Pass 2: Parse schedule
                const endIdx = hasSystemData ? systemDataIdx : lines.length;
                const ALLOWED_SPECIAL_SUBJECTS = ["ΑΓΓΛΙΚΑ", "Β' ΞΕΝΗ ΓΛΩΣΣΑ", "ΠΛΗΡΟΦΟΡΙΚΗ"];
                for (let i = 1; i < endIdx; i++) {
                    const cols = parseCSVRow(lines[i]);
                    const tName = cols[0];
                    if (!tName) continue;
                    
                    const teacher = effectiveTeachers.find(t => t.name === tName);
                    let rowId = teacher ? teacher.id : null;
                    if (!rowId && ALLOWED_SPECIAL_SUBJECTS.includes(tName)) {
                        rowId = tName; // The ID of a special subject in the schedule is its name
                    }
                    if (!rowId) continue;

                    newSchedule[rowId] = {};
                    let colIdx = 2;
                    for (let d = 0; d < 5; d++) {
                        newSchedule[rowId][d] = {};
                        for (let h = 0; h < 8; h++) {
                            const val = cols[colIdx++];
                            if (val) {
                                newSchedule[rowId][d][h] = val.split(',').map(s => s.trim()).filter(Boolean);
                            }
                        }
                    }
                }

                resolve({
                    schedule: newSchedule,
                    teachers: hasSystemData ? loadedTeachers : undefined,
                    classes: hasSystemData ? loadedClasses : undefined,
                    subjectRules: hasSystemData && loadedSubjectRules.length > 0 ? loadedSubjectRules : undefined
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
