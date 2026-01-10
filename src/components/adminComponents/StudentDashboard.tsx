import React, { useState, useEffect } from 'react';
import { Calendar, Video, Github, TrendingUp, Eye, Download, BarChart3, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApi } from '../../services/api';

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
  
  // --- API PAGINATION STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // ---------------------------
  
  const api = useApi();

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch paginated student performance data
      const studentPerformanceResponse = await api.lms.adminStudents.getStudentPerformance(
        currentPage,
        studentsPerPage
      );
      
      const studentsResponse = studentPerformanceResponse.data || [];
      const pagination = studentPerformanceResponse.pagination || {};

      // Update pagination metadata
      setTotalRecords(pagination.totalRecords || 0);
      setTotalPages(pagination.totalPages || 1);
      
      // Transform student data
      const transformedStudents: StudentMetric[] = studentsResponse.map((student: any) => ({
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

      // Calculate metrics from current page data
      if (transformedStudents.length > 0) {
        const avgAttendance = transformedStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / transformedStudents.length;
        const totalRecordings = transformedStudents.reduce((sum, s) => sum + s.recordingsAccessed, 0);
        const totalGithub = transformedStudents.reduce((sum, s) => sum + s.githubContributions, 0);
        const totalSessions = transformedStudents.reduce((sum, s) => sum + s.sessionsAttended, 0);

        setMetrics({
          avgAttendance: Math.round(avgAttendance * 10) / 10,
          recordingsAccessed: totalRecordings,
          githubContributions: totalGithub,
          sessionsAttended: totalSessions,
          activePrograms: 0,
          activeMentors: 0
        });
      }

      setStudentMetrics(transformedStudents);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load student data');
      setTotalRecords(0);
      setTotalPages(1);
      setStudentMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or filters change
  useEffect(() => {
    fetchStudentData();
    
    // Auto-refresh attendance data every 30 seconds to get updated data from Supabase
    // This ensures attendance marked by webhook (50% threshold) and synced to Supabase is reflected in UI
    const refreshInterval = setInterval(() => {
      fetchStudentData();
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [currentPage, selectedProgram, selectedBatch]);
  
  const getAttendanceColor = (rate: number): string => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGithubColor = (contributions: number): string => {
    if (contributions >= 50) return 'text-green-400';
    if (contributions >= 20) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const handleSort = (field: keyof StudentMetric) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedAndFilteredStudents = [...studentMetrics]
    .filter(student => {
      const programMatch = selectedProgram === 'all' || student.program === selectedProgram;
      const batchMatch = selectedBatch === 'all' || student.program.includes(selectedBatch);
      return programMatch && batchMatch;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const currentStudents = sortedAndFilteredStudents;
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + currentStudents.length;

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-400/10 border border-red-400 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <span className="text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Attendance</p>
              <p className="text-2xl font-bold text-white">{metrics.avgAttendance}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Recordings Accessed</p>
              <p className="text-2xl font-bold text-white">{metrics.recordingsAccessed}</p>
            </div>
            <Video className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">GitHub Contributions</p>
              <p className="text-2xl font-bold text-white">{metrics.githubContributions}</p>
            </div>
            <Github className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sessions Attended</p>
              <p className="text-2xl font-bold text-white">{metrics.sessionsAttended}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
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
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Student</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Program</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Attendance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Sessions</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Recordings</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">GitHub</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Action</th>
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
                        />
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
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} students
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrevPage}
                disabled={!hasPrevPage} 
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {(() => {
                  const pages: number[] = [];
                  const maxButtons = 5;
                  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                  let end = start + maxButtons - 1;
                  
                  if (end > totalPages) {
                    end = totalPages;
                    start = Math.max(1, end - maxButtons + 1);
                  }
                  
                  for (let p = start; p <= end; p++) pages.push(p);

                  const elems: JSX.Element[] = [];

                  if (start > 1) {
                    elems.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-1 text-sm rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
                      >
                        1
                      </button>
                    );
                    if (start > 2) {
                      elems.push(
                        <span key="start-ellipsis" className="px-2 text-gray-500 select-none">…</span>
                      );
                    }
                  }

                  pages.forEach((page) => {
                    elems.push(
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-yellow-500 text-black font-medium'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  });

                  if (end < totalPages) {
                    if (end < totalPages - 1) {
                      elems.push(
                        <span key="end-ellipsis" className="px-2 text-gray-500 select-none">…</span>
                      );
                    }
                    elems.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 text-sm rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return elems;
                })()}
              </div>

              <button
                onClick={handleNextPage}
                disabled={!hasNextPage} 
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;