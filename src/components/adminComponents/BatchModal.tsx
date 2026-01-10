import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Batch } from '../../types';
import { useApi } from '../../services/api';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  onBatchUpdated: () => void;
}

const BatchModal: React.FC<BatchModalProps> = ({ isOpen, onClose, batch, onBatchUpdated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (batch) {
      setName(batch.name);
    } else {
      setName('');
    }
  }, [batch, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;

    try {
      setLoading(true);
      await api.lms.batches.updateBatch(batch.id, name);
      onBatchUpdated();
      onClose();
    } catch (error: any) {
      alert('Failed to update batch: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex min-h-screen items-center justify-center px-0 py-0 sm:px-6 sm:py-8">
        <div className="modal-backdrop fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="modal-content relative w-full h-full sm:h-auto sm:w-full sm:max-w-md bg-gray-900 sm:rounded-xl border-0 sm:border border-gray-800 shadow-2xl sm:mx-auto flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-white">Edit Batch</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Batch ID
              </label>
              <input
                type="text"
                value={batch?.id || ''}
                disabled
                className="w-full h-12 px-4 bg-gray-800/50 border border-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                placeholder="Batch ID (read-only)"
              />
              <p className="text-xs text-gray-500 mt-1">Enter batchId Number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Batch Name (newname)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter new batch name"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter new batch name</p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BatchModal;
