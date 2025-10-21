import React, { useState, useEffect } from 'react';
import { User, Mail, BookOpen, Users, Calendar, Star, Award, TrendingUp, UserX, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import type { Mentor } from '../types';
import Modal from './Modal';
import { useApi } from '../services/api';

interface MentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor | null;
  mode: 'view' | 'edit' | 'add';
  onRevoke?: (mentor: Mentor) => void;
  onMentorUpdated?: () => void; // Callback to refresh mentor list
}

const MentorModal: React.FC<MentorModalProps> = ({ isOpen, onClose, mentor, mode, onRevoke, onMentorUpdated }) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editData, setEditData] = useState(mentor || {
    id: '',
    name: '',
    email: '',
    program: '',
    batch: '',
    students: [],
    maxStudents: 10,
    status: 'active' as Mentor['status'],
    joinDate: '',
    expertise: [],
    sessionsCompleted: 0,
    rating: 0
  });

  const [batches, setBatches] = useState<Array<{id: number, batch_name: string, academic_year: string, semester: number}>>([]);
  const [courses, setCourses] = useState<Array<{id: number, course_name: string, course_code?: string}>>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(1);

  const programs = [
    'Full Stack Development',
    'Data Science Bootcamp',
    'UI/UX Design Fundamentals',
    'Machine Learning Advanced'
  ];

  // Fetch batches when modal opens
  useEffect(() => {
    if (isOpen && mode === 'add') {
      fetchBatches();
      fetchCourses();
    }
  }, [isOpen, mode]);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await api.lms.adminMentors.getAllBatches();
      if (response.batches) {
        setBatches(response.batches);
        // Set default to a known working batch ID
        if (response.batches.length > 0) {
          setEditData(prev => ({ ...prev, batch: response.batches[0].batch_name }));
        }
      }
    } catch (error) {
      // Error fetching batches
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      // Fetch actual courses from the Live LMS backend
      const response = await api.lms.adminMentors.getAllCourses();
      if (response.courses) {
        setCourses(response.courses);
        // Use a known working course ID (Full Stack Development 2)
        setSelectedCourseId(4);
      }
    } catch (error) {
      // Error fetching courses
    } finally {
      setLoadingCourses(false);
    }
  };

  const expertiseOptions = [
    'React', 'Node.js', 'MongoDB', 'JavaScript', 'Python', 'Machine Learning',
    'TensorFlow', 'Data Analysis', 'Figma', 'Adobe XD', 'User Research',
    'Prototyping', 'Deep Learning', 'Neural Networks', 'PyTorch', 'Computer Vision'
  ];

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (mode === 'add') {
        // Validation
        if (!editData.name.trim()) {
          setError('Name is required');
          return;
        }
        if (!editData.email.trim()) {
          setError('Email is required');
          return;
        }
        if (!editData.email.includes('@')) {
          setError('Please enter a valid email address');
          return;
        }
        if (editData.expertise.length === 0) {
          setError('Please select at least one expertise area');
          return;
        }
        if (!editData.batch) {
          setError('Please select a batch');
          return;
        }

        // Find the selected batch ID
        const selectedBatch = batches.find(batch => batch.batch_name === editData.batch);
        if (!selectedBatch) {
          setError('Please select a valid batch');
          return;
        }

        // Add new mentor using Live LMS adminMentors endpoint
        const result = await api.lms.adminMentors.addMentor({
          name: editData.name.trim(),
          email: editData.email.trim(),
          expertise: editData.expertise,
          dateOfJoining: editData.joinDate || new Date().toISOString().split('T')[0],
          courseId: selectedCourseId, // Use selected course ID
          batchId: selectedBatch.id
        });

        if (result.message === 'Faculty created successfully') {
          // The Live LMS backend returns defaultPassword: "1"
          const password = result.data?.defaultPassword || result.data?.generatedPassword || '1';
          setSuccess(`Mentor created successfully! Login credentials: Email: ${editData.email}, Password: ${password}`);
        } else {
          setSuccess('Mentor invited successfully!');
        }

        // Refresh mentor list
        if (onMentorUpdated) {
          onMentorUpdated();
        }

        // Don't auto-close modal - let admin manually close to see the password
      } else if (mode === 'edit' && mentor) {
        // Update existing mentor
        const result = await api.lms.mentors.update(mentor.id, {
          name: editData.name,
          email: editData.email,
          program: editData.program,
          batch: editData.batch,
          expertise: editData.expertise,
          maxStudents: editData.maxStudents,
          status: editData.status
        });

        setSuccess('Mentor updated successfully!');

        // Refresh mentor list
        if (onMentorUpdated) {
          onMentorUpdated();
        }

        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save mentor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'add': return 'Add New Mentor';
      case 'edit': return 'Edit Mentor';
      case 'view': return 'Mentor Overview';
      default: return 'Mentor';
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-400';
    if (attendance >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const averageAttendance = mentor?.students.length
    ? (mentor.students || []).reduce((sum, student) => sum + student.attendance, 0) / mentor.students.length
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="xl"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-green-400 font-semibold text-lg mb-2">✅ Mentor Created Successfully!</div>
                <div className="text-green-300 text-sm mb-3">{success}</div>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                  <div className="text-yellow-400 font-medium text-sm mb-1">⚠️ Important:</div>
                  <div className="text-gray-300 text-sm">Please copy the login credentials above and share them with the mentor. Close this modal when done.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-400 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {mentor?.name || 'N/A'}
              </div>
            ) : (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
                placeholder="Enter mentor's full name"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {mentor?.email || 'N/A'}
              </div>
            ) : (
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
                placeholder="mentor@plarislabs.com"
              />
            )}
          </div>
        </div>

        {/* Program and Batch Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Course
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {mentor?.program || 'N/A'}
              </div>
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
                disabled={loadingCourses}
              >
                <option value="">{loadingCourses ? 'Loading courses...' : 'Select Course'}</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
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
                {mentor?.batch || 'N/A'}
              </div>
            ) : (
              <select
                value={editData.batch}
                onChange={(e) => setEditData({ ...editData, batch: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
                disabled={loadingBatches}
              >
                <option value="">{loadingBatches ? 'Loading batches...' : 'Select Batch'}</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.batch_name}>
                    {batch.batch_name} ({batch.academic_year} - Semester {batch.semester})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stats Overview (View Mode Only) */}
        {mode === 'view' && mentor && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">Students</span>
              </div>
              <div className="text-2xl font-bold text-white">{mentor.students.length}/{mentor.maxStudents}</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(mentor.students.length / mentor.maxStudents) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">Sessions</span>
              </div>
              <div className="text-2xl font-bold text-white">{mentor.sessionsCompleted}</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">Rating</span>
              </div>
              <div className="text-2xl font-bold text-white">{mentor.rating}/5</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">Avg Attendance</span>
              </div>
              <div className={`text-2xl font-bold ${getAttendanceColor(averageAttendance)}`}>
                {averageAttendance.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">Rescheduled</span>
              </div>
              <div className={`text-2xl font-bold ${
                (mentor.sessionsRescheduled || 0) >= 10 ? 'text-red-400' :
                (mentor.sessionsRescheduled || 0) >= 5 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {mentor.sessionsRescheduled || 0}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <UserX className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">Cancelled</span>
              </div>
              <div className={`text-2xl font-bold ${
                (mentor.sessionsCancelled || 0) >= 5 ? 'text-red-400' :
                (mentor.sessionsCancelled || 0) >= 2 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {mentor.sessionsCancelled || 0}
              </div>
            </div>
          </div>
        )}

        {/* Expertise */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Award className="w-4 h-4 inline mr-2" />
            Expertise
          </label>
          {mode === 'view' ? (
            <div className="flex flex-wrap gap-2">
              {(mentor?.expertise || []).map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              )) || <span className="text-gray-500 italic">No expertise listed</span>}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {editData.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium flex items-center space-x-1"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => setEditData({
                        ...editData,
                        expertise: editData.expertise.filter((_, i) => i !== index)
                      })}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value && !editData.expertise.includes(e.target.value)) {
                    setEditData({
                      ...editData,
                      expertise: [...editData.expertise, e.target.value]
                    });
                  }
                  e.target.value = '';
                }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                <option value="">Add expertise...</option>
                {expertiseOptions
                  .filter(skill => !editData.expertise.includes(skill))
                  .map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Student List (View Mode Only) */}
        {mode === 'view' && mentor && mentor.students.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Assigned Students ({mentor.students.length}/{mentor.maxStudents})
            </h4>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {(mentor.students || []).map((student) => (
                      <tr key={student.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-2 text-white text-sm">{student.name}</td>
                        <td className="px-4 py-2 text-gray-300 text-sm font-mono">{student.rollNo}</td>
                        <td className="px-4 py-2">
                          <span className={`text-sm font-medium ${getAttendanceColor(student.attendance)}`}>
                            {student.attendance}%
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            student.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'
                          }`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Join Date
            </label>
            {mode === 'view' ? (
              <div className="bg-gray-800 px-3 py-2 rounded-lg text-white">
                {mentor?.joinDate ? new Date(mentor.joinDate).toLocaleDateString() : 'N/A'}
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
                  mentor?.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'
                }`}>
                  {mentor?.status?.charAt(0).toUpperCase() + mentor?.status?.slice(1) || 'N/A'}
                </span>
              </div>
            ) : (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as Mentor['status'] })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-700">
          {/* Revoke Access Button (View Mode Only) */}
          {mode === 'view' && mentor && mentor.status === 'active' && onRevoke && (
            <button
              onClick={() => onRevoke(mentor)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <UserX className="w-4 h-4" />
              <span>Revoke Access</span>
            </button>
          )}

          {mode === 'view' && (!mentor || mentor.status !== 'active' || !onRevoke) && (
            <div></div>
          )}

          {/* Save/Cancel Actions */}
          {mode !== 'view' && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{mode === 'add' ? 'Add Mentor' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Warning for Inactive Mentors */}
        {mode === 'view' && mentor && mentor.status === 'inactive' && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">This mentor's access has been revoked</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MentorModal;