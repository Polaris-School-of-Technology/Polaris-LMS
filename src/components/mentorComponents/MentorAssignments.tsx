import React, { useState } from 'react';
import { Plus, Search, Calendar, Users, FileText, Eye, Download, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentDetailView from './AssignmentDetailView';

const MentorAssignments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);

  const assignments = [
    {
      id: 1,
      title: 'Build a Todo App with React Hooks',
      description: 'Create a fully functional todo application using React hooks (useState, useEffect) with add, edit, delete, and mark complete features.',
      dueDate: '2024-01-20',
      program: 'Full Stack Development',
      cohort: '2024-A',
      totalSubmissions: 6,
      totalStudents: 8,
      graded: 4,
      pending: 2,
      maxPoints: 100,
      createdAt: '2024-01-10'
    },
    {
      id: 2,
      title: 'JavaScript ES6+ Exercises',
      description: 'Complete the set of exercises covering arrow functions, destructuring, spread operator, async/await, and promises.',
      dueDate: '2024-01-18',
      program: 'Full Stack Development',
      cohort: '2024-A',
      totalSubmissions: 8,
      totalStudents: 8,
      graded: 8,
      pending: 0,
      maxPoints: 50,
      createdAt: '2024-01-08'
    },
    {
      id: 3,
      title: 'API Integration Project',
      description: 'Build a weather dashboard that fetches data from a public API and displays it in a user-friendly interface.',
      dueDate: '2024-01-25',
      program: 'Full Stack Development',
      cohort: '2024-B',
      totalSubmissions: 3,
      totalStudents: 6,
      graded: 2,
      pending: 1,
      maxPoints: 150,
      createdAt: '2024-01-12'
    },
    {
      id: 4,
      title: 'Component Design Challenge',
      description: 'Design and implement a reusable card component with multiple variants and responsive behavior.',
      dueDate: '2024-01-15',
      program: 'Full Stack Development',
      cohort: '2024-A',
      totalSubmissions: 7,
      totalStudents: 8,
      graded: 5,
      pending: 2,
      maxPoints: 75,
      createdAt: '2024-01-05'
    }
  ];

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && new Date(assignment.dueDate) >= new Date()) ||
      (filterStatus === 'past' && new Date(assignment.dueDate) < new Date());
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (dueDate: string, totalSubmissions: number, totalStudents: number) => {
    const due = new Date(dueDate);
    const now = new Date();
    const isOverdue = due < now;
    const allSubmitted = totalSubmissions === totalStudents;

    if (isOverdue && !allSubmitted) {
      return { label: 'Overdue', color: 'bg-red-900 text-red-300', icon: AlertCircle };
    } else if (allSubmitted) {
      return { label: 'Complete', color: 'bg-green-900 text-green-300', icon: CheckCircle };
    } else {
      return { label: 'Active', color: 'bg-blue-900 text-blue-300', icon: Clock };
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days remaining`;
  };

  if (selectedAssignment) {
    const assignment = assignments.find(a => a.id === selectedAssignment);
    return (
      <AssignmentDetailView
        assignment={assignment!}
        onBack={() => setSelectedAssignment(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Create and manage assignments for your students.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Create Assignment</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search assignments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Assignments</option>
              <option value="active">Active</option>
              <option value="past">Past Due</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssignments.map((assignment) => {
          const status = getStatusInfo(assignment.dueDate, assignment.totalSubmissions, assignment.totalStudents);
          const StatusIcon = status.icon;

          return (
            <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{status.label}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Program:</span>
                  <p className="font-medium text-gray-900">{assignment.program}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cohort:</span>
                  <p className="font-medium text-gray-900">{assignment.cohort}</p>
                </div>
                <div>
                  <span className="text-gray-500">Due Date:</span>
                  <p className="font-medium text-gray-900 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Points:</span>
                  <p className="font-medium text-gray-900">{assignment.maxPoints}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Submissions</span>
                  <span className="font-medium text-gray-900">
                    {assignment.totalSubmissions}/{assignment.totalStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(assignment.totalSubmissions / assignment.totalStudents) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{assignment.graded} graded</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{assignment.pending} pending</span>
                  </div>
                </div>
                <span className="text-gray-500">{getDaysRemaining(assignment.dueDate)}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedAssignment(assignment.id)}
                  className="flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Submissions</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">Create your first assignment to get started.</p>
        </div>
      )}

      <CreateAssignmentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default MentorAssignments;
