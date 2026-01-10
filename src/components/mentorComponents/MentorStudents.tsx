import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, CalendarCheck } from 'lucide-react';
import { useApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SessionFeedbackModal from './SessionFeedbackModal';
import WeeklyFeedbackModal from './WeeklyFeedbackModal';

interface SessionStudent {
  enrollment_id: number;
  student_id: string;
  student_name: string;
  student_email: string | null;
  batch_id: number;
  section_id: number;
  enrollment_date: string;
  attendance_status: string; // Updated with multimedia service data (50% threshold)
  has_feedback: boolean;
}

interface SessionData {
  session_id: number;
  session_datetime: string;
  duration: number;
  venue: string;
  status: string;
  course_id: number;
  course_name: string;
  course_code: string;
  student_count: number;
  students: SessionStudent[];
  has_more: boolean;
}

const MentorStudents: React.FC = () => {
  const [previousSessions, setPreviousSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isWeeklyFeedbackModalOpen, setIsWeeklyFeedbackModalOpen] = useState(false);

  const { user } = useAuth();
  const userId = user?.id;
  const api = useApi();

  const isFeedbackModalOpenRef = React.useRef(isFeedbackModalOpen);

  useEffect(() => {
    isFeedbackModalOpenRef.current = isFeedbackModalOpen;
  }, [isFeedbackModalOpen]);

  useEffect(() => {
    console.log('MentorStudents mounted');
    console.log('User:', user);
    console.log('UserId:', userId);
    fetchSessions();

    // Refresh sessions every 30 seconds to get updated attendance data
    // This ensures attendance marked by webhook (50% threshold) is reflected in UI
    // Skip refresh if feedback modal is open to prevent data loss
    // const refreshInterval = setInterval(() => {
    //   if (!isFeedbackModalOpenRef.current) {
    //     fetchSessions();
    //   }
    // }, 30000); // 30 seconds

    // return () => {
    //   clearInterval(refreshInterval);
    // };
  }, []);

  const fetchSessions = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await api.lms.adminSchedule.getFacultySessions(userId);

      const sessions = response.data || [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const lastWeekSessions = sessions.filter((session: SessionData) => {
        const sessionDate = new Date(session.session_datetime);
        return sessionDate >= sevenDaysAgo && sessionDate <= now;
      });

      setPreviousSessions(lastWeekSessions.sort((a: SessionData, b: SessionData) =>
        new Date(b.session_datetime).getTime() - new Date(a.session_datetime).getTime()
      ));
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackModal = (session: SessionData) => {
    setSelectedSession(session);
    setIsFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedSession(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Users className="h-8 w-8 text-blue-500 mx-auto" />
          </div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-jakarta">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Session Feedback</h1>
          <p className="text-gray-400 mt-1">Add feedback for students after each completed session.</p>
        </div>
      </div>

      {/* Weekly Feedback Button */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-xl border border-yellow-500/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-yellow-500" />
              Weekly Feedback
            </h2>
            <p className="text-gray-400 text-sm">Submit general weekly performance feedback</p>
          </div>
          <button
            onClick={() => setIsWeeklyFeedbackModalOpen(true)}
            className="flex items-center space-x-2 bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-semibold"
          >
            <Plus className="h-5 w-5" />
            <span>Add Weekly Feedback</span>
          </button>
        </div>
      </div>

      {/* Previous Sessions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Previous Sessions (Last 7 Days)</h2>
        {previousSessions.length === 0 ? (
          <p className="text-gray-400">No sessions in the last 7 days</p>
        ) : (
          <div className="space-y-4">
            {previousSessions.map((session, index) => (
              <div key={`session-${session.session_id}-${index}`} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{session.course_name}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(session.session_datetime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{session.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{session.student_count} students</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{session.course_code}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openFeedbackModal(session)}
                      className="flex items-center space-x-2 bg-[#FFC540] text-black px-4 py-2 rounded-lg hover:bg-[#e6b139] transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Feedback</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Feedback Modal */}
      {isFeedbackModalOpen && selectedSession && userId && (
        <SessionFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={closeFeedbackModal}
          session={selectedSession}
          mentorId={userId}
        />
      )}

      {/* Weekly Feedback Modal */}
      {isWeeklyFeedbackModalOpen && userId && (
        <WeeklyFeedbackModal
          isOpen={isWeeklyFeedbackModalOpen}
          onClose={() => setIsWeeklyFeedbackModalOpen(false)}
          mentorId={userId}
        />
      )}
    </div>
  );
};

export default MentorStudents;
