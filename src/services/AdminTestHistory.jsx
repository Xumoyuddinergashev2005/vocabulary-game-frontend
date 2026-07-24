import React, { useEffect, useState } from 'react';
import { testService } from "./testService"; 

export default function AdminTestHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', page: 0, size: 10 });

  // Qidiruv yoki status o'zgarganda avtomatik ma'lumotni yuklash
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadHistory();
    }, 300); // Foydalanuvchi yozib bo'lishini 300ms kutib, keyin so'rov yuboradi (serverga yuklama tushmasligi uchun)

    return () => clearTimeout(delayDebounceFn);
  }, [filters.search, filters.status, filters.page]); 

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await testService.getTestHistory(filters);
      setHistory(data.content || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Test Tarixi</h1>
          <p className="text-sm text-gray-500">Barcha foydalanuvchilarning test natijalari</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Qidirish..."
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 0 })}
          />
          <select
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 0 })}
          >
            <option value="">Barcha holatlar</option>
            <option value="COMPLETED">Tugallangan (COMPLETED)</option>
            <option value="IN_PROGRESS">Jarayonda (IN_PROGRESS)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Foydalanuvchi</th>
              <th className="p-4 font-semibold">Dars</th>
              <th className="p-4 font-semibold">Holati & Turi</th>
              <th className="p-4 font-semibold">Natija (To'g'ri / Umumiy)</th>
              <th className="p-4 font-semibold">To'plangan Ball</th>
              <th className="p-4 font-semibold">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">Yuklanmoqda...</td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">Ma'lumot topilmadi</td>
              </tr>
            ) : (
              history.map((item) => {
                const firstName = item.firstName || item.first_name || '';
                const lastName = item.lastName || item.last_name || '';
                const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : `User #${item.userId || item.user_id}`;

                return (
                  <tr key={item.sessionId || item.session_id || item.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-medium text-gray-900">
                      {fullName}
                    </td>
                    <td className="p-4 text-gray-600 font-medium">{item.lessonName || item.lesson_name}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">{item.attemptType || item.attempt_type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      <span className="text-green-600">{item.correctAnswers || item.correct_answers || 0}</span> / {item.totalQuestions || item.total_questions || 0}
                    </td>
                    <td className="p-4 font-bold text-[#5B3DF5]">
                      {item.score || item.earnedScore || item.earned_score || 0} ball
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {item.startedAt || item.started_at ? new Date(item.startedAt || item.started_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}