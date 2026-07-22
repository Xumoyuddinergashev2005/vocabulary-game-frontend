import React, { useState, useEffect } from 'react';

export default function VocabularyManagement() {
  const [vocabularies, setVocabularies] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Filterlar va sahifalash
  const [filters, setFilters] = useState({
    search: '',
    lesson_id: '',
    word_type: '',
    word_level: '',
    aspect: ''
  });
  
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVocabId, setSelectedVocabId] = useState(null);

  const [formData, setFormData] = useState({
    russian_word: '',
    uzbek_meaning: '',
    word_type: 'NOUN', 
    aspect: '',
    word_level: '',
    example_sentence: '',
    example_sentence_meaning: '',
    lesson_id: ''
  });

  const token = localStorage.getItem('token');

  const authFetch = async (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  const fetchVocabularies = async () => {
    setLoading(true);
    try {
      let queryParams = `page=${page}&size=${size}`;
      if (filters.search) queryParams += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.lesson_id) queryParams += `&lesson_id=${filters.lesson_id}`;
      if (filters.word_type) queryParams += `&word_type=${filters.word_type}`;
      if (filters.word_level) queryParams += `&word_level=${filters.word_level}`;
      if (filters.aspect) queryParams += `&aspect=${filters.aspect}`;

      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/vocabularies?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setVocabularies(data.content || []);
        const tPages = data.total_pages !== undefined ? data.total_pages : (data.totalPages || 0);
        const tElements = data.total_elements !== undefined ? data.total_elements : (data.totalElements || 0);
        setTotalPages(tPages);
        setTotalElements(tElements);
      } else {
        showStatus('So\'zlarni yuklashda xatolik yuz berdi.', true);
      }
    } catch (err) {
      showStatus('Tarmoq xatoligi.', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const res = await authFetch('https://vocabulary-game.duckdns.org/api/lessons?size=100');
      if (res.ok) {
        const data = await res.json();
        setLessons(data.content || []);
      }
    } catch (err) {
      console.error('Darslarni yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    fetchVocabularies();
  }, [page, filters]);

  useEffect(() => {
    fetchLessons();
  }, []);

  const showStatus = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        russian_word: formData.russian_word?.trim() || null,
        uzbek_meaning: formData.uzbek_meaning?.trim() || null,
        word_type: formData.word_type || 'NOUN',
        aspect: formData.aspect === '' ? null : formData.aspect,
        word_level: formData.word_level === '' ? null : formData.word_level,
        example_sentence: formData.example_sentence?.trim() || null,
        example_sentence_meaning: formData.example_sentence_meaning?.trim() || null,
        lesson_id: formData.lesson_id && !isNaN(formData.lesson_id) ? parseInt(formData.lesson_id, 10) : null
      };

      const cleanPayload = {};
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== '') {
          cleanPayload[key] = payload[key];
        }
      });

      const res = await authFetch('https://vocabulary-game.duckdns.org/api/vocabularies', {
        method: 'POST',
        body: JSON.stringify(cleanPayload)
      });
      
      if (res.ok) {
        showStatus('So\'z muvaffaqiyatli qo\'shildi!');
        setShowCreateModal(false);
        resetForm();
        fetchVocabularies();
      } else {
        showStatus('Xatolik yuz berdi. Ma\'lumotlarni tekshiring.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const patchData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          patchData[key] = key === 'lesson_id' ? (isNaN(formData[key]) ? null : parseInt(formData[key], 10)) : formData[key];
        }
      });

      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/vocabularies/${selectedVocabId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchData)
      });
      
      if (res.ok) {
        showStatus('So\'z muvaffaqiyatli yangilandi!');
        setShowEditModal(false);
        resetForm();
        fetchVocabularies();
      } else {
        showStatus('Yangilashda xatolik yuz berdi.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Haqiqatan ham ushbu so'zni o'chirmoqchimisiz?")) return;
    try {
      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/vocabularies/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showStatus('So\'z o\'chirib tashlandi.');
        fetchVocabularies();
      } else {
        showStatus('O\'chirishda xatolik.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  const resetForm = () => {
    setFormData({
      russian_word: '',
      uzbek_meaning: '',
      word_type: 'NOUN',
      aspect: '',
      word_level: '',
      example_sentence: '',
      example_sentence_meaning: '',
      lesson_id: ''
    });
    setSelectedVocabId(null);
  };

  const openEditModal = (vocab) => {
    setSelectedVocabId(vocab.id);
    setFormData({
      russian_word: vocab.russian_word || '',
      uzbek_meaning: vocab.uzbek_meaning || '',
      word_type: vocab.word_type || 'NOUN',
      aspect: vocab.aspect || '',
      word_level: vocab.word_level || '',
      example_sentence: vocab.example_sentence || '',
      example_sentence_meaning: vocab.example_sentence_meaning || '',
      lesson_id: vocab.lesson_id || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-indigo-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header qismi */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Vocabulary Management</h1>
            <p className="text-sm text-gray-500 mt-1">Rus tili o'quv bazasidagi so'zlarni boshqarish va tahrirlash paneli</p>
          </div>
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Yangi so'z qo'shish
          </button>
        </div>

        {/* Status xabarlari */}
        {message && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-3 ${
            isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            <span>{message}</span>
          </div>
        )}

        {/* Filterlar Bo'limi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Qidirish</label>
            <input 
              type="text" 
              placeholder="Ruscha / O'zbekcha..." 
              value={filters.search}
              onChange={(e) => { setPage(0); setFilters({...filters, search: e.target.value}); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Darslar</label>
            <select 
              value={filters.lesson_id} 
              onChange={(e) => { setPage(0); setFilters({...filters, lesson_id: e.target.value}); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Barcha darslar</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.lesson_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">So'z Turi</label>
            <select 
              value={filters.word_type} 
              onChange={(e) => { setPage(0); setFilters({...filters, word_type: e.target.value}); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Barcha turlar</option>
              <option value="NOUN">NOUN (Ot)</option>
              <option value="VERB">VERB (Fe'l)</option>
              <option value="ADJECTIVE">ADJECTIVE (Sifat)</option>
              <option value="ADVERB">ADVERB (Ravish)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Daraja (Level)</label>
            <select 
              value={filters.word_level} 
              onChange={(e) => { setPage(0); setFilters({...filters, word_level: e.target.value}); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Barcha darajalar</option>
              <option value="A1">A1</option><option value="A2">A2</option>
              <option value="B1">B1</option><option value="B2">B2</option>
              <option value="C1">C1</option><option value="C2">C2</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Aspect</label>
            <select 
              value={filters.aspect} 
              onChange={(e) => { setPage(0); setFilters({...filters, aspect: e.target.value}); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Barcha aspectlar</option>
              <option value="PERFECTIVE">PERFECTIVE</option>
              <option value="IMPERFECTIVE">IMPERFECTIVE</option>
            </select>
          </div>
        </div>

        {/* So'zlar jadvali */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-indigo-600 font-medium gap-2">
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              
              </svg>
              Ma'lumotlar yuklanmoqda...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                      <th className="p-4 font-semibold">Ruscha so'z</th>
                      <th className="p-4 font-semibold">O'zbekcha ma'nosi</th>
                      <th className="p-4 font-semibold">Turi / Darajasi</th>
                      <th className="p-4 font-semibold">Dars nomi</th>
                      <th className="p-4 font-semibold">Misol gap</th>
                      <th className="p-4 font-semibold text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {vocabularies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">Hech qanday so'z topilmadi.</td>
                      </tr>
                    ) : vocabularies.map((vocab) => (
                      <tr key={vocab.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="p-4 font-semibold text-gray-900">{vocab.russian_word}</td>
                        <td className="p-4 text-gray-600">{vocab.uzbek_meaning}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">{vocab.word_type}</span>
                            {vocab.word_level && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">{vocab.word_level}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 font-medium">{vocab.lesson_name || vocab.lessonName || '-'}</td>
                        <td className="p-4 max-w-xs truncate text-gray-500" title={vocab.example_sentence}>{vocab.example_sentence || '-'}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => openEditModal(vocab)} className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">Tahrirlash</button>
                            <button onClick={() => handleDelete(vocab.id)} className="text-rose-600 hover:text-rose-900 font-semibold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition">O'chirish</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginatsiya paneli */}
              <div className="p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center border-t border-gray-100 bg-gray-50/50 gap-4">
                <div className="text-xs text-gray-500 font-medium">
                  Jami topilgan elementlar: <span className="font-bold text-gray-800">{totalElements}</span> ta
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    disabled={page === 0} 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Orqaga
                  </button>
                  
                  <span className="text-xs text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl font-bold shadow-sm">
                    {page + 1} / {totalPages || 1}
                  </span>
                  
                  <button 
                    type="button"
                    disabled={totalPages <= 1 || page >= totalPages - 1} 
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Oldinga
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* YANGI QO'SHISH MODALI */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Yangi Lug'at Qo'shish</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Ruscha so'z *</label>
                <input type="text" required value={formData.russian_word} onChange={(e)=>setFormData({...formData, russian_word: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">O'zbekcha ma'nosi *</label>
                <input type="text" required value={formData.uzbek_meaning} onChange={(e)=>setFormData({...formData, uzbek_meaning: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Word Type *</label>
                  <select required value={formData.word_type} onChange={(e)=>setFormData({...formData, word_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="NOUN">NOUN</option><option value="VERB">VERB</option>
                    <option value="ADJECTIVE">ADJECTIVE</option><option value="ADVERB">ADVERB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Darsni tanlang *</label>
                  <select required value={formData.lesson_id} onChange={(e)=>setFormData({...formData, lesson_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="">-- Darsni tanlang --</option>
                    {lessons.map(l => <option key={l.id} value={l.id}>{l.lesson_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Word Level</label>
                  <select value={formData.word_level} onChange={(e)=>setFormData({...formData, word_level: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="">Tanlanmagan</option>
                    <option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option>
                    <option value="B2">B2</option><option value="C1">C1</option><option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Aspect</label>
                  <select value={formData.aspect} onChange={(e)=>setFormData({...formData, aspect: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="">Tanlanmagan</option>
                    <option value="PERFECTIVE">PERFECTIVE</option><option value="IMPERFECTIVE">IMPERFECTIVE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Misol gap (Ruscha)</label>
                <textarea rows="2" value={formData.example_sentence} onChange={(e)=>setFormData({...formData, example_sentence: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Misol gap tarjimasi (O'zbekcha)</label>
                <textarea rows="2" value={formData.example_sentence_meaning} onChange={(e)=>setFormData({...formData, example_sentence_meaning: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 transition">Bekor qilish</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAHRIRLASH MODALI */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">So'zni Tahrirlash</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Ruscha so'z</label>
                <input type="text" value={formData.russian_word} onChange={(e)=>setFormData({...formData, russian_word: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">O'zbekcha ma'nosi</label>
                <input type="text" value={formData.uzbek_meaning} onChange={(e)=>setFormData({...formData, uzbek_meaning: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Word Type</label>
                  <select value={formData.word_type} onChange={(e)=>setFormData({...formData, word_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="NOUN">NOUN</option><option value="VERB">VERB</option>
                    <option value="ADJECTIVE">ADJECTIVE</option><option value="ADVERB">ADVERB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Darsni o'zgartirish</label>
                  <select value={formData.lesson_id} onChange={(e)=>setFormData({...formData, lesson_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="">-- Darsni tanlang --</option>
                    {lessons.map(l => <option key={l.id} value={l.id}>{l.lesson_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Word Level</label>
                  <select value={formData.word_level} onChange={(e)=>setFormData({...formData, word_level: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="">Tanlanmagan</option>
                    <option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option>
                    <option value="B2">B2</option><option type="C1">C1</option><option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Aspect</label>
                  <select value={formData.aspect} onChange={(e)=>setFormData({...formData, aspect: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition">
                    <option value="">Tanlanmagan</option>
                    <option value="PERFECTIVE">PERFECTIVE</option><option value="IMPERFECTIVE">IMPERFECTIVE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Misol gap (Ruscha)</label>
                <textarea rows="2" value={formData.example_sentence} onChange={(e)=>setFormData({...formData, example_sentence: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase sm:mb-1">Misol gap tarjimasi (O'zbekcha)</label>
                <textarea rows="2" value={formData.example_sentence_meaning} onChange={(e)=>setFormData({...formData, example_sentence_meaning: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"/>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 transition">Bekor qilish</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition">O'zgarishlarni saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}