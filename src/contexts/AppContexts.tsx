import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getMe } from '../api/auth';

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

interface AppContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthLoading: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsAuthLoading(false);
      return;
    }
    getMe()
      .then((me) => setUser({ email: me.email, name: me.name, role: me.role }))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setIsAuthLoading(false));
  }, [token]);

  const setAuth = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, token, isAuthLoading, setAuth, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
