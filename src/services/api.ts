// API service layer to connect with all three backends
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URLs for different services
const UMS_BASE_URL = import.meta.env.VITE_UMS_BASE_URL || 'https://ums-672553132888.asia-south1.run.app'; // User Management System
const LMS_BASE_URL = import.meta.env.VITE_LMS_BASE_URL || 'https://live-class-lms1-672553132888.asia-south1.run.app'; // Live Class LMS Backend  

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

// Live LMS API request function (only sends Authorization header)
async function lmsApiRequest(url: string, options: RequestInit = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    // Don't send x-access-token for live LMS backend
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Generic API request function with automatic token refresh
async function apiRequest(url: string, options: RequestInit = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-access-token'] = token; // Keep for backward compatibility
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
        headers['Authorization'] = `Bearer ${newToken}`;
        headers['x-access-token'] = newToken; // Keep for backward compatibility
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
  getUserProfile: async (token: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/profile`, {
      method: 'GET',
    }, token);
  },

  getAllUsers: async (token: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users`, {
      method: 'GET',
    }, token);
  },

  createUser: async (userData: any, token: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    }, token);
  },

  updateUser: async (userId: string, userData: any, token: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }, token);
  },

  deleteUser: async (userId: string, token: string) => {
    return apiRequest(`${UMS_BASE_URL}/api/auth/users/${userId}`, {
      method: 'DELETE',
    }, token);
  },

  // Programs
  programs: {
    getAll: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/list`, {
        method: 'GET',
      }, token);
    },

    getMetrics: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/metrics`, {
        method: 'GET',
      }, token);
    },

    getDetails: async (courseId: number, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/${courseId}`, {
        method: 'GET',
      }, token);
    },

    getSessions: async (courseId: number, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/${courseId}/sessions`, {
        method: 'GET',
      }, token);
    },

    getReschedules: async (courseId: number, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/${courseId}/reschedules`, {
        method: 'GET',
      }, token);
    },

    create: async (programData: any, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/programs/create`, {
        method: 'POST',
        body: JSON.stringify(programData),
      }, token);
    },
  },

  // Students
  students: {
    getAll: async (page: number = 1, limit: number = 20, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/list?page=${page}&limit=${limit}`, {
        method: 'GET',
      }, token);
    },

    getMetrics: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/metrics`, {
        method: 'GET',
      }, token);
    },

    getDetails: async (page: number = 1, limit: number = 20, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/details?page=${page}&limit=${limit}`, {
        method: 'GET',
      }, token);
    },

    getAttendanceHistory: async (studentId: string, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/students/${studentId}/attendance`, {
        method: 'GET',
      }, token);
    },

    bulkEnroll: async (file: File, batchId: number, token: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchId', batchId.toString());
      
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/students/bulk-enroll`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        }
      }, token);
    },
  },

  // Alerts
  alerts: {
    getAll: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/alerts/list`, {
        method: 'GET',
      }, token);
    },

    getStats: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/alerts/stats`, {
        method: 'GET',
      }, token);
    },
  },

  // Reports
  reports: {
    getStats: async (dateRange: string = 'last30', token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/stats?dateRange=${dateRange}`, {
        method: 'GET',
      }, token);
    },

    getPrograms: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/programs`, {
        method: 'GET',
      }, token);
    },

    getMentors: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/mentors`, {
        method: 'GET',
      }, token);
    },

    getStudents: async (limit: number = 20, token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/students?limit=${limit}`, {
        method: 'GET',
      }, token);
    },

    getCohorts: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/reports/cohorts`, {
        method: 'GET',
      }, token);
    },

    getFiltered: async (filters: any, token: string) => {
      const queryParams = new URLSearchParams(filters).toString();
      return apiRequest(`${UMS_BASE_URL}/api/reports/filtered?${queryParams}`, {
        method: 'GET',
      }, token);
    },
  },

  // Faculty
  faculty: {
    getAll: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/api/faculty/list`, {
        method: 'GET',
      }, token);
    },

    invite: async (facultyData: any, token: string) => {
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

    remove: async (userId: string, token: string) => {
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

    changePassword: async (passwordData: any, token: string) => {
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
    getStudentDetails: async (page: number = 1, limit: number = 20, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/students/performance?page=${page}&limit=${limit}`, {
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
      // Use adminPrograms.getAllFaculties instead of non-existent mentor/list endpoint
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/allFaculties`, {
          method: 'GET',
      }, token);
    },

    invite: async (mentorData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/addMentor`, {
        method: 'POST',
        body: JSON.stringify(mentorData),
        headers: {
          'Content-Type': 'application/json',
        },
      }, token);
    },

    getAllBatches: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/getAllBatches`, {
        method: 'GET',
      }, token);
    },

    update: async (_mentorId: string, _updateData: any, _token: string) => {
      // Note: Update endpoint doesn't exist in Live LMS, return mock success
      return Promise.resolve({
        success: true,
        message: 'Mentor update not supported in current backend version'
      });
    },

    remove: async (_mentorId: string, _token: string) => {
      // Note: Remove endpoint doesn't exist in Live LMS, return mock success
      return Promise.resolve({
        success: true,
        message: 'Mentor removal not supported in current backend version'
      });
    },
  },

  assignments: {
    getAll: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/assignment/list`, {
        method: 'GET',
      }, token);
    },
  },

  programs: {
    create: async (programData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/create`, {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    getAll: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/stats`, {
        method: 'GET',
      }, token);
    },

    getById: async (programId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/getCourseById/${programId}`, {
        method: 'GET',
      }, token);
    },

    edit: async (programId: string, programData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/editCourse/${programId}`, {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    getAllFaculties: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/allFaculties`, {
        method: 'GET',
      }, token);
    },

    getAllCourses: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/stats`, {
        method: 'GET',
      }, token);
    },
  },

  adminCards: {
    getActivePrograms: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/cards/active-programs`, {
        method: 'GET',
      }, token);
    },

    getActiveMentors: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/cards/active-mentors`, {
        method: 'GET',
      }, token);
    },

    getScheduledSessions: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/cards/scheduled-sessions`, {
        method: 'GET',
      }, token);
    },

    getAverageAttendance: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/cards/average-attendance`, {
        method: 'GET',
      }, token);
    },
  },

  // Additional Live LMS endpoints
  adminMentors: {
    addMentor: async (mentorData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/addMentor`, {
        method: 'POST',
        body: JSON.stringify(mentorData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    getAllBatches: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/getAllBatches`, {
        method: 'GET',
      }, token);
    },

    getAllCourses: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/getAllCourses`, {
        method: 'GET',
      }, token);
    },

    getAllSessions: async (mentorId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/getAllSessions/${mentorId}`, {
        method: 'GET',
      }, token);
    },

    getRescheduledSessions: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/getRescheduledSessions`, {
        method: 'GET',
      }, token);
    },
  },

  adminPrograms: {
    getProgramStats: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/stats`, {
        method: 'GET',
      }, token);
    },

    createProgram: async (programData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/create`, {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    getAllFaculties: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/allFaculties`, {
        method: 'GET',
      }, token);
    },

    editProgram: async (programId: string, programData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/editCourse/${programId}`, {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },
  },

  // Admin Students data endpoints
  adminStudents: {
    bulkUploadStudents: async (formData: FormData, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/students/bulk-enroll`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData, let browser set it
      }, token);
    },

    getWeeklyAttendanceStats: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/students/weekly-attendance-stats`, {
        method: 'GET',
      }, token);
    },

    getStudentPerformance: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/students/performance`, {
        method: 'GET',
      }, token);
    },
  },

  // Mentor Data (Admin side) endpoints
  adminMentorData: {
    getMentorStats: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentor-data/stats`, {
        method: 'GET',
      }, token);
    },
    
    getDashboardStats: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentorStats/dashboard/all`, {
        method: 'GET',
      }, token);
    },
    
    getPerformanceMetrics: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentorStats/performance-metrics`, {
        method: 'GET',
      }, token);
    },

    getMentorWiseStats: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentor-data/mentor-wise-stats`, {
        method: 'GET',
      }, token);
    },

    getMentorWiseSessionData: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentor-data/mentor-wise-session-data`, {
        method: 'GET',
      }, token);
    },
  },

  // Admin Reports endpoints
  adminReports: {
    getAttendance: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/reports/attendance`, {
        method: 'GET',
      }, token);
    },

    getSessionAnalytics: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/reports/session-analytics`, {
        method: 'GET',
      }, token);
    },

    getFacultyPerformance: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/reports/faculty-performance`, {
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
        umsApi.programs.getMetrics(token),
        umsApi.students.getMetrics(token),
        umsApi.faculty.getAll(token),
        umsApi.alerts.getStats(token),
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
      getUserProfile: () => umsApi.getUserProfile(token),
      getAllUsers: () => umsApi.getAllUsers(token),
      createUser: (userData: any) => umsApi.createUser(userData, token),
      updateUser: (userId: string, userData: any) => umsApi.updateUser(userId, userData, token),
      deleteUser: (userId: string) => umsApi.deleteUser(userId, token),
      programs: {
        getAll: () => umsApi.programs.getAll(token),
        getMetrics: () => umsApi.programs.getMetrics(token),
        getDetails: (courseId: number) => umsApi.programs.getDetails(courseId, token),
        getSessions: (courseId: number) => umsApi.programs.getSessions(courseId, token),
        getReschedules: (courseId: number) => umsApi.programs.getReschedules(courseId, token),
        create: (programData: any) => umsApi.programs.create(programData, token),
      },
      students: {
        getAll: (page: number = 1, limit: number = 20) => umsApi.students.getAll(page, limit, token),
        getMetrics: () => umsApi.students.getMetrics(token),
        getDetails: (page: number = 1, limit: number = 20) => lmsApi.students.getStudentDetails(page, limit, token),
        getAttendanceHistory: (studentId: string) => umsApi.students.getAttendanceHistory(studentId, token),
        bulkEnroll: (file: File, batchId: number) => umsApi.students.bulkEnroll(file, batchId, token),
      },
      alerts: {
        getAll: () => umsApi.alerts.getAll(token),
        getStats: () => umsApi.alerts.getStats(token),
      },
      reports: {
        getStats: (dateRange: string = 'last30') => umsApi.reports.getStats(dateRange, token),
        getPrograms: () => umsApi.reports.getPrograms(token),
        getMentors: () => umsApi.reports.getMentors(token),
        getStudents: (limit: number = 20) => umsApi.reports.getStudents(limit, token),
        getCohorts: () => umsApi.reports.getCohorts(token),
        getFiltered: (filters: any) => umsApi.reports.getFiltered(filters, token),
      },
      faculty: {
        getAll: () => umsApi.faculty.getAll(token),
        invite: (facultyData: any) => umsApi.faculty.invite(facultyData, token),
        signup: (signupData: any) => umsApi.faculty.signup(signupData),
        remove: (userId: string) => umsApi.faculty.remove(userId, token),
      },
      auth: {
        login: (credentials: any) => umsApi.auth.login(credentials),
        refresh: (refreshToken: string) => umsApi.auth.refresh(refreshToken),
        changePassword: (passwordData: any) => umsApi.auth.changePassword(passwordData, token),
      }
    },
    lms: {
      students: {
        getAll: () => lmsApi.students.getAll(token),
        getDashboardCards: () => lmsApi.students.getDashboardCards(token),
        getStudentDetails: (page: number, limit: number) => lmsApi.adminStudents.getStudentDetails(page, limit, token),
      },
      mentors: {
        getAll: () => lmsApi.mentors.getAll(token),
        invite: (mentorData: any) => lmsApi.mentors.invite(mentorData, token),
        getAllBatches: () => lmsApi.mentors.getAllBatches(token),
        update: (mentorId: string, updateData: any) => lmsApi.mentors.update(mentorId, updateData, token),
        remove: (mentorId: string) => lmsApi.mentors.remove(mentorId, token),
      },
      assignments: {
        getAll: () => lmsApi.assignments.getAll(token),
      },
      programs: {
        create: (programData: any) => lmsApi.programs.create(programData, token),
        getAll: () => lmsApi.programs.getAll(token),
        getById: (programId: string) => lmsApi.programs.getById(programId, token),
        edit: (programId: string, programData: any) => lmsApi.programs.edit(programId, programData, token),
        getAllFaculties: () => lmsApi.programs.getAllFaculties(token),
        getAllCourses: () => lmsApi.programs.getAllCourses(token),
      },
      adminCards: {
        getActivePrograms: () => lmsApi.adminCards.getActivePrograms(token),
        getActiveMentors: () => lmsApi.adminCards.getActiveMentors(token),
        getScheduledSessions: () => lmsApi.adminCards.getScheduledSessions(token),
        getAverageAttendance: () => lmsApi.adminCards.getAverageAttendance(token),
      },
      adminMentors: {
        addMentor: (mentorData: any) => lmsApi.adminMentors.addMentor(mentorData, token),
        getAllBatches: () => lmsApi.adminMentors.getAllBatches(token),
        getAllCourses: () => lmsApi.adminMentors.getAllCourses(token),
        getAllSessions: (mentorId: string) => lmsApi.adminMentors.getAllSessions(mentorId, token),
        getRescheduledSessions: () => lmsApi.adminMentors.getRescheduledSessions(token),
      },
      adminPrograms: {
        getProgramStats: () => lmsApi.adminPrograms.getProgramStats(token),
        createProgram: (programData: any) => lmsApi.adminPrograms.createProgram(programData, token),
        getAllFaculties: () => lmsApi.adminPrograms.getAllFaculties(token),
        editProgram: (programId: string, programData: any) => lmsApi.adminPrograms.editProgram(programId, programData, token),
      },
      adminStudents: {
        bulkUploadStudents: (formData: FormData) => lmsApi.adminStudents.bulkUploadStudents(formData, token),
        getWeeklyAttendanceStats: () => lmsApi.adminStudents.getWeeklyAttendanceStats(token),
        getStudentPerformance: () => lmsApi.adminStudents.getStudentPerformance(token),
      },
      adminMentorData: {
        getMentorStats: () => lmsApi.adminMentorData.getMentorStats(token),
        getDashboardStats: () => lmsApi.adminMentorData.getDashboardStats(token),
        getPerformanceMetrics: () => lmsApi.adminMentorData.getPerformanceMetrics(token),
        getMentorWiseStats: () => lmsApi.adminMentorData.getMentorWiseStats(token),
        getMentorWiseSessionData: () => lmsApi.adminMentorData.getMentorWiseSessionData(token),
      },
      adminReports: {
        getAttendance: () => lmsApi.adminReports.getAttendance(token),
        getSessionAnalytics: () => lmsApi.adminReports.getSessionAnalytics(token),
        getFacultyPerformance: () => lmsApi.adminReports.getFacultyPerformance(token),
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
