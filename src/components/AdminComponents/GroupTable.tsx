import React, { useEffect, useState } from 'react';
import { Search, Eye, CreditCard as Edit, MoreVertical, ArrowUpDown, Filter, Loader2, AlertCircle } from 'lucide-react';
import type { Group } from '../../types/AdminTypes';
import { useApi } from '../../services/AdminServices/api';

interface GroupTableProps {
  onViewGroup: (group: Group) => void;
  onEditGroup: (group: Group) => void;
}

const GroupTable: React.FC<GroupTableProps> = ({ onViewGroup, onEditGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Group>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        const programsData = await api.lms.adminPrograms.getProgramStats();
        const derivedGroups: Group[] = (programsData.data || []).map((p: any, index: number) => ({
          id: `grp-${p.program_id || index}`,
          name: `${p.program_name || 'Learning Group'} ${index + 1}`,
        }))
        .filter((g: Group) => g.name); // Filter out any entries without a name

        if (!derivedGroups.length) {
          setGroups([
            { id: 'g1', name: 'Alpha Group' },
            { id: 'g2', name: 'Beta Group' },
            { id: 'g3', name: 'Gamma Group' },
          ] as Group[]); // Explicitly cast to meet the minimal Group interface
        } else {
          setGroups(derivedGroups);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load groups');
        // Fallback mock data on error
        setGroups([
          { id: 'g1', name: 'Alpha Group' },
          { id: 'g2', name: 'Beta Group' },
          { id: 'g3', name: 'Gamma Group' },
        ] as Group[]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [api.lms.adminPrograms]);

  const handleSort = (field: keyof Group) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredGroups = groups
    .filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) 
    )
    .sort((a, b) => {
      const aVal = a[sortField] as any;
      const bVal = b[sortField] as any;
      if (sortDirection === 'asc') {
        return (aVal || '') < (bVal || '') ? -1 : (aVal || '') > (bVal || '') ? 1 : 0;
      } else {
        return (aVal || '') > (bVal || '') ? -1 : (aVal || '') < (bVal || '') ? 1 : 0;
      }
    });

  
  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Groups</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading groups...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Groups</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load groups</p>
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
          <h2 className="text-xl font-semibold text-white">Groups</h2>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none w-64"
              />
            </div>
            {/* Filter - Hiding as there are no status/date fields to filter by */}
            {/* <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
            */}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              {/* Group Name Column */}
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Group Name</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              
              {/* Action Column */}
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredGroups.map((group) => (
              <tr
                key={group.id}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => onViewGroup(group)}
              >
                {/* Group Name Data */}
                <td className="px-6 py-4">
                  <div className="text-white font-medium group-hover:text-yellow-400 transition-colors">{group.name}</div>
                </td>
                
                {/* Actions Data */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewGroup(group);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGroup(group);
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

export default GroupTable;