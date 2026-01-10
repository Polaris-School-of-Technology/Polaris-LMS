import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Batch, Student } from '../../types';
import { useApi } from '../../services/api';

interface BatchDetailsProps {
  batch: Batch;
  onBack: () => void;
}

const BatchDetails: React.FC<BatchDetailsProps> = ({ batch, onBack }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'sessions'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(1000);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [customBatchId, setCustomBatchId] = useState<string>(batch.id);
  const api = useApi();

  useEffect(() => {
    setCustomBatchId(batch.id);
  }, [batch.id]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'sessions' && selectedDate && (customBatchId?.trim() || batch.id)) {
      // Auto-fetch sessions when date and batchId are both available
      fetchSessions();
    }
  }, [activeTab, page, batch.id, selectedDate, customBatchId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.lms.batches.getBatchStudents(batch.id, page, limit);
      
      const rawStudents =
        response?.students ||
        response?.data?.students ||
        response?.data ||
        response ||
        [];

      const normalizedStudents: Student[] = Array.isArray(rawStudents)
        ? rawStudents.map((student: any) => {
            const profile = student.profiles || student.profile || {};
            const statusValue = (student.status || 'active').toString().toLowerCase();
            const status: Student['status'] =
              statusValue === 'inactive' ? 'inactive' : 'active';

            return {
              id: profile.id || student.user_id || student.id || '',
              name: profile.name || student.name || 'Unnamed Student',
              rollNo: student.rollNo || student.roll_no || '—',
              email: profile.email || student.email || '—',
              batch: batch.name || batch.id,
              program: student.program || '—',
              mentorGroup: student.mentorGroup || undefined,
              attendance: Number(student.attendance ?? 0),
              status,
              joinDate: student.joinDate || student.created_at || '',
            };
          })
        : [];

      setStudents(normalizedStudents);

      const totalValue =
        response?.total ??
        response?.data?.total ??
        normalizedStudents.length;
      setTotalStudents(totalValue);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      if (!selectedDate) {
        setDateError('Please choose a date to load sessions.');
        setSessions([]);
        return;
      }

      const targetBatchId = customBatchId?.trim() || batch.id;
      if (!targetBatchId) {
        setDateError('Batch ID is required.');
        setSessions([]);
        return;
      }

      setLoading(true);
      setError(null);
      setDateError(null);
      
      console.log('Fetching sessions for batch:', targetBatchId, 'date:', selectedDate);
      const response = await api.lms.batches.getBatchSessions(targetBatchId, selectedDate);
      
      // Handle different response structures
      let sessionsData: any[] = [];
      if (Array.isArray(response)) {
        sessionsData = response;
      } else if (Array.isArray(response?.sessions)) {
        sessionsData = response.sessions;
      } else if (Array.isArray(response?.data)) {
        sessionsData = response.data;
      } else if (response?.data && Array.isArray(response.data.sessions)) {
        sessionsData = response.data.sessions;
      }
      
      // Normalize session data to ensure consistent field names
      const normalizedSessions = sessionsData.map((session: any) => {
        // Extract title from multiple possible field names
        const title = session.title || 
                     session.course_name || 
                     session.session_title || 
                     session.name ||
                     session.course_code ||
                     `Session ${session.id || ''}`;
        
        // Extract start time from multiple possible field names
        const startTime = session.startTime || 
                         session.start_time || 
                         session.session_datetime || 
                         session.sessionDateTime ||
                         session.datetime;
        
        // Calculate end time from start time + duration (if not provided)
        let endTime = session.endTime || session.end_time || session.endDateTime;
        
        if (!endTime && startTime && session.duration) {
          try {
            const startDate = new Date(startTime);
            // Duration is in minutes, convert to milliseconds
            const durationMs = (typeof session.duration === 'number' ? session.duration : parseInt(session.duration)) * 60 * 1000;
            const endDate = new Date(startDate.getTime() + durationMs);
            endTime = endDate.toISOString();
          } catch (e) {
            console.warn('Could not calculate end time:', e);
          }
        }
        
        // Extract status
        const status = session.status || 'scheduled';
        
        return {
          ...session,
          title,
          startTime,
          endTime,
          status,
          // Keep original id
          id: session.id || session.session_id || session.sessionId
        };
      });
      
      console.log('Sessions fetched:', normalizedSessions.length, 'Sample:', normalizedSessions[0]);
      setSessions(normalizedSessions);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load sessions';
      setError(errorMessage);
      setDateError(errorMessage);
      setSessions([]);
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the batch?')) {
      return;
    }

    try {
      await api.lms.batches.removeStudentFromBatch(batch.id, studentId);
      fetchStudents(); // Refresh list
    } catch (err: any) {
      alert('Failed to remove student: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{batch.name}</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Batch Details</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'students'
              ? 'text-yellow-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Students</span>
          </div>
          {activeTab === 'students' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-4 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'text-yellow-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Scheduled Sessions</span>
          </div>
          {activeTab === 'sessions' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-400 mb-2">Error</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        ) : activeTab === 'students' ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Email</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-800/50">
                      <td className="px-4 sm:px-6 py-4 text-white">{student.name}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-300">{student.email}</td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-colors"
                          title="Remove Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No students found in this batch
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Student Count and Pagination Info */}
            <div className="px-6 py-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-gray-400 text-sm">
                Showing {students.length} {totalStudents > students.length ? `of ${totalStudents} ` : ''}students
              </div>
              {totalStudents > limit && (
                <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
                  <span className="text-gray-400 text-sm">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={students.length < limit}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 mb-6">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Batch ID</label>
                <input
                  type="text"
                  value={customBatchId}
                  placeholder={`e.g. ${batch.id}`}
                  onChange={(e) => setCustomBatchId(e.target.value)}
                  className="w-full h-12 bg-gray-800 text-white px-4 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to use the selected batch automatically.</p>
              </div>
              <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                  placeholder="e.g. 2025-11-25"
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setSelectedDate(nextValue);
                    setDateError(nextValue ? null : 'Please choose a date to load sessions.');
                  }}
                  className="w-full h-12 bg-gray-800 text-white px-4 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none appearance-none"
                />
                <p className={`text-xs mt-1 ${dateError ? 'text-red-400' : 'text-gray-500'}`}>
                  {dateError || 'Select a date to fetch sessions.'}
                </p>
              </div>
              <div className="flex-1 md:flex-none md:w-auto lg:w-[160px] w-full pt-4 md:pt-0">
                <button
                  onClick={fetchSessions}
                  className="w-full h-12 px-4 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedDate}
                >
                  Load Sessions
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {sessions.map((session: any) => {
                // Get title from normalized field or fallback to other possible fields
                const sessionTitle = session.title || 
                                   session.course_name || 
                                   session.session_title || 
                                   session.name ||
                                   session.course_code ||
                                   `Session ${session.id || ''}`;
                
                // Format datetime for display
                const formatTime = (timeStr: string | Date) => {
                  if (!timeStr) return 'N/A';
                  try {
                    const date = typeof timeStr === 'string' ? new Date(timeStr) : timeStr;
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    return 'N/A';
                  }
                };
                
                const startTime = session.startTime || session.start_time || session.session_datetime;
                const endTime = session.endTime || session.end_time;
                
                // Get additional info from response
                const facultyName = session.faculty_name || session.facultyName || '';
                const venue = session.venue || '';
                const sessionType = session.session_type || session.sessionType || '';
                const duration = session.duration ? `${session.duration} min` : '';
                
                return (
                  <div key={session.id || Math.random()} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="w-full sm:flex-1">
                        <h3 className="text-white font-medium mb-2">{sessionTitle}</h3>
                        <div className="space-y-1 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <span>🕐</span>
                            <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                            {duration && <span className="text-gray-500">({duration})</span>}
                          </div>
                          {facultyName && (
                            <div className="flex items-center gap-2">
                              <span>👤</span>
                              <span>{facultyName}</span>
                            </div>
                          )}
                          {venue && (
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span>{venue}</span>
                            </div>
                          )}
                          {sessionType && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 capitalize">
                                {sessionType}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right sm:text-left sm:flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          session.status === 'completed' ? 'bg-green-400/10 text-green-400' :
                          session.status === 'scheduled' ? 'bg-blue-400/10 text-blue-400' :
                          'bg-gray-400/10 text-gray-400'
                        }`}>
                          {session.status || 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No sessions scheduled for this date
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetails;
