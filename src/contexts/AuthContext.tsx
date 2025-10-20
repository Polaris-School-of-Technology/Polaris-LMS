import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  userType: 'student' | 'faculty' | 'admin';
  batchId?: number;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication data on app load
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('auth_user');


    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string, refreshTokenValue?: string) => {
    setUser(userData);
    setToken(authToken);
    if (refreshTokenValue) {
      setRefreshToken(refreshTokenValue);
      localStorage.setItem('refreshToken', refreshTokenValue);
    }
    localStorage.setItem('accessToken', authToken);
    localStorage.setItem('auth_token', authToken); // Keep for backward compatibility
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    const currentUser = user;
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth_user');

    // Navigate based on user type
    if (currentUser?.userType === 'admin') {
      window.location.href = '/admin';
    } else if (currentUser?.userType === 'faculty') {
      window.location.href = '/faculty';
    } else {
      window.location.href = '/';
    }
  };

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
