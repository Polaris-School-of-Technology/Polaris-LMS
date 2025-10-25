import React, { useState, useEffect } from 'react';
import { Search, Eye, CreditCard as Edit, MoreVertical, ArrowUpDown, Filter, Loader2, AlertCircle } from 'lucide-react';
import type { Program } from '../types';
import { useApi } from '../services/api';

interface ProgramTableProps {
  onViewProgram: (program: Program) => void;
  onEditProgram: (program: Program) => void;
}

const ProgramTable: React.FC<ProgramTableProps> = ({ onViewProgram, onEditProgram }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Program>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get programs from Live LMS backend
        const programsData = await api.lms.adminPrograms.getProgramStats();
        
        // Transform the data to match our Program interface
        const transformedPrograms: Program[] = programsData.data.map((program: any, index: number) => {
          return {
            id: `${program.program_id}-${program.cohort}-${index}` || Math.random().toString(),
            name: program.program_name || 'Unknown Program',
            cohort: program.cohort || 'No Batch Assigned',
            mentors: program.mentors_count || 0,
            sessions: program.sessions_count || 0,
            status: program.status === 'Active' ? 'active' : 'inactive',
            startDate: program.start_date || 'N/A',
            endDate: program.end_date || 'N/A'
          };
        });

        setPrograms(transformedPrograms);
      } catch (err: any) {
        setError(err.message || 'Failed to load programs');

        // Fallback to mock data if API fails
        setPrograms([
          {
            id: '1',
            name: 'Full Stack Development',
            cohort: 'Cohort 2024-A',
            mentors: 8,
            sessions: 45,
            status: 'active',
            startDate: '2024-01-15',
            endDate: '2024-06-15'
          },
          {
            id: '2',
            name: 'Data Science Bootcamp',
            cohort: 'Cohort 2024-B',
            mentors: 6,
            sessions: 38,
            status: 'active',
            startDate: '2024-02-01',
            endDate: '2024-07-01'
          },
          {
            id: '3',
            name: 'UI/UX Design Fundamentals',
            cohort: 'Cohort 2024-C',
            mentors: 4,
            sessions: 32,
            status: 'completed',
            startDate: '2024-01-01',
            endDate: '2024-04-30'
          },
          {
            id: '4',
            name: 'Machine Learning Advanced',
            cohort: 'Cohort 2024-D',
            mentors: 10,
            sessions: 42,
            status: 'inactive',
            startDate: '2024-03-01',
            endDate: '2024-08-01'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [api.lms.adminPrograms]);

  const handleSort = (field: keyof Program) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredPrograms = programs
    .filter(program =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.cohort.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortDirection === 'asc') {
        return (aVal || '') < (bVal || '') ? -1 : (aVal || '') > (bVal || '') ? 1 : 0;
      } else {
        return (aVal || '') > (bVal || '') ? -1 : (aVal || '') < (bVal || '') ? 1 : 0;
      }
    });

  const getStatusColor = (status: Program['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'inactive': return 'text-gray-400 bg-gray-400/10';
      case 'completed': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Programs</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Programs</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load programs</p>
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
          <h2 className="text-xl font-semibold text-white">Programs</h2>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search programs..."
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
                  <span className="text-xs font-medium uppercase tracking-wider">Program</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('cohort')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Cohort</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Mentors</span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Sessions</span>
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
            {filteredPrograms.map((program) => (
              <tr
                key={program.id}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => onViewProgram(program)}
              >
                <td className="px-6 py-4">
                  <div className="text-white font-medium group-hover:text-yellow-400 transition-colors">{program.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-300">{program.cohort}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-300">{program.mentors}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-300">{program.sessions}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                    {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProgram(program);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProgram(program);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgramTable;