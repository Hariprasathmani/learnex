export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileType: 'pdf' | 'text';
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
}

export interface Quiz {
  id: string;
  userId: string;
  noteId?: string;
  title: string;
  questions: Question[];
  score: number;
  totalQuestions: number;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface StudySession {
  id: string;
  time: string;
  subject: string;
  duration: number;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  userId: string;
  date: Date;
  schedule: StudySession[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  totalStudyDays: number;
  badges: Badge[];
  createdAt: Date;
  updatedAt: Date;
}
