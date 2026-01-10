import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit2, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';
import type { Batch } from '../../types';
import { useApi } from '../../services/api';

interface BatchesTableProps {
  onViewBatch: (batch: Batch) => void;
  onEditBatch: (batch: Batch) => void;
  refreshTrigger?: number;
}

const BatchesTable: React.FC<BatchesTableProps> = ({ onViewBatch, onEditBatch, refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Batch>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.lms.batches.getAllBatches();

        // Normalize response shape
        let batchesData: any[] = [];
        if (Array.isArray(response?.data?.batches)) {
          batchesData = response.data.batches;
        } else if (Array.isArray(response?.batches)) {
          batchesData = response.batches;
        } else if (Array.isArray(response?.data)) {
          batchesData = response.data;
        } else if (Array.isArray(response)) {
          batchesData = response;
        }

        const transformedBatches: Batch[] = batchesData.map((batch: any) => ({
          id: String(batch.id ?? batch.batch_id ?? ''),
          name: batch.batch_name || batch.name || 'Unnamed Batch',
          studentsCount: batch.students_count ?? batch.studentCount ?? batch.students?.length ?? 0,
          sessionsCount: batch.sessions_count ?? batch.sessionCount ?? 0,
          academicYear: batch.academic_year ?? batch.academicYear ?? undefined,
          semester: batch.semester ?? undefined,
          type: batch.batch_type ?? batch.type ?? undefined,
          createdAt: batch.created_at ?? undefined
        }));

        setBatches(transformedBatches);
      } catch (err: any) {
        setError(err.message || 'Failed to load batches');
        console.error('Error fetching batches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [api.lms.batches, refreshTrigger]);

  const handleSort = (field: keyof Batch) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredBatches = batches
    .filter(batch =>
      batch.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      // Handle numeric fields (semester, type)
      if (sortField === 'semester' || sortField === 'type') {
        const aNum = typeof aVal === 'number' ? aVal : (typeof aVal === 'string' ? parseInt(aVal) || 0 : 0);
        const bNum = typeof bVal === 'number' ? bVal : (typeof bVal === 'string' ? parseInt(bVal) || 0 : 0);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string fields (name, academicYear)
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Batches</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading batches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Batches</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load batches</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Table Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Batches</h2>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Batch Name</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-4 sm:px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('academicYear')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Academic Year</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-4 sm:px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Batch Type</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-4 sm:px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('semester')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Semester</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-4 sm:px-6 py-3 text-right">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredBatches.map((batch) => (
              <tr
                key={batch.id}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => onViewBatch(batch)}
              >
                <td className="px-4 sm:px-6 py-4">
                  <div className="text-white font-medium group-hover:text-yellow-400 transition-colors">{batch.name}</div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="text-gray-300">{batch.academicYear || '—'}</div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="text-gray-300">{batch.type ? String(batch.type) : '—'}</div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="text-gray-300">{batch.semester ? `Sem ${batch.semester}` : '—'}</div>
                </td>
                <td className="px-4 sm:px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewBatch(batch);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBatch(batch);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                      title="Edit Batch Name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBatches.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No batches found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchesTable;
