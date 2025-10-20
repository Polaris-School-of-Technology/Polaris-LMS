// API service layer to connect with all three backends
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URLs for different services
const UMS_BASE_URL = import.meta.env.UMS_BASE_URL || '/ums'; // User Management System
const LMS_BASE_URL = import.meta.env.LMS_BASE_URL || 'https://live-class-lms1-672553132888.asia-south1.run.app'; // Live Class LMS Backend
const MULTIMEDIA_BASE_URL = import.meta.env.MULTIMEDIA_BASE_URL || '/multimedia'; // Multimedia Service  

// Token storage and refresh functionality
let refreshTokenPromise: Promise<string> | null = null;

async function refreshAccessToken(refreshToken: string): Promise<string> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const response = await fetch(`${UMS_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken;

      // Update stored tokens
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      return newAccessToken;
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

// Generic API request function with automatic token refresh
async function apiRequest(url: string, options: RequestInit = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
      headers['x-access-token'] = token;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token refresh on 401
  if (response.status === 401 && token) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const newToken = await refreshAccessToken(refreshToken);
        // Retry the original request with new token
        headers['x-access-token'] = newToken;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });
        return retryResponse.json();
      } catch (error) {
        // Redirect to login on refresh failure
        window.location.href = '/admin';
        throw error;
      }
    } else {
      window.location.href = '/admin';
      throw new Error('No refresh token available');
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// UMS API functions
const umsApi = {
  // User management
  getUserProfile: async (token: string, refreshToken: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/profile`, {
      method: 'GET',
    }, token);
  },

  getAllUsers: async (token: string, refreshToken: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users`, {
      method: 'GET',
    }, token);
  },

  createUser: async (userData: any, token: string, refreshToken: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }, token);
  },

  updateUser: async (userId: string, userData: any, token: string, refreshToken: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }, token);
  },

  deleteUser: async (userId: string, token: string, refreshToken: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users/${userId}`, {
      method: 'DELETE',
    }, token);
  },

  // Programs
  programs: {
    getAll: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/list`, {
        method: 'GET',
      }, token);
    },

    getMetrics: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/metrics`, {
        method: 'GET',
      }, token);
    },

    getDetails: async (courseId: number, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/${courseId}`, {
        method: 'GET',
      }, token);
    },

    getSessions: async (courseId: number, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/${courseId}/sessions`, {
        method: 'GET',
      }, token);
    },

    getReschedules: async (courseId: number, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/${courseId}/reschedules`, {
        method: 'GET',
      }, token);
    },

    create: async (programData: any, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/create`, {
        method: 'POST',
        body: JSON.stringify(programData),
      }, token);
    },
  },

  // Students
  students: {
    getAll: async (page: number = 1, limit: number = 20, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/list?page=${page}&limit=${limit}`, {
        method: 'GET',
      }, token);
    },

    getMetrics: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/metrics`, {
        method: 'GET',
      }, token);
    },

    getDetails: async (page: number = 1, limit: number = 20, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/details?page=${page}&limit=${limit}`, {
        method: 'GET',
      }, token);
    },

    getAttendanceHistory: async (studentId: string, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/${studentId}/attendance`, {
        method: 'GET',
      }, token);
    },
  },

  // Alerts
  alerts: {
    getAll: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/alerts/list`, {
        method: 'GET',
      }, token);
    },

    getStats: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/alerts/stats`, {
        method: 'GET',
      }, token);
    },
  },

  // Reports
  reports: {
    getStats: async (dateRange: string = 'last30', token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/stats?dateRange=${dateRange}`, {
        method: 'GET',
      }, token);
    },

    getPrograms: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/programs`, {
        method: 'GET',
      }, token);
    },

    getMentors: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/mentors`, {
        method: 'GET',
      }, token);
    },

    getStudents: async (limit: number = 20, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/students?limit=${limit}`, {
        method: 'GET',
      }, token);
    },

    getCohorts: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/cohorts`, {
        method: 'GET',
      }, token);
    },

    getFiltered: async (filters: any, token: string, refreshToken: string) => {
      const queryParams = new URLSearchParams(filters).toString();
      return apiRequest(`${UMS_BASE_URL}/api/reports/filtered?${queryParams}`, {
        method: 'GET',
      }, token);
    },
  },

  // Faculty
  faculty: {
    getAll: async (token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/faculty/list`, {
        method: 'GET',
      }, token);
    },

    invite: async (facultyData: any, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/faculty/invite`, {
        method: 'POST',
        body: JSON.stringify(facultyData),
      }, token);
    },

    signup: async (signupData: any) => {
      return apiRequest(`${UMS_BASE_URL}/api/faculty/signup`, {
        method: 'POST',
        body: JSON.stringify(signupData),
      });
    },

    remove: async (userId: string, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/faculty/remove/${userId}`, {
        method: 'DELETE',
      }, token);
    },
  },

  // Auth
  auth: {
    login: async (credentials: any) => {
      return apiRequest(`${UMS_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    refresh: async (refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    },

    changePassword: async (passwordData: any, token: string, refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData),
      }, token);
    },
  },
};

// LMS API functions
const lmsApi = {
  students: {
    getAll: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/student/list`, {
        method: 'GET',
      }, token);
    },

    getDashboardCards: async (token: string) => {
      try {
        const [totalClasses, totalCourses, avgAttendance] = await Promise.all([
          apiRequest(`${LMS_BASE_URL}/api/v1/student/cards/total-classes`, {
            method: 'GET',
          }, token),
          apiRequest(`${LMS_BASE_URL}/api/v1/student/cards/total-courses`, {
            method: 'GET',
          }, token),
          apiRequest(`${LMS_BASE_URL}/api/v1/student/cards/avg-attendance`, {
            method: 'GET',
          }, token)
        ]);

        return {
          totalClasses: totalClasses.data || 0,
          totalCourses: totalCourses.data || 0,
          avgAttendance: avgAttendance.data || 0
        };
      } catch (error) {
        return {
          totalClasses: 0,
          totalCourses: 0,
          avgAttendance: 0
        };
      }
    },
  },

  mentors: {
    getAll: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/mentor/list`, {
          method: 'GET',
      }, token);
    },

    invite: async (mentorData: any, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/mentor/invite`, {
        method: 'POST',
        body: JSON.stringify(mentorData),
      }, token);
    },

    update: async (mentorId: string, updateData: any, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/mentor/update/${mentorId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }, token);
    },

    remove: async (mentorId: string, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/mentor/remove/${mentorId}`, {
        method: 'DELETE',
      }, token);
    },
  },

  assignments: {
    getAll: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/assignment/list`, {
        method: 'GET',
      }, token);
    },
  },
};

