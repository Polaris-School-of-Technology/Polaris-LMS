import React, { useState, useEffect } from 'react';
import { Search, Eye, CreditCard as Edit, MoreVertical, ArrowUpDown, Filter, UserPlus, Loader2, AlertCircle, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import type { Student } from '../types';
import { useApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BulkUploadModal from './BulkUploadModal';

interface StudentTableProps {
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onAddStudent: () => void;
}

const StudentTable: React.FC<StudentTableProps> = ({ onViewStudent, onEditStudent, onAddStudent }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Student>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const api = useApi();

  const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.ums.students.getDetails(currentPage, 20);

        // Transform the API response to match our Student interface
        const transformedStudents: Student[] = (response.data || []).map((student: any) => ({
          id: student.student_id,
          name: student.name || 'Unknown',
          rollNo: student.roll_number || 'N/A',
          email: student.email || 'N/A',
          batch: student.batch_name || 'N/A',
          program: student.program || 'N/A',
          mentorGroup: student.group_name, // This would need to be added to the backend
          attendance: student.attendance_percentage || 0,
          status: student.status || 'inactive',
          joinDate: student.joinDate || 'N/A'
        }));

        setStudents(transformedStudents);
        
        // Update pagination info
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalCount(response.pagination.totalCount);
          setHasNextPage(response.pagination.hasNextPage);
          setHasPrevPage(response.pagination.hasPrevPage);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load students');
        
        // Fallback to mock data if API fails
        setStudents([
          {
            id: '1',
            name: 'John Smith',
            rollNo: 'FS2024001',
            email: 'john.smith@email.com',
            batch: 'Batch 2024-A',
            program: 'Full Stack Development',
            mentorGroup: 'Group Alpha',
            attendance: 92,
            status: 'active',
            joinDate: '2024-01-15'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            rollNo: 'DS2024002',
            email: 'sarah.johnson@email.com',
            batch: 'Batch 2024-B',
            program: 'Data Science Bootcamp',
            mentorGroup: 'Group Beta',
            attendance: 88,
            status: 'active',
            joinDate: '2024-02-01'
          },
          {
            id: '3',
            name: 'Mike Chen',
            rollNo: 'UX2024003',
            email: 'mike.chen@email.com',
            batch: 'Batch 2024-C',
            program: 'UI/UX Design Fundamentals',
            mentorGroup: 'Group Gamma',
            attendance: 95,
            status: 'active',
            joinDate: '2024-01-20'
          },
          {
            id: '4',
            name: 'Emily Davis',
            rollNo: 'ML2024004',
            email: 'emily.davis@email.com',
            batch: 'Batch 2024-D',
            program: 'Machine Learning Advanced',
            mentorGroup: 'Group Delta',
            attendance: 78,
            status: 'inactive',
            joinDate: '2024-03-01'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchStudents();
  }, [currentPage]);

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredStudents = students
    .filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.batch.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'inactive': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-400';
    if (attendance >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Students</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Students</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load students</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Students</h2>
          <div className="flex items-center space-x-3">
            {/* Add Student Button */}
            <button
              onClick={onAddStudent}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
            
            {/* Bulk Upload Button - Only for Admin */}
            {user?.userType === 'admin' && (
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload</span>
              </button>
            )}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none w-64"
              />
            </div>
            {/* Filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Name</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('rollNo')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Roll No</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Email</span>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('batch')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Batch</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Mentor Group</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Attendance</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Status</span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="text-white font-medium">{student.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-300 font-mono text-sm">{student.rollNo}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-300">{student.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-300">{student.batch}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-300">
                    {student.mentorGroup || (
                      <span className="text-gray-500 italic">Not assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`font-medium ${getAttendanceColor(student.attendance)}`}>
                    {student.attendance}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewStudent(student)}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditStudent(student)}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} students
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasPrevPage
                  ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white'
                  : 'text-gray-500 bg-gray-800 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'text-white bg-yellow-500 hover:bg-yellow-600'
                        : 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasNextPage
                  ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white'
                  : 'text-gray-500 bg-gray-800 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onUploadComplete={() => {
          setShowBulkUpload(false);
          // Refresh the student list
          fetchStudents();
        }}
      />
    </div>
  );
};

export default StudentTable;