import React, { useState } from 'react';
import { User, Mail, Hash, Users, Calendar, BarChart } from 'lucide-react';
import type { Student } from '../types';
import Modal from './Modal';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  mode: 'view' | 'edit' | 'add';
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, student, mode }) => {
  const [editData, setEditData] = useState(student || {
    id: '',
    name: '',
    rollNo: '',
    email: '',
    batch: '',
    program: '',
    mentorGroup: '',
    attendance: 0,
    status: 'active' as Student['status'],
    joinDate: ''
  });

  const mentorGroups = [
    'Group Alpha',
    'Group Beta',
    'Group Gamma',
    'Group Delta',
    'Group Epsilon'
  ];

  const programs = [
    'Full Stack Development',
    'Data Science Bootcamp',
    'UI/UX Design Fundamentals',
    'Machine Learning Advanced'
  ];

  const batches = [
    'Batch 2024-A',
    'Batch 2024-B',
    'Batch 2024-C',
    'Batch 2024-D'
  ];

  const handleSave = () => {
    // Handle save logic here
    onClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'add': return 'Add New Student';
      case 'edit': return 'Edit Student';
      case 'view': return 'Student Details';
      default: return 'Student';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {student?.name || 'N/A'}
              </div>
            ) : (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
                placeholder="Enter student's full name"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Hash className="w-4 h-4 inline mr-2" />
              Roll Number
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white font-mono">
                {student?.rollNo || 'N/A'}
              </div>
            ) : (
              <input
                type="text"
                value={editData.rollNo}
                onChange={(e) => setEditData({ ...editData, rollNo: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none font-mono"
                placeholder="e.g., FS2024001"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          {mode === 'view' ? (
            <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
              {student?.email || 'N/A'}
            </div>
          ) : (
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              placeholder="student@email.com"
            />
          )}
        </div>

        {/* Program Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Program
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {student?.program || 'N/A'}
              </div>
            ) : (
              <select
                value={editData.program}
                onChange={(e) => setEditData({ ...editData, program: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                <option value="">Select Program</option>
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Batch
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {student?.batch || 'N/A'}
              </div>
            ) : (
              <select
                value={editData.batch}
                onChange={(e) => setEditData({ ...editData, batch: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Mentor Group Assignment */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Mentor Group
          </label>
          {mode === 'view' ? (
            <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
              {student?.mentorGroup || (
                <span className="text-gray-500 italic">Not assigned</span>
              )}
            </div>
          ) : (
            <select
              value={editData.mentorGroup}
              onChange={(e) => setEditData({ ...editData, mentorGroup: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
            >
              <option value="">Select Mentor Group</option>
              {mentorGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Join Date
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {student?.joinDate ? new Date(student.joinDate).toLocaleDateString() : 'N/A'}
              </div>
            ) : (
              <input
                type="date"
                value={editData.joinDate}
                onChange={(e) => setEditData({ ...editData, joinDate: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  student?.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'
                }`}>
                  {student?.status?.charAt(0).toUpperCase() + student?.status?.slice(1) || 'N/A'}
                </span>
              </div>
            ) : (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as Student['status'] })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            )}
          </div>
        </div>

        {/* Attendance (View only or display current) */}
        {mode === 'view' && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 flex items-center">
                <BarChart className="w-4 h-4 mr-2" />
                Attendance Rate
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${student?.attendance || 0}%` }}
                />
              </div>
              <span className={`text-lg font-bold ${
                (student?.attendance || 0) >= 90 ? 'text-green-400' :
                (student?.attendance || 0) >= 75 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {student?.attendance || 0}%
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {mode !== 'view' && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              {mode === 'add' ? 'Add Student' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StudentModal;