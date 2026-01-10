import React, { useState, useEffect } from 'react';
import { Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MentorAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState<Set<number>>(new Set());
  const api = useApi();
  const { user } = useAuth();
  const userId = user?.id;

  // Session-wise stats coming from multimedia session analytics API
  const [sessionStats, setSessionStats] = useState<any[]>([]);
  useEffect(() => {
    console.log('🔍 MentorAnalytics useEffect triggered:', { userId, dateRange });
    if (userId) {
      console.log('✅ userId found, calling fetchAnalyticsData');
      fetchAnalyticsData();
    } else {
      console.warn('⚠️ userId is missing, cannot fetch analytics');
      setLoading(false);
    }
  }, [userId, dateRange]);

  const fetchAnalyticsData = async () => {
    if (!userId) {
      console.warn('⚠️ fetchAnalyticsData: userId is missing');
      return;
    }
    
    try {
      console.log('📡 Starting fetchAnalyticsData for userId:', userId);
      setLoading(true);
      
      // Fetch mentor stats and sessions
      console.log('📡 Calling getFacultySessions API...');
      const [, sessionsResponse] = await Promise.all([
        api.lms.mentors.getAvgAttendance(),
        api.lms.adminSchedule.getFacultySessions(userId)
      ]);
      console.log('✅ getFacultySessions response:', sessionsResponse);
      const sessions = sessionsResponse?.data || [];
      console.log('📊 Sessions received:', sessions.length);

      // Calculate date range
      const now = new Date();
      const daysBack = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      
      // Set startDate to start of day (00:00:00) for accurate date comparison
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);
      
      // Set endDate to end of today (23:59:59) for accurate date comparison
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      
      // Filter sessions by date range (all sessions within the selected period)
      const filteredSessions = sessions.filter((s: any) => {
        if (!s.session_datetime) return false;
        const sessionDate = new Date(s.session_datetime);
        // Include sessions from startDate (inclusive) to endDate (inclusive)
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      // Sort by date (newest first) and fetch analytics for ALL filtered sessions
      const sortedSessions = filteredSessions.sort((a: any, b: any) => {
        const dateA = new Date(a.session_datetime).getTime();
        const dateB = new Date(b.session_datetime).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      console.log('📊 Filtered sessions count:', sortedSessions.length);
      console.log('📊 Sample session object:', sortedSessions[0]);
      
      // Fetch session stats using getSessionAnalytics API for all filtered sessions
      const sessionStatsPromises = sortedSessions.map(async (session: any) => {
        // Try multiple possible field names for sessionId
        const rawSessionId = session.id || session.session_id || session.sessionId || session.live_session_id;
        
        // Convert to number if it's a string
        const sessionId = rawSessionId ? (typeof rawSessionId === 'number' ? rawSessionId : parseInt(String(rawSessionId), 10)) : null;
        
        console.log(`📡 Processing session:`, {
          sessionId,
          rawSessionId,
          id: session.id,
          session_id: session.session_id,
          sessionId_field: session.sessionId,
          course_name: session.course_name,
          session_datetime: session.session_datetime
        });
        
        // Skip if no valid sessionId or if conversion failed
        if (!sessionId || isNaN(sessionId)) {
          console.warn(`⚠️ Skipping session - no valid sessionId found:`, session);
          return null;
        }
        
        // Default values if API fails
        let sessionData = {
          date: session.session_datetime,
          title: session.course_name || 'Session',
          attendance: 0,
          totalStudents: session?.students?.length || session?.student_count || 0,
          duration: session.duration ? `${Math.floor(session.duration / 60)}h ${session.duration % 60}m` : '0m',
          engagement: 0,
          attendancePercentage: 0,
          averageEngagementTime: 0,
          students: [] // Store student data for performance table
        };

        try {
          console.log(`📡 Calling getSessionAnalytics API for sessionId: ${sessionId} (type: ${typeof sessionId})`);
            // Use getSessionAnalytics API for detailed analytics
            const analyticsResponse = await api.multimedia.attendance.getSessionAnalytics(sessionId);
          console.log(`✅ getSessionAnalytics response for sessionId ${sessionId}:`, analyticsResponse);
          
          // Handle API response structure: { statusCode: 200, data: { sessionDuration, totalCount, students: [...] }, message: "success" }
          const responseData = analyticsResponse?.data || analyticsResponse;
          if (responseData) {
            const analytics = responseData;
            
            console.log('📊 Processing analytics data:', {
              sessionDuration: analytics.sessionDuration,
              totalCount: analytics.totalCount,
              studentsCount: analytics.students?.length
            });
            
            // Handle actual API response structure:
            // { sessionDuration, totalCount, students: [...] }
            // API returns duration in MINUTES, convert to seconds first
            const durationMinutes = analytics.sessionDuration || analytics.duration || 0;
            const durationSeconds = Math.floor(durationMinutes * 60); // Convert minutes to seconds
            const hours = Math.floor(durationSeconds / 3600);
            const remainingSeconds = durationSeconds % 3600;
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            
            // Format duration with hours, minutes, and seconds
            let durationStr = '';
            if (hours > 0) {
              durationStr = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
              durationStr = `${minutes}m ${seconds}s`;
            } else {
              durationStr = `${seconds}s`;
            }

            // Get total students count from API response
            let totalStudents = analytics.totalCount || analytics.totalStudents || 0;
            if (totalStudents === 0 && analytics.students && Array.isArray(analytics.students)) {
              totalStudents = analytics.students.length;
            }
            
            // If still 0, use fallback from session data
            if (totalStudents === 0) {
              totalStudents = session?.students?.length || session?.student_count || 0;
            }
            
            // Calculate average engagement time from students (commented - not used in active UI)
            // let totalEngagementTime = 0;
            // if (analytics.students && Array.isArray(analytics.students)) {
            //   totalEngagementTime = analytics.students.reduce((sum: number, s: any) => {
            //     return sum + Math.floor(s.totalDuration || s.joinedDuration || 0);
            //   }, 0);
            // }
            // const avgEngagementSeconds = analytics.students?.length > 0
            //   ? Math.floor(totalEngagementTime / analytics.students.length)
            //   : 0;
            // const engagementMinutes = Math.floor(avgEngagementSeconds / 60);
            
            // Fetch isPresent from new LMS admin batch attendance API instead of Supabase
            let attendanceRecordsMap = new Map<string, boolean>();
            try {
              const attendanceResponse = await api.multimedia.attendance.getBatchSessionAttendance(sessionId);
              const apiStudents = attendanceResponse?.students || [];

              apiStudents.forEach((record: any) => {
                // Prefer explicit userId, fall back to nested student.id
                const userIdFromApi = record.userId || record.student?.id;
                if (userIdFromApi) {
                  attendanceRecordsMap.set(userIdFromApi, !!record.isPresent);
                }
              });

              console.log(
                `✅ Fetched ${apiStudents.length} attendance records from admin batch attendance API for sessionId ${sessionId}`
              );
            } catch (error) {
              console.error(
                `❌ Error fetching admin batch attendance for sessionId ${sessionId}:`,
                error
              );
            }
            
            // Map students to expected format
            // API returns joinedDuration in MINUTES, convert to seconds
            const mappedStudents = (analytics.students || []).map((s: any) => {
              const studentDurationMinutes = s.joinedDuration ?? 0;
              const studentDuration = Math.floor(studentDurationMinutes * 60); // Convert minutes to seconds
              // Use isPresent from new admin batch attendance API only (no 50% duration logic on frontend)
              const isPresentFromRecords = attendanceRecordsMap.get(s.studentId);
              const isPresent = !!isPresentFromRecords;
              
              // Calculate attendance percentage only if both session duration and student duration are > 0
              // If session duration is 0, return 0% (avoid division by zero)
              // If student duration is 0, return 0% (student didn't attend)
              let attendancePercentage = 0;
              if (durationSeconds > 0 && studentDuration > 0) {
                attendancePercentage = parseFloat(((studentDuration / durationSeconds) * 100).toFixed(2));
              }
              
              return {
                studentId: s.studentId,
                studentName: s.studentName,
                // imageUrl: s.imageUrl || null, // Not used in UI - commented out
                isPresent: isPresent,
                attendancePercentage: attendancePercentage,
                totalDuration: studentDuration, // Integer value in seconds
                // joinedAt: s.joinedAt ? new Date(s.joinedAt) : (session.session_datetime ? new Date(session.session_datetime) : new Date()), // Not used in UI - commented out
                // leftAt: s.leftAt ? new Date(s.leftAt) : null // Not used in UI - commented out
              };
            }).filter((s: any) => String(s.studentId) !== String(userId));
            
            console.log('✅ Processed analytics:', {
              totalStudents,
              studentsPresent: mappedStudents.filter((s: any) => s.isPresent).length,
              durationStr
            });
              
            const studentsPresentCount = mappedStudents.filter((s: any) => s.isPresent).length;

            sessionData = {
              date: new Date(session.session_datetime).toISOString(),
              title: session.course_name || 'Session',
              attendance: studentsPresentCount,
              totalStudents: totalStudents,
              duration: durationStr,
              engagement: 0, // Not calculated - not used in active UI
              attendancePercentage: 0, // Not calculated - not used in active UI
              averageEngagementTime: 0, // Not calculated - not used in active UI
              students: mappedStudents // Mapped student data
            };
          }
        } catch (err: any) {
          const errorMessage = err?.message || err?.toString() || 'Unknown error';
          const isSessionNotFound = errorMessage.toLowerCase().includes('session not found') || 
                                   errorMessage.toLowerCase().includes('not found');
          
          if (isSessionNotFound) {
            console.warn(`⚠️ Session ${sessionId} not found in backend, using fallback data`);
          } else {
            console.error(`❌ Error fetching session analytics for sessionId ${sessionId}:`, errorMessage);
          }
          
          // Fallback to basic session data if API fails
          // sessionData already has default values, so it will be returned as is
        }

        return sessionData;
      });

      console.log('⏳ Waiting for all session analytics promises...');
      const sessionStatsData = await Promise.all(sessionStatsPromises);
      // Filter out null values (sessions without valid sessionId)
      const validSessionStats = sessionStatsData.filter((data: any) => data !== null);
      console.log('✅ All session analytics fetched:', {
        total: sessionStatsData.length,
        valid: validSessionStats.length,
        skipped: sessionStatsData.length - validSessionStats.length
      });
      setSessionStats(validSessionStats);

    } catch (err) {
      console.error('❌ Error in fetchAnalyticsData:', err);
    } finally {
      console.log('🏁 fetchAnalyticsData completed');
      setLoading(false);
    }
  };

  // If we later re-enable the detailed student table, helpers can be added back.

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">Track your teaching performance and student progress.</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          <button className="flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Session Analytics Section (Real data from API – latest session) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Session Analytics</h2>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
          </div>
        ) : sessionStats.length === 0 ? (
          <div className="text-gray-500 text-sm">No session analytics available for this period.</div>
        ) : (
          <div className="space-y-6">
            {sessionStats.map((session, index) => {
              const isExpanded = showParticipants.has(index);
              const presentCount = session.attendance || 0;
              const toggleParticipants = () => {
                const newSet = new Set(showParticipants);
                if (isExpanded) {
                  newSet.delete(index);
                } else {
                  newSet.add(index);
                }
                setShowParticipants(newSet);
              };

              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {session.title || `Session ${index + 1}`}
                    {index === 0 && (
                      <span className="ml-2 text-sm font-normal text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        Latest
                      </span>
                    )}
                  </h2>
                  
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">Total Duration</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {session.duration || '0m'}
                      </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">Total Students</div>
                      <div className="text-2xl font-bold text-gray-900">{session.totalStudents || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">Students Present</div>
                      <div className="text-2xl font-bold text-gray-900">{presentCount}</div>
          </div>
           <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
             <div className="text-sm text-gray-500 mb-1">Session Date</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {new Date(session.date).toLocaleDateString()}
                      </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Participants List</h3>
          <button 
                      onClick={toggleParticipants}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
          >
                      <span>{isExpanded ? 'Hide' : 'Show'} List</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
          </button>
        </div>
        
                  {isExpanded && (
          <div className="overflow-x-auto transition-all duration-300 ease-in-out">
            <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Present
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                          {session.students && session.students.length > 0 ? (
                            session.students.map((student: any, studentIndex: number) => (
                              <tr key={studentIndex} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                  {student.studentName || 'Unknown Student'}
                                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      student.isPresent
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {student.isPresent ? 'Present' : 'Absent'}
                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                  {student.attendancePercentage?.toFixed
                                    ? student.attendancePercentage.toFixed(2)
                                    : student.attendancePercentage || 0}
                                  %
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                  {formatDuration(student.totalDuration || 0)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                No participants data available
                  </td>
                </tr>
                          )}
            </tbody>
          </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        )}
      </div>

      {/* Key Metrics */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(analyticsData).map(([key, data]) => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 capitalize">{key}</h3>
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl font-bold text-gray-900">{data.current}%</span>
              <div className={`flex items-center space-x-1 text-sm ${
                data.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-4 w-4" />
                <span>+{data.current - data.previous}%</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">vs previous period</div>
          </div>
        ))}
      </div> */}

      {/* Student Performance Table */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Student Performance</h2>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GitHub PRs
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No student performance data available
                  </td>
                </tr>
              ) : (
                studentPerformance.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-yellow-400 font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(student.attendance)}`}
                            style={{ width: `${student.attendance}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getPerformanceColor(student.attendance)}`}>
                          {student.attendance}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(student.engagement)}`}
                            style={{ width: `${student.engagement}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getPerformanceColor(student.engagement)}`}>
                          {student.engagement}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(student.completion)}`}
                            style={{ width: `${student.completion}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getPerformanceColor(student.completion)}`}>
                          {student.completion}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{student.githubPRs}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Recent Sessions */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Session Analytics</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {sessionStats.map((session, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{session.title}</h3>
                  <span className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Attendance:</span>
                    <p className="font-medium">
                      {session.attendance}
                      {session.totalStudents ? `/${session.totalStudents}` : ''} students
                    </p>
                    {session.attendancePercentage !== undefined && (
                      <p className={`text-xs mt-1 ${getPerformanceColor(session.attendancePercentage)}`}>
                        ({session.attendancePercentage.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium">{session.duration}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Attendance %:</span>
                    <p className={`font-medium ${getPerformanceColor(session.attendancePercentage || session.engagement)}`}>
                      {(session.attendancePercentage || session.engagement).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Engagement:</span>
                    <p className="font-medium">
                      {session.averageEngagementTime > 0 
                        ? `${session.averageEngagementTime} min` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default MentorAnalytics;