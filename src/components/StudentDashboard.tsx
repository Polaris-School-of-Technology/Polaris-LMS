import React, { useState, useEffect } from 'react';
import { Calendar, Video, Github, TrendingUp, Eye, Download, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { useApi } from '../services/api';

interface StudentMetric {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  program: string;
  attendanceRate: number;
  sessionsAttended: number;
  totalSessions: number;
  recordingsAccessed: number;
  githubContributions: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

const StudentDashboard: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [sortBy, setSortBy] = useState<keyof StudentMetric>('attendanceRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [studentMetrics, setStudentMetrics] = useState<StudentMetric[]>([]);
  const [metrics, setMetrics] = useState({
    avgAttendance: 0,
    recordingsAccessed: 0,
    githubContributions: 0,
    sessionsAttended: 0,
    activePrograms: 0,
    activeMentors: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const api = useApi();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data from Live LMS - use mentorStats dashboard for common metrics
        const [activeProgramsResponse, activeMentorsResponse, scheduledSessionsResponse, programStatsResponse, mentorDashboardStats] = await Promise.all([
          api.lms.adminCards.getActivePrograms(),
          api.lms.adminCards.getActiveMentors(),
          api.lms.adminCards.getScheduledSessions(),
          api.lms.adminPrograms.getProgramStats(),
          api.lms.adminMentorData.getDashboardStats()
        ]);

        // Fetch student performance data from Live LMS
        const studentPerformanceResponse = await api.lms.adminStudents.getStudentPerformance();
        const allStudents = studentPerformanceResponse.data || [];

        // Transform student performance data to match our interface
        const transformedStudents: StudentMetric[] = allStudents.map((student: any) => ({
          id: student.student_id || student.id,
          name: student.name || 'Unknown Student',
          rollNo: student.roll_number || 'N/A',
          email: student.email || 'N/A',
          program: student.program || 'N/A',
          attendanceRate: parseFloat(
            typeof student.attendance_percentage === 'string' 
              ? student.attendance_percentage.replace('%', '') 
              : student.attendance_percentage?.toString() || '0'
          ),
          sessionsAttended: student.sessions_attended || 0,
          totalSessions: student.total_sessions || 0,
          recordingsAccessed: student.recordings || 0,
          githubContributions: student.github_contributions || 0,
          lastActive: student.last_active || 'N/A',
          status: student.status === 'active' ? 'active' : 'inactive'
        }));

        // Calculate additional metrics from program data
        const programs = programStatsResponse.data || [];
        const activePrograms = programs.filter((p: any) => p.status === 'Active');
        const totalSessions = programs.reduce((sum: number, p: any) => sum + (p.sessions_count || 0), 0);
        const completedSessions = Math.floor(totalSessions * 0.8); // 80% completion rate

        setStudentMetrics(transformedStudents);
        setCurrentPage(1); // Reset to first page when data changes
        
        // Extract data from mentor dashboard stats for consistency
        const dashboardStats = mentorDashboardStats.data || {};
        const mentorAvgAttendance = parseFloat(dashboardStats.avg_attendance?.replace('%', '') || '0');
        
        // Calculate real metrics from student data
        const totalRecordings = transformedStudents.reduce((sum, s) => sum + s.recordingsAccessed, 0);
        const totalGithubContributions = transformedStudents.reduce((sum, s) => sum + s.githubContributions, 0);
        const totalSessionsAttended = transformedStudents.reduce((sum, s) => sum + s.sessionsAttended, 0);
        const avgAttendanceFromStudents = transformedStudents.length > 0 
          ? transformedStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / transformedStudents.length 
          : 0;

        setMetrics({
          avgAttendance: mentorAvgAttendance || avgAttendanceFromStudents, // Use mentor stats or calculate from students
          recordingsAccessed: totalRecordings,
          githubContributions: totalGithubContributions,
          sessionsAttended: totalSessionsAttended,
          activePrograms: activePrograms.length,
          activeMentors: activeMentorsResponse.data?.total_mentors || 0
        });

      } catch (err: any) {
        setError(err.message || 'Failed to load student data');

        // Fallback to mock data
        setStudentMetrics([
          {
            id: '1',
            name: 'John Smith',
            rollNo: 'FS2024001',
            email: 'john.smith@email.com',
            program: 'Full Stack Development',
            attendanceRate: 95,
            sessionsAttended: 38,
            totalSessions: 40,
            recordingsAccessed: 42,
            githubContributions: 156,
            lastActive: '2024-01-15',
            status: 'active'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            rollNo: 'DS2024002',
            email: 'sarah.johnson@email.com',
            program: 'Data Science Bootcamp',
            attendanceRate: 88,
            sessionsAttended: 35,
            totalSessions: 40,
            recordingsAccessed: 38,
            githubContributions: 89,
            lastActive: '2024-01-14',
            status: 'active'
          }
        ]);
        setMetrics({
          avgAttendance: 0, // Will be overridden by Live LMS data
          recordingsAccessed: 146,
          githubContributions: 335,
          sessionsAttended: 139,
          activePrograms: 5,
          activeMentors: 12
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [api.ums.students]);

  const handleSort = (field: keyof StudentMetric) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedStudents = [...studentMetrics].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  // Filter students based on selected program and batch
  const filteredStudents = sortedStudents.filter(student => {
    const programMatch = selectedProgram === 'all' || student.program === selectedProgram;
    const batchMatch = selectedBatch === 'all' || student.program.includes(selectedBatch);
    return programMatch && batchMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Roll No', 'Email', 'Program', 'Attendance Rate', 'Sessions Attended', 'Total Sessions', 'Recordings Accessed', 'GitHub Contributions', 'Last Active', 'Status'];
    const csvContent = [
      headers.join(','),
      ...studentMetrics.map(student => [
        student.name,
        student.rollNo,
        student.email,
        student.program,
        `${student.attendanceRate}%`,
        student.sessionsAttended,
        student.totalSessions,
        student.recordingsAccessed,
        student.githubContributions,
        student.lastActive,
        student.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-metrics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-400';
    if (attendance >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGithubColor = (contributions: number) => {
    if (contributions >= 100) return 'text-green-400';
    if (contributions >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading student data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load student data</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Student Dashboard</h2>
          <p className="text-gray-400">Student engagement and performance analytics</p>
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
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-400/10">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{metrics.avgAttendance}%</div>
          <div className="text-gray-400 text-sm">Avg Attendance</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-400/10">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{metrics.sessionsAttended}</div>
          <div className="text-gray-400 text-sm">Scheduled Sessions</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-400/10">
              <Github className="w-6 h-6 text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{metrics.activeMentors}</div>
          <div className="text-gray-400 text-sm">Total Mentors</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-400/10">
              <Video className="w-6 h-6 text-yellow-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{metrics.activePrograms}</div>
          <div className="text-gray-400 text-sm">Active Programs</div>
        </div>
      </div>

      {/* Attendance History Chart */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Attendance Trends</h3>
          <div className="text-sm text-gray-400">Last 30 days</div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Week 1</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
              <span className="text-green-400 font-medium w-12">95%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Week 2</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
              <span className="text-green-400 font-medium w-12">88%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Week 3</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <span className="text-yellow-400 font-medium w-12">82%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Week 4</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
              <span className="text-green-400 font-medium w-12">91%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Metrics Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Student Performance Metrics</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Program
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('attendanceRate')}
                >
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Recordings
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('githubContributions')}
                >
                  GitHub
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {currentStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{student.name}</div>
                      <div className="text-gray-400 text-sm font-mono">{student.rollNo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{student.program}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getAttendanceColor(student.attendanceRate)}`}>
                        {student.attendanceRate}%
                      </span>
                      <div className="w-16 bg-gray-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            student.attendanceRate >= 90 ? 'bg-green-500' :
                            student.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${student.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {student.sessionsAttended}/{student.totalSessions}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{student.recordingsAccessed}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getGithubColor(student.githubContributions)}`}>
                      {student.githubContributions}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      student.status === 'active'
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1 overflow-x-auto max-w-64 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                        currentPage === page
                          ? 'bg-yellow-500 text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;