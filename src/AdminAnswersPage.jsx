import React, { useEffect, useState } from 'react';
import { testService } from './services/testService';

export default function AdminAnswersPage() {
    const [answers, setAnswers] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [filterUserId, setFilterUserId] = useState('');
    const [filterLessonId, setFilterLessonId] = useState('');
    const [filterIsCorrect, setFilterIsCorrect] = useState('');
    const [selectedDetail, setSelectedDetail] = useState(null);

    useEffect(() => {
        const fetchMetaData = async () => {
            try {
                const lessonsData = await testService.getLessons();
                setLessons(Array.isArray(lessonsData) ? lessonsData : (lessonsData.content || []));

                const usersData = await testService.getUsersList();
                setUsers(Array.isArray(usersData) ? usersData : (usersData.content || []));
            } catch (err) {
                console.error("Ma'lumotlarni yuklashda xatolik:", err);
            }
        };
        fetchMetaData();
    }, []);

    const fetchAdminAnswers = async () => {
        try {
            const data = await testService.getAdminUserAnswers({
                userId: filterUserId || null,
                lessonId: filterLessonId || null,
                isCorrect: filterIsCorrect === '' ? null : filterIsCorrect,
                page: page,
                size: 10
            });
            setAnswers(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error("Admin ma'lumotlarini olishda xatolik:", error);
        }
    };

    useEffect(() => {
        fetchAdminAnswers();
    }, [page, filterUserId, filterLessonId, filterIsCorrect]);

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#1E1B3A]">Admin Panel: Foydalanuvchilar javoblari</h1>
                <p className="text-xs text-[#6B6B6F]">Foydalanuvchilar va darslar bo'yicha test natijalari</p>
            </div>
            
            {/* Filterlar */}
            <div className="bg-white p-3 md:p-4 rounded-2xl border border-[#E8DEFF] shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                <select 
                    value={filterUserId}
                    onChange={(e) => { setFilterUserId(e.target.value); setPage(0); }}
                    className="px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm w-full sm:w-60 focus:outline-none focus:border-[#5B3DF5] bg-white text-[#1E1B3A]"
                >
                    <option value="">👤 Barcha foydalanuvchilar</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.firstName || u.first_name ? `${u.firstName || u.first_name} ${u.lastName || u.last_name || ''}` : u.email || `User #${u.id}`}
                        </option>
                    ))}
                </select>

          <select 
    value={filterLessonId}
    onChange={(e) => { setFilterLessonId(e.target.value); setPage(0); }}
    className="px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm w-full sm:w-60 focus:outline-none focus:border-[#5B3DF5] bg-white text-[#1E1B3A]"
>
    <option value="">📚 Barcha darslar</option>
    {lessons.map((lesson) => {
        const lessonTitle = lesson.name || lesson.title || lesson.lessonName || lesson.lesson_name || `Dars #${lesson.id}`;
        return (
            <option key={lesson.id} value={lesson.id} className="text-[#1E1B3A] bg-white">
                {lessonTitle}
            </option>
        );
    })}
