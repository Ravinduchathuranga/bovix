import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../domain/entities/cattle';
import {
  authRepository,
  loginUseCase,
  googleLoginUseCase,
  signUpUseCase,
} from '../../di/container';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authRepository.getCurrentUser().then((u: User | null) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginUseCase.execute(email, pass);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    try {
      const newUser = await signUpUseCase.execute(email, pass, name);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      const googleUser = await googleLoginUseCase.execute(idToken);
      setUser(googleUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authRepository.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signUp, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
