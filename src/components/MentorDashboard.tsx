import React, { useState } from 'react';
import { Download, Eye, MoreVertical, TrendingUp, Clock, Users, Video, Calendar, UserX } from 'lucide-react';

interface MentorMetric {
  id: string;
  name: string;
  email: string;
  sessionsScheduled: number;
  sessionsCompleted: number;
  sessionsRescheduled: number;
  sessionsCancelled: number;
  avgDuration: string;
  avgAttendance: number;
  recordingsAvailable: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

const MentorDashboard: React.FC = () => {
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof MentorMetric>('sessionsCompleted');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const mentorMetrics: MentorMetric[] = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      email: 'sarah.wilson@university.edu',
      sessionsScheduled: 45,
      sessionsCompleted: 42,
      avgDuration: '2.3h',
      avgAttendance: 92,
      recordingsAvailable: 40,
      lastActive: '2024-01-15',
      sessionsRescheduled: 8,
      sessionsCancelled: 2,
      status: 'active'
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      email: 'michael.chen@university.edu',
      sessionsScheduled: 38,
      sessionsCompleted: 35,
      avgDuration: '2.1h',
      avgAttendance: 88,
      recordingsAvailable: 33,
      lastActive: '2024-01-14',
      sessionsRescheduled: 12,
      sessionsCancelled: 4,
      status: 'active'
    },
    {
      id: '3',
      name: 'Ms. Emily Rodriguez',
      email: 'emily.rodriguez@university.edu',
      sessionsScheduled: 32,
      sessionsCompleted: 28,
      avgDuration: '2.5h',
      avgAttendance: 85,
      recordingsAvailable: 26,
      lastActive: '2024-01-13',
      sessionsRescheduled: 5,
      sessionsCancelled: 1,
      status: 'active'
    },
    {
      id: '4',
      name: 'Dr. James Thompson',
      email: 'james.thompson@university.edu',
      sessionsScheduled: 25,
      sessionsCompleted: 20,
      avgDuration: '1.8h',
      avgAttendance: 78,
      recordingsAvailable: 18,
      lastActive: '2024-01-10',
      sessionsRescheduled: 15,
      sessionsCancelled: 7,
      status: 'inactive'
    }
  ];

  const handleSort = (field: keyof MentorMetric) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedMentors = [...mentorMetrics].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Sessions Scheduled', 'Sessions Completed', 'Sessions Rescheduled', 'Sessions Cancelled', 'Avg Duration', 'Avg Attendance', 'Recordings Available', 'Last Active', 'Status'];
    const csvContent = [
      headers.join(','),
      ...mentorMetrics.map(mentor => [
        mentor.name,
        mentor.email,
        mentor.sessionsScheduled,
        mentor.sessionsCompleted,
        mentor.sessionsRescheduled,
        mentor.sessionsCancelled,
        mentor.avgDuration,
        `${mentor.avgAttendance}%`,
        mentor.recordingsAvailable,
        mentor.lastActive,
        mentor.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mentor-metrics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-400';
    if (attendance >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Mentor Dashboard</h2>
          <p className="text-gray-400">Per-mentor metrics and performance analytics</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-400/10">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">140</div>
          <div className="text-gray-400 text-sm">Total Sessions</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-400/10">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">2.2h</div>
          <div className="text-gray-400 text-sm">Avg Duration</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-400/10">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">86%</div>
          <div className="text-gray-400 text-sm">Avg Attendance</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-400/10">
              <Video className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">117</div>
          <div className="text-gray-400 text-sm">Recordings</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-400/10">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">40</div>
          <div className="text-gray-400 text-sm">Rescheduled</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-400/10">
              <UserX className="w-6 h-6 text-red-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">14</div>
          <div className="text-gray-400 text-sm">Cancelled</div>
        </div>
      </div>

      {/* Mentor Metrics Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Mentor Performance Metrics</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Mentor
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('sessionsScheduled')}
                >
                  Sessions Scheduled
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('sessionsCompleted')}
                >
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Avg Duration
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('avgAttendance')}
                >
                  Avg Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Recordings
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('sessionsRescheduled')}
                >
                  Rescheduled
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('sessionsCancelled')}
                >
                  Cancelled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedMentors.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{mentor.name}</div>
                      <div className="text-gray-400 text-sm">{mentor.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{mentor.sessionsScheduled}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{mentor.sessionsCompleted}</span>
                      <span className="text-gray-400 text-sm">
                        ({Math.round((mentor.sessionsCompleted / mentor.sessionsScheduled) * 100)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{mentor.avgDuration}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${getAttendanceColor(mentor.avgAttendance)}`}>
                      {mentor.avgAttendance}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{mentor.recordingsAvailable}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      mentor.sessionsRescheduled >= 10 ? 'text-red-400' :
                      mentor.sessionsRescheduled >= 5 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {mentor.sessionsRescheduled}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      mentor.sessionsCancelled >= 5 ? 'text-red-400' :
                      mentor.sessionsCancelled >= 2 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {mentor.sessionsCancelled}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      mentor.status === 'active'
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {mentor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
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
    </div>
  );
};

export default MentorDashboard;