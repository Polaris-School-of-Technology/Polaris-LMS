import React, { useState, useEffect } from 'react';
import { X, Users, BookOpen, Calendar, Clock, AlertTriangle, Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import type { Program } from '../types';
import { useApi } from '../services/api';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
  mode: 'view' | 'edit';
}

const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, program, mode }) => {
  const [editData, setEditData] = useState(program || {
    id: '',
    name: '',
    cohort: '',
    sessions: 0,
    status: 'active' as Program['status'],
    startDate: '',
    endDate: '',
    assignedMentor: null
  });

  const [showMentorDropdown, setShowMentorDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rescheduleFilter, setRescheduleFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'mentor' | 'reschedules'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reschedules, setReschedules] = useState<any[]>([]);
  const [loadingReschedules, setLoadingReschedules] = useState(false);
  const [batches, setBatches] = useState<Array<{id: number, batch_name: string, academic_year: string, semester: number}>>([]);
  const [faculties, setFaculties] = useState<Array<{user_id: string, name: string}>>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number>(1);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const api = useApi();

  // Fetch reschedule data when modal opens and program is selected
  useEffect(() => {
    if (isOpen && program && mode === 'view') {
      const fetchReschedules = async () => {
        try {
          setLoadingReschedules(true);
          const courseId = parseInt(program.id);
          if (!isNaN(courseId)) {
            const rescheduleData = await api.ums.programs.getReschedules(courseId);
            setReschedules(rescheduleData.data || []);
          }
        } catch (error) {
          setReschedules([]);
        } finally {
          setLoadingReschedules(false);
        }
      };

      fetchReschedules();
    }
  }, [isOpen, program, mode, api.ums.programs]);

  // Fetch batches and faculties when creating a new program
  useEffect(() => {
    if (isOpen && mode === 'edit' && !program) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [batchesResponse, facultiesResponse] = await Promise.all([
            api.lms.adminMentors.getAllBatches(),
            api.lms.adminPrograms.getAllFaculties()
          ]);
          
          if (batchesResponse.batches) {
            setBatches(batchesResponse.batches);
            if (batchesResponse.batches.length > 0) {
              setSelectedBatchId(batchesResponse.batches[0].id);
            }
          }
          
          if (facultiesResponse.faculties) {
            setFaculties(facultiesResponse.faculties);
            if (facultiesResponse.faculties.length > 0) {
              setSelectedFacultyId(facultiesResponse.faculties[0].user_id);
            }
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen, mode, program, api.lms.mentors, api.lms.programs]);

  const mockMentors = [
    { id: '1', name: 'Dr. Sarah Wilson', status: 'available' },
    { id: '2', name: 'Prof. Michael Chen', status: 'busy' },
    { id: '3', name: 'Ms. Emily Rodriguez', status: 'available' },
    { id: '4', name: 'Dr. James Thompson', status: 'offline' }
  ];

  // Mock reschedule data
  const mockReschedules = [
    {
      id: '1',
      mentorName: 'Dr. Sarah Wilson',
      sessionId: 'FS-101',
      sessionTitle: 'React Fundamentals',
      originalDateTime: '2024-01-15T10:00:00',
      rescheduledDateTime: '2024-01-16T14:00:00',
      rescheduleCount: 3
    },
    {
      id: '2',
      mentorName: 'Prof. Michael Chen',
      sessionId: 'DS-201',
      sessionTitle: 'Data Analysis Workshop',
      originalDateTime: '2024-01-14T09:00:00',
      rescheduledDateTime: '2024-01-17T11:00:00',
      rescheduleCount: 1
    },
    {
      id: '3',
      mentorName: 'Ms. Emily Rodriguez',
      sessionId: 'UX-301',
      sessionTitle: 'User Research Methods',
      originalDateTime: '2024-01-13T15:00:00',
      rescheduledDateTime: '2024-01-15T16:00:00',
      rescheduleCount: 2
    },
    {
      id: '4',
      mentorName: 'Dr. Sarah Wilson',
      sessionId: 'FS-102',
      sessionTitle: 'State Management',
      originalDateTime: '2024-01-12T13:00:00',
      rescheduledDateTime: '2024-01-14T10:00:00',
      rescheduleCount: 3
    }
  ];

  const filteredMentors = mockMentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Transform real reschedule data to match the expected format
  const transformedReschedules = reschedules.map((reschedule: any) => ({
    id: reschedule.id.toString(),
    mentorName: reschedule.profiles?.name || 'Unknown Mentor',
    sessionId: `SES-${reschedule.id}`,
    sessionTitle: 'Class Session',
    originalDateTime: reschedule.session_datetime,
    rescheduledDateTime: reschedule.rescheduled_date_time,
    rescheduleCount: reschedule.rescheduled_count || 1
  }));

  // Filter and sort reschedules
  const filteredReschedules = transformedReschedules
    .filter(reschedule => {
      if (rescheduleFilter !== 'all' && reschedule.mentorName !== rescheduleFilter) return false;
      if (dateRangeFilter !== 'all') {
        const rescheduleDate = new Date(reschedule.rescheduledDateTime);
        const now = new Date();
        const daysAgo = (now.getTime() - rescheduleDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dateRangeFilter === 'week' && daysAgo > 7) return false;
        if (dateRangeFilter === 'month' && daysAgo > 30) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'mentor':
          aValue = a.mentorName;
          bValue = b.mentorName;
          break;
        case 'reschedules':
          aValue = a.rescheduleCount;
          bValue = b.rescheduleCount;
          break;
        case 'date':
        default:
          aValue = new Date(a.rescheduledDateTime).getTime();
          bValue = new Date(b.rescheduledDateTime).getTime();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

  // Calculate summary statistics
  const totalReschedules = transformedReschedules.length;
  const mentorRescheduleCounts = transformedReschedules.reduce((acc, reschedule) => {
    acc[reschedule.mentorName] = (acc[reschedule.mentorName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topRescheduler = Object.entries(mentorRescheduleCounts)
    .sort(([,a], [,b]) => b - a)[0];

  const handleSave = async () => {
    if (mode === 'edit' && !program) {
      // Creating a new program
      try {
        setLoading(true);
        
        if (faculties.length === 0) {
          alert('No faculties available. Please add a faculty first.');
          return;
        }

        if (batches.length === 0) {
          alert('No batches available. Please add a batch first.');
          return;
        }

        const programData = {
          courseName: editData.name,
          batchId: selectedBatchId,
          startDate: editData.startDate,
          endDate: editData.endDate,
          facultyId: selectedFacultyId,
          active: editData.status,
          sessions: editData.sessions,
          theoryHours: 30, // Default values
          practicalHours: 30
        };

        const result = await api.lms.adminPrograms.createProgram(programData);
        
        if (result.message === 'Course created successfully.') {
          alert('Program created successfully!');
          onClose();
        } else {
          alert('Failed to create program: ' + (result.error || 'Unknown error'));
        }
      } catch (error: any) {
        alert('Error creating program: ' + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Editing existing program or just closing
      onClose();
    }
  };

  const handleMentorSelect = (mentor: any) => {
    setEditData({ ...editData, assignedMentor: mentor });
    setShowMentorDropdown(false);
    setSearchTerm('');
  };

  const handleSort = (field: 'date' | 'mentor' | 'reschedules') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'edit': return program ? 'Edit Program' : 'Add New Program';
      case 'view': return 'Program Details';
      default: return 'Program';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-center min-h-screen px-6 py-8">
        <div className="modal-backdrop" onClick={onClose} />

        <div className="modal-content relative w-full max-w-6xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-800">
            <h3 className="text-xl font-bold text-white">{getModalTitle()}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-all duration-200 p-2 hover:bg-gray-800/50 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-8 overflow-y-auto max-h-[calc(95vh-120px)]">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              {/* Program Name and Cohort - Always 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Program Name
                  </label>
                  {mode === 'view' ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                      {program?.name || 'N/A'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      placeholder="Enter program name"
                      required
                    />
                  )}
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Cohort
                  </label>
                  {mode === 'view' ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                      {program?.cohort || 'N/A'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editData.cohort}
                      onChange={(e) => setEditData({ ...editData, cohort: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      placeholder="Enter cohort name"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Batch and Faculty Selection - Only show when creating new program */}
              {mode === 'edit' && !program && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Batch
                    </label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(parseInt(e.target.value))}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      disabled={loading}
                    >
                      <option value="">{loading ? 'Loading batches...' : 'Select Batch'}</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batch_name} ({batch.academic_year} - Semester {batch.semester})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Faculty
                    </label>
                    <select
                      value={selectedFacultyId}
                      onChange={(e) => setSelectedFacultyId(e.target.value)}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      disabled={loading}
                    >
                      <option value="">{loading ? 'Loading faculties...' : 'Select Faculty'}</option>
                      {faculties.map((faculty) => (
                        <option key={faculty.user_id} value={faculty.user_id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Form Fields Grid - Responsive 2/3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Assigned Mentor */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 relative">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Assigned Mentor
                  </label>
                  {mode === 'view' ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                      {program?.assignedMentor?.name || (
                        <span className="text-gray-500 italic">No mentor assigned</span>
                      )}
                    </div>
                  ) : (
                    <div className="relative z-50">
                      <button
                        type="button"
                        onClick={() => setShowMentorDropdown(!showMentorDropdown)}
                        className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200 flex items-center justify-between hover:bg-gray-700/50"
                      >
                        <span className={editData.assignedMentor ? 'text-white' : 'text-gray-400'}>
                          {editData.assignedMentor ? editData.assignedMentor.name : 'Select Mentor'}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showMentorDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-56 overflow-y-auto">
                          <div className="p-3 border-b border-gray-700">
                            <input
                              type="text"
                              placeholder="Search mentors..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                            />
                          </div>
                          {filteredMentors.map((mentor) => (
                            <button
                              key={mentor.id}
                              type="button"
                              onClick={() => handleMentorSelect(mentor)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors flex items-center justify-between border-b border-gray-700/50 last:border-b-0"
                            >
                              <div className="flex items-center">
                                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${getStatusColor(mentor.status)}`}></div>
                                <span className="text-white font-medium">{mentor.name}</span>
                              </div>
                              {editData.assignedMentor?.id === mentor.id && (
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sessions */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Sessions
                  </label>
                  {mode === 'view' ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg">
                      <span className="text-2xl font-bold text-white">{program?.sessions || 0}</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={editData.sessions}
                      onChange={(e) => setEditData({ ...editData, sessions: parseInt(e.target.value) || 0 })}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  )}
                </div>

                {/* Status */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Status
                  </label>
                  {mode === 'view' ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        program?.status === 'active' ? 'text-green-400 bg-green-400/10' :
                        program?.status === 'completed' ? 'text-yellow-400 bg-yellow-400/10' :
                        'text-gray-400 bg-gray-400/10'
                      }`}>
                        {program?.status ? program.status.charAt(0).toUpperCase() + program.status.slice(1) : 'N/A'}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as Program['status'] })}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Date Fields - Always 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Start Date
                  </label>
                  {mode === 'view' ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                      {program?.startDate ? new Date(program.startDate).toLocaleDateString() : 'N/A'}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={editData.startDate}
                      onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      required
                    />
                  )}
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    End Date
                  </label>
                  {mode === 'view' ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                      {program?.endDate ? new Date(program.endDate).toLocaleDateString() : 'N/A'}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={editData.endDate}
                      onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Mentor Reschedules Section */}
              {mode === 'view' && (
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                      Mentor Reschedules
                    </h3>
                    <p className="text-gray-400 text-sm">Track and manage session reschedules across all mentors</p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Total Reschedules</span>
                        <Calendar className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-2xl font-bold text-white">{totalReschedules}</div>
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Most Reschedules</span>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="text-lg font-bold text-white truncate">
                        {topRescheduler ? topRescheduler[0] : 'N/A'}
                      </div>
                      <div className="text-sm text-red-400">
                        {topRescheduler ? `${topRescheduler[1]} reschedules` : ''}
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">This Week</span>
                        <Clock className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {mockReschedules.filter(r => {
                          const rescheduleDate = new Date(r.rescheduledDateTime);
                          const now = new Date();
                          const daysAgo = (now.getTime() - rescheduleDate.getTime()) / (1000 * 60 * 60 * 24);
                          return daysAgo <= 7;
                        }).length}
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Filter className="w-4 h-4 inline mr-2" />
                        Filter by Mentor
                      </label>
                      <select
                        value={rescheduleFilter}
                        onChange={(e) => setRescheduleFilter(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      >
                        <option value="all">All Mentors</option>
                        {mockMentors.map((mentor) => (
                          <option key={mentor.id} value={mentor.name}>
                            {mentor.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Date Range
                      </label>
                      <select
                        value={dateRangeFilter}
                        onChange={(e) => setDateRangeFilter(e.target.value)}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      >
                        <option value="all">All Time</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <ArrowUpDown className="w-4 h-4 inline mr-2" />
                        Sort By
                      </label>
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortBy(field as 'date' | 'mentor' | 'reschedules');
                          setSortOrder(order as 'asc' | 'desc');
                        }}
                        className="w-full h-10 px-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      >
                        <option value="date-desc">Most Recent</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="mentor-asc">Mentor A-Z</option>
                        <option value="mentor-desc">Mentor Z-A</option>
                        <option value="reschedules-desc">Most Reschedules</option>
                        <option value="reschedules-asc">Least Reschedules</option>
                      </select>
                    </div>
                  </div>

                  {/* Reschedules Table */}
                  <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                    {loadingReschedules ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
                          <p className="text-gray-400">Loading reschedule data...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left">
                                <button
                                  onClick={() => handleSort('mentor')}
                                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                                >
                                  <span className="text-xs font-medium uppercase tracking-wider">Mentor</span>
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Session
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Original Time
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Rescheduled Time
                              </th>
                              <th className="px-4 py-3 text-left">
                                <button
                                  onClick={() => handleSort('reschedules')}
                                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                                >
                                  <span className="text-xs font-medium uppercase tracking-wider">Count</span>
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {filteredReschedules.map((reschedule) => (
                              <tr key={reschedule.id} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="text-white font-medium">{reschedule.mentorName}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-300">
                                    <div className="font-mono text-sm text-yellow-400">{reschedule.sessionId}</div>
                                    <div className="text-sm">{reschedule.sessionTitle}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-300 text-sm">
                                    <div>{new Date(reschedule.originalDateTime).toLocaleDateString()}</div>
                                    <div className="text-gray-400">{new Date(reschedule.originalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-300 text-sm">
                                    <div>{new Date(reschedule.rescheduledDateTime).toLocaleDateString()}</div>
                                    <div className="text-gray-400">{new Date(reschedule.rescheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    reschedule.rescheduleCount >= 3 ? 'text-red-400 bg-red-400/10' :
                                    reschedule.rescheduleCount >= 2 ? 'text-yellow-400 bg-yellow-400/10' :
                                    'text-green-400 bg-green-400/10'
                                  }`}>
                                    {reschedule.rescheduleCount}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!loadingReschedules && filteredReschedules.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No reschedules found matching your filters.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {mode !== 'view' && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {program ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      program ? 'Save Changes' : 'Create Program'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramModal;