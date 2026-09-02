import { ScheduleData, Teacher } from '../types';

export function exportToCSV(schedule: ScheduleData, teachers: Teacher[]) {
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

    // Add BOM for Excel/Calc greek characters support
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programma.csv';
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

export function importFromCSV(file: File, teachers: Teacher[], onImport: (data: ScheduleData) => void) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const newSchedule: ScheduleData = {};

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVRow(lines[i]);
            const tName = cols[0];
            const teacher = teachers.find(t => t.name === tName);
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
        onImport(newSchedule);
    };
    reader.readAsText(file);
}
