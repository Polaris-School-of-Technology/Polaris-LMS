import React, { useEffect, useState } from "react";
import {
  X,
  Users,
  BookOpen,
  Calendar,
  Clock,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import type { Mentor, Program, programMentor } from "../../types";
import { useApi } from "../../services/api";
interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
  mode: "view" | "edit";
}
interface AssignMentor {
  from: programMentor | null;
  to: programMentor | null;
}
const ProgramModal: React.FC<ProgramModalProps> = ({
  isOpen,
  onClose,
  program,
  mode,
}) => {
  const api = useApi();

  // --- State ---
  const [editData, setEditData] = useState<Partial<Program>>({
    id: "",
    name: "",
    cohort: "",
    sessions: 0,
    status: "active",
    startDate: "",
    endDate: "",
    assignedMentor: null,
  });

  const [showMentorDropdown, setShowMentorDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rescheduleFilter, setRescheduleFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "mentor" | "reschedules">(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [reschedules, setReschedules] = useState<any[]>([]);
  const [mentor, setMentor] = useState<string>("");
  const [allmentors, setAllmentors] = useState<any[]>([]);
  const [displayedProgramMentors, setDisplayedProgramMentors] = useState<any[]>(
    []
  );
  // 'assign' -> show assign/reassign UI (existing)
  // 'add' -> show multi-select UI to add multiple mentors
  const [mentorActionMode, setMentorActionMode] = useState<"swap" | "add">(
    "swap"
  );
  const [showAddMentorsDropdown, setShowAddMentorsDropdown] = useState(false);
  const [newMentorsToAdd, setNewMentorsToAdd] = useState<any[]>([]);
  const [loadingReschedules, setLoadingReschedules] = useState(false);
  const [batches, setBatches] = useState<
    Array<{
      id: number;
      batch_name: string;
      academic_year: string;
      semester: number;
    }>
  >([]);
  const [faculties, setFaculties] = useState<
    Array<{
      user_id: string;
      profiles: { name: string };
      expertise: string[] | null;
      date_of_joining: string | null;
      is_active: boolean;
    }>
  >([]);
  /// mentor to assign ---
  const [mentorToAssign, setMentorToAssign] = useState<AssignMentor>({
    from: null,
    to: null,
  });
  // --- Mock Data for Mentors List ---
  const mentorsList = [
    { id: 1, name: "Rahul Sharma" },
    { id: 2, name: "Ananya Gupta" },
    { id: 3, name: "Vikram Singh" },
  ];

  const [selectedBatchId, setSelectedBatchId] = useState<number>(0); // default 0 (no selection)
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mentorReschedules, setMentorReschedules] = useState<any | null>(null);
  const [programMentors, setProgramMentors] = useState<any[]>([]);

  const mockReschedules = [
    {
      id: "1",
      mentorName: "Dr. Sarah Wilson",
      sessionId: "FS-101",
      sessionTitle: "React Fundamentals",
      originalDateTime: "2024-01-15T10:00:00",
      rescheduledDateTime: "2024-01-16T14:00:00",
      rescheduleCount: 3,
    },
    {
      id: "2",
      mentorName: "Prof. Michael Chen",
      sessionId: "DS-201",
      sessionTitle: "Data Analysis Workshop",
      originalDateTime: "2024-01-14T09:00:00",
      rescheduledDateTime: "2024-01-17T11:00:00",
      rescheduleCount: 1,
    },
    {
      id: "3",
      mentorName: "Ms. Emily Rodriguez",
      sessionId: "UX-301",
      sessionTitle: "User Research Methods",
      originalDateTime: "2024-01-13T15:00:00",
      rescheduledDateTime: "2024-01-15T16:00:00",
      rescheduleCount: 2,
    },
    {
      id: "4",
      mentorName: "Dr. Sarah Wilson",
      sessionId: "FS-102",
      sessionTitle: "State Management",
      originalDateTime: "2024-01-12T13:00:00",
      rescheduledDateTime: "2024-01-14T10:00:00",
      rescheduleCount: 3,
    },
  ];

  // --- Fetch batches & faculties when creating a new program ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const anyProgram = program as any;
        const candidate = anyProgram?.course_id ?? anyProgram?.id ?? "";
        const courseId = parseInt(String(candidate), 10);

        setLoading(true);

        const [batchesResponse, facultiesResponse, programMentorsResponse] =
          await Promise.all([
            api.lms.adminMentors.getAllBatches(),
            api.lms.adminPrograms.getAllFaculties(),
            api.lms.adminMentors.getProgramMentors(courseId),
          ]);
        setFaculties(facultiesResponse);
        const programMentorsData = programMentorsResponse?.data || [];
        const allotedMentors = Array.isArray(program?.mentors)
          ? program.mentors.map((m: any) => (m.mentor_name || "").toLowerCase())
          : [];
        const filteredMentors =
          allotedMentors.length > 0
            ? programMentorsData.filter((val: any) =>
                allotedMentors.includes((val.faculty_name || "").toLowerCase())
              )
            : programMentorsData;
        setProgramMentors(filteredMentors);
        setDisplayedProgramMentors(filteredMentors);

        if (batchesResponse?.batches) {
          setBatches(batchesResponse.batches);
          if (batchesResponse.batches.length > 0) {
            setSelectedBatchId(batchesResponse.batches[0].id);
          }
        }

        if (facultiesResponse?.faculties) {
          setFaculties(facultiesResponse.faculties);
          if (facultiesResponse.faculties.length > 0) {
            setSelectedFacultyId(facultiesResponse.faculties[0].user_id);
          }
        } else {
          console.warn("No faculties found in response:", facultiesResponse);
        }
      } catch (err) {
        console.error("fetchData error", err);
        // Set empty arrays on error to prevent UI issues
        setBatches([]);
        setFaculties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, mode, program, api]);

  // Keep displayed list in sync when programMentors is updated elsewhere
  useEffect(() => {
    setDisplayedProgramMentors(programMentors);
  }, [programMentors]);

  const allowedStatuses = ["active", "inactive", "archived"] as const;
  type StatusValue = (typeof allowedStatuses)[number];

  const normalizeStatus = (value: any): StatusValue => {
    if (typeof value === "boolean") {
      return value ? "active" : "inactive";
    }

    const status = typeof value === "string" ? value.trim().toLowerCase() : "";

    if (status === "completed" || status === "complete") {
      return "archived";
    }

    if ((allowedStatuses as readonly string[]).includes(status)) {
      return status as StatusValue;
    }

    return "active";
  };

  const filteredMentors = (mentorName: string) => {
    const filtered = programMentors.filter(
      (m) => (m.faculty_name || "").toLowerCase() === mentorName.toLowerCase()
    );
    setDisplayedProgramMentors(filtered);
  };

  useEffect(() => {
    if (!program) {
      setEditData({
        id: "",
        name: "",
        cohort: "",
        sessions: 0,
        status: "active",
        startDate: "",
        endDate: "",
        assignedMentor: null,
      });
      setSelectedFacultyId("");
      return;
    }

    const anyProgram = program as any;
    const apiItem = Array.isArray(anyProgram) ? anyProgram[0] : anyProgram;

    const mapped = {
      id: (apiItem?.course_id?.toString?.() ||
        apiItem?.id?.toString?.() ||
        "") as string,
      name: apiItem?.course_name ?? apiItem?.name ?? "",
      cohort: apiItem?.batch_name ?? apiItem?.cohort ?? "",
      sessions:
        typeof apiItem?.sessions === "number"
          ? apiItem.sessions
          : parseInt(apiItem?.sessions ?? "0", 10) || 0,
      status: normalizeStatus(
        typeof apiItem?.active === "boolean" ? apiItem.active : apiItem?.status
      ),
      startDate: apiItem?.start_date ?? apiItem?.startDate ?? "",
      endDate: apiItem?.end_date ?? apiItem?.endDate ?? "",
      assignedMentor: apiItem?.faculty_name
        ? {
            id: apiItem?.faculty_id?.toString?.() || "",
            name: apiItem.faculty_name,
          }
        : apiItem?.assignedMentor ?? null,
    };

    setEditData(mapped);
    setSelectedFacultyId(mapped.assignedMentor?.id ?? "");
  }, [program, isOpen]);

  // Ensure mentor dropdown is closed whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setShowMentorDropdown(false);
      // reset previous temporary selections when opening the modal
      setMentorToAssign({ from: null, to: null });
      // reset add-mode selections & dropdown when opening
      setNewMentorsToAdd([]);
      setShowAddMentorsDropdown(false);
      // reset displayed mentors to full list
      setDisplayedProgramMentors(programMentors);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchReschedules = async () => {
      try {
        setLoadingReschedules(true);

        if (!program) {
          setReschedules([]);
          setMentorReschedules(null);
          return;
        }

        const anyProgram = program as any;
        const candidate = anyProgram?.course_id ?? anyProgram?.id ?? "";
        const courseId = parseInt(String(candidate), 10);

        if (Number.isNaN(courseId)) {
          setReschedules([]);
          setMentorReschedules(null);
          return;
        }

        const [rescheduleData, mentorSummary, mentorsData] = await Promise.all([
          api.ums.programs.getProgramDetails(courseId),
          api.lms.adminMentors.getMentorReschedules().catch(() => null),
          api.adminAnalytics.mentorsAnalytics("", "", 1, 80),
        ]);

        if (mentorsData && mentorsData.data) {
          setAllmentors(mentorsData.data);
        }

        const data = rescheduleData?.data ?? rescheduleData?.data ?? [];
        setReschedules(Array.isArray(data) ? data : []);
        setMentorReschedules(mentorSummary);
      } catch (err) {
        console.error("fetchReschedules error", err);
        setReschedules([]);
        setMentorReschedules(null);
      } finally {
        setLoadingReschedules(false);
      }
    };
    fetchReschedules();
  }, [isOpen, program, mode, api]);

  const transformedReschedules = React.useMemo(
    () =>
      reschedules.map((reschedule: any) => {
        return {
          id: reschedule?.id?.toString?.() ?? String(Math.random()).slice(2),
          mentorName: reschedule?.faculty_name ?? reschedule?.mentor_name ?? "",
          sessionId:
            reschedule?.session_id ??
            reschedule?.course_code ??
            (reschedule?.id ? String(reschedule.id) : undefined),
          sessionTitle: reschedule?.session_title ?? reschedule?.title ?? "",
          courseName: reschedule?.course_name ?? reschedule?.course ?? "",
          originalDateTime:
            reschedule?.session_datetime ??
            reschedule?.original_datetime ??
            reschedule?.originalDateTime ??
            "",
          rescheduledDateTime:
            reschedule?.rescheduled_date_time ??
            reschedule?.rescheduledDateTime ??
            "",
          rescheduleCount:
            reschedule?.rescheduled_count ??
            reschedule?.reschedule_count ??
            reschedule?.count ??
            1,
        };
      }),
    [reschedules]
  );

  // --- Filter & sort reschedules ---
  const filteredReschedules = transformedReschedules
    .filter((reschedule) => {
      if (
        rescheduleFilter !== "all" &&
        reschedule.mentorName !== rescheduleFilter
      )
        return false;
      if (dateRangeFilter !== "all") {
        const rescheduleDate = new Date(reschedule.rescheduledDateTime);
        const now = new Date();
        const daysAgo =
          (now.getTime() - rescheduleDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dateRangeFilter === "week" && daysAgo > 7) return false;
        if (dateRangeFilter === "month" && daysAgo > 30) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "mentor":
          aValue = a.mentorName;
          bValue = b.mentorName;
          break;
        case "reschedules":
          aValue = a.rescheduleCount;
          bValue = b.rescheduleCount;
          break;
        case "date":
        default:
          aValue = new Date(a.rescheduledDateTime).getTime();
          bValue = new Date(b.rescheduledDateTime).getTime();
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  // --- Actions ---
  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const programId = program?.originalProgramId;
    const batchId = program?.batchId;
    const mentorIds = newMentorsToAdd.map((m) => m.mentor_id);
    const fromMentorId = mentorToAssign.from?.mentor_id || "";
    const toMentorId = mentorToAssign.to?.mentor_id || "";

    const hasValidBatch = batchId != null && batchId !== "" && Number(batchId) >= 1;
    const hasSwapIntent = mentorActionMode === "swap" && fromMentorId && toMentorId;
    const hasAddIntent = mentorActionMode === "add" && mentorIds.length > 0;
    if (
      programId &&
      hasValidBatch &&
      (hasSwapIntent || hasAddIntent)
    ) {
      try {
        await api.lms.adminPrograms.addSwapMentor(
          mentorIds,
          programId as string,
          batchId as string,
          fromMentorId,
          toMentorId,
          mentorActionMode
        );
      } catch (error) {
        console.error("Mentor swap/add failed:", error);
      }
    }

    if ((mode === "edit" || mode === "add") && !program) {
      try {
        setLoading(true);

        const courseName = (editData.name ?? "").trim();
        const startDate = editData.startDate ?? "";
        const endDate = editData.endDate ?? "";
        const active = editData.status === "active" ? "active" : "inactive";

        if (!courseName || !startDate || !endDate) {
          alert(
            "Please fill out all required fields: Program Name, Start Date, and End Date."
          );
          return;
        }

        const programData = {
          courseName,
          startDate,
          endDate,
          active,
        };

        const result = await api.lms.adminPrograms.createProgram(programData);

        if (
          result?.message === "Course created successfully." ||
          result?.message === "Program created successfully." ||
          result?.success
        ) {
          alert("Program created successfully!");
          onClose();
        } else {
          alert(
            "Failed to create program: " +
              (result?.error ||
                result?.message ||
                JSON.stringify(result) ||
                "Unknown error")
          );
        }
      } catch (error: any) {
        alert("Error creating program: " + (error?.message ?? String(error)));
      } finally {
        setLoading(false);
      }
    } else {
      // editing existing program or just closing
      onClose();
    }
  };

  // const handleMentorSelect = (mentor: React.ChangeEvent<HTMLSelectElement>) => {
  //   const [type, selectedMentorId] = mentor.target.value.split(":");

  //   const getSelectedMentor = allmentors.find(
  //     (m) => m.mentor_id === selectedMentorId
  //   );
  //   setMentorToAssign((prev) => ({
  //     from: type === "from" ? getSelectedMentor : prev?.from ?? null,
  //     to: type === "to" ? getSelectedMentor : prev?.to ?? null,
  //   }));
  //   console.log(mentorToAssign);
  //   // setMentor();
  // };
  // console.log(mentorToAssign);

  const handleSort = (field: "date" | "mentor" | "reschedules") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case "edit":
        return program ? "Edit Program" : "Add New Program";
      case "view":
        return "Program Details";
      default:
        return "Program";
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-center min-h-screen px-6 py-8">
        <div className="modal-backdrop" onClick={onClose} />

        <div className="modal-content relative w-full max-w-6xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-800">
            <h3 className="text-xl font-bold text-white">{getModalTitle()}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-all duration-200 p-2 hover:bg-gray-800/50 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-8 overflow-y-auto max-h-[calc(95vh-120px)]">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Program Name */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Program Name
                </label>
                {mode === "view" ? (
                  <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                    {program?.name ?? (program as any)?.course_name ?? "N/A"}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editData.name ?? ""}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                    placeholder="Enter program name"
                    required
                  />
                )}
              </div>

              {/* Date Fields - Always 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Start Date
                  </label>
                  {mode === "view" ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                      {program?.startDate
                        ? new Date(program.startDate).toLocaleDateString()
                        : (program as any)?.start_date
                        ? new Date(
                            (program as any).start_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={editData.startDate ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, startDate: e.target.value })
                      }
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      required
                    />
                  )}
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    End Date
                  </label>
                  {mode === "view" ? (
                    <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg text-white">
                      {program?.endDate
                        ? new Date(program.endDate).toLocaleDateString()
                        : (program as any)?.end_date
                        ? new Date(
                            (program as any).end_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={editData.endDate ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, endDate: e.target.value })
                      }
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Status
                </label>
                {mode === "view" ? (
                  <div className="h-12 flex items-center px-4 bg-gray-800 rounded-lg">
                    {(() => {
                      const rawStatus =
                        (program as any)?.status ?? (program as any)?.active;
                      const normalized = normalizeStatus(rawStatus);
                      const badgeClass =
                        normalized === "active"
                          ? "text-green-400 bg-green-400/10"
                          : normalized === "inactive"
                          ? "text-gray-300 bg-gray-400/10"
                          : "text-yellow-400 bg-yellow-400/10";
                      const label =
                        normalized.charAt(0).toUpperCase() +
                        normalized.slice(1);
                      return (
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${badgeClass}`}
                        >
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <select
                    value={
                      editData.status === "active" ||
                      editData.status === "inactive"
                        ? editData.status
                        : "active"
                    }
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        status:
                          e.target.value === "active" ? "active" : "inactive",
                      })
                    }
                    className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all duration-200"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                )}
              </div>
              {(mode === "view" || mode === "edit") && (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Mentor Assigned
                  </label>

                  {mode === "view" ? (
                    <div className="min-h-12 flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white">
                      {program?.mentors?.length ? (
                        program.mentors.map((mentor) => (
                          <span
                            key={mentor.mentor_id}
                            className="px-2 py-1 bg-gray-700 rounded-md text-sm"
                          >
                            {mentor.mentor_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">
                          No mentor assigned
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-3">
                        <label className="inline-flex items-center text-sm text-gray-300">
                          <input
                            type="radio"
                            name="mentorAction"
                            value="swap"
                            checked={mentorActionMode === "swap"}
                            onChange={() => setMentorActionMode("swap")}
                            className="mr-2"
                          />
                          Swap
                        </label>
                        <label className="inline-flex items-center text-sm text-gray-300">
                          <input
                            type="radio"
                            name="mentorAction"
                            value="add"
                            checked={mentorActionMode === "add"}
                            onChange={() => setMentorActionMode("add")}
                            className="mr-2"
                          />
                          Add
                        </label>
                      </div>

                      {mentorActionMode === "swap" && (
                        <button
                          type="button"
                          onClick={() => setShowMentorDropdown((prev) => !prev)}
                          className="w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-between text-white"
                        >
                          {mentorToAssign.from && mentorToAssign.to ? (
                            <span className="flex items-center gap-2">
                              <span className="text-gray-300">
                                {mentorToAssign.from.mentor_name}
                              </span>
                              <span className="text-yellow-400">→</span>
                              <span className="font-semibold">
                                {mentorToAssign.to.mentor_name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Swap/ Add Mentor
                            </span>
                          )}
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      )}

                      {mentorActionMode === "add" && (
                        <button
                          type="button"
                          onClick={() => setShowAddMentorsDropdown((s) => !s)}
                          className="w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-between text-white"
                        >
                          {newMentorsToAdd.length > 0 ? (
                            <span className="text-gray-300">
                              {newMentorsToAdd
                                .map((m) => m.mentor_name)
                                .join(", ")}
                            </span>
                          ) : (
                            <span className="text-gray-400">Add Mentors</span>
                          )}
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      )}

                      {mentorActionMode === "swap" && showMentorDropdown && (
                        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 text-xs text-gray-400 uppercase">
                            Assigned Mentors
                          </div>
                          {program?.mentors?.map((mentor) => (
                            <div
                              key={mentor.mentor_id}
                              onClick={() =>
                                setMentorToAssign((prev) => {
                                  const next = { ...prev, from: mentor };
                                  if (next.from && next.to)
                                    setShowMentorDropdown(false);
                                  return next;
                                })
                              }
                              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-800"
                            >
                              <span className="text-white">
                                {mentor.mentor_name}
                              </span>
                              {mentorToAssign.from?.mentor_id ===
                                mentor.mentor_id && (
                                <span className="text-green-400">✔</span>
                              )}
                            </div>
                          ))}

                          <div className="px-4 py-2 text-xs text-gray-400 uppercase border-t border-gray-700">
                            Available Mentors
                          </div>
                          {allmentors
                            ?.filter(
                              (m) =>
                                m.mentor_id !== mentorToAssign.from?.mentor_id
                            )
                            .map((mentor) => (
                              <div
                                key={mentor.mentor_id}
                                onClick={() =>
                                  setMentorToAssign((prev) => {
                                    const next = { ...prev, to: mentor };
                                    if (next.from && next.to)
                                      setShowMentorDropdown(false);
                                    return next;
                                  })
                                }
                                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-800"
                              >
                                <span className="text-white">
                                  {mentor.mentor_name}
                                </span>
                                {mentorToAssign.to?.mentor_id ===
                                  mentor.mentor_id && (
                                  <span className="text-green-400">✔</span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {mentorActionMode === "add" && showAddMentorsDropdown && (
                        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 text-xs text-gray-400 uppercase">
                            Available Mentors
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {allmentors
                              ?.filter((m) => {
                                const existingIds = (
                                  program?.mentors || []
                                ).map((pm: any) => pm.mentor_id);
                                return !existingIds.includes(m.mentor_id);
                              })
                              .map((mentor) => {
                                const checked = newMentorsToAdd.some(
                                  (n) => n.mentor_id === mentor.mentor_id
                                );
                                return (
                                  <label
                                    key={mentor.mentor_id}
                                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-800"
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          setNewMentorsToAdd((prev) => {
                                            if (checked)
                                              return prev.filter(
                                                (p) =>
                                                  p.mentor_id !==
                                                  mentor.mentor_id
                                              );
                                            return [...prev, mentor];
                                          });
                                        }}
                                        className="accent-yellow-400"
                                      />
                                      <span className="text-white">
                                        {mentor.mentor_name}
                                      </span>
                                    </div>
                                    {checked && (
                                      <span className="text-green-400">✔</span>
                                    )}
                                  </label>
                                );
                              })}
                          </div>
                          <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setNewMentorsToAdd([]);
                                setShowAddMentorsDropdown(false);
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => {
                                if (newMentorsToAdd.length > 0) {
                                  setDisplayedProgramMentors((prev) => [
                                    ...prev,
                                    ...newMentorsToAdd,
                                  ]);
                                }
                                setNewMentorsToAdd([]);
                                setShowAddMentorsDropdown(false);
                              }}
                            >
                              Add Selected
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {mode === "view" && (
                <div className="mt-8 pt-8 border-t border-gray-700">
                  {/* Filters */}
                  <div>
                    <select
                      // value={selectedMentor}
                      onChange={(e) => filteredMentors(e.target.value)}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 text-white rounded-lg"
                    >
                      <option value="" disabled>
                        Select Mentor
                      </option>

                      {program?.mentors.map((mentor) => (
                        <option
                          key={mentor.mentor_id}
                          value={mentor.mentor_name}
                        >
                          {mentor.mentor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Reschedules Table */}
                  <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                    {loadingReschedules ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
                          <p className="text-gray-400">
                            Loading reschedule data...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left">
                                <button
                                  onClick={() => handleSort("mentor")}
                                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                                >
                                  <span className="text-xs font-medium uppercase tracking-wider">
                                    Mentor
                                  </span>
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Session
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Original Time
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Rescheduled Time
                              </th>
                              <th className="px-4 py-3 text-left">
                                <button
                                  onClick={() => handleSort("reschedules")}
                                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                                >
                                  <span className="text-xs font-medium uppercase tracking-wider">
                                    Count
                                  </span>
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-gray-700">
                            {programMentors.map((reschedule) => {
                              return (
                                <tr
                                  key={reschedule?.class_sessions.id}
                                  className="hover:bg-gray-700/30 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <div className="text-white font-medium">
                                      {reschedule.faculty_name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-gray-300">
                                      {/* Course Code */}
                                      <div className="font-mono text-sm text-yellow-400">
                                        {reschedules?.[0]?.course_code ?? "N/A"}
                                      </div>

                                      {/* Course Name */}
                                      <div className="text-white font-medium">
                                        {reschedules?.[0]?.course_name ?? "N/A"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-gray-300 text-sm">
                                      <div>
                                        {reschedule.class_sessions
                                          ?.session_datetime
                                          ? new Date(
                                              reschedule.class_sessions.session_datetime
                                            ).toLocaleDateString("en-GB")
                                          : "N/A"}
                                      </div>
                                      <div className="text-gray-400">
                                        {reschedule.class_sessions
                                          ?.session_datetime
                                          ? new Date(
                                              reschedule.class_sessions.session_datetime
                                            ).toLocaleTimeString("en-GB", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: false,
                                            })
                                          : ""}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="text-gray-300 text-sm">
                                      <div>
                                        {reschedule.class_sessions
                                          ?.rescheduled_date_time
                                          ? new Date(
                                              reschedule.class_sessions.rescheduled_date_time
                                            ).toLocaleDateString("en-GB")
                                          : "N/A"}
                                      </div>
                                      <div className="text-gray-400">
                                        {reschedule.class_sessions
                                          ?.rescheduled_date_time
                                          ? new Date(
                                              reschedule.class_sessions.rescheduled_date_time
                                            ).toLocaleTimeString("en-GB", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: false,
                                            })
                                          : ""}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        reschedule.class_sessions
                                          .rescheduled_count >= 3
                                          ? "text-red-400 bg-red-400/10"
                                          : reschedule.rescheduleCount >= 2
                                          ? "text-yellow-400 bg-yellow-400/10"
                                          : "text-green-400 bg-green-400/10"
                                      }`}
                                    >
                                      {reschedule.class_sessions
                                        .rescheduled_count || 0}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!loadingReschedules &&
                      filteredReschedules.length === 0 && (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">
                            No reschedules found matching your filters.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {mode !== "view" && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {program ? "Saving..." : "Creating..."}
                      </>
                    ) : program ? (
                      "Save Changes"
                    ) : (
                      "Create Program"
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramModal;
