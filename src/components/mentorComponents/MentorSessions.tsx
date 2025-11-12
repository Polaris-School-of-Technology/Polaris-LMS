import React, { useState, useEffect } from 'react';
import { Video, Users, Clock, Play, Square, Settings, Mic, MicOff, Camera, CameraOff, AlertCircle } from 'lucide-react';
import { useApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface SessionData {
  id: number;
  section_id: number;
  session_datetime: string;
  duration: number;
  venue: string;
  status: string;
  attendance_token: string;
  token_expires_at: string;
  session_type: string;
  actual_faculty_id: string;
  created_at: string;
  session_location_coordinates: null | string;
  is_live: boolean;
  rescheduled_date_time: null | string;
  rescheduled_count: null | number;
  course_id: number;
  course_code: string;
  course_name: string;
}

interface ActiveSession extends SessionData {
  startTime: string;
  participants: number;
  maxParticipants: number;
  recording: boolean;
}

interface SessionStats {
  sessionsToday: number;
  totalParticipants: number;
  sessionHours: number;
}

const MentorSessions: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionData[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    sessionsToday: 0,
    totalParticipants: 0,
    sessionHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const facultyId = user?.id;
  
  const api = useApi();

  const [sessionControls, setSessionControls] = useState({
    mic: true,
    camera: true,
    recording: true
  });

  useEffect(() => {
    fetchSessions();
    fetchSessionStats();
  }, []);

  const fetchSessionStats = async () => {
    try {
      const [todayClassesRes, participantsRes, hoursRes] = await Promise.all([
        api.lms.mentors.getTodayClasses(),
        api.lms.mentors.getTotalParticipants(),
        api.lms.mentors.getTodayClassesHours()
      ]);

      setSessionStats({
        sessionsToday: todayClassesRes.data?.total_classes || 0,
        totalParticipants: participantsRes.data?.total_participants || 0,
        sessionHours: hoursRes.data?.total_hours || 0
      });
    } catch (err) {
      console.error('Error fetching session stats:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.lms.adminSchedule.getFacultySessions(facultyId);
      
      console.log('API Response:', response);
      console.log('Sessions data:', response.data);

      const sessions = response.data || [];
      const now = new Date();
      const active: ActiveSession[] = [];
      const upcoming: SessionData[] = [];

      sessions.forEach((session: SessionData) => {
        const sessionDate = new Date(session.session_datetime);
        const sessionEnd = new Date(sessionDate.getTime() + session.duration * 60000);

        if (sessionDate <= now && now <= sessionEnd && session.status !== 'completed' && session.status !== 'cancelled') {
          active.push({
            ...session,
            startTime: sessionDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            participants: 8,
            maxParticipants: 8,
            recording: true
          });
        } 
        else if (sessionDate > now && session.status !== 'cancelled' && session.status !== 'completed') {
          upcoming.push(session);
        }
      });

      setActiveSessions(active);
      setUpcomingSessions(upcoming.sort((a, b) => 
        new Date(a.session_datetime).getTime() - new Date(b.session_datetime).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleControl = (control: keyof typeof sessionControls) => {
    setSessionControls(prev => ({
      ...prev,
      [control]: !prev[control]
    }));
  };

  const startSession = (sessionId: number) => {
    const sessionToStart = upcomingSessions.find(s => s.id === sessionId);
    if (!sessionToStart) return;

    const activeSession: ActiveSession = {
      ...sessionToStart,
      startTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      participants: 8,
      maxParticipants: 8,
      recording: true
    };

    setActiveSessions(prev => [...prev, activeSession]);
    setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId));
    console.log(`Starting session ${sessionId}`);
  };

  const endSession = (sessionId: number) => {
    setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
    console.log(`Ending session ${sessionId}`);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Video className="h-8 w-8 text-blue-500 mx-auto" />
          </div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600 mt-1">Manage your active and upcoming live sessions.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              fetchSessions();
              fetchSessionStats();
            }}
            className="flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200"
          >
            <Video className="h-4 w-4" />
            <span>Refresh Sessions</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              Active Sessions
            </h2>
          </div>
          
          <div className="p-6">
            {activeSessions.map((session) => (
              <div key={session.id} className="border-2 border-red-200 bg-red-50 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{session.course_name}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Started at {session.startTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>{formatDuration(session.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{session.participants}/{session.maxParticipants} joined</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{session.course_code}</span> • {session.session_type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                      LIVE
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-red-200">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleControl('mic')}
                      className={`p-3 rounded-full transition-colors duration-200 ${
                        sessionControls.mic 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {sessionControls.mic ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => toggleControl('camera')}
                      className={`p-3 rounded-full transition-colors duration-200 ${
                        sessionControls.camera 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {sessionControls.camera ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                    </button>
                    <button className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200">
                      <Settings className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${session.recording ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                      <span>{session.recording ? 'Recording' : 'Not Recording'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200">
                      <Video className="h-4 w-4" />
                      <span>Join Session</span>
                    </button>
                    <button 
                      onClick={() => endSession(session.id)}
                      className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
                    >
                      <Square className="h-4 w-4" />
                      <span>End Session</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions ({upcomingSessions.length})</h2>
        </div>
        
        <div className="p-6">
          {upcomingSessions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No upcoming sessions</p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{session.course_name}</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(session.session_datetime)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4" />
                          <span>{formatDuration(session.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{session.session_type}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{session.course_code}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => startSession(session.id)}
                        className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                      >
                        <Play className="h-4 w-4" />
                        <span>Start Session</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sessions Today</p>
              <p className="text-3xl font-bold text-gray-900">{sessionStats.sessionsToday}</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-3xl font-bold text-gray-900">{sessionStats.totalParticipants}</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Session Hours</p>
              <p className="text-3xl font-bold text-gray-900">{sessionStats.sessionHours.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorSessions;