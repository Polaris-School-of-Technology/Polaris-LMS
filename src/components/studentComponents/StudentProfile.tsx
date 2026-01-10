import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Video, FileText, Github, Award, Clock, Users, BookOpen, PlayCircle, CheckCircle, AlertCircle, Upload, X, LogOut, User, ChevronDown } from 'lucide-react';

import { useApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayerModal from './VideoPlayerModal';

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
  epoch?: number;
  joinUrl?: string;
}

interface Recording {
  id: number;
  recordingId: number;
  sessionId: number;
  batchId: number;
  title: string;
  duration: number;
  status: string;
  playlistUrl: string;
  thumbnailUrl: string;
  recordedAt: string;
  availableAt: string;
}

interface RecordingsResponse {
  status: string;
  data: {
    recordings: Recording[];
    pagination: {
      total: number;
      totalPages: number | null;
    };
    studentId: string;
    batchId: number;
    status: string;
  };
  message: string;
}

interface StudentAssignmentListItem {
  studentAssignmentId: string;
  assignmentId: string;
  title: string;
  program: string;
  batchName?: string;
  dueDate?: string;
  status: 'pending' | 'submitted' | 'graded' | 'in_progress';
  obtainedMarks?: number | null;
  totalMarks?: number | null;
  gradeLabel?: string;
  assignmentType?: string;
  submittedAt?: string | null;
  startedAt?: string | null;
}

