import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('learnex_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      fullName,
      createdAt: new Date(),
    };

    localStorage.setItem('learnex_user', JSON.stringify(newUser));
    localStorage.setItem(`learnex_pass_${email}`, password);
    setUser(newUser);
  };

  const signIn = async (email: string, password: string) => {
    const storedPassword = localStorage.getItem(`learnex_pass_${email}`);
    if (storedPassword !== password) {
      throw new Error('Invalid credentials');
    }

    const storedUser = localStorage.getItem('learnex_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.email === email) {
        setUser(userData);
        return;
      }
    }
    throw new Error('User not found');
  };

  const signOut = async () => {
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    console.log('Password reset requested for:', email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
