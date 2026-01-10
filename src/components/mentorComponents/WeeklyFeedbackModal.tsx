import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, User, Users } from 'lucide-react';
import { useApi } from '../../services/api';

interface SessionStudent {
  studentId: string;
  studentName: string;
  email?: string;
  rollNo?: string;
  imageUrl?: string;
  joinedAt: string;
  leftAt: string;
  totalDuration: number;
  attendancePercentage: number;
  isPresent: boolean;
}

interface StudentFeedback {
  student_id: string;
  performance_rating: number;
  overall_performance: string;
  area_for_improvement: string;
  strengh: string;
  homework: string;
  assignments: string;
}

interface WeeklyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
}

const WeeklyFeedbackModal: React.FC<WeeklyFeedbackModalProps> = ({ isOpen, onClose, mentorId }) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<SessionStudent[]>([]);
  const [studentFeedbacks, setStudentFeedbacks] = useState<Record<string, StudentFeedback>>({});

  // Weekly mentor-level feedback state – commented out, kept only for reference
  // const [formData, setFormData] = useState({
  //   performance_rating: 5,
  //   area_for_improvement: '',
  //   overall_performance: '',
  //   strengh: '',
  //   homework: '',
  //   assignments: ''
  // });

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Fetch all students for the mentor
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isOpen) return;
      
      setLoadingStudents(true);
      try {
        // Fetch all students for this mentor
        const response = await api.lms.mentors.getFacultyStudents();
        const sessionsData = response.data || [];
        
        // Extract unique students from all sessions
        const studentMap = new Map();
        sessionsData.forEach((session: any) => {
          if (session.students && Array.isArray(session.students)) {
            session.students.forEach((student: any) => {
              if (!studentMap.has(student.student_id)) {
                studentMap.set(student.student_id, {
                  studentId: student.student_id,
                  studentName: student.student_name,
                  email: student.student_email || '',
                  rollNo: '',
                  imageUrl: '',
                  joinedAt: '',
                  leftAt: '',
                  totalDuration: 0,
                  attendancePercentage: 0,
                  isPresent: true
                });
              }
            });
          }
        });
        
        const transformedStudents = Array.from(studentMap.values());
        setStudents(transformedStudents);
        
        // Initialize feedback for each student (all 6 fields)
        const initialFeedbacks: Record<string, StudentFeedback> = {};
        transformedStudents.forEach((student: SessionStudent) => {
          initialFeedbacks[student.studentId] = {
            student_id: student.studentId,
            performance_rating: 5,
            overall_performance: '',
            area_for_improvement: '',
            strengh: '',
            homework: '',
            assignments: ''
          };
        });
        setStudentFeedbacks(initialFeedbacks);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };
    
    fetchStudents();
  }, [isOpen, mentorId]);

  // Weekly mentor-level change handler (no longer used)
  // const handleChange = (field: string, value: string | number) => {
  //   setFormData(prev => ({ ...prev, [field]: value }));
  // };

  const handleStudentFeedbackChange = (
    studentId: string, 
    field: 'performance_rating' | 'overall_performance' | 'area_for_improvement' | 'strengh' | 'homework' | 'assignments', 
    value: string | number
  ) => {
    setStudentFeedbacks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'performance_rating' ? Number(value) : value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    try {
      // 1. Weekly mentor-level feedback payload – commented out (only student feedback will be submitted)
      // const weeklyFeedbackPayload = {
      //   user_id: mentorId,
      //   session_id: null,
      //   performance_rating: formData.performance_rating,
      //   area_for_improvement: formData.area_for_improvement,
      //   overall_performance: formData.overall_performance,
      //   strengh: formData.strengh,
      //   homework: formData.homework,
      //   assignments: formData.assignments,
      //   feedback_type: "weekly"
      // };
      //
      // console.log('📤 Submitting weekly feedback payload:', weeklyFeedbackPayload);
      // await api.lms.mentors.submitFeedback(weeklyFeedbackPayload);
      // console.log('✅ Weekly feedback submitted successfully');
      
      // 2. Submit feedback for each student (all 6 fields)
      const studentFeedbackPromises = Object.values(studentFeedbacks).map(feedback => {
        const payload = {
          user_id: feedback.student_id,
          session_id: null,
          // student_id: feedback.student_id, // not required in weekly student feedback payload
          performance_rating: feedback.performance_rating,
          overall_performance: feedback.overall_performance,
          area_for_improvement: feedback.area_for_improvement,
          strengh: feedback.strengh,
          homework: feedback.homework,
          assignments: feedback.assignments,
          feedback_type: "weekly"
        };
        
        return api.lms.mentors.submitFeedback(payload);
      });

      await Promise.all(studentFeedbackPromises);
      console.log('✅ All student feedbacks submitted successfully');
      
      setNotification({ type: 'success', message: 'Weekly feedback submitted successfully for all students!' });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error submitting weekly feedback:', error);
      setNotification({ type: 'error', message: `Failed to submit weekly feedback: ${error.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-2 sm:p-4">
      <div className="bg-slate-800 text-white rounded-xl shadow-2xl w-full max-w-6xl m-0 sm:m-4 p-3 sm:p-4 md:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start sm:items-center gap-2 mb-4 sm:mb-6 border-b border-slate-700 pb-3 sm:pb-4">
          <h2 className="text-base sm:text-lg md:text-xl font-bold flex-1 pr-2 break-words flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            <span>Add Weekly Feedback</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl sm:text-2xl flex-shrink-0">&times;</button>
        </div>

        {notification && (
          <div className={`fixed top-4 right-4 z-[60] p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-0 border ${
            notification.type === 'success' 
              ? 'bg-slate-900 text-white border-yellow-500/50' 
              : 'bg-slate-900 text-white border-red-500/50'
          }`}>
            {notification.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
            )}
            <div>
              <h4 className={`font-semibold text-sm ${notification.type === 'success' ? 'text-yellow-500' : 'text-red-500'}`}>
                {notification.type === 'success' ? 'Success' : 'Error'}
              </h4>
              <p className="text-xs opacity-90 text-slate-300">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Weekly Feedback Form – commented out, kept only for reference
          <div className="bg-slate-700/30 rounded-lg p-4 sm:p-5 border border-slate-600">
            <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-500" />
              <span>Weekly Feedback</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">
                  Performance Rating
                </label>
                <select
                  value={formData.performance_rating}
                  onChange={(e) => handleChange('performance_rating', Number(e.target.value))}
                  required
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Fair</option>
                  <option value={3}>3 - Good</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">
                  Area for Improvement
                </label>
                <textarea
                  value={formData.area_for_improvement}
                  onChange={(e) => handleChange('area_for_improvement', e.target.value)}
                  placeholder="Areas where improvement is needed..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">
                  Overall Performance
                </label>
                <textarea
                  value={formData.overall_performance}
                  onChange={(e) => handleChange('overall_performance', e.target.value)}
                  placeholder="Overall weekly performance feedback..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">
                  Strengths
                </label>
                <textarea
                  value={formData.strengh}
                  onChange={(e) => handleChange('strengh', e.target.value)}
                  placeholder="Key strengths observed this week..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">
                  Homework
                </label>
                <textarea
                  value={formData.homework}
                  onChange={(e) => handleChange('homework', e.target.value)}
                  placeholder="Homework assigned this week..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2">
                  Assignments
                </label>
                <textarea
                  value={formData.assignments}
                  onChange={(e) => handleChange('assignments', e.target.value)}
                  placeholder="Assignments given this week..."
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                />
              </div>
            </div>
          </div>
          */}

          {/* Students List Section (Below Weekly Form) */}
          <div className="bg-slate-700/30 rounded-lg p-4 sm:p-5 border border-slate-600">
            <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              <span>Student Feedback ({students.length})</span>
            </h3>
            
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                <span className="ml-2 text-slate-400">Loading students...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No students found</div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.studentId} className="bg-slate-700/50 rounded-lg p-3 sm:p-4 border border-slate-600">
                    {/* Student Header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-600">
                      {student.imageUrl ? (
                        <img
                          src={student.imageUrl}
                          alt={student.studentName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                          <User className="w-5 h-5 text-black" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{student.studentName}</h4>
                        <div className="flex gap-3 text-xs text-slate-400">
                          {student.rollNo && <span>Roll No: {student.rollNo}</span>}
                          {student.email && <span>{student.email}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Student Feedback Form - All 6 Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Performance Rating */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                          Performance Rating
                        </label>
                        <select
                          value={studentFeedbacks[student.studentId]?.performance_rating || 5}
                          onChange={(e) => handleStudentFeedbackChange(student.studentId, 'performance_rating', e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                        >
                          <option value={1}>1 - Poor</option>
                          <option value={2}>2 - Fair</option>
                          <option value={3}>3 - Good</option>
                          <option value={4}>4 - Very Good</option>
                          <option value={5}>5 - Excellent</option>
                        </select>
                      </div>

                      {/* Area for Improvement */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                          Area for Improvement
                        </label>
                        <textarea
                          value={studentFeedbacks[student.studentId]?.area_for_improvement || ''}
                          onChange={(e) => handleStudentFeedbackChange(student.studentId, 'area_for_improvement', e.target.value)}
                          placeholder="Areas where improvement is needed..."
                          rows={2}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                        />
                      </div>

                      {/* Overall Performance */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                          Overall Performance
                        </label>
                        <textarea
                          value={studentFeedbacks[student.studentId]?.overall_performance || ''}
                          onChange={(e) => handleStudentFeedbackChange(student.studentId, 'overall_performance', e.target.value)}
                          placeholder="Overall student performance..."
                          rows={2}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                        />
                      </div>

                      {/* Strengths */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                          Strengths
                        </label>
                        <textarea
                          value={studentFeedbacks[student.studentId]?.strengh || ''}
                          onChange={(e) => handleStudentFeedbackChange(student.studentId, 'strengh', e.target.value)}
                          placeholder="Key strengths observed..."
                          rows={2}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                        />
                      </div>

                      {/* Homework */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                          Homework
                        </label>
                        <textarea
                          value={studentFeedbacks[student.studentId]?.homework || ''}
                          onChange={(e) => handleStudentFeedbackChange(student.studentId, 'homework', e.target.value)}
                          placeholder="Homework feedback..."
                          rows={2}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                        />
                      </div>

                      {/* Assignments */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                          Assignments
                        </label>
                        <textarea
                          value={studentFeedbacks[student.studentId]?.assignments || ''}
                          onChange={(e) => handleStudentFeedbackChange(student.studentId, 'assignments', e.target.value)}
                          placeholder="Assignments feedback..."
                          rows={2}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 placeholder-slate-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base text-slate-300 hover:text-white transition-colors rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingStudents}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save All Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeeklyFeedbackModal;
