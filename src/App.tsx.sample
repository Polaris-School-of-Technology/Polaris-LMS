import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudentPage, FacultyPage, AdminPage, Dashboard } from './pages';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const RedirectAfterLogin: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (user.userType === 'admin') return <Navigate to="/admin-dashboard" replace />;
  if (user.userType === 'faculty') return <Navigate to="/faculty-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

// 🔹 NEW: Landing page for role selection
const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-semibold text-yellow-400 mb-8">
        Welcome to Mentro LMS
      </h1>
      <p className="text-gray-300 mb-6">Choose your role to continue:</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl shadow-md transition-all"
        >
          Student Login
        </button>

        <button
          onClick={() => navigate('/faculty')}
          className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl shadow-md transition-all"
        >
          Faculty Login
        </button>

        <button
          onClick={() => navigate('/admin')}
          className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl shadow-md transition-all"
        >
          Admin Login
        </button>
      </div>
    </div>
  );
};

// 🔐 Login routes
const StudentLoginRoute: React.FC = () => {
  const { isAuthenticated, user, login } = useAuth();
  if (isAuthenticated && user) return <RedirectAfterLogin />;
  return <StudentPage onLogin={login} />;
};

const FacultyLoginRoute: React.FC = () => {
  const { isAuthenticated, user, login } = useAuth();
  if (isAuthenticated && user) return <RedirectAfterLogin />;
  return <FacultyPage onLogin={login} />;
};

const AdminLoginRoute: React.FC = () => {
  const { isAuthenticated, user, login } = useAuth();
  if (isAuthenticated && user) return <RedirectAfterLogin />;
  return <AdminPage onLogin={login} />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* 🏠 Role selection */}
      <Route path="/" element={<RoleSelectionPage />} />

      {/* Login pages */}
      <Route path="/student" element={<StudentLoginRoute />} />
      <Route path="/faculty" element={<FacultyLoginRoute />} />
      <Route path="/admin" element={<AdminLoginRoute />} />

      {/* Dashboards */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard /> {/* student dashboard */}
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty-dashboard"
        element={
          <ProtectedRoute>
            <FacultyPage /> {/* faculty dashboard (replace if needed) */}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute>
            <AdminPage /> {/* admin dashboard (replace if needed) */}
          </ProtectedRoute>
        }
      />

      {/* Default redirect for logged-in users */}
      {isAuthenticated && user && (
        <Route path="*" element={<RedirectAfterLogin />} />
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
