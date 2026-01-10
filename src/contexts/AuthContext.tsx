import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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

  const decodeUserFromToken = (jwtToken: string | null): User | null => {
    if (!jwtToken) return null;
    try {
      const parts = jwtToken.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));

      const id = payload?.id || payload?.userId || payload?.sub;
      const email = payload?.email || payload?.mail || '';
      const name = payload?.name || payload?.username || payload?.preferred_username || '';
      const rawType = payload?.userType || payload?.user_type || payload?.role || payload?.userRole;

      if (!id || !rawType) {
        return null;
      }

      const normalizedType = String(rawType).toLowerCase();
      if (normalizedType !== 'student' && normalizedType !== 'faculty' && normalizedType !== 'admin') {
        return null;
      }

      return {
        id: String(id),
        email: String(email || ''),
        name: String(name || ''),
        userType: normalizedType as User['userType'],
        batchId: payload?.batchId || payload?.batch_id ? Number(payload?.batchId || payload?.batch_id) : undefined,
      };
    } catch (error) {
      console.error('Failed to decode user from token:', error);
    }
    return null;
  };

  useEffect(() => {
    // Check for stored authentication data on app load
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedToken) {
      try {
        setToken(storedToken);
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
        const decodedUser = decodeUserFromToken(storedToken);
        if (decodedUser) {
          setUser(decodedUser);
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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
  };

  const logout = () => {
    const currentUser = user;
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Navigate based on user type
    if (currentUser?.userType === 'admin') {
      window.location.href = '/admin/login';
    } else if (currentUser?.userType === 'faculty') {
      window.location.href = '/faculty/login';
    } else if (currentUser?.userType === 'student') {
      window.location.href = '/student/login';
    } else {
      window.location.href = '/admin/login';
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
