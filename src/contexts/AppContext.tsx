import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note, Quiz, StudyPlan, Streak } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  notes: Note[];
  quizzes: Quiz[];
  studyPlans: StudyPlan[];
  streak: Streak | null;
  addNote: (note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'userId' | 'createdAt'>) => void;
  updateQuiz: (id: string, updates: Partial<Quiz>) => void;
  addStudyPlan: (plan: Omit<StudyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateStudyPlan: (id: string, updates: Partial<StudyPlan>) => void;
  updateStreak: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    if (user) {
      const storedNotes = localStorage.getItem(`learnex_notes_${user.id}`);
      const storedQuizzes = localStorage.getItem(`learnex_quizzes_${user.id}`);
      const storedPlans = localStorage.getItem(`learnex_plans_${user.id}`);
      const storedStreak = localStorage.getItem(`learnex_streak_${user.id}`);

      if (storedNotes) setNotes(JSON.parse(storedNotes));
      if (storedQuizzes) setQuizzes(JSON.parse(storedQuizzes));
      if (storedPlans) setStudyPlans(JSON.parse(storedPlans));
      if (storedStreak) {
        setStreak(JSON.parse(storedStreak));
      } else {
        const newStreak: Streak = {
          id: crypto.randomUUID(),
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          totalStudyDays: 0,
          badges: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setStreak(newStreak);
        localStorage.setItem(`learnex_streak_${user.id}`, JSON.stringify(newStreak));
      }
    }
  }, [user]);

  const addNote = (note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>) => {
    if (!user) return;
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem(`learnex_notes_${user.id}`, JSON.stringify(updatedNotes));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    if (!user) return;
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
    );
    setNotes(updatedNotes);
    localStorage.setItem(`learnex_notes_${user.id}`, JSON.stringify(updatedNotes));
  };

  const deleteNote = (id: string) => {
    if (!user) return;
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem(`learnex_notes_${user.id}`, JSON.stringify(updatedNotes));
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const newQuiz: Quiz = {
      ...quiz,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date(),
    };
    const updatedQuizzes = [...quizzes, newQuiz];
    setQuizzes(updatedQuizzes);
    localStorage.setItem(`learnex_quizzes_${user.id}`, JSON.stringify(updatedQuizzes));
  };

  const updateQuiz = (id: string, updates: Partial<Quiz>) => {
    if (!user) return;
    const updatedQuizzes = quizzes.map(quiz =>
      quiz.id === id ? { ...quiz, ...updates } : quiz
    );
    setQuizzes(updatedQuizzes);
    localStorage.setItem(`learnex_quizzes_${user.id}`, JSON.stringify(updatedQuizzes));
  };

  const addStudyPlan = (plan: Omit<StudyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const newPlan: StudyPlan = {
      ...plan,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedPlans = [...studyPlans, newPlan];
    setStudyPlans(updatedPlans);
    localStorage.setItem(`learnex_plans_${user.id}`, JSON.stringify(updatedPlans));
  };

  const updateStudyPlan = (id: string, updates: Partial<StudyPlan>) => {
    if (!user) return;
    const updatedPlans = studyPlans.map(plan =>
      plan.id === id ? { ...plan, ...updates, updatedAt: new Date() } : plan
    );
    setStudyPlans(updatedPlans);
    localStorage.setItem(`learnex_plans_${user.id}`, JSON.stringify(updatedPlans));
  };

  const updateStreak = () => {
    if (!user || !streak) return;

    const today = new Date().toDateString();
    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate).toDateString() : null;

    if (lastActivity === today) return;

    let newCurrentStreak = streak.currentStreak;
    let newTotalDays = streak.totalStudyDays + 1;

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (diffDays === 1) {
        newCurrentStreak += 1;
      } else if (diffDays > 1) {
        newCurrentStreak = 1;
      }
    } else {
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);
    const newBadges = [...streak.badges];

    if (newCurrentStreak === 7 && !newBadges.find(b => b.id === 'week_warrior')) {
      newBadges.push({
        id: 'week_warrior',
        name: 'Week Warrior',
        description: '7-day study streak',
        icon: '🔥',
        earnedAt: new Date(),
      });
    }

    if (newCurrentStreak === 30 && !newBadges.find(b => b.id === 'monthly_master')) {
      newBadges.push({
        id: 'monthly_master',
        name: 'Monthly Master',
        description: '30-day study streak',
        icon: '🏆',
        earnedAt: new Date(),
      });
    }

    const updatedStreak: Streak = {
      ...streak,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: new Date(),
      totalStudyDays: newTotalDays,
      badges: newBadges,
      updatedAt: new Date(),
    };

    setStreak(updatedStreak);
    localStorage.setItem(`learnex_streak_${user.id}`, JSON.stringify(updatedStreak));
  };

  return (
    <AppContext.Provider
      value={{
        notes,
        quizzes,
        studyPlans,
        streak,
        addNote,
        updateNote,
        deleteNote,
        addQuiz,
        updateQuiz,
        addStudyPlan,
        updateStudyPlan,
        updateStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