interface AssignmentDetailData {
  assignment: {
    id: string;
    title: string;
    description?: string | null;
    assignment_type?: string | null;
    total_marks?: number | null;
    passing_marks?: number | null;
    due_date?: string | null;
    allow_late_submission?: boolean;
    time_limit_minutes?: number | null;
    batches?: {
      batch_name?: string;
    } | null;
    courses?: {
      course_code?: string;
    } | null;
  };
  questions: Array<{
    id: string;
    question_text: string;
    question_type: string;
    marks: number;
    options?: any;
    hint?: string | null;
    question_order?: number | null;
  }>;
  student_assignment: {
    id: string;
    status: string;
    started_at?: string | null;
    submitted_at?: string | null;
    attempt_number?: number | null;
  } | null;
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



const StudentProfile = () => {
  const api = useApi();
  const { user, logout } = useAuth();
  const [userBatchId, setUserBatchId] = useState<number | null>(user?.batchId || null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'recordings' | 'assignments' | 'contributions'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('React.js');
  const [selectedFileType, setSelectedFileType] = useState('Assignment');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
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

  // Assignment state
  const [assignments, setAssignments] = useState<StudentAssignmentListItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [assignmentDetailModalOpen, setAssignmentDetailModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignmentListItem | null>(null);
  const [assignmentDetail, setAssignmentDetail] = useState<AssignmentDetailData | null>(null);
  const [assignmentDetailLoading, setAssignmentDetailLoading] = useState(false);
  const [assignmentDetailError, setAssignmentDetailError] = useState<string | null>(null);
  const [detailUploadFile, setDetailUploadFile] = useState<File | null>(null);
  const [uploadingAssignment, setUploadingAssignment] = useState(false);
  const [assignmentSuccessMessage, setAssignmentSuccessMessage] = useState<string | null>(null);

  // Recordings state
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);

  // Schedule state
  const [allClasses, setAllClasses] = useState<UpcomingClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [classesError, setClassesError] = useState<string | null>(null);
  const liveStatusCacheRef = useRef<Record<string, { status: 'live' | 'not_live'; lastChecked: number }>>({});

  // Pagination state
  const [upcomingPage, setUpcomingPage] = useState<number>(1);
  const [upcomingPageSize] = useState<number>(5);
  const [schedulePage, setSchedulePage] = useState<number>(1);
  const [schedulePageSize] = useState<number>(10);
  const [refreshingSchedule, setRefreshingSchedule] = useState(false);

  const normalizeAssignmentStatus = (status?: string | null, obtainedMarks?: number | null): StudentAssignmentListItem['status'] => {
    const lower = (status || '').toLowerCase();
    if (lower === 'graded' || typeof obtainedMarks === 'number') return 'graded';
    if (lower === 'submitted') return 'submitted';
    if (lower === 'in_progress') return 'in_progress';
    return 'pending';
  };

  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  useEffect(() => {
    if (user?.batchId) {
      setUserBatchId(user.batchId);
      return;
    }

    // NOTE: The profile endpoint is returning 404. We are relying on user.batchId from the token.
    if (!user?.batchId) {
      console.warn('Batch ID missing from user token. Batch exclusion filtering may not work correctly.');
    }
  }, [api.ums, user?.batchId]);

  const mapAssignmentFromApi = (item: any): StudentAssignmentListItem => {
    const assignmentData = item?.assignments || {};
    const status = normalizeAssignmentStatus(item?.status, item?.obtained_marks);
    const totalMarks = assignmentData?.total_marks ?? null;
    const obtainedMarks = item?.obtained_marks ?? null;
    const gradeLabel = obtainedMarks !== null && totalMarks !== null ? `${obtainedMarks}/${totalMarks}` : undefined;

    return {
      studentAssignmentId: item?.id || item?.student_assignment_id || '',
      assignmentId: item?.assignment_id || assignmentData?.id || '',
      title: assignmentData?.title || 'Untitled Assignment',
      program: assignmentData?.courses?.course_code || '—',
      batchName: assignmentData?.batches?.batch_name || undefined,
      dueDate: assignmentData?.due_date || null,
      status,
      obtainedMarks,
      totalMarks,
      gradeLabel,
      assignmentType: assignmentData?.assignment_type || undefined,
      submittedAt: item?.submitted_at || null,
      startedAt: item?.started_at || null,
    };
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatRecordingDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRecordingDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePlayRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setShowVideoPlayer(true);
  };

  const getAssignmentStatusMeta = (status: StudentAssignmentListItem['status']) => {
    switch (status) {
      case 'submitted':
        return { label: 'Submitted', className: 'bg-blue-500/20 text-blue-300 border-blue-500/40', dot: 'bg-blue-400' };
      case 'graded':
        return { label: 'Graded', className: 'bg-green-500/20 text-green-300 border-green-500/40', dot: 'bg-green-400' };
      case 'in_progress':
        return { label: 'In Progress', className: 'bg-purple-500/20 text-purple-300 border-purple-500/40', dot: 'bg-purple-400' };
      default:
        return { label: 'Pending', className: 'bg-[#FFC540]/20 text-[#FFC540] border-[#FFC540]/40', dot: 'bg-[#FFC540]' };
    }
  };

  const renderStatusBadge = (status: StudentAssignmentListItem['status']) => {
    const meta = getAssignmentStatusMeta(status);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${meta.className} flex items-center gap-1`}>
        <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
        {meta.label}
      </span>
    );
  };

  // Fetch assignments
  useEffect(() => {
    let active = true;

    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        setAssignmentsError(null);
        const response = await api.lms.students.getAssignments();
        const raw = Array.isArray(response?.data) ? response.data : [];
        if (!active) return;
        setAssignments(raw.map(mapAssignmentFromApi));
      } catch (error: any) {
        if (active) {
          setAssignmentsError(error?.message || 'Failed to load assignments');
        }
      } finally {
        if (active) {
          setLoadingAssignments(false);
        }
      }
    };

    fetchAssignments();
    return () => {
      active = false;
    };
  }, [api.lms.students]);

  // Fetch recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      if (!user?.id) return;

      try {
        setLoadingRecordings(true);
        setRecordingsError(null);

        // Use the working student ID as fallback for testing
        const testStudentId = '08faa382-56d6-4a7c-9482-ef6efdfa5bea';
        const studentIdToUse = user.id || testStudentId;

        const response: RecordingsResponse = await api.ums.students.getRecordings(studentIdToUse);

        if (response.status === 'success' && Array.isArray(response.data.recordings)) {
          // Filter out recordings from excluded batches
          const excludedBatches = [1, 5, 6, 7];
          const filteredRecordings = response.data.recordings.filter(
            (rec) => {
              let bId = Number(rec.batchId);

              // Fallback to user's batch ID if recording doesn't have one
              if (isNaN(bId) && userBatchId) {
                bId = userBatchId;
              }

              const shouldExclude = excludedBatches.includes(bId);
              // console.log(`Recording ${rec.id} Batch: ${bId} Exclude: ${shouldExclude}`);
              return !shouldExclude;
            }
          );
          setRecordings(filteredRecordings);
        } else {
          setRecordingsError('Failed to fetch recordings');
        }
      } catch (err: any) {
        console.error('Error fetching recordings:', err);

        // Show user-friendly error message
        if (err?.message?.includes('multiple (or no) rows returned')) {
          setRecordingsError('This student has multiple batches. Please contact support.');
        } else if (err?.message?.includes('500')) {
          setRecordingsError('Server error while fetching recordings. Please try again later.');
        } else {
          setRecordingsError(err?.message || 'Failed to load recordings');
        }
      } finally {
        setLoadingRecordings(false);
      }
    };

    fetchRecordings();
  }, [user?.id, api.ums.students, userBatchId]);

  const loadAssignmentDetail = async (assignmentId: string) => {
    setAssignmentDetailLoading(true);
    setAssignmentDetailError(null);
    try {
      const response = await api.lms.students.getAssignmentDetails(assignmentId);
      setAssignmentDetail(response?.data || null);
    } catch (error: any) {
      setAssignmentDetailError(error?.message || 'Failed to load assignment details');
    } finally {
      setAssignmentDetailLoading(false);
    }
  };

  const openAssignmentDetail = (item: StudentAssignmentListItem) => {
    setSelectedAssignment(item);
    setAssignmentDetailModalOpen(true);
    setAssignmentSuccessMessage(null);
    setDetailUploadFile(null);
    loadAssignmentDetail(item.assignmentId);
  };

  const closeAssignmentDetail = () => {
    setAssignmentDetailModalOpen(false);
    setSelectedAssignment(null);
    setAssignmentDetail(null);
    setDetailUploadFile(null);
    setAssignmentDetailError(null);
    setAssignmentSuccessMessage(null);
  };

  const handleDetailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      console.log('📁 File selected:', file.name, file.size, file.type);
      setDetailUploadFile(file);
      setAssignmentDetailError(null);
    } else {
      console.log('❌ No file selected');
      setDetailUploadFile(null);
    }
  };

  const handleAssignmentSubmit = async () => {
    console.log('🚀 Submitting assignment...', {
      selectedAssignment: selectedAssignment?.assignmentId,
      hasFile: !!detailUploadFile,
      fileName: detailUploadFile?.name,
      fileSize: detailUploadFile?.size,
      userId: user?.id,
      canUpload: canUploadAssignment,
      status: detailStatus
    });

    if (!selectedAssignment) {
      setAssignmentDetailError('No assignment selected');
      return;
    }
    if (!detailUploadFile) {
      setAssignmentDetailError('Please select a file to upload');
      return;
    }
    if (!user?.id) {
      setAssignmentDetailError('Student ID not available. Please re-login.');
      return;
    }
    if (!canUploadAssignment) {
      setAssignmentDetailError('This assignment has already been submitted or graded. Cannot upload again.');
      return;
    }

    const formData = new FormData();
    formData.append('assignmentId', selectedAssignment.assignmentId);
    formData.append('studentId', user.id);
    formData.append('file', detailUploadFile);

    console.log('📤 FormData created:', {
      assignmentId: selectedAssignment.assignmentId,
      studentId: user.id,
      fileName: detailUploadFile.name,
      fileSize: detailUploadFile.size,
      fileType: detailUploadFile.type
    });

    setUploadingAssignment(true);
    setAssignmentDetailError(null);
    setAssignmentSuccessMessage(null);

    try {
      console.log('📡 Calling submitAssignment API...');
      const response = await api.lms.students.submitAssignment(formData);
      console.log('✅ Submit response:', response);

      const successMessage = response?.message || response?.data?.message || 'Assignment submitted successfully';
      setAssignmentSuccessMessage(successMessage);
      setDetailUploadFile(null);

      await loadAssignmentDetail(selectedAssignment.assignmentId);

      try {
        const refresh = await api.lms.students.getAssignments();
        const raw = Array.isArray(refresh?.data) ? refresh.data : [];
        const mapped = raw.map(mapAssignmentFromApi);
        setAssignments(mapped);
        const updated = mapped.find((item: StudentAssignmentListItem) => item.assignmentId === selectedAssignment.assignmentId);
        if (updated) {
          setSelectedAssignment(updated);
        }
      } catch (refreshError) {
        console.error('Failed to refresh assignments after submission', refreshError);
      }
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      setAssignmentDetailError(error?.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setUploadingAssignment(false);
    }
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





  const fetchClassSchedule = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent) {
          setLoadingClasses(true);
        }
        if (silent) {
          setRefreshingSchedule(true);
        }
        setClassesError(null);

        const response = await api.lms.students.getClassSchedule();

        if (response && response.success === false) {
          throw new Error(response.error || 'Failed to fetch class schedule');
        }

        let data = Array.isArray(response) ? response : response?.data || [];

        // Filter out excluded batches
        const excludedBatches = [1, 5, 6, 7];
        data = data.filter((s: any) => {
          let bId = Number(s.batch_id || s.batchId);

          // Fallback to user's batch ID if session doesn't have one
          if (isNaN(bId) && userBatchId) {
            bId = userBatchId;
          }

          const shouldExclude = excludedBatches.includes(bId);
          // console.log(`Session ${s.id} Batch: ${bId} Exclude: ${shouldExclude}`);
          return !shouldExclude;
        });

        const now = new Date();

        const mapped: UpcomingClass[] = data.map((s: any) => {
          const dt = s.session_datetime ? new Date(s.session_datetime) : null;
          const durationMinutes = Number(s.duration) && Number(s.duration) > 0 ? Number(s.duration) : 60;
          const endTime = dt ? new Date(dt.getTime() + durationMinutes * 60000) : null;

          let dateDisplay = '';
          if (dt) {
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

          const timeDisplay = dt ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

          const rawStatus = (s.status || '').toLowerCase();
          let status: UpcomingClass['status'] = 'upcoming';

          if (rawStatus === 'postponed') {
            status = 'postponed';
          } else if (rawStatus === 'completed' || rawStatus === 'ended') {
            status = 'completed';
          } else if (dt && endTime && now > endTime) {
            status = 'completed';
          } else if (!dt) {
            status = 'upcoming';
          }

          return {
            id: String(s.session_id || s.id || Date.now()),
            title: s.course_name || 'Session',
            mentor: s.faculty_name || '',
            program: s.course_name || '',
            date: dateDisplay,
            time: timeDisplay,
            duration: `${durationMinutes} min`,
            status,
            rescheduled: rawStatus === 'postponed',
            epoch: dt ? dt.getTime() : 0,
            joinUrl: s.join_url || s.hms_join_url || s.live_url || s.meeting_url || s.url,
          } as UpcomingClass;
        });

        const liveIds = new Set<string>();
        const nowMillis = now.getTime();
        const CACHE_TTL = 60 * 1000;

        for (const session of mapped) {
          const sessionIdStr = String(session.id);
          const durationMinutes = Number(session.duration?.replace(' min', '')) || 0;
          const startEpoch = session.epoch && session.epoch > 0 ? session.epoch : null;
          const endEpoch = startEpoch ? startEpoch + durationMinutes * 60000 : null;
          const minutesUntilStart =
            startEpoch !== null ? (startEpoch - nowMillis) / 60000 : null;
          const minutesSinceEnd =
            endEpoch !== null ? (nowMillis - endEpoch) / 60000 : null;

          const cacheEntry = liveStatusCacheRef.current[sessionIdStr];
          const recentlyChecked =
            cacheEntry ? nowMillis - cacheEntry.lastChecked < CACHE_TTL : false;
          const shouldRecheckNearStart =
            minutesUntilStart !== null && minutesUntilStart <= 2 && minutesUntilStart >= -15;
          const shouldRecheckRecentlyEnded =
            minutesSinceEnd !== null && minutesSinceEnd >= -5 && minutesSinceEnd <= 10;

          if (session.status === 'live') {
            liveIds.add(sessionIdStr);
            liveStatusCacheRef.current[sessionIdStr] = { status: 'live', lastChecked: nowMillis };
            continue;
          }

          if (session.status === 'completed' || session.status === 'postponed') {
            liveStatusCacheRef.current[sessionIdStr] = { status: 'not_live', lastChecked: nowMillis };
            continue;
          }

          const original = data.find(
            (raw: any) => String(raw.session_id || raw.id) === String(session.id)
          );

          const rawStatus = (original?.status || '').toLowerCase();
          if (rawStatus === 'live' || rawStatus === 'started' || rawStatus === 'active') {
            liveIds.add(sessionIdStr);
            liveStatusCacheRef.current[sessionIdStr] = { status: 'live', lastChecked: nowMillis };
            continue;
          }

          if (startEpoch && endEpoch && nowMillis >= startEpoch && nowMillis <= endEpoch) {
            liveIds.add(sessionIdStr);
            liveStatusCacheRef.current[sessionIdStr] = { status: 'live', lastChecked: nowMillis };
            continue;
          }

          if (minutesSinceEnd !== null && minutesSinceEnd > 10) {
            liveStatusCacheRef.current[sessionIdStr] = { status: 'not_live', lastChecked: nowMillis };
            continue;
          }

          if (cacheEntry) {
            if (cacheEntry.status === 'live') {
              liveIds.add(sessionIdStr);
              continue;
            }

            if (
              cacheEntry.status === 'not_live' &&
              !shouldRecheckNearStart &&
              !shouldRecheckRecentlyEnded
            ) {
              continue;
            }

            if (recentlyChecked && !shouldRecheckNearStart && !shouldRecheckRecentlyEnded) {
              continue;
            }
          }

          try {
          } catch (statusError) {
            const responseStatus = (statusError as any)?.response?.status ?? (statusError as any)?.status;
            if (responseStatus === 404 || responseStatus === 400 || responseStatus === 410) {
              liveStatusCacheRef.current[sessionIdStr] = { status: 'not_live', lastChecked: Date.now() };
            }
          }
        }

        const updatedClasses = mapped.map((session) =>
          liveIds.has(String(session.id))
            ? { ...session, status: 'live' as UpcomingClass['status'] }
            : session
        );

        setAllClasses(updatedClasses);
      } catch (error: any) {
        setClassesError(error?.message || 'Failed to load class schedule');
      } finally {
        if (!silent) {
          setLoadingClasses(false);
        }
        setRefreshingSchedule(false);
      }
    },
    [api.lms.students, userBatchId]
  );

  useEffect(() => {
    fetchClassSchedule(false);
    const interval = setInterval(() => {
      fetchClassSchedule(true);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchClassSchedule]);

  const handleRefreshSchedule = () => fetchClassSchedule(false);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = todayStart.getTime();

  const upcomingOnly = allClasses
    .filter(c => c.epoch && c.epoch >= todayTimestamp)
    .sort((a, b) => {
      const aIsLive = a.status === 'live';
      const bIsLive = b.status === 'live';
      if (aIsLive !== bIsLive) {
        return aIsLive ? -1 : 1;
      }
      return (a.epoch || 0) - (b.epoch || 0);
    });

  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingOnly.length / upcomingPageSize));
  const upcomingSlice = upcomingOnly.slice(
    (upcomingPage - 1) * upcomingPageSize,
    upcomingPage * upcomingPageSize
  );

  const allClassesSorted = [...allClasses].sort((a, b) => {
    const aIsLive = a.status === 'live' ? 0 : 1;
    const bIsLive = b.status === 'live' ? 0 : 1;
    if (aIsLive !== bIsLive) {
      return aIsLive - bIsLive;
    }
    return (b.epoch || 0) - (a.epoch || 0);
  });
  const scheduleTotalPages = Math.max(1, Math.ceil(allClassesSorted.length / schedulePageSize));
  const scheduleSlice = allClassesSorted.slice(
    (schedulePage - 1) * schedulePageSize,
    schedulePage * schedulePageSize
  );

  const goPrevUpcoming = () => setUpcomingPage(p => Math.max(1, p - 1));
  const goNextUpcoming = () => setUpcomingPage(p => Math.min(upcomingTotalPages, p + 1));
  const goPrevSchedule = () => setSchedulePage(p => Math.max(1, p - 1));
  const goNextSchedule = () => setSchedulePage(p => Math.min(scheduleTotalPages, p + 1));

  const handleAddToCalendar = (classItem: UpcomingClass, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!classItem.epoch || classItem.epoch <= Date.now()) {
      return;
    }

    // Create calendar event
    const startDate = new Date(classItem.epoch);
    const duration = parseInt(classItem.duration?.replace(' min', '') || '60');
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(classItem.title || 'Live Class');
    const description = encodeURIComponent(
      `${classItem.program || ''}${classItem.mentor ? ` - ${classItem.mentor}` : ''}`
    );
    const location = encodeURIComponent('Online');
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${description}&location=${location}`;

    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
  };

  const handleJoinLiveClass = async (classItem: UpcomingClass, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (classItem.status !== 'live') {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    setJoinError(null);
    setShowErrorModal(false);
    setIsJoiningSession(true);

    try {
      const sessionId = parseInt(classItem.id);
      if (isNaN(sessionId)) {
        throw new Error('Invalid session ID');
      }

      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
      if (!token) {
        setJoinError('Your session has expired. Please login again.');
        setShowErrorModal(true);
        setIsJoiningSession(false);
        setTimeout(() => {
          if (!window.location.pathname.includes('/student/login')) {
            window.location.replace('/student/login');
          }
        }, 2000);
        return;
      }

      try {
        const response = await api.multimedia.sessions.joinSession(
          sessionId,
          classItem.program,
          {
            deviceType: 'web',
            deviceName: navigator.userAgent,
            deviceVersion: navigator.appVersion,
          },
          token,
          user
        );

        const sessionData = response?.data || response;

        if (!sessionData) {
          throw new Error('No session data received');
        }

        let liveClassToken = null;

        if (sessionData.hms?.token) {
          liveClassToken = sessionData.hms.token;
        }
        else if (sessionData.agora?.agoraToken) {
          liveClassToken = sessionData.agora.agoraToken;
        }
        else if (sessionData.ams?.token) {
          liveClassToken = sessionData.ams.token;
        }
        else if (sessionData.token) {
          liveClassToken = sessionData.token;
        }

        if (liveClassToken) {
          localStorage.setItem('live_class_token', liveClassToken);
        }

        localStorage.setItem('liveSessionData', JSON.stringify({
          sessionId,
          ...sessionData,
        }));

        window.location.href = `/student/live/${sessionId}`;
      } catch (apiError: any) {
        throw apiError;
      }

    } catch (error: any) {
      setIsJoiningSession(false);

      console.error('Failed to join live session:', error);

      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to join session. Please try again.';
      const statusCode = error?.status ?? error?.response?.status;

      const isAuthError = statusCode === 401;

      if (isAuthError) {
        setIsJoiningSession(false);
        setTimeout(() => {
          if (!window.location.pathname.includes('/student/login') &&
            !window.location.pathname.includes('/login')) {
            window.location.replace('/student/login');
          }
        }, 100);
      } else {
        setJoinError(errorMessage);
        setShowErrorModal(true);
        setIsJoiningSession(false);
      }
    }
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

  const detailStatus = normalizeAssignmentStatus(
    assignmentDetail?.student_assignment?.status || selectedAssignment?.status,
    selectedAssignment?.obtainedMarks ?? null
  );
  const canUploadAssignment = detailStatus !== 'submitted' && detailStatus !== 'graded';
  const detailDueDate = assignmentDetail?.assignment?.due_date || selectedAssignment?.dueDate || null;
  const detailProgram = assignmentDetail?.assignment?.courses?.course_code || selectedAssignment?.program || '—';
  const detailBatch = assignmentDetail?.assignment?.batches?.batch_name || selectedAssignment?.batchName || null;


  return (
    <div className="min-h-screen bg-[#0A0E1A]">


      <nav className="bg-[#1a2332] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-xl font-bold text-[#FFC540]">Polaris Labs</h1>
              <p className="text-gray-400 text-sm">Student Portal</p>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-[#FFC540] rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-black" />
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-semibold text-white truncate">{user?.name || 'Student'}</p>
                    <p className="text-xs text-gray-400 truncate" title={user?.email || ''}>{user?.email || ''}</p>
                  </div>

                  <div className="py-2">
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
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</h1>
          <p className="text-gray-400">Here's what's happening with your learning programs today.</p>
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${activeTab === 'overview'
              ? 'bg-[#FFC540] text-black'
              : 'bg-transparent text-gray-400 hover:text-white'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${activeTab === 'schedule'
              ? 'bg-[#FFC540] text-black'
              : 'bg-transparent text-gray-400 hover:text-white'
              }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${activeTab === 'recordings'
              ? 'bg-[#FFC540] text-black'
              : 'bg-transparent text-gray-400 hover:text-white'
              }`}
          >
            Recordings
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${activeTab === 'assignments'
              ? 'bg-[#FFC540] text-black'
              : 'bg-transparent text-gray-400 hover:text-white'
              }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all text-sm ${activeTab === 'contributions'
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
                    </svg>
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
                    </svg>
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
                    </svg>
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
                    </svg>
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{studentData.attendanceRate}%</div>
                <div className="text-gray-400 text-sm">Avg Attendance</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-full">
                <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Classes
                    </h2>
                    <div className="flex items-center gap-3">
                      {refreshingSchedule && (
                        <span className="text-xs text-gray-400">Refreshing…</span>
                      )}
                      <button
                        onClick={handleRefreshSchedule}
                        className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition"
                      >
                        Refresh
                      </button>
                    </div>
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              if (classItem.status === 'live') {
                                handleJoinLiveClass(classItem, e);
                              } else if (classItem.epoch && classItem.epoch > Date.now()) {
                                handleAddToCalendar(classItem, e);
                              }
                            }}
                            onMouseDown={(e) => {
                              if (e.button === 0) {
                                e.preventDefault();
                              }
                            }}
                            className="ml-4 px-4 py-2 bg-[#FFC540] text-black rounded-lg font-semibold hover:bg-[#FFC540] transition-all flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={(classItem.status === 'live' && isJoiningSession) || (classItem.status !== 'live' && (!classItem.epoch || classItem.epoch <= Date.now()))}
                            aria-disabled={(classItem.status === 'live' && isJoiningSession) || (classItem.status !== 'live' && (!classItem.epoch || classItem.epoch <= Date.now()))}
                          >
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
                    {loadingRecordings ? (
                      <div className="col-span-2 text-center text-gray-400 py-4">Loading...</div>
                    ) : recordings.slice(0, 2).map((recording) => (
                      <div
                        key={recording.id}
                        onClick={() => handlePlayRecording(recording)}
                        className="bg-[#0d1420] rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group"
                      >
                        <div className="relative">
                          <img
                            src="https://media.istockphoto.com/id/1193698730/video/mans-hands-coding-on-laptop-close-up-man-using-portable-computers-man-programmer-writes-code.jpg?s=640x640&k=20&c=QUvOTUEJBXa889HtXbzIQY0dZBXY_jEjEvbJU3seEcI="
                            alt={recording.title}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'src="https://media.istockphoto.com/id/1193698730/video/mans-hands-coding-on-laptop-close-up-man-using-portable-computers-man-programmer-writes-code.jpg?s=640x640&k=20&c=QUvOTUEJBXa889HtXbzIQY0dZBXY_jEjEvbJU3seEcI=';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="w-12 h-12 text-[#FFC540]" />
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-[#FFC540] text-xs font-semibold rounded">
                            {formatRecordingDuration(recording.duration)}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-semibold mb-1 text-sm">{recording.title}</h3>
                          <p className="text-gray-400 text-xs">Session #{recording.sessionId}</p>
                          <p className="text-gray-500 text-xs mt-1">{formatRecordingDate(recording.recordedAt)}</p>
                        </div>
                      </div>
                    ))}
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        if (classItem.status === 'live' && !isJoiningSession) {
                          handleJoinLiveClass(classItem, e);
                        } else if (classItem.status !== 'live' && classItem.epoch && classItem.epoch > Date.now()) {
                          handleAddToCalendar(classItem, e);
                        }
                      }}
                      onMouseDown={(e) => {
                        if (e.button === 0) {
                          e.preventDefault();
                        }
                      }}
                      className="ml-6 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#FFC540] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={(classItem.status === 'live' && isJoiningSession) || (classItem.status !== 'live' && (!classItem.epoch || classItem.epoch <= Date.now()))}
                      aria-disabled={(classItem.status === 'live' && isJoiningSession) || (classItem.status !== 'live' && (!classItem.epoch || classItem.epoch <= Date.now()))}
                    >
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

            {loadingRecordings ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-400">Loading recordings...</div>
              </div>
            ) : recordingsError ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{recordingsError}</p>
              </div>
            ) : recordings.length === 0 ? (
              <div className="text-center py-12">
                <PlayCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No recordings available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    onClick={() => handlePlayRecording(recording)}
                    className="bg-[#0d1420] rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={recording.thumbnailUrl}
                        alt={recording.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://media.istockphoto.com/id/1193698730/video/mans-hands-coding-on-laptop-close-up-man-using-portable-computers-man-programmer-writes-code.jpg?s=640x640&k=20&c=QUvOTUEJBXa889HtXbzIQY0dZBXY_jEjEvbJU3seEcI=';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-16 h-16 text-[#FFC540]" />
                      </div>
                      <span className="absolute bottom-3 right-3 px-3 py-1 bg-black/90 text-[#FFC540] text-sm font-bold rounded">
                        {formatRecordingDuration(recording.duration)}
                      </span>
                      {recording.status === 'FINISHED' && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-white font-bold text-base mb-2">{recording.title}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Session #{recording.sessionId}
                        </p>
                        <p className="text-gray-400 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Batch {recording.batchId}
                        </p>
                        <p className="text-gray-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatRecordingDate(recording.recordedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Assignments</h2>
              <span className="text-sm text-gray-400">Total: {assignments.length}</span>
            </div>

            {loadingAssignments && (
              <div className="text-gray-400 py-6">Loading assignments...</div>
            )}

            {!loadingAssignments && assignmentsError && (
              <div className="text-red-400 py-6">{assignmentsError}</div>
            )}

            {!loadingAssignments && !assignmentsError && assignments.length === 0 && (
              <div className="text-gray-400 py-6">No assignments available yet. Check back soon!</div>
            )}

            {!loadingAssignments && !assignmentsError && assignments.length > 0 && (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.studentAssignmentId || assignment.assignmentId}
                    className="bg-[#0d1420] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                          {renderStatusBadge(assignment.status)}
                          {assignment.gradeLabel && assignment.status === 'graded' && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                              Grade: {assignment.gradeLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm">
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {assignment.program}
                          </span>
                          {assignment.batchName && (
                            <span className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {assignment.batchName}
                            </span>
                          )}
                          {assignment.dueDate && (
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Due: {formatDate(assignment.dueDate)}
                            </span>
                          )}
                          {assignment.assignmentType && (
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {assignment.assignmentType}
                            </span>
                          )}
                          {assignment.totalMarks !== null && (
                            <span className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Total Marks: {assignment.totalMarks}
                            </span>
                          )}
                        </div>
                        {assignment.submittedAt && (
                          <div className="mt-3 text-xs text-gray-500">
                            Last submitted: {formatDateTime(assignment.submittedAt)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openAssignmentDetail(assignment)}
                        className="ml-6 px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#FFC540] transition-all text-sm"
                      >
                        {assignment.status === 'pending' ? 'Submit Assignment' : 'View Details'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-6">
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
                            className={`px-3 py-1 rounded-full text-sm font-bold ${contribution.type === 'PR'
                              ? 'bg-purple-500/20 text-purple-400'
                              : contribution.type === 'Issue'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-blue-500/20 text-blue-400'
                              }`}
                          >
                            {contribution.type}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${contribution.status === 'merged'
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

      {assignmentDetailModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-[#101728] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {assignmentDetail?.assignment?.title || selectedAssignment?.title || 'Assignment'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-2">
                  {renderStatusBadge(detailStatus)}
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {detailProgram}
                  </span>
                  {detailBatch && (
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {detailBatch}
                    </span>
                  )}
                  {detailDueDate && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due: {formatDate(detailDueDate)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeAssignmentDetail}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[65vh]">
              {assignmentDetailLoading ? (
                <div className="py-10 text-center text-gray-400">Loading assignment details...</div>
              ) : assignmentDetail ? (
                <>
                  {assignmentDetailError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3">
                      {assignmentDetailError}
                    </div>
                  )}
                  {assignmentSuccessMessage && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-300 text-sm rounded-lg px-4 py-3">
                      {assignmentSuccessMessage}
                    </div>
                  )}

                  <div className="bg-[#152033] rounded-xl p-6 border border-gray-800 space-y-4">
                    <h4 className="text-lg font-semibold text-white">Task Description</h4>
                    {assignmentDetail.assignment.description ? (
                      <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                        {assignmentDetail.assignment.description}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm italic">No description provided for this assignment.</p>
                    )}
                  </div>

                  <div className="bg-[#152033] rounded-xl p-6 border border-gray-800">
                    <h4 className="text-lg font-semibold text-white mb-4">Requirements</h4>
                    <ol className="space-y-3 text-gray-300 text-sm list-decimal pl-5">
                      {assignmentDetail.questions && assignmentDetail.questions.length > 0 ? (
                        assignmentDetail.questions.map((question, index) => (
                          <li key={question.id || index} className="space-y-1">
                            <p className="font-semibold text-white">{question.question_text}</p>
                            {question.question_type && (
                              <p className="text-gray-400 text-xs">{question.question_type}</p>
                            )}
                            <p className="text-gray-500 text-xs">Marks: {question.marks}</p>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400">No specific requirements provided.</li>
                      )}
                    </ol>
                  </div>

                  <div className="bg-[#152033] rounded-xl p-6 border border-gray-800">
                    <h4 className="text-lg font-semibold text-white mb-3">Upload Assignment</h4>
                    <p className="text-gray-400 text-sm mb-4">Upload your completed assignment (PDF, DOC, DOCX, TXT, ZIP, PNG, JPG). Max size 50MB.</p>
                    <label
                      className={`block border-2 border-dashed rounded-xl p-8 text-center transition ${canUploadAssignment ? 'border-gray-700 hover:border-[#FFC540] cursor-pointer' : 'border-gray-800 cursor-not-allowed'}`}
                    >
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleDetailFileChange}
                        disabled={!canUploadAssignment || uploadingAssignment}
                        accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
                      />
                      {detailUploadFile ? (
                        <div className="space-y-2">
                          <p className="text-white font-medium">{detailUploadFile.name}</p>
                          <p className="text-gray-400 text-sm">{(detailUploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 text-gray-500 mx-auto" />
                          <p className="text-white font-medium">
                            {canUploadAssignment ? 'Click to upload or drag and drop' : 'Submission locked'}
                          </p>
                          <p className="text-gray-500 text-sm">Supported formats: PDF, DOC, DOCX, TXT, ZIP, PNG, JPG</p>
                        </div>
                      )}
                    </label>
                    {!canUploadAssignment && (
                      <p className="mt-3 text-xs text-gray-500">
                        You have already {detailStatus === 'graded' ? 'received a grade' : 'submitted'} for this assignment.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-red-400">
                  {assignmentDetailError || 'Assignment details not available.'}
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-gray-800 flex items-center justify-end gap-3">
              <button
                onClick={closeAssignmentDetail}
                className="px-5 py-2 rounded-lg bg-[#0d1524] text-white border border-gray-700 hover:bg-[#1a2332] transition"
              >
                Close
              </button>
              <button
                onClick={handleAssignmentSubmit}
                disabled={uploadingAssignment || !detailUploadFile || !canUploadAssignment}
                className="px-5 py-2 rounded-lg bg-[#FFC540] text-black font-semibold hover:bg-[#e6b139] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingAssignment
                  ? 'Submitting...'
                  : !detailUploadFile
                    ? 'Select a file to upload'
                    : !canUploadAssignment
                      ? 'Submission Locked'
                      : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Error Modal for Join Session Errors */}
      {showErrorModal && joinError && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              setShowErrorModal(false);
              setJoinError(null);
            }
          }}
        >
          <div className="bg-[#1a2332] rounded-xl p-8 border border-gray-800 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Error Joining Session</h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowErrorModal(false);
                  setJoinError(null);
                }}
                className="text-gray-400 hover:text-white transition-all"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-300">{joinError}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowErrorModal(false);
                  setJoinError(null);
                }}
                className="px-6 py-3 bg-[#FFC540] text-black rounded-lg font-bold hover:bg-[#FFC540] transition-all"
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Video Player Modal */}
      {showVideoPlayer && selectedRecording && (
        <VideoPlayerModal
          isOpen={showVideoPlayer}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedRecording(null);
          }}
          videoUrl={`https://prod-video-transcoding.polariscampus.com/v1/vod/sessions/${selectedRecording.sessionId}/master-playlist`}
          title={selectedRecording.title}
        />
      )}
    </div>
  );
};

export default StudentProfile;
