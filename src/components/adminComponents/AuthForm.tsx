import React, { useState, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { publicAuthApi, lmsStudentGoogleLogin } from '../../services/api';

interface AuthFormProps {
  userType: 'student' | 'faculty' | 'admin';
  onLogin: (user: any, token: string, refreshToken?: string) => void;
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
          emailRestriction: 'Sign in with your Google account',
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

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setLoading(true);
      setError('');
      try {
        const result =
          userType === 'student'
            ? await lmsStudentGoogleLogin(credential)
            : userType === 'faculty'
              ? await publicAuthApi.facultyGoogleLogin(credential)
              : await publicAuthApi.adminGoogleLogin(credential);
        const accessToken = result.token;
        if (typeof accessToken === 'string' && accessToken.length > 0) {
          onLogin(result.user, accessToken, result.refreshToken);
        } else {
          throw new Error('No authentication token received');
        }
      } catch (err: any) {
        setError(err.message || 'Google authentication failed');
      } finally {
        setLoading(false);
      }
    },
    [userType, onLogin]
  );

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

  // --- Email Login ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const credentials = { email: formData.email, password: formData.password };

      const result =
        userType === 'faculty'
          ? await publicAuthApi.facultyEmailLogin(credentials)
          : userType === 'admin'
            ? await publicAuthApi.login(credentials)
            : (() => {
                throw new Error('Email login is not available for this portal.');
              })();

      if (result.token) {
        onLogin(result.user, result.token, result.refreshToken);
      } else {
        throw new Error('No authentication token received');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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

      {(info.googleOnly || info.allowGoogleAuth) && (
        <div className="mb-6 w-full">
          {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
              <div className="w-full [&>div]:!w-full">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    const cred = credentialResponse.credential;
                    if (!cred) {
                      setError('Google did not return a credential');
                      return;
                    }
                    void handleGoogleCredential(cred);
                  }}
                  onError={() =>
                    setError(
                      userType === 'student'
                        ? 'Google sign-in failed. Please try again.'
                        : 'Google sign-in failed. Try again or use email.'
                    )
                  }
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              </div>
            </GoogleOAuthProvider>
          ) : (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
              Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).
            </p>
          )}
        </div>
      )}

      {/* Divider */}
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
