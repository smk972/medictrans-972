import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { AuthService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithEmail: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (
    email: string, 
    password: string, 
    profileData: Partial<UserProfile> & { role: UserRole }
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (role?: UserRole) => Promise<{ success: boolean; redirected?: boolean; error?: string }>;
  loginAsDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Erreur initialisation auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    // Écoute des événements de session Supabase si configuré
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } else if (event === 'SIGNED_OUT') {
          const local = AuthService.getLocalUser();
          if (!local) {
            setUser(null);
          }
        } else {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loginWithEmail = async (email: string, password: string, role: UserRole = 'PATIENT') => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await AuthService.signInWithEmail(email, password, role);
      if (res.error) {
        setError(res.error);
        return { success: false, error: res.error };
      }
      setUser(res.user);
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Erreur de connexion';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string, 
    password: string, 
    profileData: Partial<UserProfile> & { role: UserRole }
  ) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await AuthService.signUpWithEmail(email, password, profileData);
      if (res.error) {
        setError(res.error);
        return { success: false, error: res.error };
      }
      setUser(res.user);
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as Error).message || "Erreur lors de l'enregistrement";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: UserRole = 'PATIENT') => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await AuthService.signInWithGoogle(role);
      if (res.error) {
        setError(res.error);
        setIsLoading(false);
        return { success: false, error: res.error };
      }

      if (!res.redirected) {
        // Mode démo direct
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      }
      
      setIsLoading(false);
      return { success: true, redirected: res.redirected };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Erreur Google OAuth';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const loginAsDemo = (role: UserRole) => {
    setError(null);
    const demoUser = AuthService.loginAsDemo(role);
    setUser(demoUser);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemo,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
