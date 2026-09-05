import { useMemo } from 'react';
import { ScheduleData, Teacher, SubjectRule, ValidationError } from '../types';

const DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

export function useValidation(schedule: ScheduleData, teachers: Teacher[], classes: string[], subjectRules: SubjectRule[]) {
  return useMemo(() => {
    const errors: ValidationError[] = [];

    // Έλεγχοι ανά εκπαιδευτικό
    teachers.forEach(teacher => {
      let totalHours = 0;
      const tSchedule = schedule[teacher.id] || {};

      for (let d = 0; d < 5; d++) {
        const daySchedule = tSchedule[d] || {};
        const validHours = Object.values(daySchedule).filter(clsArr => clsArr.length > 0 && !clsArr.includes('BLOCK'));
        totalHours += validHours.length;

        // Κανόνας: Όχι 1η ώρα και 8η ώρα την ίδια μέρα
        const isTeachingFirst = daySchedule[0] && daySchedule[0].some(c => c !== 'BLOCK');
        const isTeachingEighth = daySchedule[7] && daySchedule[7].some(c => c !== 'BLOCK');
        if (isTeachingFirst && isTeachingEighth) {
          errors.push({
            id: `t-${teacher.id}-d-${d}-gap`,
            message: `${teacher.name}: Διδάσκει 1η και 8η ώρα την ${DAYS[d]}`,
            type: 'error'
          });
        }
        
        // Κανόνας: Ένας εκπαιδευτικός δεν μπορεί να διδάσκει την ίδια ώρα σε διαφορετικά τμήματα (εξαιρούνται ειδικά μαθήματα με 0 ώρες)
        if (teacher.maxHours > 0) {
            Object.entries(daySchedule).forEach(([h, clsArr]) => {
                if (clsArr.length > 1) {
                    errors.push({
                        id: `t-${teacher.id}-d-${d}-h-${h}-mult`,
                        message: `${teacher.name}: Διδάσκει σε πολλαπλά τμήματα την ${DAYS[d]} (${Number(h) + 1}η ώρα): ${clsArr.join(', ')}`,
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
          const clsArr = schedule[t.id]?.[d]?.[h] || [];
          clsArr.forEach(cls => {
            if (!classToTeachers[cls]) classToTeachers[cls] = [];
            classToTeachers[cls].push(t.name);
          });
        });

        // Also check generic subjects
        subjectRules.forEach(sr => {
          if (!teachers.some(t => t.id === sr.name)) {
            const clsArr = schedule[sr.name]?.[d]?.[h] || [];
            clsArr.forEach(cls => {
              if (!classToTeachers[cls]) classToTeachers[cls] = [];
              classToTeachers[cls].push(sr.name);
            });
          }
        });

        Object.entries(classToTeachers).forEach(([cls, tNames]) => {
          if (tNames.length > 1) {
            errors.push({
              id: `c-${cls}-d-${d}-h-${h}`,
              message: `Το τμήμα ${cls} έχει ${tNames.length} καθηγητές/μαθήματα την ${DAYS[d]} (${h + 1}η ώρα): ${tNames.join(', ')}`,
              type: 'error'
            });
          }
        });
      }
    }

    // Έλεγχοι κανόνων μαθημάτων ανά τμήμα
    const getPrefix = (c: string) => c.match(/^[^\d]+/)?.[0] || c;
    const gradeToIndex: Record<string, number> = { 'Α': 0, 'Β': 1, 'Γ': 2, 'Δ': 3, 'Ε': 4, 'ΣΤ': 5 };

    classes.forEach(cls => {
      const prefix = getPrefix(cls).toUpperCase();
      const gradeIdx = gradeToIndex[prefix];
      if (gradeIdx === undefined) return; // Not a standard grade

      const classSubjectHours: Record<string, number> = {};

      for (let d = 0; d < 5; d++) {
        for (let h = 0; h < 8; h++) {
          teachers.forEach(t => {
            if (schedule[t.id]?.[d]?.[h]?.includes(cls)) {
              if (t.subject) {
                classSubjectHours[t.subject] = (classSubjectHours[t.subject] || 0) + 1;
              }
            }
          });
          subjectRules.forEach(sr => {
            if (schedule[sr.name]?.[d]?.[h]?.includes(cls)) {
              classSubjectHours[sr.name] = (classSubjectHours[sr.name] || 0) + 1;
            }
          });
        }
      }

      subjectRules.forEach(rule => {
        const currentHours = classSubjectHours[rule.name] || 0;
        const maxAllowed = rule.maxHours[gradeIdx];
        if (currentHours > maxAllowed) {
          errors.push({
            id: `rule-${cls}-${rule.name}`,
            message: `Το τμήμα ${cls} παραβιάζει τον κανόνα για: ${rule.name} (Έχει ${currentHours} ώρες, μέγιστο ${maxAllowed})`,
            type: 'error'
          });
        }
      });
    });

    return errors;
  }, [schedule, teachers, classes, subjectRules]);
}