// Multimedia API functions
const multimediaApi = {
  sessions: {
    getAll: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/session/list`, {
        method: 'GET',
      }, token);
    },

    getStats: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/session/stats`, {
        method: 'GET',
      }, token);
    },

    getUpcoming: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/session/upcoming`, {
        method: 'GET',
      }, token);
    },
  },

  reports: {
    getAttendanceReport: async (filters: any, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/reports/attendance`, {
        method: 'POST',
        body: JSON.stringify(filters),
      }, token);
    },

    getSessionReport: async (filters: any, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/reports/session`, {
        method: 'POST',
        body: JSON.stringify(filters),
      }, token);
    },

    getCourseReport: async (filters: any, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/reports/course`, {
        method: 'POST',
        body: JSON.stringify(filters),
      }, token);
    },
  },
};

// Dashboard API functions
const dashboardApi = {
  getSummaryStats: async (token: string) => {
    try {
      const [programs, students, faculty, alerts] = await Promise.all([
        umsApi.programs.getMetrics(token, ''),
        umsApi.students.getMetrics(token, ''),
        umsApi.faculty.getAll(token, ''),
        umsApi.alerts.getStats(token, ''),
      ]);

      return {
        totalPrograms: programs.data?.totalCourses || 0,
        totalStudents: students.data?.totalStudents || 0,
        totalFaculty: faculty.data?.length || 0,
        totalAlerts: alerts.data?.totalAlerts || 0,
      };
    } catch (error) {
      return {
        totalPrograms: 0,
        totalStudents: 0,
        totalFaculty: 0,
        totalAlerts: 0,
      };
    }
  },

  getRecentActivities: async (token: string) => {
    try {
      const [recentSessions, recentStudents] = await Promise.all([
        multimediaApi.sessions.getUpcoming(token),
        lmsApi.students.getAll(token),
      ]);

      return {
        recentSessions: recentSessions.data || [],
        recentStudents: recentStudents.data || [],
      };
    } catch (error) {
      return {
        recentSessions: [],
        recentStudents: [],
      };
    }
  },
};

