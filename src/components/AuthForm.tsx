import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };


  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      // Use real email addresses for testing Google OAuth
      let testEmail = '';
      let endpoint = '';
      let requestBody: any = {};

      switch (userType) {
        case 'student':
          endpoint = '/student/login';
          testEmail = 'nitish.p24@medhaviskillsuniversity.edu.in'; // Real student email
          requestBody = {
            token: `mock_google_token_for_${testEmail}`
          };
          break;
        case 'faculty':
          endpoint = '/faculty/login';
          testEmail = 'ananya.sharma@polariscampus.com'; // Real faculty email
          requestBody = {
            token: `mock_google_token_for_${testEmail}`
          };
          break;
        case 'admin':
          endpoint = '/login'; // Use general login endpoint for admin
          testEmail = 'kshitiz.dhooria@classplus.co'; // Real admin email
          requestBody = {
            token: `mock_google_token_for_${testEmail}`
          };
          break;
      }


      const response = await fetch(`https://ums-672553132888.asia-south1.run.app/ums/api/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      const token = response.headers.get('x-access-token');
      if (token) {
        onLogin(data.user, token);
      } else {
        throw new Error('No authentication token received');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let endpoint = '';
      let requestBody: any = {
        email: formData.email,
        password: formData.password
      };

      switch (userType) {
        case 'student':
          // Students should use Google OAuth, not email/password
          setError('Students must use Google OAuth. Please use the "Continue with Google" button.');
          setLoading(false);
          return;
        case 'faculty':
          endpoint = '/faculty/email-login';
          break;
        case 'admin':
          endpoint = '/login';
          break;
      }

      const response = await fetch(`https://ums-672553132888.asia-south1.run.app/ums/api/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const token = response.headers.get('x-access-token');
      if (token) {
        onLogin(data.user, token);
      } else {
        throw new Error('No authentication token received');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let endpoint = '';
      let requestBody: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name
      };

      switch (userType) {
        case 'student':
          // Students should use Google OAuth for registration
          setError('Student registration requires Google OAuth. Please use the "Continue with Google" button.');
          setLoading(false);
          return;
        case 'faculty':
        case 'admin':
          // Faculty and admin accounts are created by administrators
          setError('Faculty and admin accounts must be created by administrators.');
          setLoading(false);
          return;
      }

      const response = await fetch(`https://ums-672553132888.asia-south1.run.app/ums/api/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const token = response.headers.get('x-access-token');
      if (token) {
        onLogin(data.user, token);
      } else {
        throw new Error('No authentication token received');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeInfo = () => {
    switch (userType) {
      case 'student':
        return {
          title: 'Student Portal',
          description: 'Access your courses, assignments, and track your learning progress.',
          emailRestriction: 'Students must use @medhaviskillsuniversity.edu.in email addresses',
          allowSignup: true,
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
              allowGoogleAuth: true // Admin now supports Google OAuth
            };
    }
  };

  const info = getUserTypeInfo();

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{info.title}</h1>
        <p className="text-gray-300">{info.description}</p>
      </div>

      {/* Tab Navigation - Hide for Google-only users */}
      {!info.googleOnly && (
        <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Login
          </button>
          {info.allowSignup && (
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'signup'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          )}
        </div>
      )}

          {/* Google OAuth Button */}
          {(info.googleOnly || info.allowGoogleAuth) && (
            <div className="mb-6">
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Test Email Info */}
              <div className="mt-2 text-xs text-gray-400 text-center">
                {userType === 'student' && 'Testing with: nitish.p24@medhaviskillsuniversity.edu.in'}
                {userType === 'faculty' && 'Testing with: ananya.sharma@polariscampus.com'}
                {userType === 'admin' && 'Testing with: kshitiz.dhooria@classplus.co'}
              </div>
            </div>
          )}

      {!info.googleOnly && info.allowGoogleAuth && (
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">Or continue with email</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Login Form */}
      {activeTab === 'login' && !info.googleOnly && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input-field w-full pl-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="input-field w-full pl-10 pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Signup Form */}
      {activeTab === 'signup' && info.allowSignup && !info.googleOnly && (
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input-field w-full pl-10"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input-field w-full pl-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="input-field w-full pl-10 pr-10"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="input-field w-full pl-10"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      )}

      {/* Student-specific message */}
      {info.googleOnly && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="text-center">
            <h3 className="text-blue-400 font-semibold mb-2">Student Authentication</h3>
            <p className="text-sm text-gray-300 mb-3">
              Students can only sign in using their Google account with a @medhaviskillsuniversity.edu.in email address.
            </p>
            <p className="text-xs text-gray-400">
              If you don't have access, please contact your administrator.
            </p>
          </div>
        </div>
      )}

          {/* Admin-specific message */}
          {userType === 'admin' && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="text-center">
                <h3 className="text-red-400 font-semibold mb-2">Admin Authentication</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Admin accounts can sign in using either Google OAuth or email/password credentials.
                </p>
                <p className="text-xs text-gray-400">
                  Admin accounts must be created by system administrators.
                </p>
              </div>
            </div>
          )}

      {/* Faculty-specific message */}
      {userType === 'faculty' && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="text-center">
            <h3 className="text-green-400 font-semibold mb-2">Faculty Authentication</h3>
            <p className="text-sm text-gray-300 mb-3">
              Faculty accounts can sign in using either Google OAuth or email/password credentials.
            </p>
            <p className="text-xs text-gray-400">
              Faculty accounts must be created by administrators.
            </p>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">{info.emailRestriction}</p>
      </div>
    </div>
  );
};

export default AuthForm;
