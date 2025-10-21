import React, { useState } from 'react';
import { Upload, FileText, Users, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { useApi } from '../services/api';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const api = useApi();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [batches, setBatches] = useState<Array<{id: number, batch_name: string, academic_year: string, semester: number}>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch batches when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchBatches();
    }
  }, [isOpen]);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await api.lms.mentors.getAllBatches();
      if (response.batches) {
        setBatches(response.batches);
      }
    } catch (error) {
      setError('Failed to fetch batches');
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
      } else {
        setError('Please select a CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedBatchId) {
      setError('Please select a file and batch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Try Live LMS adminStudents bulk upload endpoint first
      let result;
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('batchId', selectedBatchId.toString());
        
        result = await api.lms.adminStudents.bulkUploadStudents(formData);
      } catch (lmsError) {
        // Fallback to UMS bulk upload
        result = await api.students.bulkEnroll(selectedFile, selectedBatchId);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setSuccess(`Successfully uploaded ${result.count || 'students'} from CSV file`);
        setSelectedFile(null);
        setSelectedBatchId(null);
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (error: any) {
      setError(error.message || 'Upload failed');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedBatchId(null);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-500" />
            Bulk Upload Students
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select CSV File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-yellow-500 transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <FileText className="w-5 h-5" />
                    <span>{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload className="w-8 h-8" />
                    <span>Click to select CSV file</span>
                    <span className="text-xs">or drag and drop</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Batch
            </label>
            <select
              value={selectedBatchId || ''}
              onChange={(e) => setSelectedBatchId(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              disabled={loadingBatches}
            >
              <option value="">
                {loadingBatches ? 'Loading batches...' : 'Select Batch'}
              </option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_name} ({batch.academic_year} - Semester {batch.semester})
                </option>
              ))}
            </select>
          </div>

          {/* CSV Format Info */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">CSV Format Required:</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• First row should contain headers: name, email, rollNumber</p>
              <p>• Each subsequent row should contain student data</p>
              <p>• Example:</p>
              <div className="bg-gray-700 p-2 rounded mt-2 font-mono text-xs">
                name,email,rollNumber<br/>
                John Doe,john.doe@example.com,STU001<br/>
                Jane Smith,jane.smith@example.com,STU002
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedBatchId || loading}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Students
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
