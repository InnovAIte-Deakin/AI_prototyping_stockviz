import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and check for stored user session
    const storedUser = localStorage.getItem('stockviz_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('stockviz_user');
      }
    }
    setLoading(false);
  }, []);

  const signOut = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('stockviz_user');
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    // Simulate sign in - in real app this would call your auth API
    const mockUser: User = {
      id: '1',
      email,
      user_metadata: {
        full_name: 'Demo User',
        avatar_url: undefined
      }
    };
    setUser(mockUser);
    localStorage.setItem('stockviz_user', JSON.stringify(mockUser));
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    // Simulate sign up - in real app this would call your auth API
    const mockUser: User = {
      id: '1',
      email,
      user_metadata: {
        full_name: 'New User',
        avatar_url: undefined
      }
    };
    setUser(mockUser);
    localStorage.setItem('stockviz_user', JSON.stringify(mockUser));
  };

  const value: AuthContextType = {
    user,
    signOut,
    signIn,
    signUp,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
