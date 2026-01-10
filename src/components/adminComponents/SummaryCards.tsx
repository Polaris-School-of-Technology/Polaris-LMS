import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, PlayCircle, Calendar, BarChart, Loader2 } from 'lucide-react';
import type { KPI } from '../../types';
import { useApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SummaryCards: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!isAuthenticated || !token) {
          setError('User not authenticated. Please log in.');
          setLoading(false);
          return;
        }

        // Fetch data from Live LMS - use mentorStats dashboard for common metrics
        const [activeProgramsResponse, activeMentorsResponse, scheduledSessionsResponse, programStatsResponse, mentorDashboardStats] = await Promise.all([
          api.lms.adminCards.getActivePrograms(),
          api.lms.adminCards.getActiveMentors(),
          api.lms.adminCards.getScheduledSessions(),
          api.lms.adminPrograms.getProgramStats(),
          api.lms.adminMentorData.getDashboardStats()
        ]);

        // Extract data from mentor dashboard stats for consistency
        const dashboardStats = mentorDashboardStats.data || {};
        const mentorTotalSessions = dashboardStats.total_sessions || 0;
        const mentorAvgAttendance = parseFloat(dashboardStats.avg_attendance?.replace('%', '') || '0');
        
        // Calculate additional metrics from program data
        const programs = programStatsResponse.data || [];
        const activePrograms = programs.filter((p: any) => p.status === 'Active');
        const programTotalSessions = programs.reduce((sum: number, p: any) => sum + (p.sessions_count || 0), 0);
        const completedSessions = Math.floor(programTotalSessions * 0.8); // 80% completion rate

        const stats = {
          totalMentors: activeMentorsResponse.data?.total_mentors || 0,
          activeSessions: completedSessions, // Use calculated completed sessions from programs
          scheduledSessions: scheduledSessionsResponse.data?.total_sessions || 0,
          avgAttendance: mentorAvgAttendance, // Use mentor dashboard stats for consistency
          totalPrograms: activePrograms.length
        };
        if (!isMounted) return; // Prevent state update if component unmounted
        const kpiData: KPI[] = [
          {
            title: 'Total Mentors',
            value: Number(stats.totalMentors) || 0,
            change: 8, // This could be calculated from historical data
            icon: 'Users'
          },
          {
            title: 'Active Programs',
            value: Number(stats.totalPrograms) || 0,
            change: 12, // This could be calculated from historical data
            icon: 'PlayCircle'
          },
          {
            title: 'Scheduled Sessions',
            value: Number(stats.scheduledSessions) || 0,
            change: -3, // This could be calculated from historical data
            icon: 'Calendar'
          },
          {
            title: 'Avg Attendance',
            value: `${Number(stats.avgAttendance) || 0}%`,
            change: 5, // This could be calculated from historical data
            icon: 'BarChart'
          }
        ];
        setKpis(kpiData);
      } catch (err: any) {

        if (!isMounted) return; // Prevent state update if component unmounted

        // Provide more specific error messages
        let errorMessage = 'Failed to load summary data';
        if (err.message?.includes('Invalid token')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.message?.includes('401')) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        // Fallback to default data if API fails
        setKpis([
          {
            title: 'Total Mentors',
            value: 0,
            change: 0,
            icon: 'Users'
          },
          {
            title: 'Active Sessions',
            value: 0,
            change: 0,
            icon: 'PlayCircle'
          },
          {
            title: 'Scheduled Sessions',
            value: 0,
            change: 0,
            icon: 'Calendar'
          },
          {
            title: 'Avg Attendance',
            value: '0%',
            change: 0,
            icon: 'BarChart'
          }
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSummaryData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token, api.dashboard]); // Re-run when auth state changes

  const getIcon = (iconName: string) => {
    const icons = {
      Users,
      PlayCircle,
      Calendar,
      BarChart
    };
    const Icon = icons[iconName as keyof typeof icons];
    return Icon ? <Icon className="w-6 h-6" /> : null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-8 border border-gray-800/50 relative overflow-hidden"
          >
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl mb-8">
        <div className="flex items-center">
          <div className="w-5 h-5 mr-3">⚠️</div>
          <div>
            <h3 className="font-semibold">Failed to load summary data</h3>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-8 border border-gray-800/50 card-hover group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="text-gray-400 group-hover:text-yellow-500 transition-all duration-300 p-3 bg-gray-800/50 rounded-xl group-hover:bg-yellow-500/10">
              {getIcon(kpi.icon)}
            </div>
              <div className={`flex items-center text-sm font-semibold px-3 py-1 rounded-full ${
                kpi.change >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
              }`}>
                {kpi.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(kpi.change)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2 transition-colors duration-300 group-hover:text-[#ffc540]">
              {kpi.value}
            </div>
            <div className="text-gray-400 text-sm font-medium">
              {kpi.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;