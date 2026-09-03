import { ScheduleData, Teacher } from '../types';

export function exportToCSV(schedule: ScheduleData, teachers: Teacher[], classes: string[]) {
    const header = ['Εκπαιδευτικός', 'Max Ώρες'];
    const DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
    for (let d = 0; d < 5; d++) {
        for (let h = 0; h < 8; h++) {
            header.push(`${DAYS[d]} ${h + 1}η`);
        }
    }

    const rows = [header.join(',')];
    teachers.forEach(t => {
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
        rows.push(`TEACHER,"${t.id}","${t.name}",${t.maxHours}`);
    });
    classes.forEach(c => {
        rows.push(`CLASS,"${c}"`);
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

export function importFromCSV(file: File, currentTeachers: Teacher[]): Promise<{ schedule: ScheduleData, teachers?: Teacher[], classes?: string[] }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(l => l.trim());
                
                let loadedTeachers: Teacher[] = [];
                let loadedClasses: string[] = [];
                let hasSystemData = false;

                // Pass 1: Find system data
                const systemDataIdx = lines.findIndex(l => l.trim() === '---SYSTEM_DATA---');
                if (systemDataIdx !== -1) {
                    hasSystemData = true;
                    for (let i = systemDataIdx + 1; i < lines.length; i++) {
                        const cols = parseCSVRow(lines[i]);
                        if (cols[0] === 'TEACHER' && cols.length >= 4) {
                            loadedTeachers.push({ id: cols[1], name: cols[2], maxHours: parseInt(cols[3], 10) || 0 });
                        } else if (cols[0] === 'CLASS' && cols.length >= 2) {
                            loadedClasses.push(cols[1]);
                        }
                    }
                }

                const effectiveTeachers = hasSystemData ? loadedTeachers : currentTeachers;
                const newSchedule: ScheduleData = {};

                // Pass 2: Parse schedule
                const endIdx = hasSystemData ? systemDataIdx : lines.length;
                for (let i = 1; i < endIdx; i++) {
                    const cols = parseCSVRow(lines[i]);
                    const tName = cols[0];
                    if (!tName) continue;
                    
                    const teacher = effectiveTeachers.find(t => t.name === tName);
                    if (!teacher) continue;

                    newSchedule[teacher.id] = {};
                    let colIdx = 2;
                    for (let d = 0; d < 5; d++) {
                        newSchedule[teacher.id][d] = {};
                        for (let h = 0; h < 8; h++) {
                            const val = cols[colIdx++];
                            if (val) {
                                newSchedule[teacher.id][d][h] = val.split(',').map(s => s.trim()).filter(Boolean);
                            }
                        }
                    }
                }

                resolve({
                    schedule: newSchedule,
                    teachers: hasSystemData ? loadedTeachers : undefined,
                    classes: hasSystemData ? loadedClasses : undefined
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
