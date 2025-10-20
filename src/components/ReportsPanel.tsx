import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, BarChart3, FileText, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useApi } from '../services/api';

const ReportsPanel: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [selectedMentor, setSelectedMentor] = useState('all');
  const [dateRange, setDateRange] = useState('last30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [programs, setPrograms] = useState<string[]>(['All Programs']);
  const [cohorts, setCohorts] = useState<string[]>(['All Cohorts']);
  const [mentors, setMentors] = useState<string[]>(['All Mentors']);
  const api = useApi();

  // Fetch reports data
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters = {
          program: selectedProgram !== 'all' ? selectedProgram : undefined,
          cohort: selectedCohort !== 'all' ? selectedCohort : undefined,
          mentor: selectedMentor !== 'all' ? selectedMentor : undefined,
          dateRange: dateRange
        };

        const response = await api.ums.reports.getFiltered(filters);
        setReportData(response.data);

        // Update filter options
        if (response.data.programs) {
          setPrograms(['All Programs', ...response.data.programs.map((p: any) => p.name)]);
        }
        if (response.data.cohorts) {
          setCohorts(['All Cohorts', ...response.data.cohorts.map((c: any) => c.name)]);
        }
        if (response.data.mentors) {
          setMentors(['All Mentors', ...response.data.mentors.map((m: any) => m.name)]);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load reports data');

        // Fallback to default data
        setReportData({
          stats: {
            completionRate: 87,
            avgSessionDuration: 2.4,
            studentSatisfaction: 4.8,
            mentorEfficiency: 92
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [api.ums.reports, selectedProgram, selectedCohort, selectedMentor, dateRange]);

  // Generate report stats from API data
  const reportStats = reportData?.stats ? [
    {
      label: 'Completion Rate',
      value: `${reportData.stats.completionRate}%`,
      trend: '+5%',
      color: 'text-green-400'
    },
    {
      label: 'Avg Session Duration',
      value: `${reportData.stats.avgSessionDuration}h`,
      trend: '+12%',
      color: 'text-green-400'
    },
    {
      label: 'Student Satisfaction',
      value: `${reportData.stats.studentSatisfaction}/5`,
      trend: '+0.2',
      color: 'text-green-400'
    },
    {
      label: 'Mentor Efficiency',
      value: `${reportData.stats.mentorEfficiency}%`,
      trend: '-1%',
      color: 'text-red-400'
    }
  ] : [
    { label: 'Completion Rate', value: '87%', trend: '+5%', color: 'text-green-400' },
    { label: 'Avg Session Duration', value: '2.4h', trend: '+12%', color: 'text-green-400' },
    { label: 'Student Satisfaction', value: '4.8/5', trend: '+0.2', color: 'text-green-400' },
    { label: 'Mentor Efficiency', value: '92%', trend: '-1%', color: 'text-red-400' }
  ];

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
            <span className="text-gray-300">Loading reports...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-400">Error Loading Reports</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Reports & Analytics</span>
        </h2>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:text-white transition-colors">
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium">
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Program</label>
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
          >
            {programs.map((program, index) => (
              <option key={index} value={program.toLowerCase().replace(' ', '-')}>
                {program}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cohort</label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
          >
            {cohorts.map((cohort, index) => (
              <option key={index} value={cohort.toLowerCase().replace(' ', '-')}>
                {cohort}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mentor</label>
          <select
            value={selectedMentor}
            onChange={(e) => setSelectedMentor(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
          >
            {mentors.map((mentor, index) => (
              <option key={index} value={mentor.toLowerCase().replace(' ', '-')}>
                {mentor}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reportStats.map((stat, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <TrendingUp className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-white text-2xl font-bold">{stat.value}</span>
              <span className={`text-sm ${stat.color}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Performance Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">Chart visualization would appear here</p>
            <p className="text-gray-500 text-sm">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;