// Hook to use API with authentication
export const useApi = () => {
  const { token, refreshToken } = useAuth();

  if (!token) {
    throw new Error('No authentication token available');
  }

  // Memoize the API functions to prevent infinite re-renders
  const apiFunctions = useMemo(() => ({
    ums: {
      getUserProfile: () => umsApi.getUserProfile(token, refreshToken || ''),
      getAllUsers: () => umsApi.getAllUsers(token, refreshToken || ''),
      createUser: (userData: any) => umsApi.createUser(userData, token, refreshToken || ''),
      updateUser: (userId: string, userData: any) => umsApi.updateUser(userId, userData, token, refreshToken || ''),
      deleteUser: (userId: string) => umsApi.deleteUser(userId, token, refreshToken || ''),
      programs: {
        getAll: () => umsApi.programs.getAll(token, refreshToken || ''),
        getMetrics: () => umsApi.programs.getMetrics(token, refreshToken || ''),
        getDetails: (courseId: number) => umsApi.programs.getDetails(courseId, token, refreshToken || ''),
        getSessions: (courseId: number) => umsApi.programs.getSessions(courseId, token, refreshToken || ''),
        getReschedules: (courseId: number) => umsApi.programs.getReschedules(courseId, token, refreshToken || ''),
        create: (programData: any) => umsApi.programs.create(programData, token, refreshToken || ''),
      },
      students: {
        getAll: (page: number = 1, limit: number = 20) => umsApi.students.getAll(page, limit, token, refreshToken || ''),
        getMetrics: () => umsApi.students.getMetrics(token, refreshToken || ''),
        getDetails: (page: number = 1, limit: number = 20) => umsApi.students.getDetails(page, limit, token, refreshToken || ''),
        getAttendanceHistory: (studentId: string) => umsApi.students.getAttendanceHistory(studentId, token, refreshToken || ''),
      },
      alerts: {
        getAll: () => umsApi.alerts.getAll(token, refreshToken || ''),
        getStats: () => umsApi.alerts.getStats(token, refreshToken || ''),
      },
      reports: {
        getStats: (dateRange: string = 'last30') => umsApi.reports.getStats(dateRange, token, refreshToken || ''),
        getPrograms: () => umsApi.reports.getPrograms(token, refreshToken || ''),
        getMentors: () => umsApi.reports.getMentors(token, refreshToken || ''),
        getStudents: (limit: number = 20) => umsApi.reports.getStudents(limit, token, refreshToken || ''),
        getCohorts: () => umsApi.reports.getCohorts(token, refreshToken || ''),
        getFiltered: (filters: any) => umsApi.reports.getFiltered(filters, token, refreshToken || ''),
      },
      faculty: {
        getAll: () => umsApi.faculty.getAll(token, refreshToken || ''),
        invite: (facultyData: any) => umsApi.faculty.invite(facultyData, token, refreshToken || ''),
        signup: (signupData: any) => umsApi.faculty.signup(signupData),
        remove: (userId: string) => umsApi.faculty.remove(userId, token, refreshToken || ''),
      },
      auth: {
        login: (credentials: any) => umsApi.auth.login(credentials),
        refresh: (refreshToken: string) => umsApi.auth.refresh(refreshToken),
        changePassword: (passwordData: any) => umsApi.auth.changePassword(passwordData, token, refreshToken || ''),
      }
    },
    lms: {
      students: {
        getAll: () => lmsApi.students.getAll(token),
        getDashboardCards: () => lmsApi.students.getDashboardCards(token),
      },
      mentors: {
        getAll: () => lmsApi.mentors.getAll(token),
        invite: (mentorData: any) => lmsApi.mentors.invite(mentorData, token),
        update: (mentorId: string, updateData: any) => lmsApi.mentors.update(mentorId, updateData, token),
        remove: (mentorId: string) => lmsApi.mentors.remove(mentorId, token),
      },
      assignments: {
        getAll: () => lmsApi.assignments.getAll(token),
      },
    },
    multimedia: {
      sessions: {
        getAll: () => multimediaApi.sessions.getAll(token),
        getStats: () => multimediaApi.sessions.getStats(token),
        getUpcoming: () => multimediaApi.sessions.getUpcoming(token),
      },
      reports: {
        getAttendanceReport: (filters: any) => multimediaApi.reports.getAttendanceReport(filters, token),
        getSessionReport: (filters: any) => multimediaApi.reports.getSessionReport(filters, token),
        getCourseReport: (filters: any) => multimediaApi.reports.getCourseReport(filters, token),
      },
    },
    dashboard: {
      getSummaryStats: () => dashboardApi.getSummaryStats(token),
      getRecentActivities: () => dashboardApi.getRecentActivities(token),
    },
  }), [token, refreshToken]);

  return apiFunctions;
};

export default {
  ums: umsApi,
  lms: lmsApi,
  multimedia: multimediaApi,
  dashboard: dashboardApi,
};