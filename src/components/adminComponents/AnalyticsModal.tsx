import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "../../services/api";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: {mentor_id: string, start_date: string , end_date: string};
  mode?: "view" | "edit";
}
interface Lecture {
  lecture_id: number;
  lecture_name: string;
  lecture_date: Date;
  duration: number;
  students_present: number;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
}) => {
    const { adminAnalytics} = useApi();
    const {mentor_id,start_date,end_date}=analytics||{};

    const [lecturesData,setLecturesData]=useState<Lecture[]>([]);

    async function fetchMentorLectures(mentor_id: string, start_date: string, end_date: string) {
        try {
            const response=await adminAnalytics.lecturesAnalytics(mentor_id, start_date, end_date);
            if (response?.success) {
                // Handle the successful response
                console.log("Lectures Data:", response.data);
                setLecturesData(response.data);
            }
        } catch (error) {
            
        }
    }
    useEffect(()=>{
        fetchMentorLectures(mentor_id,start_date,end_date);
    },[mentor_id,start_date,end_date]);
    
  if (!isOpen || !mentor_id) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-6 py-8">
        <div className="modal-backdrop" onClick={onClose} />

        <div className="relative w-full max-w-6xl rounded-2xl shadow-xl border border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800">
            <h3 className="text-xl font-bold text-white">Lectures Details</h3>
            <button onClick={onClose}>
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="px-10 py-8 space-y-6 max-h-[80vh] overflow-y-auto">
            {lecturesData?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-700 rounded-xl overflow-hidden">
                  <thead className="bg-gray-800">
                    <tr className="text-left text-sm text-gray-300">
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Duration (min)</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Students</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-700">
                    {lecturesData.map((lecture) => (
                      <tr
                        key={lecture.lecture_id}
                        className="bg-gray-900 hover:bg-gray-800 transition"
                      >
                        <td className="px-4 py-3 text-white">
                          {lecture.lecture_name}
                        </td>

                        <td className="px-4 py-3 text-white">
                          {lecture.duration}
                        </td>

                        <td className="px-4 py-3 text-white">
                          {new Date(lecture.lecture_date).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3 text-white">
                          {lecture.students_present}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center">
                No lecture data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;
