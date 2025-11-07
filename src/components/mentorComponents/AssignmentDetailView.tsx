import React, { useState } from 'react';
import { ArrowLeft, Download, Eye, Calendar, Users, FileText, CheckCircle, Clock, AlertCircle, Star } from 'lucide-react';
import GradeSubmissionModal from './GradeSubmissionModal';

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  program: string;
  cohort: string;
  totalSubmissions: number;
  totalStudents: number;
  graded: number;
  pending: number;
  maxPoints: number;
  createdAt: string;
}

interface AssignmentDetailViewProps {
  assignment: Assignment;
  onBack: () => void;
}

const AssignmentDetailView: React.FC<AssignmentDetailViewProps> = ({ assignment, onBack }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  const submissions = [
    {
      id: 1,
      studentName: 'Alice Johnson',
      studentEmail: 'alice.johnson@email.com',
      submittedAt: '2024-01-18T14:30:00',
      status: 'graded',
      grade: 95,
      fileName: 'todo-app-alice.zip',
      fileUrl: '#',
      submissionText: 'Implemented all required features including add, edit, delete, and mark complete. Added bonus features like filtering and localStorage persistence.',
      feedback: 'Excellent work! Clean code structure and went above and beyond with additional features.',
      gradedAt: '2024-01-19T10:00:00'
    },
    {
      id: 2,
      studentName: 'Bob Smith',
      studentEmail: 'bob.smith@email.com',
      submittedAt: '2024-01-19T16:45:00',
      status: 'graded',
      grade: 88,
      fileName: 'react-todo-bob.zip',
      fileUrl: '#',
      submissionText: 'Completed all core requirements. Used React hooks as specified.',
      feedback: 'Good work! Consider improving the UI design and adding error handling.',
      gradedAt: '2024-01-19T18:00:00'
    },
    {
      id: 3,
      studentName: 'Carol Davis',
      studentEmail: 'carol.davis@email.com',
      submittedAt: '2024-01-20T09:15:00',
      status: 'pending',
      grade: null,
      fileName: 'todo-app-carol.zip',
      fileUrl: '#',
      submissionText: 'All features implemented with responsive design.',
      feedback: null,
      gradedAt: null
    },
    {
      id: 4,
      studentName: 'David Wilson',
      studentEmail: 'david.wilson@email.com',
      submittedAt: '2024-01-20T22:30:00',
      status: 'late',
      grade: null,
      fileName: 'david-todo-app.zip',
      fileUrl: '#',
      submissionText: 'Completed the assignment. Had some issues with state management but resolved them.',
      feedback: null,
      gradedAt: null
    },
    {
      id: 5,
      studentName: 'Eva Martinez',
      studentEmail: 'eva.martinez@email.com',
      submittedAt: '2024-01-19T20:00:00',
      status: 'graded',
      grade: 92,
      fileName: 'eva-todo-project.zip',
      fileUrl: '#',
      submissionText: 'Implemented with TypeScript for better type safety. All tests passing.',
      feedback: 'Great initiative using TypeScript! Well-structured code.',
      gradedAt: '2024-01-20T08:00:00'
    },
    {
      id: 6,
      studentName: 'Frank Chen',
      studentEmail: 'frank.chen@email.com',
      submittedAt: '2024-01-20T11:00:00',
      status: 'graded',
      grade: 85,
      fileName: 'frank-react-todo.zip',
      fileUrl: '#',
      submissionText: 'All requirements met. Focused on clean code practices.',
      feedback: 'Solid implementation. Work on adding more detailed comments.',
      gradedAt: '2024-01-20T14:00:00'
    }
  ];

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'graded':
        return { label: 'Graded', color: 'bg-green-900 text-green-300', icon: CheckCircle };
      case 'pending':
        return { label: 'Pending', color: 'bg-blue-900 text-blue-300', icon: Clock };
      case 'late':
        return { label: 'Late', color: 'bg-red-900 text-red-300', icon: AlertCircle };
      default:
        return { label: 'Unknown', color: 'bg-gray-700 text-gray-300', icon: Clock };
    }
  };

  const getGradeColor = (grade: number) => {
    const percentage = (grade / assignment.maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleGradeClick = (submissionId: number) => {
    setSelectedSubmission(submissionId);
    setGradeModalOpen(true);
  };

  const selectedSubmissionData = submissions.find(s => s.id === selectedSubmission);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Assignments</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-gray-600">{assignment.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <span className="text-sm text-gray-500">Program</span>
            <p className="font-medium text-gray-900">{assignment.program}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Cohort</span>
            <p className="font-medium text-gray-900">{assignment.cohort}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Due Date</span>
            </span>
            <p className="font-medium text-gray-900">{new Date(assignment.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Max Points</span>
            <p className="font-medium text-gray-900">{assignment.maxPoints}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Students</span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{assignment.totalStudents}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-600">Submitted</span>
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{assignment.totalSubmissions}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-600">Graded</span>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-900">{assignment.graded}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-yellow-600">Pending</span>
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">{assignment.pending}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Student Submissions</h2>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="graded">Graded</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredSubmissions.map((submission) => {
            const status = getStatusInfo(submission.status);
            const StatusIcon = status.icon;

            return (
              <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-yellow-400 font-bold">
                        {submission.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.studentName}</h3>
                        <p className="text-sm text-gray-500">{submission.studentEmail}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{status.label}</span>
                      </span>
                    </div>

                    <div className="ml-13 space-y-2">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                        </div>
                        {submission.gradedAt && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Graded: {new Date(submission.gradedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {submission.submissionText && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">
                          {submission.submissionText}
                        </p>
                      )}

                      {submission.fileName && (
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{submission.fileName}</span>
                        </div>
                      )}

                      {submission.grade !== null && (
                        <div className="flex items-start space-x-4 bg-green-50 rounded-lg p-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-semibold text-gray-900">Grade:</span>
                              <span className={`font-bold text-lg ${getGradeColor(submission.grade)}`}>
                                {submission.grade}/{assignment.maxPoints}
                              </span>
                            </div>
                            {submission.feedback && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-700">Feedback:</span>
                                <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {submission.fileName && (
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleGradeClick(submission.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                        submission.status === 'graded'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-yellow-400 text-black hover:bg-yellow-500'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      <span>{submission.status === 'graded' ? 'Review' : 'Grade'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">No submissions match your current filters.</p>
          </div>
        )}
      </div>

      {selectedSubmissionData && (
        <GradeSubmissionModal
          isOpen={gradeModalOpen}
          onClose={() => {
            setGradeModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmissionData}
          maxPoints={assignment.maxPoints}
        />
      )}
    </div>
  );
};

export default AssignmentDetailView;
