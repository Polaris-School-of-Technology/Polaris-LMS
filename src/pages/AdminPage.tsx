import React from 'react';
import AuthForm from '../components/AuthForm';

interface AdminPageProps {
  onLogin: (user: any, token: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <AuthForm userType="admin" onLogin={onLogin} />
    </div>
  );
};

export default AdminPage;
