import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useApi } from '../../services/AdminServices/api';
import type { Group } from '../../types/AdminTypes';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  mode: 'view' | 'edit';
}

const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, group, mode }) => {
  const api = useApi();
  const [editData, setEditData] = useState<Partial<Group>>({
    id: '',
    name: '',
  });

  const [loading, setLoading] = useState(false);
  
  // Initialize form data when group or mode changes
  useEffect(() => {
    if (group && mode === 'edit') {
      setEditData({ id: group.id, name: group.name });
    } else if (!group && mode === 'edit') {
      // Creating new group
      setEditData({ id: '', name: '' });
    }
  }, [group, mode]);
  
  const isCreating = mode === 'edit' && !group;

  const handleSave = async () => {
    if (!editData.name || editData.name.trim() === '') {
      alert('Group Name is required.');
      return;
    }
  
    try {
      setLoading(true);
  
      if (isCreating) {
        // Creating new group
        const payload = { group_name: editData.name };
        const response = await api.lms.adminGroups.createGroup(payload);
        
        console.log('Creating Group:', payload);
        console.log('Response:', response);
        
        alert(`Group created successfully: ${editData.name}`);
      } else {
        // Editing existing group
        const payload = { group_name: editData.name };
        const response = await api.lms.adminGroups.editGroup(editData.id!, payload);
        
        console.log('Updating Group:', payload);
        console.log('Response:', response);
        
        alert(`Group updated successfully: ${editData.name}`);
      }
  
      onClose();
      // Optionally trigger a refresh of the group list here
      
    } catch (error: any) {
      console.error('Error saving group:', error);
      alert(`Error saving group: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'edit': return group ? 'Edit Group' : 'Add New Group';
      case 'view': return 'Group Details';
      default: return 'Group';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-center min-h-screen px-6 py-8">
        <div className="modal-backdrop" onClick={onClose} />

        <div className="modal-content relative w-full max-w-lg max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-800">
            <h3 className="text-xl font-bold text-white">{getModalTitle()}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-all duration-200 p-2 hover:bg-gray-800/50 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-8 overflow-y-auto max-h-[calc(95vh-120px)]">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              
              {/* Group Name */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Group Name
                </label>
                {mode === 'view' ? (
                  <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                    {group?.name || 'N/A'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                    placeholder="Enter group name"
                    required
                  />
                )}
              </div>

              {/* Group ID (View Mode Only) */}
              {mode === 'view' && group?.id && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Group ID
                  </label>
                  <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-gray-400">
                    {group.id}
                  </div>
                </div>
              )}

              {/* Actions */}
              {mode !== 'view' && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isCreating ? 'Creating...' : 'Saving...'}
                      </>
                    ) : (
                      isCreating ? 'Create Group' : 'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;