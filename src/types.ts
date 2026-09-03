export type Teacher = {
  id: string;
  name: string;
  maxHours: number;
  subject?: string; // Προαιρετικό μάθημα / ειδικότητα
};

export type SubjectRule = {
  id: string;
  name: string;
  maxHours: number[]; // 6 elements for grades Α, Β, Γ, Δ, Ε, ΣΤ
};

// scheduleData: teacherId -> day (0-4) -> hour (0-7) -> classId
export type ScheduleData = Record<string, Record<number, Record<number, string[]>>>;

export type ValidationError = {
  id: string;
  message: string;
  type: 'error' | 'warning';
};

/* 
 * ============================================================================
 * ΚΑΝΟΝΕΣ ΜΑΘΗΜΑΤΩΝ (DEFAULT SUBJECT RULES)
 * ============================================================================
 * Εδώ μπορείτε να προσθέσετε, να αφαιρέσετε ή να τροποποιήσετε "καρφωτά" 
 * τους προεπιλεγμένους κανόνες μαθημάτων του σχολείου.
 * Κάθε αντικείμενο δέχεται το όνομα του μαθήματος και έναν πίνακα maxHours 
 * με ακριβώς 6 τιμές, οι οποίες αντιστοιχούν στις μέγιστες επιτρεπόμενες 
 * ώρες για κάθε τάξη: [Α, Β, Γ, Δ, Ε, ΣΤ].
 * ============================================================================
 */
export const DEFAULT_SUBJECT_RULES: SubjectRule[] = [
  { id: 'sr1', name: "Β' ΞΕΝΗ ΓΛΩΣΣΑ", maxHours: [0, 0, 2, 2, 3, 3] },
  { id: 'sr2', name: "ΓΥΜΝΑΣΤΙΚΗ", maxHours: [4, 4, 3, 3, 3, 3] },
  { id: 'sr3', name: "ΦΥΣΙΚΗ", maxHours: [0, 0, 0, 0, 3, 3] },
  { id: 'sr4', name: "ΚΑΛΛΙΤΕΧΝΙΚΑ", maxHours: [2, 2, 2, 2, 1, 1] },
  { id: 'sr5', name: "ΑΓΓΛΙΚΑ", maxHours: [4, 4, 5, 5, 5, 5] },
  { id: 'sr6', name: "ΜΟΥΣΙΚΗ", maxHours: [2, 2, 2, 2, 1, 1] },
  { id: 'sr7', name: "ΠΛΗΡΟΦΟΡΙΚΗ", maxHours: [1, 1, 1, 1, 1, 1] },
  { id: 'sr8', name: "SOCIAL STUDIES", maxHours: [0, 0, 0, 0, 1, 1] },
  { id: 'sr9', name: "ΘΕΑΤΡΙΚΗ ΑΓΩΓΗ", maxHours: [1, 1, 1, 1, 1, 1] },
];

