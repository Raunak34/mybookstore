import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  registerUser: (username: string, email: string, psw: string) => Promise<{ success: boolean; error?: string }>;
  loginUser: (email: string, psw: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bka_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync token to API headers
  const getHeaders = (customToken = token) => {
    return {
      'Content-Type': 'application/json',
      ...(customToken ? { 'Authorization': `Bearer ${customToken}` } : {})
    };
  };

  const refreshUser = async (forcedToken = token) => {
    if (!forcedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${forcedToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token stale
        localStorage.removeItem('bka_token');
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.error("Failed fetching self user details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('bka_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('bka_token');
    setToken(null);
    setUser(null);
  };

  const registerUser = async (username: string, email: string, psw: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: psw })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      login(data.token, data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Offline register error' };
    }
  };

  const loginUser = async (email: string, psw: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: psw })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication credential error' };
      }
      login(data.token, data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Offline login error' };
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, registerUser, loginUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed secure inside an AuthProvider');
  }
  return context;
};
