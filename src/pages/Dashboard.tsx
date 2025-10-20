import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import SummaryCards from '../components/SummaryCards';
import ProgramDashboard from '../components/ProgramDashboard';
import MentorDashboard from '../components/MentorDashboard';
import StudentDashboard from '../components/StudentDashboard';
import CustomReports from '../components/CustomReports';
import AlertsPanel from '../components/AlertsPanel';
import ProgramTable from '../components/ProgramTable';
import StudentTable from '../components/StudentTable';
import MentorTable from '../components/MentorTable';
import QuickActions from '../components/QuickActions';
import ProgramModal from '../components/ProgramModal';
import StudentModal from '../components/StudentModal';
import MentorModal from '../components/MentorModal';
import type { Program, Student, Mentor } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'programs' | 'students' | 'mentors' | 'reports' | 'alerts'>('dashboard');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [studentModalMode, setStudentModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [mentorModalMode, setMentorModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [mentorToRevoke, setMentorToRevoke] = useState<Mentor | null>(null);

  const handleViewProgram = (program: Program) => {
    setSelectedProgram(program);
    setModalMode('view');
    setShowProgramModal(true);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setModalMode('edit');
    setShowProgramModal(true);
  };

  const handleCloseProgramModal = () => {
    setShowProgramModal(false);
    setSelectedProgram(null);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentModalMode('view');
    setShowStudentModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentModalMode('edit');
    setShowStudentModal(true);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setStudentModalMode('add');
    setShowStudentModal(true);
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  const handleViewMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setMentorModalMode('view');
    setShowMentorModal(true);
  };

  const handleEditMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setMentorModalMode('edit');
    setShowMentorModal(true);
  };

  const handleAddMentor = () => {
    setSelectedMentor(null);
    setMentorModalMode('add');
    setShowMentorModal(true);
  };

  const handleCloseMentorModal = () => {
    setShowMentorModal(false);
    setSelectedMentor(null);
  };

  const handleRevokeMentor = (mentor: Mentor) => {
    setMentorToRevoke(mentor);
    setShowRevokeConfirm(true);
  };

  const confirmRevokeMentor = () => {
    if (mentorToRevoke) {
      // Here you would typically update the mentor's status to 'inactive'
      // and handle any necessary cleanup (reassign students, etc.)
    }
    setShowRevokeConfirm(false);
    setMentorToRevoke(null);
    setShowMentorModal(false);
  };

  const cancelRevokeMentor = () => {
    setShowRevokeConfirm(false);
    setMentorToRevoke(null);
  };

  const handleInviteMentor = () => {
    handleAddMentor();
  };

  const handleCreateProgram = () => {
    setSelectedProgram(null);
    setModalMode('edit');
    setShowProgramModal(true);
  };

  const handleBulkUpload = () => {
  };

  const handleNotificationClick = () => {
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      <Navbar
        notifications={3}
        onNotificationClick={handleNotificationClick}
      />

      <main className="max-w-8xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'Admin'}
          </h1>
          <p className="text-gray-400 text-lg font-medium">
            Here's what's happening with your learning programs today.
          </p>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 mt-8 p-2 bg-gray-900/50 rounded-2xl border border-gray-800/50 backdrop-blur-sm w-fit">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentView === 'dashboard'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('programs')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentView === 'programs'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Programs
            </button>
            <button
              onClick={() => setCurrentView('students')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentView === 'students'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setCurrentView('mentors')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentView === 'mentors'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Mentors
            </button>
            <button
              onClick={() => setCurrentView('reports')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentView === 'reports'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setCurrentView('alerts')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                currentView === 'alerts'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Alerts
            </button>
          </div>
        </div>

        {currentView === 'dashboard' ? (
          <>
            <SummaryCards />
            <QuickActions
              onInviteMentor={handleInviteMentor}
              onCreateProgram={handleCreateProgram}
              onBulkUpload={handleBulkUpload}
            />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <ProgramDashboard />
              </div>
              <div>
                <AlertsPanel />
              </div>
            </div>
          </>
        ) : currentView === 'programs' ? (
          <div className="mb-12">
            <ProgramTable
              onViewProgram={handleViewProgram}
              onEditProgram={handleEditProgram}
            />
          </div>
        ) : currentView === 'students' ? (
          <div className="mb-12">
            <StudentDashboard />
            <div className="mt-8">
              <StudentTable
                onViewStudent={handleViewStudent}
                onEditStudent={handleEditStudent}
                onAddStudent={handleAddStudent}
              />
            </div>
          </div>
        ) : currentView === 'mentors' ? (
          <div className="mb-12">
            <MentorDashboard />
            <div className="mt-8">
              <MentorTable
                onViewMentor={handleViewMentor}
                onEditMentor={handleEditMentor}
                onAddMentor={handleAddMentor}
              />
            </div>
          </div>
        ) : currentView === 'reports' ? (
          <CustomReports />
        ) : currentView === 'alerts' ? (
          <AlertsPanel />
        ) : null}
      </main>

      <ProgramModal
        isOpen={showProgramModal}
        onClose={handleCloseProgramModal}
        program={selectedProgram}
        mode={modalMode}
      />

      <StudentModal
        isOpen={showStudentModal}
        onClose={handleCloseStudentModal}
        student={selectedStudent}
        mode={studentModalMode}
      />

      <MentorModal
        isOpen={showMentorModal}
        onClose={handleCloseMentorModal}
        mentor={selectedMentor}
        mode={mentorModalMode}
        onRevoke={handleRevokeMentor}
        onMentorUpdated={() => {
          // Refresh mentor data - this will trigger a re-render of MentorTable
        }}
      />

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirm && mentorToRevoke && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-center min-h-screen px-6">
            <div className="modal-backdrop" />
            <div className="modal-content relative w-full max-w-lg">
              <div className="px-8 py-6 border-b border-gray-800/50 bg-gradient-to-r from-red-900/20 to-gray-900">
                <h3 className="text-xl font-bold text-white flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <span>Revoke Mentor Access</span>
                </h3>
              </div>
              <div className="px-8 py-6">
                <p className="text-gray-300 mb-6 text-lg">
                  Are you sure you want to revoke access for <strong className="text-white font-semibold">{mentorToRevoke.name}</strong>?
                </p>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
                  <p className="text-red-400 font-semibold mb-3">
                    <strong>Warning:</strong> This action will:
                  </p>
                  <ul className="text-red-400 space-y-2">
                    <li>• Deactivate the mentor's account</li>
                    <li>• Require reassignment of their {mentorToRevoke.students?.length || 0} students</li>
                    <li>• Remove access to all mentor features</li>
                  </ul>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={cancelRevokeMentor}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRevokeMentor}
                    className="bg-red-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 active:scale-95"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
