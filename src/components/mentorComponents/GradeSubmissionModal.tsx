import React, { useState } from 'react';
import { X, Download, FileText, Save, Star } from 'lucide-react';

interface Submission {
  id: number;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  status: string;
  grade: number | null;
  fileName: string;
  fileUrl: string;
  submissionText: string;
  feedback: string | null;
  gradedAt: string | null;
}

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  maxPoints: number;
}

const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  maxPoints
}) => {
  const [grade, setGrade] = useState<number>(submission.grade || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Grading submission:', { submissionId: submission.id, grade, feedback });
    onClose();
  };

  const getGradePercentage = () => {
    return ((grade / maxPoints) * 100).toFixed(1);
  };

  const getGradeColor = () => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Grade Submission</h2>
            <p className="text-sm text-gray-600 mt-1">{submission.studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Student:</span>
                <p className="font-medium text-gray-900">{submission.studentName}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium text-gray-900">{submission.studentEmail}</p>
              </div>
              <div>
                <span className="text-gray-600">Submitted:</span>
                <p className="font-medium text-gray-900">
                  {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="font-medium text-gray-900 capitalize">{submission.status}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Submission Details</h3>

            {submission.submissionText && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Notes
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{submission.submissionText}</p>
                </div>
              </div>
            )}

            {submission.fileName && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attached Files
                </label>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{submission.fileName}</p>
                      <p className="text-sm text-gray-500">Click to download</p>
                    </div>
                  </div>
                  <button className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (0 - {maxPoints} points) *
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  required
                  min="0"
                  max={maxPoints}
                  value={grade}
                  onChange={(e) => setGrade(Math.min(maxPoints, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <span className="text-gray-500">/ {maxPoints}</span>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className={`text-xl font-bold ${getGradeColor()}`}>
                    {getGradePercentage()}%
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={maxPoints}
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value))}
                className="w-full mt-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback *
              </label>
              <textarea
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide detailed feedback on the submission..."
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                Be specific about what was done well and areas for improvement.
              </p>
            </div>

            {submission.grade !== null && submission.gradedAt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Previously graded:</strong> {submission.grade}/{maxPoints} points on{' '}
                  {new Date(submission.gradedAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200"
              >
                <Save className="h-4 w-4" />
                <span>{submission.grade !== null ? 'Update Grade' : 'Save Grade'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmissionModal;
