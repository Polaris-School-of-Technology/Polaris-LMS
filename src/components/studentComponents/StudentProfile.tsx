import { useState, useEffect } from 'react';
import { Calendar, Video, FileText, Github, Award, Clock, Users, BookOpen, PlayCircle, CheckCircle, AlertCircle, Upload, File, X, Mail, Phone, Briefcase, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface UpcomingClass {
  id: string;
  title: string;
  mentor: string;
  program: string;
  date: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'live' | 'completed' | 'postponed';
  rescheduled?: boolean;
  originalDate?: string;
  epoch?: number; // timestamp for sorting/filtering
}

interface Recording {
  id: string;
  title: string;
  mentor: string;
  date: string;
  duration: string;
  thumbnail: string;
  program: string;
}

interface Assignment {
  id: string;
  title: string;
  program: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
}

interface GitHubContribution {
  type: 'PR' | 'Issue' | 'Commit';
  title: string;
  repo: string;
  date: string;
  status: 'open' | 'merged' | 'closed';
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedDate: string;
  program: string;
}

interface MentorInfo {
  name: string;
  photo: string;
  email: string;
  phone: string;
  department: string;
  bio: string;
}

const StudentProfile = () => {
  const api = useApi();
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'recordings' | 'assignments' | 'contributions'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('React.js');
  const [selectedFileType, setSelectedFileType] = useState('Assignment');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Project_Documentation.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedDate: 'Oct 3, 2025',
      program: 'React.js',
    },
    {
      id: '2',
      name: 'Assignment_Notes.docx',
      type: 'DOCX',
      size: '1.1 MB',
      uploadedDate: 'Oct 1, 2025',
      program: 'Node.js',
    },
  ]);

  // Schedule state
  const [allClasses, setAllClasses] = useState<UpcomingClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);

  // Pagination state
  const [upcomingPage, setUpcomingPage] = useState<number>(1);
  const [upcomingPageSize] = useState<number>(5);
  const [schedulePage, setSchedulePage] = useState<number>(1);
  const [schedulePageSize] = useState<number>(10);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE';
    const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);

    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: selectedFile.name,
      type: fileExtension,
      size: `${fileSizeMB} MB`,
      uploadedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      program: selectedProgram,
    };

    setUploadedFiles([newFile, ...uploadedFiles]);
    setShowUploadModal(false);
    setSelectedFile(null);
    setSelectedProgram('React.js');
    setSelectedFileType('Assignment');
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

  // Fetch class schedule from API
  useEffect(() => {
    let mounted = true;
    const fetchClassSchedule = async () => {
      try {
        setLoadingClasses(true);
        setClassesError(null);
        const response = await api.lms.students.getClassSchedule();
        console.log("response: ", response );

        if (response && response.success === false) {
          throw new Error(response.error || 'Failed to fetch class schedule');
        }
        const data = (response && Array.isArray(response)) ? response : (response?.data || []);
        
        // Map API response to UpcomingClass format
        const mapped: UpcomingClass[] = data.map((s: any) => {
          const dt = s.session_datetime ? new Date(s.session_datetime) : null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const sessionDate = dt ? new Date(dt) : null;
          if (sessionDate) {
            sessionDate.setHours(0, 0, 0, 0);
          }
          
          // Format date display
          let dateDisplay = '';
          if (dt) {
            const now = new Date();
            const sessionTime = dt.getTime();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
            
            if (sessionTime >= todayStart && sessionTime < tomorrowStart) {
              dateDisplay = 'Today';
            } else if (sessionTime >= tomorrowStart && sessionTime < tomorrowStart + 24 * 60 * 60 * 1000) {
              dateDisplay = 'Tomorrow';
            } else {
              dateDisplay = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
          }
          
          // Format time display
          const timeDisplay = dt ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
          
          // Determine status
          const rawStatus = (s.status || '').toLowerCase();
          let status: UpcomingClass['status'] = 'completed';
          if (rawStatus === 'upcoming' || rawStatus === 'scheduled') {
            status = 'upcoming';
          } else if (rawStatus === 'live') {
            status = 'live';
          } else if (rawStatus === 'postponed') {
            status = 'postponed';
          }
          
          return {
            id: String(s.session_id || s.id || Date.now()),
            title: s.course_name || 'Session',
            mentor: s.faculty_name || '',
            program: s.course_name || '',
            date: dateDisplay,
            time: timeDisplay,
            duration: `${s.duration || 60} min`,
            status,
            rescheduled: rawStatus === 'postponed',
            epoch: dt ? dt.getTime() : 0,
          } as UpcomingClass;
        });
        
        if (mounted) {
          setAllClasses(mapped);
        }
      } catch (error: any) {
        if (mounted) {
          setClassesError(error?.message || 'Failed to load class schedule');
        }
      } finally {
        if (mounted) {
          setLoadingClasses(false);
        }
      }
    };

    fetchClassSchedule();
    return () => { mounted = false; };
  }, [api.lms.students]);

  // Fetch assignments from API
  useEffect(() => {
    let mounted = true;
    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        setAssignmentsError(null);
        const response = await api.lms.students.getAssignments();
        console.log("assignments response: ", response);

        if (response && response.success === false) {
          throw new Error(response.error || 'Failed to fetch assignments');
        }
        const data = (response && Array.isArray(response)) ? response : (response?.data || []);
        
        // Map API response to Assignment format
        const mapped: Assignment[] = data.map((item: any) => {
          const assignment = item.assignments || {};
          const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
          
          // Format due date
          let dueDateDisplay = '';
          if (dueDate) {
            dueDateDisplay = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
          
          // Determine status
          let status: Assignment['status'] = 'pending';
          if (item.obtained_marks !== null && item.obtained_marks !== undefined && item.graded_at) {
            status = 'graded';
          } else if (item.submitted_at) {
            status = 'submitted';
          } else {
            status = 'pending';
          }
          
          // Calculate grade if graded
          let grade: string | undefined = undefined;
          if (status === 'graded' && item.obtained_marks !== null && assignment.total_marks) {
            const percentage = (item.obtained_marks / assignment.total_marks) * 100;
            if (percentage >= 90) grade = 'A';
            else if (percentage >= 80) grade = 'B';
            else if (percentage >= 70) grade = 'C';
            else if (percentage >= 60) grade = 'D';
            else grade = 'F';
          }
          
          return {
            id: item.id || item.assignment_id || Date.now().toString(),
            title: assignment.title || 'Assignment',
            program: assignment.courses?.course_code || assignment.batches?.batch_name || 'N/A',
            dueDate: dueDateDisplay,
            status,
            grade,
          } as Assignment;
        });
        
        if (mounted) {
          setAssignments(mapped);
        }
      } catch (error: any) {
        if (mounted) {
          setAssignmentsError(error?.message || 'Failed to load assignments');
        }
      } finally {
        if (mounted) {
          setLoadingAssignments(false);
        }
      }
    };

    fetchAssignments();
    return () => { mounted = false; };
  }, [api.lms.students]);

  // Filter and paginate upcoming classes (session_datetime >= today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = todayStart.getTime();
  
  const upcomingOnly = allClasses
    .filter(c => c.epoch && c.epoch >= todayTimestamp)
    .sort((a, b) => (a.epoch || 0) - (b.epoch || 0));
  
  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingOnly.length / upcomingPageSize));
  const upcomingSlice = upcomingOnly.slice(
    (upcomingPage - 1) * upcomingPageSize,
    upcomingPage * upcomingPageSize
  );

  // Paginate all classes for schedule tab
  const allClassesSorted = [...allClasses].sort((a, b) => (a.epoch || 0) - (b.epoch || 0));
  const scheduleTotalPages = Math.max(1, Math.ceil(allClassesSorted.length / schedulePageSize));
  const scheduleSlice = allClassesSorted.slice(
    (schedulePage - 1) * schedulePageSize,
    schedulePage * schedulePageSize
  );

  const goPrevUpcoming = () => setUpcomingPage(p => Math.max(1, p - 1));
  const goNextUpcoming = () => setUpcomingPage(p => Math.min(upcomingTotalPages, p + 1));
  const goPrevSchedule = () => setSchedulePage(p => Math.max(1, p - 1));
  const goNextSchedule = () => setSchedulePage(p => Math.min(scheduleTotalPages, p + 1));

  const mentorInfo: MentorInfo = {
    name: 'Sarah Mitchell',
    photo: 'https://storage.googleapis.com/polaris-tech_cloudbuild/image_Mentor.jpg',
    email: 'sarah.mitchell@academy.com',
    phone: '+1 (555) 123-4567',
    department: 'Frontend Development',
    bio: 'Experienced React developer with 8+ years in the industry. Passionate about teaching modern web development and helping students achieve their goals.',
  };

  const studentData = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    program: 'Open Source Development',
    enrolledPrograms: ['React.js', 'Node.js', 'Python', 'DevOps'],
    avatar: 'AJ',
    totalClasses: 24,
    attendanceRate: 92,
    completedAssignments: 18,
    totalAssignments: 20,
    githubContributions: 45,
  };


  const recordings: Recording[] = [
    {
      id: '1',
      title: 'Introduction to React Hooks',
      mentor: 'Sarah Mitchell',
      date: 'Oct 1, 2025',
      duration: '1:45:30',
      thumbnail: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=400',
      program: 'React.js',
    },
    {
      id: '2',
      title: 'RESTful API Design',
      mentor: 'James Cooper',
      date: 'Sep 29, 2025',
      duration: '2:10:15',
      thumbnail: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=400',
      program: 'Node.js',
    },
    {
      id: '3',
      title: 'Git Workflow Best Practices',
      mentor: 'Emily Zhang',
      date: 'Sep 28, 2025',
      duration: '1:30:45',
      thumbnail: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400',
      program: 'DevOps',
    },
  ];


  const githubContributions: GitHubContribution[] = [
    {
      type: 'PR',
      title: 'Add user authentication feature',
      repo: 'open-source/project-alpha',
      date: 'Oct 2, 2025',
      status: 'merged',
    },
    {
      type: 'Issue',
      title: 'Fix navigation bug on mobile',
      repo: 'community/web-app',
      date: 'Oct 1, 2025',
      status: 'closed',
    },
    {
      type: 'PR',
      title: 'Update documentation',
      repo: 'docs/learning-resources',
      date: 'Sep 30, 2025',
      status: 'open',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <nav className="bg-[#0A0E1A] border-b border-gray-800 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFC540] flex items-center justify-center">
                <span className="text-black font-bold text-sm">P</span>
              </div>
              <span className="text-white font-bold text-lg">Plarislabs <span className="text-gray-500 text-sm">2.0</span></span>
            </div>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-[#FFC540] text-black rounded-lg font-medium text-sm">
                Programs
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm">
                Mentors
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm">
                Students
              </button>
              <button className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm">
                Reports
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-[#1a2332] text-white placeholder-gray-500 px-4 py-2 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC540]"
              />
            </div>
            <div className="relative">
              <button className="text-gray-400 hover:text-white">
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-[#FFC540] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
                </div>
              </button>
            </div>
            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 hover:bg-gray-800/50 rounded-lg px-3 py-2 transition-colors duration-200"
                aria-haspopup="true"
                aria-expanded={showUserDropdown}
              >
                <div className="w-8 h-8 bg-[#FFC540] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-black" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>


              {/* Dropdown Menu */}
              {showUserDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-64 bg-[#1a2332] border border-gray-700 rounded-lg shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-semibold text-white">{user?.name || 'Student'}</p>
                      <p className="text-xs text-gray-400">{user?.email || ''}</p>
                    </div>
                    
                    <div className="py-2">
                      <button
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</h1>
          <p className="text-gray-400">Here's what's happening with your learning programs today.</p>
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === 'overview'
                ? 'bg-[#FFC540] text-black'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === 'schedule'
                ? 'bg-[#FFC540] text-black'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === 'recordings'
                ? 'bg-[#FFC540] text-black'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Recordings
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === 'assignments'
                ? 'bg-[#FFC540] text-black'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === 'contributions'
                ? 'bg-[#FFC540] text-black'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Contributions
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                  <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    12%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{studentData.totalClasses}</div>
                <div className="text-gray-400 text-sm">Total Classes</div>
              </div>

              <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                  <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    8%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{studentData.enrolledPrograms.length}</div>
                <div className="text-gray-400 text-sm">Active Programs</div>
              </div>

              <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                  <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    5%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{studentData.githubContributions}</div>
                <div className="text-gray-400 text-sm">GitHub Contributions</div>
              </div>

              <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                  <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    2%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{studentData.attendanceRate}%</div>
                <div className="text-gray-400 text-sm">Avg Attendance</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Classes
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {loadingClasses && (
                      <div className="text-sm text-gray-400 py-4">Loading classes...</div>
                    )}
                    {!loadingClasses && classesError && (
                      <div className="text-sm text-red-400 py-4">{classesError}</div>
                    )}
                    {!loadingClasses && !classesError && upcomingSlice.length === 0 && (
                      <div className="text-sm text-gray-400 py-4">No upcoming classes found.</div>
                    )}
                    {!loadingClasses && !classesError && upcomingSlice.map((classItem) => (
                      <div
                        key={classItem.id}
                        className="bg-[#0d1420] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base font-semibold text-white">{classItem.title}</h3>
                              {classItem.status === 'live' && (
                                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                  LIVE
                                </span>
                              )}
                              {classItem.status === 'postponed' && (
                                <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                                  POSTPONED
                                </span>
                              )}
                              {classItem.rescheduled && (
                                <span className="px-2 py-1 bg-[#FFC540]/20 text-[#FFC540] text-xs font-bold rounded-full border border-[#FFC540]/30">
                                  RESCHEDULED
                                </span>
                              )}
                            </div>
                            {classItem.rescheduled && classItem.originalDate && (
                              <div className="mb-2 text-xs text-[#FFC540]/80">
                                Originally scheduled for {classItem.originalDate}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {classItem.mentor}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {classItem.program}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {classItem.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {classItem.time}
                              </span>
                            </div>
                          </div>
                          <button className="ml-4 px-4 py-2 bg-[#FFC540] text-black rounded-lg font-semibold hover:bg-[#FFC540] transition-all flex items-center gap-2 text-sm">
                            {classItem.status === 'live' ? (
                              <>
                                <Video className="w-4 h-4" />
                                Join Now
                              </>
                            ) : classItem.epoch && classItem.epoch > Date.now() ? (
                              <>
                                <Calendar className="w-4 h-4" />
                                Add to Calendar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Completed
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {!loadingClasses && !classesError && upcomingOnly.length > 0 && (
                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-800">
                        <button
                          onClick={goPrevUpcoming}
                          disabled={upcomingPage === 1}
                          className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
                        >
                          Prev
                        </button>
                        <span className="text-gray-300 text-sm">
                          Page {upcomingPage} of {upcomingTotalPages}
                        </span>
                        <button
                          onClick={goNextUpcoming}
                          disabled={upcomingPage === upcomingTotalPages}
                          className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800 mt-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <PlayCircle className="w-5 h-5" />
                    Recent Recordings
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {recordings.slice(0, 2).map((recording) => (
                      <div
                        key={recording.id}
                        className="bg-[#0d1420] rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group"
                      >
                        <div className="relative">
                          <img src={recording.thumbnail} alt={recording.title} className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="w-12 h-12 text-[#FFC540]" />
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-[#FFC540] text-xs font-semibold rounded">
                            {recording.duration}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-semibold mb-1 text-sm">{recording.title}</h3>
                          <p className="text-gray-400 text-xs">{recording.mentor}</p>
                          <p className="text-gray-500 text-xs mt-1">{recording.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5" />
                    Mentor Info
                  </h2>
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={mentorInfo.photo}
                      alt={mentorInfo.name}
                      className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-[#FFC540]/20"
                    />
                    <h3 className="text-lg font-bold text-white mb-1">{mentorInfo.name}</h3>
                    <div className="flex items-center gap-1 text-gray-400 text-sm mb-4">
                      <Briefcase className="w-3 h-3" />
                      {mentorInfo.department}
                    </div>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                      {mentorInfo.bio}
                    </p>
                    <div className="w-full space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300 bg-[#0d1420] rounded-lg p-3">
                        <Mail className="w-4 h-4 text-[#FFC540]" />
                        <span className="text-xs break-all">{mentorInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300 bg-[#0d1420] rounded-lg p-3">
                        <Phone className="w-4 h-4 text-[#FFC540]" />
                        <span className="text-xs">{mentorInfo.phone}</span>
                      </div>
                    </div>
                    <button className="w-full px-4 py-3 bg-[#FFC540] text-black rounded-lg font-semibold hover:bg-[#FFC540] transition-all flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Mentor
                    </button>
                  </div>
                </div>

                <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5" />
                    Assignments
                  </h2>
                  <div className="space-y-3">
                    {loadingAssignments && (
                      <div className="text-gray-400 text-xs py-2">Loading assignments...</div>
                    )}
                    {!loadingAssignments && assignmentsError && (
                      <div className="text-red-400 text-xs py-2">{assignmentsError}</div>
                    )}
                    {!loadingAssignments && !assignmentsError && assignments.length === 0 && (
                      <div className="text-gray-400 text-xs py-2">No assignments found.</div>
                    )}
                    {!loadingAssignments && !assignmentsError && assignments.slice(0, 3).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-[#0d1420] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-medium text-sm">{assignment.title}</h3>
                          {assignment.status === 'graded' && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          {assignment.status === 'submitted' && (
                            <Clock className="w-4 h-4 text-blue-400" />
                          )}
                          {assignment.status === 'pending' && (
                            <AlertCircle className="w-4 h-4 text-[#FFC540]" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mb-2">{assignment.program}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Due: {assignment.dueDate}</span>
                          {assignment.grade && (
                            <span className="px-2 py-1 bg-green-400/20 text-green-400 rounded font-semibold">
                              {assignment.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    <Award className="w-5 h-5" />
                    Performance
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Attendance Rate</span>
                        <span className="text-white font-semibold">{studentData.attendanceRate}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[#FFC540] h-2 rounded-full"
                          style={{ width: `${studentData.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Assignments Completed</span>
                        <span className="text-white font-semibold">
                          {studentData.completedAssignments}/{studentData.totalAssignments}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[#FFC540] h-2 rounded-full"
                          style={{ width: `${(studentData.completedAssignments / studentData.totalAssignments) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Class Schedule</h2>
            <div className="space-y-4">
              {loadingClasses && (
                <div className="text-gray-400 py-4">Loading schedule...</div>
              )}
              {!loadingClasses && classesError && (
                <div className="text-red-400 py-4">{classesError}</div>
              )}
              {!loadingClasses && !classesError && scheduleSlice.length === 0 && (
                <div className="text-gray-400 py-4">No classes found.</div>
              )}
              {!loadingClasses && !classesError && scheduleSlice.map((classItem) => (
                <div
                  key={classItem.id}
                  className="bg-[#0d1420] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">{classItem.title}</h3>
                        {classItem.status === 'live' && (
                          <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                        {classItem.status === 'postponed' && (
                          <span className="px-3 py-1 bg-yellow-500 text-black text-sm font-bold rounded-full">
                            POSTPONED
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Mentor: {classItem.mentor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Program: {classItem.program}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Date: {classItem.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Time: {classItem.time} ({classItem.duration})</span>
                        </div>
                      </div>
                    </div>
                    <button className="ml-6 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#FFC540] transition-all flex items-center gap-2">
                      {classItem.status === 'live' ? (
                        <>
                          <Video className="w-4 h-4" />
                          Join Class
                        </>
                      ) : classItem.epoch && classItem.epoch > Date.now() ? (
                        <>
                          <Calendar className="w-4 h-4" />
                          Add to Calendar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {!loadingClasses && !classesError && allClassesSorted.length > 0 && (
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-800">
                  <button
                    onClick={goPrevSchedule}
                    disabled={schedulePage === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
                  >
                    Prev
                  </button>
                  <span className="text-gray-300 text-sm">
                    Page {schedulePage} of {scheduleTotalPages}
                  </span>
                  <button
                    onClick={goNextSchedule}
                    disabled={schedulePage === scheduleTotalPages}
                    className="px-3 py-1 rounded bg-gray-700 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recordings' && (
          <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Recorded Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-[#0d1420] rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group"
                >
                  <div className="relative">
                    <img src={recording.thumbnail} alt={recording.title} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-16 h-16 text-[#FFC540]" />
                    </div>
                    <span className="absolute bottom-3 right-3 px-3 py-1 bg-black/90 text-[#FFC540] text-sm font-bold rounded">
                      {recording.duration}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-white font-bold text-base mb-2">{recording.title}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {recording.mentor}
                      </p>
                      <p className="text-gray-400 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {recording.program}
                      </p>
                      <p className="text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {recording.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Assignments</h2>
            <div className="space-y-4">
              {loadingAssignments && (
                <div className="text-gray-400 py-4">Loading assignments...</div>
              )}
              {!loadingAssignments && assignmentsError && (
                <div className="text-red-400 py-4">{assignmentsError}</div>
              )}
              {!loadingAssignments && !assignmentsError && assignments.length === 0 && (
                <div className="text-gray-400 py-4">No assignments found.</div>
              )}
              {!loadingAssignments && !assignmentsError && assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-[#0d1420] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                        {assignment.status === 'graded' && (
                          <span className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-sm font-semibold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Graded
                          </span>
                        )}
                        {assignment.status === 'submitted' && (
                          <span className="px-3 py-1 bg-blue-400/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Submitted
                          </span>
                        )}
                        {assignment.status === 'pending' && (
                          <span className="px-3 py-1 bg-[#FFC540]/20 text-[#FFC540] rounded-full text-sm font-semibold flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-gray-400 text-sm">
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {assignment.program}
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Due: {assignment.dueDate}
                        </span>
                        {assignment.grade && (
                          <span className="px-4 py-1 bg-green-400/20 text-green-400 rounded-lg font-bold text-base">
                            Grade: {assignment.grade}
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.status === 'pending' && (
                      <button className="ml-6 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#FFC540] transition-all text-sm">
                        Submit Assignment
                      </button>
                    )}
                    {assignment.status !== 'pending' && (
                      <button className="ml-6 px-6 py-3 bg-[#1a2332] text-white border border-gray-700 rounded-lg font-bold hover:bg-[#243044] transition-all text-sm">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-6 h-6" />
                  My Uploads
                </h2>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-2 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#FFC540] transition-all flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              </div>
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-[#0d1420] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-[#FFC540]/20 flex items-center justify-center flex-shrink-0">
                          <File className="w-6 h-6 text-[#FFC540]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white mb-2">{file.name}</h3>
                          <div className="flex items-center gap-6 text-gray-400 text-sm">
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {file.type}
                            </span>
                            <span className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {file.program}
                            </span>
                            <span>{file.size}</span>
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {file.uploadedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="px-4 py-2 bg-[#1a2332] text-white border border-gray-700 rounded-lg font-semibold hover:bg-[#243044] transition-all text-sm">
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Github className="w-6 h-6" />
                  GitHub Contributions
                </h2>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{studentData.githubContributions}</div>
                  <div className="text-gray-400 text-sm">Total Contributions</div>
                </div>
              </div>
              <div className="space-y-4">
                {githubContributions.map((contribution, index) => (
                  <div
                    key={index}
                    className="bg-[#0d1420] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              contribution.type === 'PR'
                                ? 'bg-purple-500/20 text-purple-400'
                                : contribution.type === 'Issue'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {contribution.type}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              contribution.status === 'merged'
                                ? 'bg-green-500/20 text-green-400'
                                : contribution.status === 'open'
                                ? 'bg-[#FFC540]/20 text-[#FFC540]'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {contribution.status.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white mb-2">{contribution.title}</h3>
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                          <span className="flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            {contribution.repo}
                          </span>
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {contribution.date}
                          </span>
                        </div>
                      </div>
                      <button className="ml-6 px-6 py-2 bg-[#1a2332] text-white border border-gray-700 rounded-lg font-semibold hover:bg-[#243044] transition-all text-sm">
                        View on GitHub
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] rounded-xl p-8 border border-gray-800 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Upload File</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full bg-[#0d1420] text-white border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC540]"
                >
                  <option>React.js</option>
                  <option>Node.js</option>
                  <option>Python</option>
                  <option>DevOps</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">File Type</label>
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="w-full bg-[#0d1420] text-white border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFC540]"
                >
                  <option>Assignment</option>
                  <option>Notes</option>
                  <option>Project Documentation</option>
                  <option>Research</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Upload File</label>
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.zip"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="block border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-[#FFC540] transition-all cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  {selectedFile ? (
                    <>
                      <p className="text-white font-medium mb-1">{selectedFile.name}</p>
                      <p className="text-gray-500 text-sm">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-gray-500 text-sm">PDF, DOC, DOCX, TXT, ZIP (max 10MB)</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 bg-[#0d1420] text-white border border-gray-700 rounded-lg font-bold hover:bg-[#1a2332] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="flex-1 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#FFC540] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
