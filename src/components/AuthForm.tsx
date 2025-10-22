import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

interface AuthFormProps {
  userType: 'student' | 'faculty' | 'admin';
  onLogin: (user: any, token: string) => void; // must be a function
}

const UMS_BASE_URL = 'https://ums-672553132888.asia-south1.run.app/ums/api/auth';

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

      const response = await fetch(`${UMS_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: `mock_google_token_for_${testEmail}` })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Google authentication failed');

      const token = response.headers.get('x-access-token');

      if (token && typeof onLogin === 'function') {
        onLogin(data.user, token);
      } else {
        throw new Error('No authentication token received or onLogin is not a function');
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
      if (userType === 'student') {
        setError('Students must use Google OAuth.');
        setLoading(false);
        return;
      }

      const endpoint = userType === 'faculty' ? '/faculty/email-login' : '/login';

      const response = await fetch(`${UMS_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Login failed');

      const token = response.headers.get('x-access-token');

      if (token && typeof onLogin === 'function') {
        onLogin(data.user, token);
      } else {
        throw new Error('No authentication token received or onLogin is not a function');
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

    setError('Faculty and admin accounts must be created by administrators. Students must use Google OAuth.');
    setLoading(false);
  };

  const getUserTypeInfo = () => {
    switch (userType) {
      case 'student':
        return { title: 'Student Portal', googleOnly: true, allowGoogleAuth: true, emailRestriction: 'Students must use @medhaviskillsuniversity.edu.in' };
      case 'faculty':
        return { title: 'Faculty Portal', googleOnly: false, allowGoogleAuth: true, allowSignup: false, emailRestriction: 'Faculty accounts must be created by administrators' };
      case 'admin':
        return { title: 'Admin Portal', googleOnly: false, allowGoogleAuth: true, allowSignup: false, emailRestriction: 'Admin access is restricted to authorized personnel' };
    }
  };

  const info = getUserTypeInfo();

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{info.title}</h1>
        <p className="text-gray-300">{info.emailRestriction}</p>
      </div>

      {(info.googleOnly || info.allowGoogleAuth) && (
        <button onClick={handleGoogleAuth} disabled={loading} className="w-full bg-white text-gray-900 py-3 rounded-xl mb-4">
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
      )}

      {error && <div className="bg-red-500/10 px-4 py-3 rounded-xl mb-4 text-red-400">{error}</div>}

      {!info.googleOnly && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required className="w-full p-2 rounded" />
          </div>
          <div>
            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required className="w-full p-2 rounded" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AuthForm;
