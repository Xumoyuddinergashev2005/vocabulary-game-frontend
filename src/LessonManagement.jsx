import React, { useState, useEffect } from "react";
import UserTestFlow from "./services/UserTestFlow";

export default function LessonManagement({ setStep }) {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [lessons, setLessons] = useState([]);
  const [activeTestsMap, setActiveTestsMap] = useState({}); // LessonID -> Active Session info
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [showModal, setShowModal] = useState(false); // 'add' | 'edit' | false
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ lesson_name: '', lesson_date: getTodayDate(), description: '' });

  const [activeTestLessonId, setActiveTestLessonId] = useState(null);
  const [selectedLessonDetails, setSelectedLessonDetails] = useState(null);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchAdminLessons();
  }, [searchQuery, page]);

  const fetchAdminLessons = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStep('login');
      return;
    }

    try {
      let url = `https://vocabulary-game.duckdns.org/api/lessons?page=${page}&size=${size}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const lessonList = Array.isArray(data) ? data : data.content || [];
        setLessons(lessonList);
        
        lessonList.forEach(lesson => checkActiveTestSession(lesson.id, token));
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        setStep('login');
      } else {
        setIsError(true);
        setMessage(`Darslarni yuklab bo'lmadi. Kod: ${response.status}`);
      }
    } catch (error) {
      setIsError(true);
      setMessage("Tarmoq xatoligi: Darslarni yuklash imkoni bo'lmadi.");
    }
  };

