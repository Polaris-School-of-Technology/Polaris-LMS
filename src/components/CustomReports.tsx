import React, { useState } from 'react';
import { Download, Filter, Calendar, FileText, BarChart3, Users, BookOpen } from 'lucide-react';

interface ReportFilter {
  program: string;
  mentor: string;
  dateRange: string;
  cohort: string;
  reportType: string;
}

const CustomReports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilter>({
    program: 'all',
    mentor: 'all',
    dateRange: 'last30',
    cohort: 'all',
    reportType: 'attendance'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const programs = ['All Programs', 'Full Stack Development', 'Data Science Bootcamp', 'UI/UX Design', 'Machine Learning'];
  const mentors = ['All Mentors', 'Dr. Sarah Wilson', 'Prof. Michael Chen', 'Ms. Emily Rodriguez', 'Dr. James Thompson'];
  const cohorts = ['All Cohorts', 'Cohort 2024-A', 'Cohort 2024-B', 'Cohort 2024-C', 'Cohort 2024-D'];
  const reportTypes = [
    { value: 'attendance', label: 'Attendance Report', icon: Users },
    { value: 'sessions', label: 'Session Analytics', icon: Calendar },
    { value: 'mentor-performance', label: 'Mentor Performance', icon: BarChart3 },
    { value: 'program-overview', label: 'Program Overview', icon: BookOpen },
    { value: 'student-progress', label: 'Student Progress', icon: FileText }
  ];

  const handleFilterChange = (key: keyof ReportFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = async (format: 'csv' | 'pdf') => {
    setIsGenerating(true);

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data based on filters
    const reportData = generateMockData();

    if (format === 'csv') {
      downloadCSV(reportData);
    } else {
      downloadPDF(reportData);
    }

    setIsGenerating(false);
  };

  const generateMockData = () => {
    const selectedReportType = reportTypes.find(type => type.value === filters.reportType);

    switch (filters.reportType) {
      case 'attendance':
        return {
          headers: ['Student Name', 'Roll No', 'Program', 'Attendance Rate', 'Sessions Attended', 'Total Sessions'],
          data: [
            ['John Smith', 'FS2024001', 'Full Stack Development', '95%', '38', '40'],
            ['Sarah Johnson', 'DS2024002', 'Data Science Bootcamp', '88%', '35', '40'],
            ['Mike Chen', 'UX2024003', 'UI/UX Design', '92%', '37', '40']
          ]
        };
      case 'sessions':
        return {
          headers: ['Session ID', 'Title', 'Mentor', 'Date', 'Duration', 'Attendance', 'Recording Available'],
          data: [
            ['FS-101', 'React Fundamentals', 'Dr. Sarah Wilson', '2024-01-15', '2.5h', '18/20', 'Yes'],
            ['DS-201', 'Data Analysis', 'Prof. Michael Chen', '2024-01-14', '2.0h', '16/18', 'Yes'],
            ['UX-301', 'User Research', 'Ms. Emily Rodriguez', '2024-01-13', '2.2h', '15/16', 'No']
          ]
        };
      case 'mentor-performance':
        return {
          headers: ['Mentor Name', 'Sessions Conducted', 'Avg Attendance', 'Avg Duration', 'Recordings Available', 'Rating'],
          data: [
            ['Dr. Sarah Wilson', '42', '92%', '2.3h', '40', '4.8'],
            ['Prof. Michael Chen', '35', '88%', '2.1h', '33', '4.6'],
            ['Ms. Emily Rodriguez', '28', '85%', '2.5h', '26', '4.7']
          ]
        };
      default:
        return {
          headers: ['Metric', 'Value', 'Change'],
          data: [
            ['Total Programs', '24', '+12%'],
            ['Active Mentors', '156', '+8%'],
            ['Total Students', '342', '+15%']
          ]
        };
    }
  };

  const downloadCSV = (data: any) => {
    const csvContent = [
      data.headers.join(','),
      ...data.data.map((row: string[]) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filters.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: any) => {
    // Mock PDF generation - in real implementation, use a library like jsPDF
    alert('PDF generation would be implemented with a library like jsPDF');
  };

  const getReportPreview = () => {
    const selectedType = reportTypes.find(type => type.value === filters.reportType);
    const mockData = generateMockData();

    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          {selectedType && <selectedType.icon className="w-5 h-5 text-yellow-500" />}
          <h4 className="text-lg font-semibold text-white">
            {selectedType?.label} Preview
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                {mockData.headers.map((header, index) => (
                  <th key={index} className="text-left py-2 px-3 text-gray-300 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockData.data.slice(0, 3).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-800">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-2 px-3 text-gray-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mockData.data.length > 3 && (
          <div className="mt-4 text-center text-gray-400 text-sm">
            ... and {mockData.data.length - 3} more rows
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Custom Reports Builder</h2>
        <p className="text-gray-400">Create and export custom reports with advanced filtering options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-white">Report Filters</h3>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Report Type</label>
              <div className="space-y-2">
                {reportTypes.map((type) => (
                  <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value={type.value}
                      checked={filters.reportType === type.value}
                      onChange={(e) => handleFilterChange('reportType', e.target.value)}
                      className="text-yellow-500 focus:ring-yellow-500"
                    />
                    <div className="flex items-center space-x-2">
                      <type.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{type.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Program Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Program</label>
              <select
                value={filters.program}
                onChange={(e) => handleFilterChange('program', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                {programs.map((program, index) => (
                  <option key={index} value={program.toLowerCase().replace(' ', '-')}>
                    {program}
                  </option>
                ))}
              </select>
            </div>

            {/* Mentor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mentor</label>
              <select
                value={filters.mentor}
                onChange={(e) => handleFilterChange('mentor', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                {mentors.map((mentor, index) => (
                  <option key={index} value={mentor.toLowerCase().replace(' ', '-')}>
                    {mentor}
                  </option>
                ))}
              </select>
            </div>

            {/* Cohort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cohort</label>
              <select
                value={filters.cohort}
                onChange={(e) => handleFilterChange('cohort', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                {cohorts.map((cohort, index) => (
                  <option key={index} value={cohort.toLowerCase().replace(' ', '-')}>
                    {cohort}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:border-yellow-500 focus:outline-none"
              >
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Generate Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => generateReport('csv')}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => generateReport('pdf')}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          {getReportPreview()}
        </div>
      </div>
    </div>
  );
};

export default CustomReports;