</select>

                <select 
                    value={filterIsCorrect}
                    onChange={(e) => { setFilterIsCorrect(e.target.value); setPage(0); }}
                    className="px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm w-full sm:w-48 focus:outline-none focus:border-[#5B3DF5] bg-white text-[#1E1B3A]"
                >
                    <option value="">🎯 Barcha holatlar</option>
                    <option value="true">To'g'ri</option>
                    <option value="false">Xato</option>
                </select>
            </div>

            {/* Jadval */}
            <div className="bg-white rounded-2xl border border-[#E8DEFF] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F8F7FF] text-[#6B6B6F] text-xs uppercase tracking-wider border-b border-[#E8DEFF]">
                                <th className="p-3 md:p-4 font-semibold">ID</th>
                                <th className="p-3 md:p-4 font-semibold">Dars nomi</th>
                                <th className="p-3 md:p-4 font-semibold text-center">Natija</th>
                                <th className="p-3 md:p-4 font-semibold text-right">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8DEFF] text-sm text-[#1E1B3A]">
                            {answers.length > 0 ? (
                                answers.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#F8F7FF]/50 transition">
                                        <td className="p-3 md:p-4 font-medium">#{item.id}</td>
                                        <td className="p-3 md:p-4">{item.lessonName || item.lesson_name}</td>
                                        <td className="p-3 md:p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                (item.isCorrect ?? item.is_correct) ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                                            }`}>
                                                {(item.isCorrect ?? item.is_correct) ? "To'g'ri" : "Xato"}
                                            </span>
                                        </td>
                                        <td className="p-3 md:p-4 text-right">
                                            <button 
                                                onClick={() => setSelectedDetail(item)}
                                                className="px-3 py-1.5 bg-[#5B3DF5]/10 text-[#5B3DF5] hover:bg-[#5B3DF5] hover:text-white rounded-lg text-xs font-semibold transition"
                                            >
                                                Batafsil
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-gray-400 text-sm">Ma'lumot topilmadi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-3 md:p-4 border-t border-[#E8DEFF] flex justify-between items-center bg-[#F8F7FF]">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(p - 1, 0))}
                            className="px-3 md:px-4 py-2 bg-white border border-[#E8DEFF] rounded-lg text-xs md:text-sm font-semibold text-[#1E1B3A] disabled:opacity-40"
                        >
                            Oldingi
                        </button>
                        <span className="text-xs text-[#6B6B6F]">Sahifa {page + 1} / {totalPages}</span>
                        <button 
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 md:px-4 py-2 bg-[#5B3DF5] text-white rounded-lg text-xs md:text-sm font-semibold disabled:opacity-40"
                        >
                            Keyingi
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-[#E8DEFF]">
                        <div className="flex justify-between items-center border-b border-[#E8DEFF] pb-3">
                            <h3 className="font-bold text-lg text-[#1E1B3A]">Javob tafsilotlari #{selectedDetail.id}</h3>
                            <button onClick={() => setSelectedDetail(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
                        </div>
                        <div className="space-y-3 text-sm text-[#1E1B3A]">
                            <div>
                                <span className="text-xs text-[#6B6B6F] block">Dars nomi:</span>
                                <span className="font-medium">{selectedDetail.lessonName || selectedDetail.lesson_name}</span>
                            </div>
                            <div>
                                <span className="text-xs text-[#6B6B6F] block">Savol turi:</span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-700 inline-block mt-1">
                                    {selectedDetail.questionType || selectedDetail.question_type}
                                </span>
                            </div>
                            <div className="bg-[#F8F7FF] p-3 rounded-xl border border-[#E8DEFF] space-y-2">
                                <div>
                                    <span className="text-xs text-[#6B6B6F] block">To'g'ri so'z (RU / UZ):</span>
                                    <span className="font-semibold text-emerald-600">{selectedDetail.correctRussianWord || selectedDetail.correct_russian_word}</span>
                                    <span className="text-xs text-gray-500 block">{selectedDetail.correctUzbekMeaning || selectedDetail.correct_uzbek_meaning}</span>
                                </div>
                                <hr className="border-[#E8DEFF]" />
                                <div>
                                    <span className="text-xs text-[#6B6B6F] block">Tanlov (RU / UZ):</span>
                                    <span className="font-semibold text-[#1E1B3A]">{selectedDetail.selectedRussianWord || selectedDetail.selected_russian_word || '—'}</span>
                                    <span className="text-xs text-gray-500 block">{selectedDetail.selectedUzbekMeaning || selectedDetail.selected_uzbek_meaning || '—'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-[#6B6B6F] block">Natija:</span>
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${
                                    (selectedDetail.isCorrect ?? selectedDetail.is_correct) ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                                }`}>
                                    {(selectedDetail.isCorrect ?? selectedDetail.is_correct) ? "To'g'ri" : "Xato"}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetail(null)} className="w-full py-2.5 bg-[#5B3DF5] text-white rounded-xl text-sm font-semibold hover:bg-[#4a2fe0] transition">
                            Yopish
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}