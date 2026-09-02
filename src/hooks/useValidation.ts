import { useMemo } from 'react';
import { ScheduleData, Teacher, ValidationError } from '../types';

const DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

export function useValidation(schedule: ScheduleData, teachers: Teacher[]) {
  return useMemo(() => {
    const errors: ValidationError[] = [];

    // Έλεγχοι ανά εκπαιδευτικό
    teachers.forEach(teacher => {
      let totalHours = 0;
      const tSchedule = schedule[teacher.id] || {};

      for (let d = 0; d < 5; d++) {
        const daySchedule = tSchedule[d] || {};
        const hoursAssigned = Object.keys(daySchedule).map(Number);
        totalHours += hoursAssigned.length;

        // Κανόνας: Όχι 1η ώρα και 8η ώρα την ίδια μέρα
        if (daySchedule[0] && daySchedule[7]) {
          errors.push({
            id: `t-${teacher.id}-d-${d}-gap`,
            message: `${teacher.name}: Διδάσκει 1η και 8η ώρα την ${DAYS[d]}`,
            type: 'error'
          });
        }
        
        // Κανόνας: Ένας εκπαιδευτικός δεν μπορεί να διδάσκει την ίδια ώρα σε διαφορετικά τμήματα (εξαιρούνται ειδικά μαθήματα με 0 ώρες)
        if (teacher.maxHours > 0) {
            Object.entries(daySchedule).forEach(([h, classes]) => {
                if (classes.length > 1) {
                    errors.push({
                        id: `t-${teacher.id}-d-${d}-h-${h}-mult`,
                        message: `${teacher.name}: Διδάσκει σε πολλαπλά τμήματα την ${DAYS[d]} (${Number(h) + 1}η ώρα): ${classes.join(', ')}`,
                        type: 'error'
                    });
                }
            });
        }
      }

      // Κανόνας: Υπέρβαση ωραρίου (Μόνο για κανονικούς εκπαιδευτικούς)
      if (teacher.maxHours > 0 && totalHours > teacher.maxHours) {
        errors.push({
          id: `t-${teacher.id}-hours`,
          message: `${teacher.name}: Υπέρβαση ωρών (${totalHours}/${teacher.maxHours})`,
          type: 'error'
        });
      }
    });

    // Έλεγχοι ανά τμήμα (διπλές αναθέσεις την ίδια ώρα)
    for (let d = 0; d < 5; d++) {
      for (let h = 0; h < 8; h++) {
        const classToTeachers: Record<string, string[]> = {};
        
        teachers.forEach(t => {
          const classes = schedule[t.id]?.[d]?.[h] || [];
          classes.forEach(cls => {
            if (!classToTeachers[cls]) classToTeachers[cls] = [];
            classToTeachers[cls].push(t.name);
          });
        });

        Object.entries(classToTeachers).forEach(([cls, tNames]) => {
          if (tNames.length > 1) {
            errors.push({
              id: `c-${cls}-d-${d}-h-${h}`,
              message: `Το τμήμα ${cls} έχει ${tNames.length} καθηγητές την ${DAYS[d]} (${h + 1}η ώρα): ${tNames.join(', ')}`,
              type: 'error'
            });
          }
        });
      }
    }

    return errors;
  }, [schedule, teachers]);
}
