import { useState, useEffect } from 'react';
import { Calendar, Video, FileText, Github, Award, Clock, User, Users, BookOpen, PlayCircle, CheckCircle, AlertCircle, Upload, File, X, Mail, Phone, Briefcase, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../services/api';

interface UpcomingClass {
  session_id: number;
  course_name: string;
  faculty_name: string;
  session_datetime: string;
  duration: number;
  venue: string;
  status: 'scheduled' | 'pending' | 'upcoming' | 'live' | 'completed' | 'rescheduled' | string;
  rescheduled?: boolean;
  originalDate?: string;
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
  const { logout, user } = useAuth();
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'recordings' | 'assignments' | 'contributions'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('React.js');
  const [selectedFileType, setSelectedFileType] = useState('Assignment');
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [dashboardCards, setDashboardCards] = useState({
    totalClasses: 0,
    totalCourses: 0,
    avgAttendance: 0,
    githubContributions: 0
  });

  const fetchDashboardCards = async () => {
    try {
      const data = await api.lms.students.getDashboardCards();
      console.log('Dashboard Cards API Response:', data);
      
      setDashboardCards({
        totalClasses: data.totalClasses || 0,
        totalCourses: data.totalCourses || 0,
        avgAttendance: data.avgAttendance || 0,
        githubContributions: 0 // GitHub data not in this API yet
      });
    } catch (error) {
      console.error('Error fetching dashboard cards:', error);
    }
  };

  useEffect(() => {
    fetchUpcomingClasses();
    fetchDashboardCards();

    // Auto-refresh every 5 minutes to update class statuses and remove ended classes
    const refreshInterval = setInterval(() => {
      fetchUpcomingClasses();
      fetchDashboardCards();
    }, 300000); // 300000ms = 5 minutes

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Real-time status updater - updates class statuses every 30 seconds without API call
  useEffect(() => {
    const statusUpdateInterval = setInterval(() => {
      setUpcomingClasses(currentClasses => {
        const now = new Date();
        
        return currentClasses
          .map(session => {
            const sessionStart = new Date(session.session_datetime);
            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
            
            // Keep rescheduled flag from API
            const isRescheduled = session.rescheduled || session.status === 'rescheduled';
            
            // Determine display status based on time
            let displayStatus: string = session.status;
            
            if (now.getTime() >= sessionStart.getTime() && now.getTime() < sessionEnd.getTime()) {
              displayStatus = 'live';
            } else if (now.getTime() >= sessionEnd.getTime()) {
              displayStatus = 'completed';
            } else if (!isRescheduled) {
              // Only override to 'upcoming' if not rescheduled
              displayStatus = 'upcoming';
            }
            
            return { ...session, status: displayStatus, rescheduled: isRescheduled };
          })
          .filter(session => {
            const sessionStart = new Date(session.session_datetime);
            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
            return now.getTime() < sessionEnd.getTime();
          });
      });
    }, 30000); // 30000ms = 30 seconds

    return () => clearInterval(statusUpdateInterval);
  }, []);

  const fetchUpcomingClasses = async () => {
    try {
      setLoading(true);
      const response = await api.lms.students.getClassSchedule(1, 10);
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        const now = new Date(); // Get the current date and time
        
        // Filter and update status for sessions
        const processedSessions = response.data
          .map((session: UpcomingClass) => {
            const sessionStart = new Date(session.session_datetime);
            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000); // Add duration in milliseconds
            
            // Check if this is a rescheduled session from API status
            const isRescheduled = session.status === 'rescheduled';
            
            // Determine display status based on time (override API status for real-time accuracy)
            let displayStatus: string = session.status;
            
            if (now.getTime() >= sessionStart.getTime() && now.getTime() < sessionEnd.getTime()) {
              // Class has started but not ended - show as LIVE
              displayStatus = 'live';
            } else if (now.getTime() >= sessionEnd.getTime()) {
              // Class has ended - mark as completed
              displayStatus = 'completed';
            } else if (session.status !== 'rescheduled') {
              // Class hasn't started yet - show as upcoming (unless it's rescheduled)
              displayStatus = 'upcoming';
            }
            
            return { 
              ...session, 
              status: displayStatus,
              rescheduled: isRescheduled 
            };
          })
          .filter((session: UpcomingClass) => {
            const sessionStart = new Date(session.session_datetime);
            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);
            
            // Show only classes that haven't ended yet
            return now.getTime() < sessionEnd.getTime();
          });
        
        // Sort by date (earliest first)
        const sortedSessions = processedSessions.sort((a: UpcomingClass, b: UpcomingClass) => 
          new Date(a.session_datetime).getTime() - new Date(b.session_datetime).getTime()
        );
        
        setUpcomingClasses(sortedSessions);
      }
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const sessionDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (sessionDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

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

  const handleLogout = () => {
    logout();
  };

  // Dynamic mentor info - should be fetched from API
  const mentorInfo: MentorInfo = {
    name: (user as any)?.mentorName || 'Mentor',
    photo: (user as any)?.mentorPhoto || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    email: (user as any)?.mentorEmail || 'mentor@polariscampus.com',
    phone: (user as any)?.mentorPhone || 'Contact admin for details',
    department: (user as any)?.mentorDepartment || 'Development',
    bio: (user as any)?.mentorBio || 'Experienced developer passionate about teaching and helping students achieve their goals.',
  };

  // Dynamic student data from authenticated user
  const studentData = {
    name: user?.name || 'Student',
    email: user?.email || '',
    program: 'Open Source Development',
    enrolledPrograms: ['React.js', 'Node.js', 'Python', 'DevOps'],
    avatar: user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'ST',
    totalClasses: dashboardCards.totalClasses,
    attendanceRate: dashboardCards.avgAttendance,
    completedAssignments: 18,
    totalAssignments: 20,
    githubContributions: dashboardCards.githubContributions,
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

  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Build a Custom Hook',
      program: 'React.js',
      dueDate: 'Oct 5, 2025',
      status: 'pending',
    },
    {
      id: '2',
      title: 'API Integration Project',
      program: 'Node.js',
      dueDate: 'Oct 3, 2025',
      status: 'submitted',
    },
    {
      id: '3',
      title: 'Data Analysis Script',
      program: 'Python',
      dueDate: 'Sep 30, 2025',
      status: 'graded',
      grade: 'A',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0E1A]">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Users className="h-8 w-8 text-[#FFC540] mx-auto" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <nav className="bg-[#0A0E1A] border-b border-gray-800 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFC540] flex items-center justify-center">
                <span className="text-black font-bold text-sm">P</span>
              </div>
              <span className="text-white font-bold text-lg">Polaris Labs <span className="text-gray-500 text-sm">2.0</span></span>
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
            
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-[#FFC540] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-black" />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-semibold text-white">{user?.name || studentData.name}</p>
                      <p className="text-xs text-gray-400">{user?.email || studentData.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <button
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
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
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {studentData.name.split(' ')[0]}</h1>
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
                <div className="text-3xl font-bold text-white mb-1">{dashboardCards.totalCourses}</div>
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
                  {upcomingClasses.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No upcoming classes scheduled</p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingClasses.map((classItem) => (
                        <div
                          key={classItem.session_id}
                          className="bg-[#0d1420] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base font-semibold text-white">{classItem.course_name}</h3>
                                {classItem.status === 'live' && (
                                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                    LIVE
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
                                  {classItem.faculty_name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(classItem.session_datetime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(classItem.session_datetime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {classItem.duration} min
                                </span>
                              </div>
                            </div>
                            <button className="ml-4 px-4 py-2 bg-[#FFC540] text-black rounded-lg font-semibold hover:bg-[#e6b139] transition-all flex items-center gap-2 text-sm">
                              <Video className="w-4 h-4" />
                              {classItem.status === 'live' ? 'Join Now' : 'Calendar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <button className="w-full px-4 py-3 bg-[#FFC540] text-black rounded-lg font-semibold hover:bg-[#e6b139] transition-all flex items-center justify-center gap-2">
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
                    {assignments.map((assignment) => (
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
            {upcomingClasses.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No upcoming classes scheduled</p>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.map((classItem) => (
                  <div
                    key={classItem.session_id}
                    className="bg-[#0d1420] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-white">{classItem.course_name}</h3>
                          {classItem.status === 'live' && (
                            <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                              LIVE NOW
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Mentor: {classItem.faculty_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Date: {formatDate(classItem.session_datetime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Time: {formatTime(classItem.session_datetime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Duration: {classItem.duration} min</span>
                          </div>
                        </div>
                      </div>
                      <button className="ml-6 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#e6b139] transition-all flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        {classItem.status === 'live' ? 'Join Class' : 'Add to Calendar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              {assignments.map((assignment) => (
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
                      <button className="ml-6 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#e6b139] transition-all text-sm">
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
                  className="px-6 py-2 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#e6b139] transition-all flex items-center gap-2 text-sm"
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
                  className="flex-1 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#e6b139] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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