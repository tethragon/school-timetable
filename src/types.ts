export type Teacher = {
  id: string;
  name: string;
  maxHours: number;
};

// scheduleData: teacherId -> day (0-4) -> hour (0-7) -> classId
export type ScheduleData = Record<string, Record<number, Record<number, string[]>>>;

export type ValidationError = {
  id: string;
  message: string;
  type: 'error' | 'warning';
};
