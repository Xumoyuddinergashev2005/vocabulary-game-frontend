import React, { useState, useEffect } from 'react';
import { Alert } from '@mui/material';

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
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modallar statelari
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [selectedVocabId, setSelectedVocabId] = useState(null);
  const [selectedVocab, setSelectedVocab] = useState(null); // Details uchun

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

  const authFetch = async (url, options = {}) => {
    const currentToken = localStorage.getItem('token');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
        ...options.headers,
      },
    });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0);
      setFilters(prev => ({ ...prev, search: searchQuery }));
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

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
      document.getElementById('main-container')?.scrollTo({ top: 0, behavior: 'smooth' });
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
    setTimeout(() => setMessage(''), 6000); 
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

      const res = await authFetch('https://vocabulary-game.duckdns.org/api/vocabularies', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showStatus('So\'z muvaffaqiyatli qo\'shildi!');
        setShowCreateModal(false);
        resetForm();
        fetchVocabularies();
      } else {
        const errData = await res.json().catch(() => ({}));
        showStatus(errData.message || 'Xatolik yuz berdi. Ma\'lumotlarni tekshiring.', true);
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
        if (key === 'lesson_id') {
          patchData[key] = formData[key] && !isNaN(formData[key]) ? parseInt(formData[key], 10) : null;
        } else {
          patchData[key] = formData[key] === '' ? null : formData[key];
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
        const errData = await res.json().catch(() => ({}));
        showStatus(errData.message || 'Yangilashda xatolik yuz berdi.', true);
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
        showStatus('So\'z muvaffaqiyatli o\'chirib tashlandi.');
        fetchVocabularies();
      } else {
        const errData = await res.json().catch(() => ({}));
        showStatus(errData.message || 'O\'chirishda xatolik yuz berdi.', true);
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
      lesson_id: vocab.lesson_id || vocab.lesson?.id || '' 
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (vocab) => {
    setSelectedVocab(vocab);
    setShowDetailsModal(true);
  };

  return (
    <div id="main-container" className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-indigo-50 p-4 sm:p-8 font-sans overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Vocabulary Management</h1>
            <p className="text-sm text-gray-500 mt-1">Ixchamlashtirilgan o'quv bazasi va so'zlar nazorati</p>
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

        {/* Status Alert */}
        {message && (
          <Alert 
            severity={isError ? "error" : "success"} 
            onClose={() => setMessage('')}
            className="mb-6 shadow-sm animate-fadeIn"
            sx={{ borderRadius: '12px', fontWeight: 500 }}
          >
            {message}
          </Alert>
        )}

        {/* Filterlar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Qidirish</label>
            <input 
              type="text" 
              placeholder="Ruscha / O'zbekcha..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Ixchamlashtirilgan Jadval */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-indigo-600 font-medium gap-2">
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Yuklanmoqda...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50/75 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                      <th className="p-4 font-semibold">Ruscha so'z</th>
                      <th className="p-4 font-semibold">O'zbekcha ma'nosi</th>
                      <th className="p-4 font-semibold">Dars nomi</th>
                      <th className="p-4 font-semibold text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {vocabularies.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-gray-400 font-medium">Hech qanday so'z topilmadi.</td>
                      </tr>
                    ) : vocabularies.map((vocab) => (
                      <tr key={vocab.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="p-4 font-bold text-gray-900 whitespace-nowrap text-base">{vocab.russian_word}</td>
                        <td className="p-4 text-gray-600 font-medium whitespace-nowrap">{vocab.uzbek_meaning}</td>
                        <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                          {vocab.lesson_name || vocab.lesson?.lesson_name || vocab.lessonName || '-'}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openDetailsModal(vocab)} className="text-emerald-600 hover:text-emerald-900 font-semibold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">Batafsil</button>
                            <button onClick={() => openEditModal(vocab)} className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">Tahrirlash</button>
                            <button onClick={() => handleDelete(vocab.id)} className="text-rose-600 hover:text-rose-900 font-semibold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition">O'chirish</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sahifalash */}
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

      {/* SO'Z TAFSILOTLARI MODALI (DETAILS MODAL) */}
      {showDetailsModal && selectedVocab && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wide">Lug'at kartasi</span>
                <h3 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">{selectedVocab.russian_word}</h3>
                <p className="text-sm text-gray-500 mt-0.5">Tarjimasi: <span className="text-gray-800 font-medium">{selectedVocab.uzbek_meaning}</span></p>
              </div>
              <button 
                onClick={() => { setShowDetailsModal(false); setSelectedVocab(null); }} 
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-5">
              
              {/* Grammatika va Joylashuv metrikalari */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">So'z turi</h4>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedVocab.word_type || 'Kiritilmagan'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dars nomi</h4>
                  <p className="text-sm font-semibold text-indigo-600 mt-0.5 truncate">
                    {selectedVocab.lesson_name || selectedVocab.lesson?.lesson_name || selectedVocab.lessonName || '-'}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-200/60">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Darajasi (Level)</h4>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {selectedVocab.word_level ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-xs font-bold">{selectedVocab.word_level}</span>
                    ) : 'Tanlanmagan'}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-200/60">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aspekt</h4>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {selectedVocab.aspect ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-xs font-bold">{selectedVocab.aspect}</span>
                    ) : 'Tanlanmagan'}
                  </p>
                </div>
              </div>

              {/* Misol Gap Bo'limi */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Kontekstdagi misol gaplar:
                </h4>
                
                <div className="bg-gradient-to-r from-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-indigo-100/40 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Rus tilida:</span>
                    <p className="text-base font-semibold text-slate-900 leading-relaxed mt-0.5">
                      {selectedVocab.example_sentence || "Misol gap kiritilmagan."}
                    </p>
                  </div>
                  {selectedVocab.example_sentence_meaning && (
                    <div className="pt-2.5 border-t border-indigo-100/60">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">O'zbekcha tarjimasi:</span>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed mt-0.5">
                        {selectedVocab.example_sentence_meaning}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Yopish Tugmasi */}
            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => { setShowDetailsModal(false); setSelectedVocab(null); }} 
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-md transition active:scale-95 text-center"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YANGI QO'SHISH MODALI */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Yangi Lug'at Qo'shish</h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
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
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 transition">Bekor qilish</button>
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
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Darsni o'zgartirish *</label>
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
                <button type="button" onClick={() => { setShowEditModal(false); resetForm(); }} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 transition">Bekor qilish</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}