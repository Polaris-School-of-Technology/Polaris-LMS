// API service layer to connect with all three backends
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Base URLs for different services
const UMS_BASE_URL = import.meta.env.VITE_UMS_BASE_URL || 'https://ums-672553132888.asia-south1.run.app'; // User Management System
const LMS_BASE_URL = import.meta.env.VITE_LMS_BASE_URL || 'https://live-class-lms1-672553132888.asia-south1.run.app'; // Live Class LMS Backend
const VOD_BASE_URL = 'https://prod-video-transcoding.polariscampus.com/v1/vod';

// Token storage and refresh functionality
let refreshTokenPromise: Promise<string> | null = null;

// Helper function to redirect to appropriate login page based on user type
// Only call this for actual 401 authentication errors
function decodeUserTypeFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const userType =
      payload?.userType ||
      payload?.user_type ||
      payload?.role ||
      payload?.type ||
      payload?.userRole;
    if (typeof userType === 'string') {
      return userType.toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

function redirectToLogin() {
  // Use a flag to prevent multiple redirects
  if ((window as any).__redirectingToLogin) {
    return;
  }
  (window as any).__redirectingToLogin = true;

  let redirectPath = '/student/login';

  try {
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
    const userType = decodeUserTypeFromToken(storedToken);

    if (userType === 'student') {
      redirectPath = '/student/login';
    } else if (userType === 'faculty' || userType === 'mentor') {
      redirectPath = '/faculty/login';
    } else if (userType === 'admin') {
      redirectPath = '/admin/login';
    } else {
      // Fallback based on current path
      const currentPath = window.location.pathname;
      if (currentPath.includes('/student')) {
        redirectPath = '/student/login';
      } else if (currentPath.includes('/faculty') || currentPath.includes('/mentor')) {
        redirectPath = '/faculty/login';
      }
    }
  } catch {
    // Ignore errors and fallback to default path
  }

  // Use replace instead of href to prevent back button issues
  window.location.replace(redirectPath);
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      // Try both possible refresh token endpoint paths
      const refreshUrl = `${UMS_BASE_URL}/ums/api/auth/refresh`;
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to refresh token';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If not JSON, use the text or default message
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken;

      if (!newAccessToken) {
        throw new Error('No access token received from refresh endpoint');
      }

      localStorage.setItem('accessToken', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      return newAccessToken;
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      console.error('Token refresh failed:', error);
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

  // Multimedia service - token is optional (some routes are unsecured like /session/analytics)
  if (url.includes('multimedia') || url.includes('mm/v3')) {
    if (token) { // Token is now optional
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }
  } else if (token) {
    // For LMS backend, only send Authorization header
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (jsonError) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 200)}`);
      }
      throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Check if response indicates an error even with 200 status
    if (data?.success === false) {
      throw new Error(data?.message || data?.error || 'Request failed');
    }

    return data;
  } catch (error: any) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to reach ${url}. This might be a CORS issue or the server is unreachable.`);
    }

    // If it's already an Error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise, wrap it
    throw new Error(error?.message || 'Network error occurred');
  }
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
        headers['Authorization'] = `Bearer ${newToken}`;
        headers['x-access-token'] = newToken; // Keep for backward compatibility
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });

        // Check if retry was successful
        if (!retryResponse.ok) {
          // Create error with status code preserved
          const error: any = new Error(`HTTP error! status: ${retryResponse.status}`);
          error.status = retryResponse.status;
          error.response = { status: retryResponse.status };

          if (retryResponse.status === 401) {
            // Still unauthorized after refresh - mark as 401 but don't redirect automatically
            // Let the component handle the redirect
            error.message = 'Authentication failed after token refresh';
            throw error;
          }
          // For other errors, try to parse error message
          try {
            const errorData = await retryResponse.json();
            error.message = errorData.message || `HTTP error! status: ${retryResponse.status}`;
            throw error;
          } catch (parseError) {
            throw error;
          }
        }

        // Parse successful response
        try {
          return await retryResponse.json();
        } catch (parseError) {
          // If response is not JSON, return empty object or text
          const text = await retryResponse.text();
          return text ? { data: text } : {};
        }
      } catch (error: any) {
        // Redirect to login on refresh failure
        // Preserve status code if it exists
        if (error.status === undefined) {
          error.status = 401;
          error.response = { status: 401 };
        }
        // Don't redirect here - let the component handle it based on error status
        // This prevents automatic redirects that might interfere with error handling
        throw error;
      }
    } else {
      // No refresh token available - mark as 401 but don't redirect automatically
      // Let the component decide whether to redirect
      const error: any = new Error('No refresh token available. Please login again.');
      error.status = 401;
      error.response = { status: 401 };
      // Don't redirect here - let the component handle it
      throw error;
    }
  }

  if (!response.ok) {
    // Create error with status code preserved for proper error handling
    const error: any = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.response = { status: response.status, statusText: response.statusText };

    // Try to get error message from response
    try {
      const errorData = await response.json();
      error.message = errorData?.message || errorData?.error || `HTTP error! status: ${response.status}`;
      error.response.data = errorData;
    } catch (parseError) {
      // If response is not JSON, use status text
      error.message = `HTTP error! status: ${response.status} - ${response.statusText}`;
    }
    throw error;
  }

  // Try to parse response as JSON
  try {
    return await response.json();
  } catch (parseError) {
    // If response is not JSON, return empty object
    return {};
  }
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

    getProgramDetails: async (courseId: number, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/admin/programs/getCourseById/${courseId}`, {
        method: 'GET',
      }, token);
    },

    getProgramMentors: async (courseId: number, token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/admin/ProgramMentors/courses/${courseId}/sessions`, {
        method: 'GET',
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
      return apiRequest(`${UMS_BASE_URL}/ums/api/alerts/list`, {
        method: 'GET',
      }, token);
    },

    getStats: async (token: string) => {
      return apiRequest(`${UMS_BASE_URL}/ums/api/alerts/stats`, {
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
    // Email/Password Login
    login: async (credentials: any) => {
      const response = await fetch(`${UMS_BASE_URL}/ums/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      const token = response.headers.get('x-access-token');
      // Extract refreshToken from response body or headers
      const refreshToken = data.refreshToken || response.headers.get('x-refresh-token') || response.headers.get('refresh-token');

      return { user: data.user, token, refreshToken };
    },

    // Google OAuth Login - Student
    studentGoogleLogin: async (token: string) => {
      const response = await fetch(`${UMS_BASE_URL}/ums/api/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const data = await response.json();
      const accessToken = response.headers.get('x-access-token');
      // Extract refreshToken from response body or headers
      const refreshToken = data.refreshToken || response.headers.get('x-refresh-token') || response.headers.get('refresh-token');

      return { user: data.user, token: accessToken, refreshToken };
    },

    // Google OAuth Login - Faculty
    facultyGoogleLogin: async (token: string) => {
      const response = await fetch(`${UMS_BASE_URL}/ums/api/auth/faculty/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const data = await response.json();
      const accessToken = response.headers.get('x-access-token');
      // Extract refreshToken from response body or headers
      const refreshToken = data.refreshToken || response.headers.get('x-refresh-token') || response.headers.get('refresh-token');

      return { user: data.user, token: accessToken, refreshToken };
    },

    // Google OAuth Login - Admin
    adminGoogleLogin: async (token: string) => {
      const response = await fetch(`${UMS_BASE_URL}/ums/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const data = await response.json();
      const accessToken = response.headers.get('x-access-token');
      // Extract refreshToken from response body or headers
      const refreshToken = data.refreshToken || response.headers.get('x-refresh-token') || response.headers.get('refresh-token');

      return { user: data.user, token: accessToken, refreshToken };
    },

    // Faculty Email Login
    facultyEmailLogin: async (credentials: any) => {
      const response = await fetch(`${UMS_BASE_URL}/ums/api/auth/faculty/email-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      const token = response.headers.get('x-access-token');
      // Extract refreshToken from response body or headers
      const refreshToken = data.refreshToken || response.headers.get('x-refresh-token') || response.headers.get('refresh-token');

      return { user: data.user, token, refreshToken };
    },

    refresh: async (refreshToken: string) => {
      return apiRequest(`${UMS_BASE_URL}/ums/api/auth/refresh`, {
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

    getClassSchedule: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/student/schedule/class-schedule`, {
        method: 'GET',
      }, token);
    },

    getAssignments: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/studentAssignments/assignments`, {
        method: 'GET',
      }, token);
    },

    getAssignmentDetails: async (assignmentId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/studentAssignments/assignments/${assignmentId}`, {
        method: 'GET',
      }, token);
    },

    submitAssignment: async (formData: FormData, token: string) => {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${LMS_BASE_URL}/api/v1/studentAssignments/upload/assignment`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
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

    getAllSessions: async (mentorId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/schedule/faculty/${mentorId}/sessions`, {
        method: 'GET',
      }, token);
    },
    getFacultyStudents: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/faculty-students`, {
        method: 'GET',
      }, token);
    },
    getTotalClasses: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/total-classes`, {
        method: 'GET',
      }, token);
    },
    getTotalCourses: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/total-courses`, {
        method: 'GET',
      }, token);
    },
    getAvgAttendance: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/avg-attendance`, {
        method: 'GET',
      }, token);
    },

    submitFeedback: async (feedbackData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/submit-feedback`, {
        method: 'POST',
        body: JSON.stringify(feedbackData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    getBatches: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/batches`, {
        method: 'GET',
      }, token);
    },

    getSections: async (batchId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/sections/${batchId}`, {
        method: 'GET',
      }, token);
    },

    addSession: async (sessionData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/mentor/cards/Addsessions`, {
        method: 'POST',
        body: JSON.stringify(sessionData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },
  },

  batches: {
    getAllBatches: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/batch/batches`, {
        method: 'GET',
      }, token);
    },

    getBatchStudents: async (batchId: string, page: number = 1, limit: number = 10, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/batch/batches/${batchId}/students?page=${page}&limit=${limit}`, {
        method: 'GET',
      }, token);
    },

    getBatchSessions: async (batchId: string, date: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/batch/sessions/${date}?batch_id=${batchId}`, {
        method: 'GET',
      }, token);
    },

    updateBatch: async (batchId: string, name: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/batch/batches/${batchId}/update`, {
        method: 'PUT',
        body: JSON.stringify({ batchId, newName: name }),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    removeStudentFromBatch: async (batchId: string, studentId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/batch/batches/${batchId}/students/${studentId}`, {
        method: 'DELETE',
      }, token);
    },
  },


  sessions: {
    markComplete: async (sessionId: number, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/live/complete`, {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: {
          'Content-Type': 'application/json',
        },
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

    createMentorGroup: async (groupData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/createGroup`, {
        method: 'POST',
        body: JSON.stringify(groupData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    getAllSessions: async (mentorId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/getAllSessions?facultyId=${mentorId}`, {
        method: 'GET',
      }, token);
    },

    getRescheduledSessions: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/getRescheduledSessions`, {
        method: 'GET',
      }, token);
    },

    // Mentor reschedules summary
    getMentorReschedules: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/mentors/mentorReschedules`, {
        method: 'GET',
      }, token);
    },

    // Program mentors for a specific course
    getProgramMentors: async (courseId: number, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/ProgramMentors/courses/${courseId}/sessions`, {
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

  // Admin Groups endpoints
  adminGroups: {
    getGroupStats: async (token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/groups/stats`, {
        method: 'GET',
      }, token);
    },

    createGroup: async (groupData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/groups/create`, {
        method: 'POST',
        body: JSON.stringify(groupData),
        headers: { 'Content-Type': 'application/json' },
      }, token);
    },

    editGroup: async (groupId: string, groupData: any, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/groups/editGroup/${groupId}`, {
        method: 'POST',
        body: JSON.stringify(groupData),
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

    getStudentPerformance: async (page: number = 1, limit: number = 10, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/admin/students/performance?page=${page}&limit=${limit}`, {
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

  adminSchedule: {
    getFacultySessions: async (facultyId: string, token: string) => {
      return lmsApiRequest(`${LMS_BASE_URL}/api/v1/schedule/faculty/${facultyId}/sessions?limit=1000`, {
        method: 'GET',
      }, token);
    },
  },

};
// admin analytics endpoints
const adminAnalytics = {
  getMentorAnalytics: async (
    token: string,
    start_date?: string,
    end_date?: string,
    page?: number,  
    limit?: number
  ) => {
    const query =
      start_date && end_date
        ? `?start_date=${start_date}&end_date=${end_date}`
        : `?page=${page || 1}&limit=${limit || 10}`;
    return lmsApiRequest(
      `${LMS_BASE_URL}/api/v1/admin/mentorStats/total-lectures${query}`,
      {
        method: "GET",
      },
      token
    );
  },
  getSelectedMentorAnalytics: async (
    token: string,
    mentor_id: string,
    start_date:string,
    end_date:string)=>{
      return lmsApiRequest(
        `${LMS_BASE_URL}/api/v1/admin/mentorStats/${mentor_id}/lectures?start_date=${start_date}&end_date=${end_date}`,
        {
          method: "GET",
        },
        token
      );
    }
};

// Multimedia API functions
const getMMBaseURL = () => {
  const multimediaBaseUrl = import.meta.env.VITE_MULTIMEDIA_BASE_URL;
  if (!multimediaBaseUrl) {
    console.warn('VITE_MULTIMEDIA_BASE_URL is not configured; defaulting to https://prod-multimedia.polariscampus.com/mm/v3');
  }
  return multimediaBaseUrl || 'https://prod-multimedia.polariscampus.com/mm/v3';
};

const MM_BASE_URL = getMMBaseURL();

const multimediaApi = {
  sessions: {
    getAll: async (token: string) => {
      return apiRequest(`${LMS_BASE_URL}/api/v1/session/list`, {
        method: 'GET',
      }, token);
    },

    getEndedSessions: async (token: string, batchId?: number, facultyId?: string, limit: number = 50, offset: number = 0) => {
      const params = new URLSearchParams();
      if (batchId) params.append('batchId', batchId.toString());
      if (facultyId) params.append('facultyId', facultyId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      return lmsApiRequest(`${MM_BASE_URL}/liveclass/session/ended?${params.toString()}`, {
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

    startSession: async (sessionId: number, facultyId: string, batchId: number, facultyName: string, token: string) => {
      const url = `${MM_BASE_URL}/liveclass/session/start`;
      try {
        const response = await lmsApiRequest(url, {
          method: 'POST',
          body: JSON.stringify({ sessionId, facultyId, batchId, facultyName, platform: 'external_lms' }),
          headers: {
            'Content-Type': 'application/json',
          },
        }, token);
        return response;
      } catch (error: any) {
        throw error;
      }
    },

    // getSessionStatus: async (sessionId: string, token: string) => {
    //   return lmsApiRequest(`${MM_BASE_URL}/liveclass/session/${sessionId}/status`, {
    //     method: 'GET',
    //   }, token);
    // },

    joinSession: async (sessionId: number, _entityName: string | undefined, deviceDetails: any, token: string, user?: any) => {
      const url = `${MM_BASE_URL}/liveclass/session/student/interactive-join-token`;
      try {
        // Parse user info from token or use provided user object
        let studentId = '';
        let studentName = '';

        if (user) {
          studentId = user.id || '';
          studentName = user.name || '';
        } else if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            studentId = decoded.id || '';
            studentName = decoded.name || '';
          } catch {
            // Ignore decoding errors; payload may not be a JWT
          }
        }

        const payload: any = {
          sessionId,
          studentId,
          studentName,
          deviceType: deviceDetails?.deviceType || 'web',
        };

        // Check if token exists before making request
        if (!token) {
          const error: any = new Error('No authentication token available. Please login again.');
          error.status = 401;
          error.response = { status: 401 };
          redirectToLogin();
          throw error;
        }

        // Use lmsApiRequest for multimedia service
        const response = await lmsApiRequest(url, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }, token);

        return response;
      } catch (error: any) {
        // Log the actual error for debugging
        console.error('Join session error:', {
          message: error?.message,
          status: error?.status || error?.response?.status,
          statusText: error?.response?.statusText,
          error: error
        });

        // ONLY treat as auth error if we have a confirmed 401 status code
        // Don't check error messages as they can be misleading
        const statusCode = error?.status || error?.response?.status;
        const isAuthError = statusCode === 401;

        // Don't modify non-auth errors - let them pass through with their original message
        if (isAuthError) {
          // Only for actual 401 errors
          // DON'T call redirectToLogin() here - let the component handle it
          // This prevents automatic page redirect which interrupts the error handling
          const authError: any = new Error('Your session has expired. Please login again to join the session.');
          authError.status = 401;
          authError.response = { status: 401 };
          throw authError;
        }

        // For all other errors (400, 404, 500, network errors, etc.), pass through the original error
        // This way users see the actual error message from the server
        // Make sure status code is preserved
        if (!error.status && !error.response?.status) {
          error.status = statusCode;
          if (!error.response) error.response = {};
          error.response.status = statusCode;
        }
        throw error;
      }
    },

    endSession: async (sessionId: number, facultyId: string, token: string) => {
      return lmsApiRequest(`${MM_BASE_URL}/liveclass/session/end`, {
        method: 'POST',
        body: JSON.stringify({ sessionId, facultyId }),
        headers: {
          'Content-Type': 'application/json',
        },
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

  attendance: {
    // Get session attendance from multimedia service
    getSessionAttendance: async (sessionId: number, token: string, batchId?: number, courseId?: number, search?: string, limit: number = 20, offset: number = 0) => {
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId.toString());
      if (batchId) params.append('batchId', batchId.toString());
      if (courseId) params.append('courseId', courseId.toString());
      if (search) params.append('search', search);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      // MM_BASE_URL already contains /mm/v3
      return lmsApiRequest(`${MM_BASE_URL}/session/attendance?${params.toString()}`, {
        method: 'GET',
      }, token);
    },

    // Get course attendance from multimedia service
    getCourseAttendance: async (sessionId: number | null, courseId: number, token: string, search?: string, limit: number = 20, offset: number = 0) => {
      const params = new URLSearchParams();
      params.append('entityId', courseId.toString());
      if (sessionId) params.append('liveSessionId', sessionId.toString());
      if (search) params.append('search', search);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      // MM_BASE_URL already contains /mm/v3
      return lmsApiRequest(`${MM_BASE_URL}/session/course/attendance?${params.toString()}`, {
        method: 'GET',
      }, token);
    },

    // Get session analytics from multimedia service (includes 50% threshold attendance)
    getSessionAnalytics: async (sessionId: number, token: string) => {
      const params = new URLSearchParams();
      params.append('sessionId', sessionId.toString());

      // MM_BASE_URL already contains /mm/v3, so we don't need to add it again
      return lmsApiRequest(`${MM_BASE_URL}/session/analytics?${params.toString()}`, {
        method: 'GET',
      }, token);
    },

    // Get isPresent data for a session from LMS admin batch attendance API
    // Backend endpoint (LMS): /api/v1/admin/batch/attendance/:sessionId
    // Expected response:
    // {
    //   success: true,
    //   students: [
    //     {
    //       attendanceId: number,
    //       userId: string,
    //       sessionId: number,
    //       isPresent: boolean,
    //       student: { id: string, name: string, email: string }
    //     },
    //     ...
    //   ]
    // }
    getBatchSessionAttendance: async (sessionId: number, token: string) => {
      // Matches backend route: https://live-class-lms1-672553132888.asia-south1.run.app/api/v1/admin/batch/attendance/1081
      return apiRequest(`${LMS_BASE_URL}/api/v1/admin/batch/attendance/${sessionId}`, {
        method: 'GET',
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

export const vodApi = {
  recordings: {
    getStudentRecordings: async (studentId: string, token: string) => {
      try {
        return await apiRequest(
          `${VOD_BASE_URL}/students/${studentId}/recordings`,
          { method: 'GET' },
          token
        );
      } catch (error: any) {
        if (error.message?.includes('multiple (or no) rows returned')) {
          console.warn(`Student ${studentId} has multiple batches, this needs backend fix`);

          if (studentId !== '08faa382-56d6-4a7c-9482-ef6efdfa5bea') {
            console.log('Falling back to test student ID');
            return await apiRequest(
              `${VOD_BASE_URL}/students/08faa382-56d6-4a7c-9482-ef6efdfa5bea/recordings`,
              { method: 'GET' },
              token
            );
          }
        }
        throw error;
      }
    },
    getMasterPlaylist: async (sessionId: number, token: string) => {
      return await apiRequest(
        `${VOD_BASE_URL}/sessions/${sessionId}/master-playlist`,
        { method: 'GET' },
        token
      );
    },
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
        getProgramDetails: (courseId: number) => umsApi.programs.getProgramDetails(courseId, token),
        create: (programData: any) => umsApi.programs.create(programData, token),
      },
      students: {
        getAll: (page: number = 1, limit: number = 20) => umsApi.students.getAll(page, limit, token),
        getMetrics: () => umsApi.students.getMetrics(token),
        getDetails: (page: number = 1, limit: number = 20) => lmsApi.students.getStudentDetails(page, limit, token),
        getAttendanceHistory: (studentId: string) => umsApi.students.getAttendanceHistory(studentId, token),
        bulkEnroll: (file: File, batchId: number) => umsApi.students.bulkEnroll(file, batchId, token),
        getRecordings: (studentId: string) => vodApi.recordings.getStudentRecordings(studentId, token),
      },
      recordings: {
        getMasterPlaylist: (sessionId: number) => vodApi.recordings.getMasterPlaylist(sessionId, token),
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
        getStudentDetails: (page: number, limit: number) => lmsApi.students.getStudentDetails(page, limit, token),
        getClassSchedule: () => lmsApi.students.getClassSchedule(token),
        getAssignments: () => lmsApi.students.getAssignments(token),
        getAssignmentDetails: (assignmentId: string) => lmsApi.students.getAssignmentDetails(assignmentId, token),
        submitAssignment: (formData: FormData) => lmsApi.students.submitAssignment(formData, token),
      },
      mentors: {
        getAll: () => lmsApi.mentors.getAll(token),
        invite: (mentorData: any) => lmsApi.mentors.invite(mentorData, token),
        getAllBatches: () => lmsApi.mentors.getAllBatches(token),
        update: (mentorId: string, updateData: any) => lmsApi.mentors.update(mentorId, updateData, token),
        remove: (mentorId: string) => lmsApi.mentors.remove(mentorId, token),
        getAllSessions: (mentorId: string) => lmsApi.mentors.getAllSessions(mentorId, token),
        getFacultyStudents: () => lmsApi.mentors.getFacultyStudents(token),
        getTotalClasses: () => lmsApi.mentors.getTotalClasses(token),
        getTotalCourses: () => lmsApi.mentors.getTotalCourses(token),
        getAvgAttendance: () => lmsApi.mentors.getAvgAttendance(token),
        submitFeedback: (feedbackData: any) => lmsApi.mentors.submitFeedback(feedbackData, token),
        getBatches: () => lmsApi.mentors.getBatches(token),
        getSections: (batchId: string) => lmsApi.mentors.getSections(batchId, token),
        addSession: (sessionData: any) => lmsApi.mentors.addSession(sessionData, token),
      },
      sessions: {
        markComplete: (sessionId: number) => lmsApi.sessions.markComplete(sessionId, token),
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
        createMentorGroup: (groupData: any) => lmsApi.adminMentors.createMentorGroup(groupData, token),
        getAllSessions: (mentorId: string) => lmsApi.adminMentors.getAllSessions(mentorId, token),
        getRescheduledSessions: () => lmsApi.adminMentors.getRescheduledSessions(token),
        getMentorReschedules: () => lmsApi.adminMentors.getMentorReschedules(token),
        getProgramMentors: (courseId: number) => lmsApi.adminMentors.getProgramMentors(courseId, token),
      },
      adminPrograms: {
        getProgramStats: () => lmsApi.adminPrograms.getProgramStats(token),
        createProgram: (programData: any) => lmsApi.adminPrograms.createProgram(programData, token),
        getAllFaculties: () => lmsApi.adminPrograms.getAllFaculties(token),
        editProgram: (programId: string, programData: any) => lmsApi.adminPrograms.editProgram(programId, programData, token),
      },
      adminGroups: {
        getGroupStats: () => lmsApi.adminGroups.getGroupStats(token),
        createGroup: (groupData: any) => lmsApi.adminGroups.createGroup(groupData, token),
        editGroup: (groupId: string, groupData: any) => lmsApi.adminGroups.editGroup(groupId, groupData, token),
      },
      adminStudents: {
        bulkUploadStudents: (formData: FormData) => lmsApi.adminStudents.bulkUploadStudents(formData, token),
        getWeeklyAttendanceStats: () => lmsApi.adminStudents.getWeeklyAttendanceStats(token),
        getStudentPerformance: (page: number, limit: number) => lmsApi.adminStudents.getStudentPerformance(page, limit, token),
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
      adminSchedule: {
        getFacultySessions: (facultyId: string) => lmsApi.adminSchedule.getFacultySessions(facultyId, token),
      },
      batches: {
        getAllBatches: () => lmsApi.batches.getAllBatches(token),
        getBatchStudents: (batchId: string, page: number, limit: number) => lmsApi.batches.getBatchStudents(batchId, page, limit, token),
        getBatchSessions: (batchId: string, date: string) => lmsApi.batches.getBatchSessions(batchId, date, token),
        updateBatch: (batchId: string, name: string) => lmsApi.batches.updateBatch(batchId, name, token),
        removeStudentFromBatch: (batchId: string, studentId: string) => lmsApi.batches.removeStudentFromBatch(batchId, studentId, token),
      },
    },
    multimedia: {
      sessions: {
        getAll: () => multimediaApi.sessions.getAll(token),
        getEndedSessions: (batchId?: number, facultyId?: string, limit?: number, offset?: number) =>
          multimediaApi.sessions.getEndedSessions(token, batchId, facultyId, limit || 50, offset || 0),
        getStats: () => multimediaApi.sessions.getStats(token),
        getUpcoming: () => multimediaApi.sessions.getUpcoming(token),
        startSession: (sessionId: number, facultyId: string, batchId: number, facultyName: string) =>
          multimediaApi.sessions.startSession(sessionId, facultyId, batchId, facultyName, token),
        // getSessionStatus: (sessionId: string) => multimediaApi.sessions.getSessionStatus(sessionId, token),
        joinSession: (sessionId: number, entityName?: string, deviceDetails?: any, providedToken?: string, user?: any) =>
          multimediaApi.sessions.joinSession(sessionId, entityName, deviceDetails, providedToken || token, user),
        endSession: (sessionId: number, facultyId: string) => multimediaApi.sessions.endSession(sessionId, facultyId, token),
      },
      reports: {
        getAttendanceReport: (filters: any) => multimediaApi.reports.getAttendanceReport(filters, token),
        getSessionReport: (filters: any) => multimediaApi.reports.getSessionReport(filters, token),
        getCourseReport: (filters: any) => multimediaApi.reports.getCourseReport(filters, token),
      },
      attendance: {
        getSessionAttendance: (sessionId: number, batchId?: number, courseId?: number, search?: string, limit?: number, offset?: number) =>
          multimediaApi.attendance.getSessionAttendance(sessionId, token, batchId, courseId, search, limit || 20, offset || 0),
        getCourseAttendance: (sessionId: number | null, courseId: number, search?: string, limit?: number, offset?: number) =>
          multimediaApi.attendance.getCourseAttendance(sessionId, courseId, token, search, limit || 20, offset || 0),
        getSessionAnalytics: (sessionId: number) =>
          multimediaApi.attendance.getSessionAnalytics(sessionId, token),
        getBatchSessionAttendance: (sessionId: number) =>
          multimediaApi.attendance.getBatchSessionAttendance(sessionId, token),
      },
    },
    dashboard: {
      getSummaryStats: () => dashboardApi.getSummaryStats(token),
      getRecentActivities: () => dashboardApi.getRecentActivities(token),
    },
    adminAnalytics: {
      mentorsAnalytics: (start_date?: string, end_date?: string, page?: number, limit?: number) =>
        adminAnalytics.getMentorAnalytics(token, start_date, end_date, page, limit),
      lecturesAnalytics: (mentor_id: string, start_date:string, end_date:string) =>
        adminAnalytics.getSelectedMentorAnalytics(token, mentor_id, start_date, end_date),
    },

  }), [token, refreshToken]);

  return apiFunctions;
};

// Export public auth functions (don't require authentication)
export const publicAuthApi = umsApi.auth;

export default {
  ums: umsApi,
  lms: lmsApi,
  multimedia: multimediaApi,
  dashboard: dashboardApi,
};
