export interface Program {
  id: string;
  name: string;
  cohort: string;
  mentors: number;
  sessions: number;
  status: 'active' | 'inactive' | 'completed';
  startDate: string;
  endDate: string;
  assignedMentor?: {
    id: string;
    name: string;
    program: string;
    expertise: string[];
    rating: number;
    availability: string;
    currentPrograms: number;
  } | null;
}


export interface Group {
  id: string;
  name: string;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  program: string;
  batch: string;
  students: Student[];
  maxStudents: number;
  status: 'active' | 'inactive';
  joinDate: string;
  expertise: string[];
  sessionsCompleted: number;
  sessionsRescheduled: number;
  sessionsCancelled: number;
  rating: number;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  batch: string;
  program: string;
  mentorGroup?: string;
  attendance: number;
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface KPI {
  title: string;
  value: string | number;
  change: number;
  icon: string;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}