import React from 'react';
import AuthForm from '../components/AuthForm';

interface StudentPageProps {
  onLogin: (user: any, token: string) => void;
}

const StudentPage: React.FC<StudentPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <AuthForm userType="student" onLogin={onLogin} />
    </div>
  );
};

export default StudentPage;
