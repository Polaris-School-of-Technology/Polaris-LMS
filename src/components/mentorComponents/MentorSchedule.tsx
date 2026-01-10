import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Clock, Users, Video, CreditCard as Edit, Trash2, RotateCcw, X, Loader2 } from 'lucide-react';
import { useApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MentorSchedule: React.FC = () => {
  const api = useApi();
  const { user, token } = useAuth();
  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; sessionId: number | null }>({
    isOpen: false,
    sessionId: null
  });
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: '',
    reason: ''
  });
  const [scheduleModal, setScheduleModal] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [sessionData, setSessionData] = useState({
    section_id: '',
    session_type: 'theory',
    start_date: '',
    class_time: '',
    duration: 60,
    venue: '',
    session_title: '',
    program: '',
    cohort: '',
    location: ''
  });

  // Fetch batches and programs on modal open
  useEffect(() => {
    if (scheduleModal) {
      fetchBatches();
      fetchPrograms();
    }
  }, [scheduleModal]);

  // Fetch sections when batch is selected
  useEffect(() => {
    if (selectedBatchId) {
      fetchSections(selectedBatchId);
    }
  }, [selectedBatchId]);

  const fetchBatches = async () => {
    try {
      const data = await api.lms.mentors.getBatches();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const data = await api.lms.adminMentors.getAllCourses();
      setPrograms(data.courses || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSections = async (batchId: string) => {
    try {
      const data = await api.lms.mentors.getSections(batchId);
      // API returns array directly, not wrapped in object
      setSections(Array.isArray(data) ? data : data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    setSections([]);
    setSessionData({ ...sessionData, section_id: '' }); // Reset section when batch changes
  };

  type UiSession = {
    id: number;
    title: string;
    date: string; // ISO yyyy-mm-dd
    time: string; // HH:mm
    duration: number;
    students: number;
    program: string;
    cohort: string;
    status: string;
    recurring: 'none' | 'weekly';
    dateTime: Date; // original datetime for filtering
  };

  const [sessions, setSessions] = useState<UiSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);


        // Use getFacultyStudents API which returns sessions with student_count
        const resp = await api.lms.mentors.getFacultyStudents();

        const data = Array.isArray(resp) ? resp : (resp?.data ?? []);

        // Filter out specific batches (1, 5, 6, 7)
        const excludedBatches = [1, 5, 6, 7];
        const filteredData = (data as any[]).filter((s: any) => !excludedBatches.includes(Number(s.batch_id)));

        // Map to UiSession
        const mapped: UiSession[] = filteredData.map((s: any) => {
          const rawDt = s.session_datetime ?? s.sessionDate ?? s.dateTime ?? s.datetime;
          const dt = rawDt ? new Date(rawDt) : new Date();

          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          const hh = String(dt.getHours()).padStart(2, '0');
          const mi = String(dt.getMinutes()).padStart(2, '0');

          const rawStatus = (s.status ?? 'scheduled').toString().toLowerCase();
          const uiStatus = rawStatus === 'upcoming' ? 'scheduled' : rawStatus;

          return {
            id: Number(s.session_id ?? s.id ?? Date.now()),
            title: s.course_name ?? s.title ?? 'Session',
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${mi}`,
            duration: Number(s.duration ?? s.length ?? 60),
            students: Number(s.student_count ?? s.students ?? 0),
            program: s.course_name ?? s.program ?? '',
            cohort: s.course_code ?? s.cohort ?? '',
            status: uiStatus,
            recurring: (s.recurring === 'weekly') ? 'weekly' : 'none',
            dateTime: dt,
          } as UiSession;
        });

        if (isMounted) setSessions(mapped);
      } catch (err: any) {
        console.error('Error loading sessions:', err);
        if (isMounted) setError(err?.message ?? 'Failed to load sessions');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [api, token, user]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Week/Month filters based on selectedDate and session_datetime
  const startOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // Mon=0 ... Sun=6
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day);
    return date;
  };
  const endOfWeek = (d: Date) => {
    const start = startOfWeek(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return end;
  };
  const startOfMonth = (d: Date) => {
    const date = new Date(d.getFullYear(), d.getMonth(), 1);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const endOfMonth = (d: Date) => {
    const date = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const visibleSessions = useMemo(() => {
    if (!sessions.length) return [] as UiSession[];
    if (viewMode === 'week') {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return sessions.filter(s => s.dateTime >= start && s.dateTime < end);
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return sessions.filter(s => s.dateTime >= start && s.dateTime < end);
    }
  }, [sessions, viewMode, selectedDate]);

  const handleReschedule = (sessionId: number) => {
    setRescheduleModal({ isOpen: true, sessionId });
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setRescheduleData({
        date: session.date,
        time: session.time,
        reason: ''
      });
    }
  };

  const submitReschedule = () => {
    console.log('Rescheduling session:', rescheduleModal.sessionId, rescheduleData);
    setRescheduleModal({ isOpen: false, sessionId: null });
    setRescheduleData({ date: '', time: '', reason: '' });
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({ isOpen: false, sessionId: null });
    setRescheduleData({ date: '', time: '', reason: '' });
  };

  const openScheduleModal = () => {
    setScheduleModal(true);
  };

  const closeScheduleModal = () => {
    setScheduleModal(false);
    setSelectedBatchId('');
    setSections([]);
    setPrograms([]);
    setSessionData({
      section_id: '',
      session_type: 'theory',
      start_date: '',
      class_time: '',
      duration: 60,
      venue: '',
      session_title: '',
      program: '',
      cohort: '',
      location: ''
    });
  };

  const handleScheduleSession = async () => {
    try {
      setLoading(true);

      const sessionPayload = {
        section_id: parseInt(sessionData.section_id),
        faculty_id: user?.id,
        session_type: sessionData.session_type,
        start_date: sessionData.start_date,
        class_time: sessionData.class_time,
        duration: sessionData.duration,
        venue: sessionData.venue
      };

      await api.lms.mentors.addSession(sessionPayload);

      alert('Session scheduled successfully!');
      closeScheduleModal();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'postponed':
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-900 border-yellow-200';
      case 'live':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">Manage your sessions and create new ones.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
            >
              Month
            </button>
          </div>
          <button
            onClick={openScheduleModal}
            className="flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <Calendar className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {loading && (
            <div className="text-gray-500">Loading sessions...</div>
          )}
          {error && (
            <div className="text-red-600">{error}</div>
          )}
          {!loading && !error && visibleSessions.map((session) => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{session.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    {session.recurring !== 'none' && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                        Recurring {session.recurring}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(session.time)} ({session.duration}min)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{session.students} students</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{session.program}</span> • {session.cohort}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors duration-200">
                    <Video className="h-4 w-4" />
                    <span>Start</span>
                  </button>
                  <button
                    onClick={() => handleReschedule(session.id)}
                    className="p-2 text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                    title="Reschedule session"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Schedule Form */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Title</label>
            <input
              type="text"
              placeholder="Enter session title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
              <option value="180">180 minutes</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end mt-4">
          <button className="flex items-center space-x-2 bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200">
            <Plus className="h-4 w-4" />
            <span>Schedule Session</span>
          </button>
        </div>
      </div> */}

      {/* Reschedule Modal */}
      {rescheduleModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Reschedule Session</h3>
              <button
                onClick={closeRescheduleModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                <input
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rescheduling</label>
                <textarea
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                  placeholder="Optional: Explain why you're rescheduling this session..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Students will be automatically notified of the schedule change via email and in-app notifications.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeRescheduleModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                className="flex items-center space-x-2 bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reschedule Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule New Session Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Schedule New Session</h3>
              <button
                onClick={closeScheduleModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Batch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-[length:16px_16px] bg-[position:right_0.5rem_center] bg-no-repeat"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")" }}
                  required
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name} {batch.academic_year && batch.semester ? `(${batch.academic_year} - Sem ${batch.semester})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selection (shows after batch is selected) */}
              {selectedBatchId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course/Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sessionData.section_id}
                    onChange={(e) => setSessionData({ ...sessionData, section_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-[length:16px_16px] bg-[position:right_0.5rem_center] bg-no-repeat"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")" }}
                    required
                  >
                    <option value="">Select Course/Section</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.course_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={sessionData.session_type}
                  onChange={(e) => setSessionData({ ...sessionData, session_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-[length:16px_16px] bg-[position:right_0.5rem_center] bg-no-repeat"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")" }}
                  required
                >
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                </select>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue <span className="text-red-500">*</span>
                </label>
                <select
                  value={sessionData.venue}
                  onChange={(e) => setSessionData({ ...sessionData, venue: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-[length:16px_16px] bg-[position:right_0.5rem_center] bg-no-repeat"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")" }}
                  required
                >
                  <option value="">Select Venue</option>
                  <option value="Room 101">Room 101</option>
                  <option value="Room 102">Room 102</option>
                  <option value="Room 203">Room 203</option>
                  <option value="Lab A">Lab A</option>
                  <option value="Lab B">Lab B</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              {/* Session Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sessionData.session_title}
                  onChange={(e) => setSessionData({ ...sessionData, session_title: e.target.value })}
                  placeholder="e.g., React Fundamentals"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={sessionData.start_date}
                  onChange={(e) => setSessionData({ ...sessionData, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={sessionData.class_time}
                  onChange={(e) => setSessionData({ ...sessionData, class_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <select
                  value={sessionData.duration}
                  onChange={(e) => setSessionData({ ...sessionData, duration: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-[length:16px_16px] bg-[position:right_0.5rem_center] bg-no-repeat"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")" }}
                  required
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                  <option value="150">150 minutes</option>
                  <option value="180">180 minutes</option>
                </select>
              </div>

              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <select
                  value={sessionData.program}
                  onChange={(e) => setSessionData({ ...sessionData, program: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-[length:16px_16px] bg-[position:right_0.5rem_center] bg-no-repeat"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")" }}
                >
                  <option value="">Select Program (Optional)</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.course_name || program.name}>
                      {program.course_name || program.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cohort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cohort</label>
                <input
                  type="text"
                  value={sessionData.cohort}
                  onChange={(e) => setSessionData({ ...sessionData, cohort: e.target.value })}
                  placeholder="e.g., 2024-A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={sessionData.location}
                  onChange={(e) => setSessionData({ ...sessionData, location: e.target.value })}
                  placeholder="Physical location or coordinates"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeScheduleModal}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSession}
                disabled={loading || !sessionData.section_id || !sessionData.start_date || !sessionData.class_time || !sessionData.venue}
                className="flex items-center space-x-2 bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Schedule Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorSchedule;