import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, TrendingUp, BarChart3, Play, CheckCircle, Loader2, AlertCircle, X, Eye } from 'lucide-react';
import { useApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProgramDashboard: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [dateRange, setDateRange] = useState('last30');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const api = useApi();
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated || !token) {
          setError('User not authenticated. Please log in.');
          setLoading(false);
          return;
        }

        const metricsData = await api.ums.programs.getMetrics();
        setMetrics(metricsData.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load program metrics');

        // Fallback to default metrics
        setMetrics({
          totalCourses: 0,
          totalSessions: 0,
          completedSessions: 0,
          upcomingSessions: 0,
          activeBatches: 0,
          avgDuration: 0,
          avgAttendance: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [isAuthenticated, token, api.ums.programs]);

  const handleMetricClick = async (metricType: string) => {
    try {
      setSelectedMetric(metricType);
      setDetailLoading(true);
      setDetailData([]);

      switch (metricType) {
        case 'totalPrograms':
          const programsData = await api.ums.programs.getAll();
          setDetailData(programsData.data || []);
          break;

        case 'completedSessions':
          // Get all programs and their completed sessions
          const allPrograms = await api.ums.programs.getAll();
          const completedSessionsData = [];
          for (const program of allPrograms.data || []) {
            try {
              const sessionsData = await api.ums.programs.getSessions(program.id);
              const completedSessions = (sessionsData.data || []).filter((session: any) => session.status === 'completed');
              completedSessionsData.push(...completedSessions.map((session: any) => ({
                ...session,
                program_name: program.course_name,
                program_code: program.course_code
              })));
            } catch (err) {
            }
          }
          setDetailData(completedSessionsData);
          break;

        case 'totalSessions':
          // Get all programs and their sessions
          const allProgramsForSessions = await api.ums.programs.getAll();
          const allSessionsData = [];
          for (const program of allProgramsForSessions.data || []) {
            try {
              const sessionsData = await api.ums.programs.getSessions(program.id);
              allSessionsData.push(...(sessionsData.data || []).map((session: any) => ({
                ...session,
                program_name: program.course_name,
                program_code: program.course_code
              })));
            } catch (err) {
            }
          }
          setDetailData(allSessionsData);
          break;

        case 'activeBatches':
          // Get all programs and their batches
          const programsWithBatches = await api.ums.programs.getAll();
          const batchesData = [];
          for (const program of programsWithBatches.data || []) {
            if (program.course_sections) {
              for (const section of program.course_sections) {
                if (section.batches) {
                  batchesData.push({
                    ...section.batches,
                    program_name: program.course_name,
                    program_code: program.course_code,
                    section_id: section.id
                  });
                }
              }
            }
          }
          setDetailData(batchesData);
          break;

        case 'avgDuration':
          // Get all completed sessions with duration
          const allProgramsForDuration = await api.ums.programs.getAll();
          const durationSessionsData = [];
          for (const program of allProgramsForDuration.data || []) {
            try {
              const sessionsData = await api.ums.programs.getSessions(program.id);
              const sessionsWithDuration = (sessionsData.data || []).filter((session: any) =>
                session.status === 'completed' && session.duration
              );
              durationSessionsData.push(...sessionsWithDuration.map((session: any) => ({
                ...session,
                program_name: program.course_name,
                program_code: program.course_code,
                duration_hours: Math.round(session.duration / 60),
                duration_minutes: session.duration % 60
              })));
            } catch (err) {
            }
          }
          setDetailData(durationSessionsData);
          break;

        case 'avgAttendance':
          // For attendance, we'll show completed sessions (since attendance is calculated from them)
          const allProgramsForAttendance = await api.ums.programs.getAll();
          const attendanceSessionsData = [];
          for (const program of allProgramsForAttendance.data || []) {
            try {
              const sessionsData = await api.ums.programs.getSessions(program.id);
              const completedSessions = (sessionsData.data || []).filter((session: any) => session.status === 'completed');
              attendanceSessionsData.push(...completedSessions.map((session: any) => ({
                ...session,
                program_name: program.course_name,
                program_code: program.course_code
              })));
            } catch (err) {
            }
          }
          setDetailData(attendanceSessionsData);
          break;

        default:
          setDetailData([]);
      }
    } catch (err: any) {
      setDetailData([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedMetric(null);
    setDetailData([]);
  };

  const programMetrics = metrics ? [
    {
      id: 'totalPrograms',
      title: 'Total Programs',
      value: metrics.totalCourses,
      change: 12,
      icon: Calendar,
      color: 'text-blue-400 bg-blue-400/10'
    },
    {
      id: 'completedSessions',
      title: 'Sessions Completed',
      value: metrics.completedSessions,
      change: 8,
      icon: CheckCircle,
      color: 'text-green-400 bg-green-400/10'
    },
    {
      id: 'totalSessions',
      title: 'Sessions Scheduled',
      value: metrics.totalSessions,
      change: 5,
      icon: Video,
      color: 'text-purple-400 bg-purple-400/10'
    },
    {
      id: 'avgDuration',
      title: 'Avg Duration',
      value: `${Math.round(metrics.avgDuration / 60)}h ${metrics.avgDuration % 60}m`,
      change: 3,
      icon: Clock,
      color: 'text-yellow-400 bg-yellow-400/10'
    },
    {
      id: 'avgAttendance',
      title: 'Avg Attendance',
      value: `${metrics.avgAttendance}%`,
      change: -2,
      icon: Users,
      color: 'text-orange-400 bg-orange-400/10'
    },
    {
      id: 'activeBatches',
      title: 'Active Batches',
      value: metrics.activeBatches,
      change: 4,
      icon: TrendingUp,
      color: 'text-cyan-400 bg-cyan-400/10'
    }
  ] : [];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading program metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            <div>
              <h3 className="font-semibold">Failed to load program metrics</h3>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionRate = metrics ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Program Dashboard</h2>
          <p className="text-gray-400">Comprehensive program analytics and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none"
          >
            <option value="all">All Programs</option>
            <option value="fullstack">Full Stack Development</option>
            <option value="datascience">Data Science Bootcamp</option>
            <option value="uiux">UI/UX Design</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programMetrics.map((metric, index) => (
          <div
            key={index}
            onClick={() => handleMetricClick(metric.id)}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${metric.color} group-hover:scale-110 transition-transform duration-200`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                  metric.change >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                }`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </div>
                <Eye className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors duration-200" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors duration-200">{metric.value}</div>
            <div className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-200">{metric.title}</div>
          </div>
        ))}
      </div>

      {/* Session Completion Rate Chart */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Session Completion Rate</h3>
          <div className="text-sm text-gray-400">{completionRate}% completion rate</div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Scheduled</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-white font-medium w-12">{metrics?.totalSessions || 0}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Completed</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
              </div>
              <span className="text-white font-medium w-12">{metrics?.completedSessions || 0}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Upcoming</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.round((metrics?.upcomingSessions || 0) / (metrics?.totalSessions || 1) * 100)}%` }}></div>
              </div>
              <span className="text-white font-medium w-12">{metrics?.upcomingSessions || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-center min-h-screen px-6 py-8">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeDetailModal} />

            <div className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden bg-gray-900 rounded-xl border border-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-800">
                <h3 className="text-xl font-bold text-white">
                  {selectedMetric === 'totalPrograms' && 'All Programs'}
                  {selectedMetric === 'completedSessions' && 'Completed Sessions'}
                  {selectedMetric === 'totalSessions' && 'All Sessions'}
                  {selectedMetric === 'avgDuration' && 'Sessions by Duration'}
                  {selectedMetric === 'avgAttendance' && 'Sessions for Attendance'}
                  {selectedMetric === 'activeBatches' && 'Active Batches'}
                </h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-white transition-all duration-200 p-2 hover:bg-gray-800/50 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-8 py-8 overflow-y-auto max-h-[calc(95vh-120px)]">
                {detailLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
                      <p className="text-gray-400">Loading details...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {detailData.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No data available</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800">
                            <tr>
                              {selectedMetric === 'totalPrograms' && (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Program Name</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Code</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Semester</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Created</th>
                                </>
                              )}
                              {selectedMetric === 'completedSessions' && (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Program</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Session Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Duration</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Type</th>
                                </>
                              )}
                              {selectedMetric === 'totalSessions' && (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Program</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Session Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Duration</th>
                                </>
                              )}
                              {selectedMetric === 'avgDuration' && (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Program</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Session Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Duration</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Hours</th>
                                </>
                              )}
                              {selectedMetric === 'avgAttendance' && (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Program</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Session Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Duration</th>
                                </>
                              )}
                              {selectedMetric === 'activeBatches' && (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Program</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Batch Name</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Academic Year</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Semester</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {detailData.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                {selectedMetric === 'totalPrograms' && (
                                  <>
                                    <td className="px-4 py-3 text-white font-medium">{item.course_name}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.course_code}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.target_semester}</td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        item.active === 'active' ? 'text-green-400 bg-green-400/10' : 'text-gray-400 bg-gray-400/10'
                                      }`}>
                                        {item.active}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{new Date(item.created_at).toLocaleDateString()}</td>
                                  </>
                                )}
                                {selectedMetric === 'completedSessions' && (
                                  <>
                                    <td className="px-4 py-3 text-white font-medium">{item.program_name}</td>
                                    <td className="px-4 py-3 text-gray-300">{new Date(item.session_datetime).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.duration} min</td>
                                    <td className="px-4 py-3 text-gray-300">{item.session_type}</td>
                                  </>
                                )}
                                {selectedMetric === 'totalSessions' && (
                                  <>
                                    <td className="px-4 py-3 text-white font-medium">{item.program_name}</td>
                                    <td className="px-4 py-3 text-gray-300">{new Date(item.session_datetime).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        item.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                                        item.status === 'upcoming' ? 'text-blue-400 bg-blue-400/10' :
                                        'text-gray-400 bg-gray-400/10'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{item.duration} min</td>
                                  </>
                                )}
                                {selectedMetric === 'avgDuration' && (
                                  <>
                                    <td className="px-4 py-3 text-white font-medium">{item.program_name}</td>
                                    <td className="px-4 py-3 text-gray-300">{new Date(item.session_datetime).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.duration} min</td>
                                    <td className="px-4 py-3 text-gray-300">{item.duration_hours}h {item.duration_minutes}m</td>
                                  </>
                                )}
                                {selectedMetric === 'avgAttendance' && (
                                  <>
                                    <td className="px-4 py-3 text-white font-medium">{item.program_name}</td>
                                    <td className="px-4 py-3 text-gray-300">{new Date(item.session_datetime).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-green-400 bg-green-400/10">
                                        completed
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{item.duration} min</td>
                                  </>
                                )}
                                {selectedMetric === 'activeBatches' && (
                                  <>
                                    <td className="px-4 py-3 text-white font-medium">{item.program_name}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.batch_name}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.academic_year}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.semester}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramDashboard;