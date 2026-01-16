import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useApi } from '../../services/api';
import MultiSelect from '../ui/MultiSelect';
import type { Group } from '../../types';

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
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<any[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<(string | number)[]>([]);

  useEffect(() => {
    if (group && mode === 'edit') {
      setEditData({ id: group.id, name: group.name });
    } else if (!group && mode === 'edit') {
      setEditData({ id: '', name: '' });
    }
  }, [group, mode]);

  const isCreating = mode === 'edit' && !group;

  useEffect(() => {
    if (!isOpen) {
      setCourseOptions([]);
      setFacultyOptions([]);
      setDropdownError(null);
      setSelectedCourseId('');
      setSelectedFacultyIds([]);
      setDropdownLoading(false);
      return;
    }

    if (isCreating) {
      const loadDropdowns = async () => {
        try {
          setDropdownLoading(true);
          setDropdownError(null);

          const [coursesResponse, facultiesResponse] = await Promise.all([
            api.lms.adminMentors.getAllCourses(),
            api.lms.adminPrograms.getAllFaculties()
          ]);

          const courses = Array.isArray(coursesResponse?.courses) ? coursesResponse.courses : [];
          setCourseOptions(courses);

          const faculties = Array.isArray(facultiesResponse?.faculties) ? facultiesResponse.faculties : [];
          setFacultyOptions(faculties);
        } catch (error: any) {
          console.error('Failed to load dropdown data for group modal', error);
          setDropdownError(error?.message || 'Failed to load course and mentor lists.');
        } finally {
          setDropdownLoading(false);
        }
      };

      loadDropdowns();
    }
  }, [api, isCreating, isOpen]);

  const handleSave = async () => {
    try {
      setLoading(true);

      if (isCreating) {
        const batchName = (editData.name || '').trim();
        if (!batchName) {
          alert('Batch Name is required.');
          setLoading(false);
          return;
        }
        if (!selectedCourseId) {
          alert('Please select a course.');
          setLoading(false);
          return;
        }
        if (selectedFacultyIds.length === 0) {
          alert('Please select at least one mentor.');
          setLoading(false);
          return;
        }

        const payload = {
          batchName,
          courseId: Number(selectedCourseId),
          facultyIds: selectedFacultyIds
        };

        const response = await api.lms.adminMentors.createMentorGroup(payload);

        console.log('Creating Group:', payload);
        console.log('Response:', response);

        alert(`Group created successfully: ${batchName}`);
      } else {
        const groupName = (editData.name || '').trim();
        if (!groupName) {
          alert('Group Name is required.');
          setLoading(false);
          return;
        }

        const payload = { group_name: groupName };
        const response = await api.lms.adminGroups.editGroup(editData.id!, payload);

        console.log('Updating Group:', payload);
        console.log('Response:', response);

        alert(`Group updated successfully: ${groupName}`);
      }

      onClose();

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

        <div className="modal-content relative w-full max-w-3xl max-h-[95vh] overflow-hidden rounded-2xl shadow-xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-850">
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
          <div className="px-10 py-8 overflow-y-auto max-h-[calc(95vh-120px)]">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="grid grid-cols-2 gap-8"
            >
              {isCreating && dropdownError && (
                <div className="col-span-2 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300 text-sm">
                  {dropdownError}
                </div>
              )}

              {/* Batch Name */}
              <div className="col-span-2 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Batch Name
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

              {isCreating && (
                <>
                  {/* Program */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Program
                    </label>
                    <select
                      value={selectedCourseId === '' ? '' : selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      disabled={dropdownLoading}
                    >
                      <option value="">{dropdownLoading ? 'Loading courses...' : 'Select Course'}</option>
                      {courseOptions.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name || course.name || `Course ${course.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mentor */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Mentors
                    </label>
                    <MultiSelect
                      options={facultyOptions.map(f => ({
                        value: f.user_id,
                        label: f.profiles?.name || f.name || 'Unnamed Mentor'
                      }))}
                      value={selectedFacultyIds}
                      onChange={(newValues) => setSelectedFacultyIds(newValues)}
                      disabled={dropdownLoading}
                      placeholder={dropdownLoading ? 'Loading mentors...' : 'Select Mentors'}
                    />
                  </div>
                </>
              )}

              {/* Group ID (View Mode Only) */}
              {mode === 'view' && group?.id && (
                <div className="col-span-2 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
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
                <div className="col-span-2 flex justify-end space-x-4 pt-6 border-t border-gray-700">
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
