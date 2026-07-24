import React, { useEffect, useState } from 'react';
import { testService } from "./testService"; 

export default function AdminTestHistory() {
  const [history, setHistory] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Batafsil ko'rish uchun modal state'i
  const [selectedSession, setSelectedSession] = useState(null);

  // Backenddagi @RequestParam nomlariga moslangan filtrlar (camelCase)
  const [filters, setFilters] = useState({
    search: '',
    lessonId: '',
    status: '',
    minScore: '',
    maxScore: '',
    fromDate: '',
    toDate: '',
    page: 0,
    size: 10
  });
  
  // Status xabarlari uchun state'lar
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Darslar ro'yxatini yuklab kelish
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://vocabulary-game.duckdns.org/api/lessons', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setLessons(data.content || data);
        }
      } catch (err) {
        console.error("Darslarni yuklashda xatolik", err);
      }
    };
    fetchLessons();
  }, []);

  // Filtrlar o'zgarganda avtomatik ma'lumotni yuklash
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadHistory();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [
    filters.search, 
    filters.lessonId, 
    filters.status, 
    filters.minScore, 
    filters.maxScore, 
    filters.fromDate, 
    filters.toDate, 
    filters.page
  ]); 

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await testService.getTestHistory(filters);
      setHistory(data.content || data);
    } catch (err) {
      console.error(err);
      showStatus('Ma\'lumotlarni yuklashda xatolik yuz berdi.', true);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 4000);
  };

  // Test tarixini o'chirish funksiyasi
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Haqiqatan ham ushbu test tarixini o'chirmoqchimisiz?")) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://vocabulary-game.duckdns.org/api/tests/history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showStatus('Test tarixi muvaffaqiyatli o\'chirildi');
        loadHistory(); 
      } else {
        const errData = await res.json();
        showStatus(errData.message || 'O\'chirishda xatolik yuz berdi.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Test Tarixi</h1>
          <p className="text-sm text-gray-500">Barcha foydalanuvchilarning test natijalari va kengaytirilgan filtrlar</p>
        </div>
      </div>

      {/* --- FILTRLAR PANELI --- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Qidirish (Dars nomi bo'yicha) */}
        <input
          type="text"
          placeholder="Dars nomi bo'yicha qidirish..."
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 0 })}
        />

        {/* Dars bo'yicha filter (lessonId) */}
        <select
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
          value={filters.lessonId}
          onChange={(e) => setFilters({ ...filters, lessonId: e.target.value, page: 0 })}
        >
          <option value="">📚 Barcha darslar</option>
          {lessons.map((l) => {
            const lessonIdVal = l.lesson_id || l.lessonId || l.id;
            const lessonNameVal = l.lesson_name || l.lessonName || l.title || l.name || `Dars #${lessonIdVal}`;
            return (
              <option key={lessonIdVal} value={lessonIdVal}>
                {lessonNameVal}
              </option>
            );
          })}
        </select>

        {/* Status bo'yicha filter */}
        <select
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 0 })}
        >
          <option value="">🎯 Barcha holatlar</option>
          <option value="COMPLETED">COMPLETED (Tugallangan)</option>
          <option value="IN_PROGRESS">IN_PROGRESS (Jarayonda)</option>
        </select>

        {/* Min ball (minScore) */}
        <input
          type="number"
          placeholder="Min ball"
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
          value={filters.minScore}
          onChange={(e) => setFilters({ ...filters, minScore: e.target.value, page: 0 })}
        />

        {/* Max ball (maxScore) */}
        <input
          type="number"
          placeholder="Max ball"
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
          value={filters.maxScore}
          onChange={(e) => setFilters({ ...filters, maxScore: e.target.value, page: 0 })}
        />

        {/* Boshlanish sanasi (fromDate) */}
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 font-semibold mb-1">Dan (Sana va vaqt):</label>
          <input
            type="datetime-local"
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
            value={filters.fromDate}
            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value, page: 0 })}
          />
        </div>

        {/* Tugash sanasi (toDate) */}
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 font-semibold mb-1">Gacha (Sana va vaqt):</label>
          <input
            type="datetime-local"
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
            value={filters.toDate}
            onChange={(e) => setFilters({ ...filters, toDate: e.target.value, page: 0 })}
          />
        </div>

        {/* Filtrlarni tozalash tugmasi */}
        <div className="flex items-end">
          <button
            onClick={() => setFilters({ search: '', lessonId: '', status: '', minScore: '', maxScore: '', fromDate: '', toDate: '', page: 0, size: 10 })}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition"
          >
            Filtrni tozalash
          </button>
        </div>
      </div>

      {/* Status xabarlari */}
      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-3 ${
          isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <span>{message}</span>
        </div>
      )}

      {/* --- ASOSIY JADVAL --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Foydalanuvchi</th>
              <th className="p-4 font-semibold">Dars Nomi</th>
              <th className="p-4 font-semibold">Natija (To'g'ri / Umumiy)</th>
              <th className="p-4 font-semibold text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400">Yuklanmoqda...</td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400">Ma'lumot topilmadi</td>
              </tr>
            ) : (
              history.map((item) => {
                const firstName = item.first_name || item.firstName || '';
                const lastName = item.last_name || item.lastName || '';
                const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : `User #${item.user_id || item.userId}`;

                const sessionId = item.session_id || item.sessionId || item.id;
                const lessonName = item.lesson_name || item.lessonName || '-';
                const correctAnswers = item.correct_answers ?? item.correctAnswers ?? 0;
                const totalQuestions = item.total_questions ?? item.totalQuestions ?? 0;
                const earnedScore = item.score ?? item.earned_score ?? item.earnedScore ?? 0;

                return (
                  <tr key={sessionId} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-medium text-gray-900">{fullName}</td>
                    <td className="p-4 text-gray-600 font-medium">{lessonName}</td>
                    <td className="p-4 font-bold text-gray-800">
                      <span className="text-green-600">{correctAnswers}</span> / {totalQuestions} 
                      <span className="ml-2 text-xs font-semibold text-[#5B3DF5] bg-[#5B3DF5]/10 px-2 py-0.5 rounded">
                        {earnedScore} ball
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => setSelectedSession(item)}
                        className="text-[#5B3DF5] hover:bg-[#5B3DF5]/10 font-medium text-xs bg-[#5B3DF5]/5 px-3 py-1.5 rounded-lg transition"
                      >
                        Batafsil
                      </button>

                      <button
                        onClick={() => handleDeleteSession(sessionId)}
                        className="text-rose-600 hover:bg-rose-100 font-medium text-xs bg-rose-50 px-3 py-1.5 rounded-lg transition"
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Test Tafsilotlari (Details)</h3>
              <button 
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>Session ID:</strong> {selectedSession.session_id || selectedSession.sessionId}</p>
              <p><strong>Foydalanuvchi:</strong> {(selectedSession.first_name || selectedSession.firstName || '')} {(selectedSession.last_name || selectedSession.lastName || '')}</p>
              <p><strong>Dars:</strong> {selectedSession.lesson_name || selectedSession.lessonName}</p>
              
              <div className="flex gap-4">
                <p><strong>Holati:</strong> <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-600 font-semibold">{selectedSession.status}</span></p>
                <p><strong>Urinish turi:</strong> <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 font-semibold">{selectedSession.attempt_type || selectedSession.attemptType}</span></p>
              </div>

              <p><strong>To'g'ri javoblar:</strong> <span className="text-green-600 font-bold">{selectedSession.correct_answers ?? selectedSession.correctAnswers}</span> / {selectedSession.total_questions ?? selectedSession.totalQuestions}</p>
              <p><strong>To'plangan Ball:</strong> <span className="text-[#5B3DF5] font-bold">{selectedSession.score ?? selectedSession.earned_score ?? selectedSession.earnedScore} ball</span></p>
              
              <div className="border-t pt-3 text-xs text-gray-500 space-y-1">
                <p><strong>Boshlangan vaqt:</strong> {(selectedSession.started_at || selectedSession.startedAt) ? new Date(selectedSession.started_at || selectedSession.startedAt).toLocaleString() : '-'}</p>
                <p><strong>Tugatilgan vaqt:</strong> {(selectedSession.finished_at || selectedSession.finishedAt) ? new Date(selectedSession.finished_at || selectedSession.finishedAt).toLocaleString() : '-'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-[#5B3DF5] text-white rounded-xl text-sm font-semibold hover:bg-[#4c32d4] transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}