// Darsning aktiv test sessiyasini tekshirish (snake_case va camelCase'ni birdek qo'llab-quvvatlash uchun)
  const checkActiveTestSession = async (lessonId, token) => {
    try {
      const res = await fetch(`https://vocabulary-game.duckdns.org/api/tests/${lessonId}/active`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const sessionData = await res.json();
        // Backenddan keladigan id va indekslarni ikkala formatda ham tutib olamiz
        const sessionId = sessionData.sessionId || sessionData.session_id || sessionData.id;
        
        if (sessionData && sessionId) {
          const normalizedSession = {
            ...sessionData,
            sessionId: sessionId,
            status: sessionData.status,
            currentQuestionIndex: sessionData.currentQuestionIndex ?? sessionData.current_question_index ?? 0,
            totalQuestions: sessionData.totalQuestions ?? sessionData.total_questions ?? 0
          };
          setActiveTestsMap(prev => ({ ...prev, [lessonId]: normalizedSession }));
        }
      }
    } catch (e) {
      // ignore
    }
  };
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setStep('login');
      return;
    }
    setIsLoading(true);
    setMessage('');

    try {
      const url = showModal === 'add' 
        ? 'https://vocabulary-game.duckdns.org/api/lessons' 
        : `https://vocabulary-game.duckdns.org/api/lessons/${selectedLessonId}`;
      
      const response = await fetch(url, {
        method: showModal === 'add' ? 'POST' : 'PATCH', 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonForm)
      });

      if (response.ok) {
        setMessage(showModal === 'add' ? 'Dars muvaffaqiyatli yaratildi!' : 'Dars muvaffaqiyatli yangilandi!');
        setIsError(false);
        setShowModal(false);
        setLessonForm({ lesson_name: '', lesson_date: getTodayDate(), description: '' });
        fetchAdminLessons();
      } else {
        setIsError(true);
        const errorData = await response.json().catch(() => ({}));
        setMessage(errorData.message || `Saqlashda xatolik yuz berdi.`);
      }
    } catch (error) {
      setIsError(true);
      setMessage("Tarmoq xatoligi: Ma'lumotni saqlab bo'lmadi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Haqiqatan ham bu darsni o'chirib tashlamoqchimisiz?")) return;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`https://vocabulary-game.duckdns.org/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage("Dars muvaffaqiyatli o'chirildi!");
        setIsError(false);
        fetchAdminLessons();
      } else {
        setIsError(true);
        setMessage("Darsni o'chirishda xatolik yuz berdi.");
      }
    } catch (error) {
      setIsError(true);
      setMessage("Tarmoq xatoligi: O'chirish imkoni bo'lmadi.");
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl mb-4 text-sm text-center font-medium max-w-xl mx-auto w-full ${
          isError ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#22C55E]/10 text-[#22C55E]'
        }`}>
          {message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E1B3A]">Lessons Management</h1>
          <p className="text-xs text-[#6B6B6F]">Create, update, delete and view statistics of language lessons</p>
        </div>
        <button onClick={() => { setShowModal('add'); setLessonForm({ lesson_name: '', lesson_date: getTodayDate(), description: '' }); }} className="bg-[#5B3DF5] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#4a32d4] transition w-full sm:w-auto text-center">
          + Add Lesson
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#E8DEFF] w-full sm:max-w-xs">
        <input type="text" placeholder="Search lesson..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-1.5 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]" />
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DEFF] overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[#F8F7FF] text-xs font-bold text-[#6B6B6F] uppercase border-b border-[#E8DEFF]">
              <th className="p-4">ID</th>
              <th className="p-4">Lesson Name</th>
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#E8DEFF]">
            {lessons.length > 0 ? (
              lessons.map((lesson) => {
                const activeSession = activeTestsMap[lesson.id];
                const isContinuing = activeSession && activeSession.status === "IN_PROGRESS";

                return (
                  <tr key={lesson.id} className="hover:bg-[#F8F7FF]/50 transition">
                    <td className="p-4 font-semibold text-gray-500">{lesson.id}</td>
                    <td className="p-4 font-bold text-[#1E1B3A]">{lesson.lesson_name || lesson.lessonName}</td>
                    <td className="p-4 text-xs text-gray-500">{lesson.lesson_date || lesson.lessonDate}</td>
                    <td className="p-4 text-xs max-w-xs truncate text-gray-600">{lesson.description}</td>
                    
                    <td className="p-4 text-center space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedLessonDetails(lesson)} 
                        className="text-xs bg-purple-50 text-[#5B3DF5] px-2 py-1 rounded hover:bg-purple-100 font-medium"
                      >
                        Details
                      </button>

                      {/* DAVOM ETISH YOKI START TEST TUGMASI */}
                      <button 
                        onClick={() => setActiveTestLessonId(lesson.id)} 
                        className={`text-xs px-2.5 py-1 rounded font-medium text-white transition ${
                          isContinuing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isContinuing 
                          ? `Davom etish (${activeSession.currentQuestionIndex}/${activeSession.totalQuestions})` 
                          : 'Start Test'}
                      </button>

                      <button onClick={() => { setSelectedLessonId(lesson.id); setLessonForm({ lesson_name: lesson.lesson_name || lesson.lessonName, lesson_date: lesson.lesson_date || lesson.lessonDate, description: lesson.description }); setShowModal('edit'); }} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100 font-medium">Edit</button>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-medium">Delete</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-sm text-gray-400">No lessons found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT LESSON MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {showModal === 'add' ? 'Yangi dars qo\'shish' : 'Darsni tahrirlash'}
            </h2>
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dars nomi</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                  value={lessonForm.lesson_name}
                  onChange={(e) => setLessonForm({ ...lessonForm, lesson_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sana</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                  value={lessonForm.lesson_date}
                  onChange={(e) => setLessonForm({ ...lessonForm, lesson_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tavsif</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-medium bg-[#5B3DF5] text-white rounded-xl hover:bg-[#4a32d4]"
                >
                  {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL (Qo'shildi) */}
      {selectedLessonDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800">Dars Tafsilotlari</h2>
              <button 
                onClick={() => setSelectedLessonDetails(null)} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Dars ID</span>
                <p className="font-semibold text-gray-800">#{selectedLessonDetails.id}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Dars Nomi</span>
                <p className="font-bold text-[#5B3DF5] text-base">{selectedLessonDetails.lesson_name || selectedLessonDetails.lessonName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Sana</span>
                <p className="text-gray-700">{selectedLessonDetails.lesson_date || selectedLessonDetails.lessonDate}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold">Tavsif</span>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {selectedLessonDetails.description || "Tavsif kiritilmagan."}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLessonDetails(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#5B3DF5] text-white rounded-xl hover:bg-[#4a32d4]"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST MODAL OYNASI */}
      {activeTestLessonId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button onClick={() => { setActiveTestLessonId(null); fetchAdminLessons(); }} className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
            <UserTestFlow lessonId={activeTestLessonId} />
          </div>
        </div>
      )}
    </div>
  );
}