import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useApi } from "../../services/api";
import type { MentorAnalytics } from "../../types";




export default function AnalyticsTable({
  onViewAnalytics,
}: {
  onViewAnalytics?: (analytics: {mentor_id: string, start_date: string, end_date: string}) => void;
}) {
  const { adminAnalytics } = useApi();


  const [analyticsData, setAnalyticsData] = useState<MentorAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

 
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);


  const fetchAnalyticsData = async (
    start_date?: string,
    end_date?: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAnalytics.mentorsAnalytics(
        start_date,
        end_date,
        page,
        limit
      );

      if (response?.success && Array.isArray(response.data)) {
        setAnalyticsData(response.data);

        setCurrentPage(response?.pagination?.currentPage);
        setPageSize(response?.pagination?.pageSize);
        setTotalPages(response?.pagination?.totalPages);
        setTotalCount(response?.pagination?.totalCount);
        setHasNextPage(response?.pagination?.hasNextPage);
        setHasPreviousPage(response?.pagination?.hasPreviousPage);
      } else {
        setError("Showing demo data (invalid API response)");
      }
    } catch {
      setError("Unable to fetch analytics.");
    } finally {
      setLoading(false);
    }
  };

  const getPageNumbers = () => {
  const pages: number[] = [];
  const visiblePages = 5;

  let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  let end = start + visiblePages - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - visiblePages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
};

  useEffect(() => {
    fetchAnalyticsData(undefined, undefined, currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    if (startDate > endDate) return;

    setCurrentPage(1);
    fetchAnalyticsData(startDate, endDate, 1, pageSize);
  }, [startDate, endDate]);

  const filteredData = useMemo(() => {
    return analyticsData.filter((mentor) =>
      mentor.mentor_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [analyticsData, search]);

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 h-64 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error && analyticsData.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 h-64 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 overflow-hidden">
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">
            Mentor Analytics
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md"
            />

            <input
              type="text"
              placeholder="Search mentor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-md w-56"
            />
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-yellow-400">{error}</p>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Mentor Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">
                Number of Classes
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800/50">
            {filteredData.map((mentor) => (
              <tr
                key={mentor.mentor_id}
                onClick={() => onViewAnalytics?.({mentor_id:mentor.mentor_id,start_date:startDate,end_date:endDate})}
                className="hover:bg-gray-800/30 cursor-pointer"
              >
                <td className="px-6 py-4 text-white">
                  {mentor.mentor_name}
                </td>
                <td className="px-6 py-4 text-center text-white">
                  {mentor.lecture_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


<div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/50">
  <p className="text-sm text-gray-400">
    Page {currentPage} of {totalPages} ({totalCount} records)
  </p>

  <div className="flex items-center gap-1">
    <button
      disabled={!hasPreviousPage}
      onClick={() => setCurrentPage((p) => p - 1)}
      className={`px-3 py-2 rounded-md text-sm ${
        hasPreviousPage
          ? "bg-gray-800 text-white hover:bg-gray-700"
          : "bg-gray-900 text-gray-500 cursor-not-allowed"
      }`}
    >
      Prev
    </button>

    {getPageNumbers().map((page) => (
      <button
        key={page}
        onClick={() => setCurrentPage(page)}
        className={`px-3 py-2 rounded-md text-sm ${
          page === currentPage
            ? "bg-yellow-500 text-black font-semibold"
            : "bg-gray-800 text-white hover:bg-gray-700"
        }`}
      >
        {page}
      </button>
    ))}
    <button
      disabled={!hasNextPage}
      onClick={() => setCurrentPage((p) => p + 1)}
      className={`px-3 py-2 rounded-md text-sm ${
        hasNextPage
          ? "bg-gray-800 text-white hover:bg-gray-700"
          : "bg-gray-900 text-gray-500 cursor-not-allowed"
      }`}
    >
      Next
    </button>
  </div>
</div>
    </div>
  );
}