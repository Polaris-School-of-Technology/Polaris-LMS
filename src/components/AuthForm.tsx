import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const UMS_BASE_URL = 'https://ums-672553132888.asia-south1.run.app'

interface AuthFormProps {
  userType: 'student' | 'faculty' | 'admin';
  onLogin: (user: any, token: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ userType, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- Helpers ---
  const getUserTypeInfo = () => {
    switch (userType) {
      case 'student':
        return {
          title: 'Student Portal',
          description: 'Access your courses, assignments, and track your learning progress.',
          emailRestriction: 'Students must use @medhaviskillsuniversity.edu.in email addresses',
          allowSignup: false,
          googleOnly: true,
          allowGoogleAuth: true
        };
      case 'faculty':
        return {
          title: 'Faculty Portal',
          description: 'Manage your courses, students, and create engaging learning experiences.',
          emailRestriction: 'Faculty accounts must be created by administrators',
          allowSignup: false,
          googleOnly: false,
          allowGoogleAuth: true
        };
      case 'admin':
        return {
          title: 'Admin Portal',
          description: 'Manage the entire learning management system and user accounts.',
          emailRestriction: 'Admin access is restricted to authorized personnel',
          allowSignup: false,
          googleOnly: false,
          allowGoogleAuth: true
        };
    }
  };

  const info = getUserTypeInfo();

  // --- Google Auth ---
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      let testEmail = '';
      switch (userType) {
        case 'student':
          endpoint = '/student/login';
          testEmail = 'nitish.p24@medhaviskillsuniversity.edu.in';
          break;
        case 'faculty':
          endpoint = '/faculty/login';
          testEmail = 'ananya.sharma@polariscampus.com';
          break;
        case 'admin':
          endpoint = '/login';
          testEmail = 'kshitiz.dhooria@classplus.co';
          break;
      }

      const requestBody = { token: `mock_google_token_for_${testEmail}` };
      const response = await fetch(`${UMS_BASE_URL}/ums/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Google authentication failed');

      const token = response.headers.get('x-access-token');
      if (token) onLogin(data.user, token);
      else throw new Error('No authentication token received');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Email Login ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (userType === 'student') {
      setError('Students must use Google OAuth. Please use the "Continue with Google" button.');
      setLoading(false);
      return;
    }

    const endpoint = userType === 'faculty' ? '/faculty/email-login' : '/login';
    try {
      const response = await fetch(`${UMS_BASE_URL}/ums/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      const token = response.headers.get('x-access-token');
      if (token) onLogin(data.user, token);
      else throw new Error('No authentication token received');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Email Signup ---
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Only allow signup for Google-only (students) or block for others
    if (userType === 'student') {
      setError('Student registration requires Google OAuth.');
      setLoading(false);
      return;
    }
    setError('Faculty and admin accounts must be created by administrators.');
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{info.title}</h1>
        <p className="text-gray-300">{info.description}</p>
      </div>

      {/* Tabs */}
      {!info.googleOnly && (
        <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'login' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            Login
          </button>
          {info.allowSignup && (
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'signup' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Sign Up
            </button>
          )}
        </div>
      )}

      {/* Google Auth Button */}
      {(info.googleOnly || info.allowGoogleAuth) && (
        <div className="mb-6">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Email Forms */}
      {activeTab === 'login' && !info.googleOnly && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="input-field w-full pl-10"
              placeholder="Email address"
            />
          </div>
          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="input-field w-full pl-10 pr-10"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </form>
      )}

      {/* Additional Info */}
      <div className="mt-6 text-center text-sm text-gray-400">{info.emailRestriction}</div>
    </div>
  );
};

export default AuthForm;
