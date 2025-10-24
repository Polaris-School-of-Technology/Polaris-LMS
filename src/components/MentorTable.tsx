import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Eye, CreditCard as Edit, UserX, Loader2, AlertCircle } from 'lucide-react';
import type { Mentor, Student } from '../types';
import { useApi } from '../services/api';

interface MentorTableProps {
  onViewMentor: (mentor: Mentor) => void;
  onEditMentor: (mentor: Mentor) => void;
  onAddMentor: () => void;
}

export default function MentorTable({ onViewMentor, onEditMentor, onAddMentor }: MentorTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'program' | 'students' | 'status' | 'sessions' | 'rating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mentorData, setMentorData] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    let isMounted = true;

    const fetchMentors = async () => {
      try {
        setLoading(true);
        setError(null);

       const response = await api.lms.mentors.getAll();
        const data = response.faculties || [];

const transformedMentors: Mentor[] = data.map((faculty: any) => ({
  id: faculty.user_id,
  name: faculty.profiles.name || faculty.full_name || faculty.username || 'Unknown',
  email: faculty.email || 'N/A',
  program: faculty.department || 'N/A',
  students: [],
  batch: faculty.title || 'N/A',
  maxStudents: 10,
  joinDate: faculty.created_at ? new Date(faculty.created_at).toISOString().split('T')[0] : 'N/A',
  expertise: faculty.expertise || [],
  sessionsCompleted: faculty.sessions_completed || 0,
  sessionsRescheduled: faculty.sessions_rescheduled || 0,
  sessionsCancelled: faculty.sessions_cancelled || 0,
  rating: faculty.rating || 0,
  status: faculty.is_active ? 'active' : 'inactive'
}));

setMentorData(transformedMentors);
        console.log(transformedMentors);
        setMentorData(transformedMentors);
      } catch (err: any) {

        if (!isMounted) return; // Prevent state update if component unmounted

        setError(err.message || 'Failed to load mentors');

        // Fallback to mock data if API fails
        setMentorData([
          {
            id: '1',
            name: 'Dr. Sarah Wilson',
            email: 'sarah.wilson@university.edu',
            program: 'Full Stack Development',
            students: Array(8).fill({} as Student),
            batch: 'Batch 2024-A',
            maxStudents: 10,
            joinDate: '2024-01-01',
            expertise: ['React', 'Node.js', 'JavaScript'],
            sessionsCompleted: 42,
            sessionsRescheduled: 8,
            sessionsCancelled: 2,
            rating: 4.8,
            status: 'active'
          },
          {
            id: '2',
            name: 'Prof. Michael Chen',
            email: 'michael.chen@university.edu',
            program: 'Data Science Bootcamp',
            students: Array(10).fill({} as Student),
            batch: 'Batch 2024-B',
            maxStudents: 12,
            joinDate: '2024-01-15',
            expertise: ['Python', 'Machine Learning', 'Data Analysis'],
            sessionsCompleted: 35,
            sessionsRescheduled: 12,
            sessionsCancelled: 4,
            rating: 4.6,
            status: 'active'
          },
          {
            id: '3',
            name: 'Ms. Emily Rodriguez',
            email: 'emily.rodriguez@university.edu',
            program: 'UI/UX Design',
            students: Array(6).fill({} as Student),
            batch: 'Batch 2024-C',
            maxStudents: 8,
            joinDate: '2024-02-01',
            expertise: ['Figma', 'User Research', 'Prototyping'],
            sessionsCompleted: 28,
            sessionsRescheduled: 5,
            sessionsCancelled: 1,
            rating: 4.7,
            status: 'active'
          },
          {
            id: '4',
            name: 'Dr. James Thompson',
            email: 'james.thompson@university.edu',
            program: 'Machine Learning',
            students: Array(4).fill({} as Student),
            batch: 'Batch 2024-D',
            maxStudents: 10,
            joinDate: '2023-12-01',
            expertise: ['Deep Learning', 'TensorFlow', 'Python'],
            sessionsCompleted: 20,
            sessionsRescheduled: 15,
            sessionsCancelled: 7,
            rating: 4.2,
            status: 'inactive'
          }
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMentors();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const filteredMentors = mentorData.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMentors = [...filteredMentors].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'program':
        aValue = a.program;
        bValue = b.program;
        break;
      case 'students':
        aValue = a.students.length;
        bValue = b.students.length;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'sessions':
        aValue = a.sessionsCompleted || 0;
        bValue = b.sessionsCompleted || 0;
        break;
      case 'rating':
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSort = (column: 'name' | 'program' | 'students' | 'status' | 'sessions' | 'rating') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleDropdown = (mentorId: string) => {
    setActiveDropdown(activeDropdown === mentorId ? null : mentorId);
  };
  console.log(sortedMentors);
  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50">
          <h2 className="text-xl font-semibold text-white">Mentors</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading mentors...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50">
          <h2 className="text-xl font-semibold text-white">Mentors</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load mentors</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Mentors</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                onClick={() => handleSort('program')}
              >
                Program {sortBy === 'program' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                onClick={() => handleSort('students')}
              >
                Students {sortBy === 'students' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                onClick={() => handleSort('status')}
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                onClick={() => handleSort('sessions')}
              >
                Sessions {sortBy === 'sessions' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                onClick={() => handleSort('rating')}
              >
                Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/30 divide-y divide-gray-800/50">
            {sortedMentors.map((mentor) => (
              <tr key={mentor.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-yellow-400">
                          {mentor.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{mentor.name}</div>
                      <div className="text-sm text-gray-400">{mentor.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{mentor.program}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{mentor.students.length}/{mentor.maxStudents}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    mentor.status === 'active'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {mentor.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{mentor.sessionsCompleted || 0}</div>
                  <div className="text-xs text-gray-400">
                    {mentor.sessionsRescheduled || 0} rescheduled, {mentor.sessionsCancelled || 0} cancelled
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-white">{mentor.rating || 0}</div>
                    <div className="ml-2 flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-3 h-3 ${
                            star <= (mentor.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewMentor(mentor)}
                      className="text-gray-400 hover:text-yellow-500 p-1 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditMentor(mentor)}
                      className="text-gray-400 hover:text-yellow-500 p-1 transition-colors"
                      title="Edit Mentor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(mentor.id)}
                        className="text-gray-400 hover:text-yellow-500 p-1 transition-colors"
                        title="More Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeDropdown === mentor.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setActiveDropdown(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full text-left transition-colors"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Revoke Access
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedMentors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No mentors found matching your search.</p>
        </div>
      )}
    </div>
  );
}