import React, { useState, useEffect } from 'react';
import VocabularyManagement from './VocabularyManagement';

export default function App() {
  // Sahifalar: 'register', 'verify', 'login', 'forgot', 'new-password', 'dashboard'
  const [step, setStep] = useState('register'); 
  // Admin ichidagi bo'limlar: 'dashboard', 'lessons', 'words', 'users'
  const [adminTab, setAdminTab] = useState('lessons');

  // Auth Input statelari
  const [registerData, setRegisterData] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [verifyData, setVerifyData] = useState({ email: '', code: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [forgotData, setForgotData] = useState({ first_name: '', email: '' });
  const [resetData, setResetData] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });

  // --- ADMIN LESSONS STATES ---
  const [lessons, setLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  
  // Dars qo'shish va tahrirlash uchun modal/forma state
  const [showModal, setShowModal] = useState(false); // 'add' yoki 'edit'
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ lesson_name: '', lesson_date: '2026-07-22', description: '' });
  
  // Dars statistikasi uchun state
  const [activeStats, setActiveStats] = useState(null);

  // Umumiy xabarlar uchun
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // --- EFFECT: FAQAT DASHBOARD VA TOKEN BORLIGIDA INITIALLIZE QILISH ---
  useEffect(() => {
    if (step === 'dashboard' && adminTab === 'lessons') {
      fetchAdminLessons();
    }
  }, [step, adminTab, searchQuery, page]);

  // 1. GET ALL LESSONS
  const fetchAdminLessons = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

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
        setLessons(Array.isArray(data) ? data : data.content || []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        setStep('login');
      }
    } catch (error) {
      console.error("Darslarni yuklashda xatolik:", error);
    }
  };

  // 2. CREATE OR UPDATE LESSON
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setIsError(true);
      setMessage('Session expired. Please login again.');
      setStep('login');
      return;
    }
    setIsLoading(true);

    try {
      let response;
      if (showModal === 'add') {
        response = await fetch('https://vocabulary-game.duckdns.org/api/lessons', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(lessonForm)
        });
      } else {
        response = await fetch(`https://vocabulary-game.duckdns.org/api/lessons?lessonId=${selectedLessonId}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(lessonForm)
        });
      }

      if (response.ok) {
        setMessage(showModal === 'add' ? 'Lesson created successfully!' : 'Lesson updated successfully!');
        setIsError(false);
        setShowModal(false);
        setLessonForm({ lesson_name: '', lesson_date: '2026-07-22', description: '' });
        fetchAdminLessons();
      } else {
        setIsError(true);
        setMessage('Failed to save lesson. Code: ' + response.status);
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. DELETE LESSON
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`https://vocabulary-game.duckdns.org/api/lessons?lessonId=${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMessage('Lesson deleted successfully!');
        setIsError(false);
        fetchAdminLessons();
      } else {
        setIsError(true);
        setMessage('Failed to delete lesson.');
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network error.');
    }
  };

  // 4. GET LESSON STATS
  const fetchLessonStats = async (lessonId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://vocabulary-game.duckdns.org/api/lessons/stats?lessonId=${lessonId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const statsData = await response.json();
        setActiveStats(statsData);
      }
    } catch (error) {
      console.error("Statistika yuklanmadi", error);
    }
  };

  // Auth Handlers
  const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  const handleVerifyChange = (e) => setVerifyData({ ...verifyData, [e.target.name]: e.target.value });
  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleForgotChange = (e) => setForgotData({ ...forgotData, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetData({ ...resetData, [e.target.name]: e.target.value });

  // Auth Submits
  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true); setMessage(''); setIsError(false);
    try {
      const response = await fetch('https://vocabulary-game.duckdns.org/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      if (response.ok) { setVerifyData({ ...verifyData, email: registerData.email }); setStep('verify'); } 
      else { setIsError(true); setMessage('Registration failed.'); }
    } catch (error) { setIsError(true); setMessage('Network error.'); } finally { setIsLoading(false); }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault(); setIsLoading(true); setMessage(''); setIsError(false);
    try {
      const response = await fetch('https://vocabulary-game.duckdns.org/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyData.email, code: parseInt(verifyData.code) })
      });
      if (response.ok) { setLoginData({ ...loginData, email: verifyData.email }); setStep('login'); }
      else { setIsError(true); setMessage('Invalid code.'); }
    } catch (error) { setIsError(true); setMessage('Network error.'); } finally { setIsLoading(false); }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true); setMessage(''); setIsError(false);
    try {
      const response = await fetch('https://vocabulary-game.duckdns.org/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (response.ok) {
        const data = await response.json();
        const token = data.access_token || data.token || data.accessToken;

        if (token) {
          localStorage.setItem('token', token);
          if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
          setStep('dashboard');
        } else {
          setIsError(true); 
          setMessage('Token field not found in response.');
        }
      } else { setIsError(true); setMessage('Invalid email or password.'); }
    } catch (error) { setIsError(true); setMessage('Network error.'); } finally { setIsLoading(false); }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true); setMessage(''); setIsError(false);
    try {
      const response = await fetch('https://vocabulary-game.duckdns.org/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotData)
      });
      if (response.ok) { setResetData({ ...resetData, email: forgotData.email }); setStep('new-password'); }
      else { setIsError(true); setMessage('User not found.'); }
    } catch (error) { setIsError(true); setMessage('Network error.'); } finally { setIsLoading(false); }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault(); if (resetData.newPassword !== resetData.confirmPassword) { setIsError(true); setMessage('Passwords do not match.'); return; }
    setIsLoading(true); setMessage(''); setIsError(false);
    try {
      const response = await fetch('https://vocabulary-game.duckdns.org/api/auth/reset-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetData.email, code: parseInt(resetData.code), newPassword: resetData.newPassword })
      });
      if (response.ok) setStep('login'); else { setIsError(true); setMessage('Reset failed.'); }
    } catch (error) { setIsError(true); setMessage('Network error.'); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex font-sans antialiased text-[#1E1B3A]">
      
      {/* SIDEBAR */}
      {step === 'dashboard' && (
        <aside className="w-64 bg-[#5B3DF5] text-white flex flex-col justify-between p-6 shrink-0">
          <div className="space-y-8">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎮</span>
              <span className="text-xl font-bold tracking-wide">Vocab Test</span>
            </div>

            <nav className="space-y-6">
              <div>
                <span className="text-xs uppercase text-[#E8DEFF]/60 font-semibold block mb-2">Admin Panel</span>
                <ul className="space-y-2 text-sm">
                  <li onClick={() => setAdminTab('dashboard')} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'dashboard' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>📊</span> <span>Dashboard</span></li>
                  <li onClick={() => setAdminTab('lessons')} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'lessons' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>📚</span> <span>Lessons Management</span></li>
                  <li onClick={() => setAdminTab('words')} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'words' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>🔤</span> <span>Vocabulary Words</span></li>
                </ul>
              </div>
            </nav>
          </div>
          
          <button onClick={() => { localStorage.removeItem('token'); setStep('login'); }} className="flex items-center space-x-3 p-2 rounded-lg text-red-200 hover:bg-white/5 text-sm">
            <span>🚪</span> <span>Logout</span>
          </button>
        </aside>
      )}

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        
        {message && (
          <div className={`p-3 rounded-xl mb-4 text-sm text-center font-medium max-w-xl mx-auto w-full ${
            isError ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#22C55E]/10 text-[#22C55E]'
          }`}>
            {message}
          </div>
        )}

        {/* --- AUTH SCREENS --- */}
        {step !== 'dashboard' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E8DEFF] w-full max-w-md">
              {step === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
                  <input type="text" name="first_name" onChange={handleRegisterChange} placeholder="First Name" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <input type="text" name="last_name" onChange={handleRegisterChange} placeholder="Last Name" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <input type="email" name="email" onChange={handleRegisterChange} placeholder="Email" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <input type="password" name="password" onChange={handleRegisterChange} placeholder="Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg">Register</button>
                  <p className="text-xs text-center mt-2">Already account? <span onClick={() => setStep('login')} className="text-[#5B3DF5] cursor-pointer">Login</span></p>
                </form>
              )}

              {step === 'verify' && (
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Verify Email</h2>
                  <input type="number" name="code" onChange={handleVerifyChange} placeholder="Code" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-center font-bold" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg">Verify</button>
                </form>
              )}

              {step === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
                  <input type="email" name="email" onChange={handleLoginChange} placeholder="Email" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <div className="relative">
                    <input type="password" name="password" onChange={handleLoginChange} placeholder="Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                    <span onClick={() => setStep('forgot')} className="text-xs text-[#5B3DF5] cursor-pointer block text-right mt-1">Forgot?</span>
                  </div>
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg">Login</button>
                  <p className="text-xs text-center mt-2">No account? <span onClick={() => setStep('register')} className="text-[#5B3DF5] cursor-pointer">Register</span></p>
                </form>
              )}

              {step === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>
                  <input type="text" name="first_name" onChange={handleForgotChange} placeholder="First Name" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <input type="email" name="email" onChange={handleForgotChange} placeholder="Email" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg">Send Code</button>
                </form>
              )}

              {step === 'new-password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">New Password</h2>
                  <input type="number" name="code" onChange={handleResetChange} placeholder="OTP Code" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-center" required />
                  <input type="password" name="newPassword" onChange={handleResetChange} placeholder="New Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <input type="password" name="confirmPassword" onChange={handleResetChange} placeholder="Confirm Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg">Reset Password</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* --- ADMIN DASHBOARD PANEL: LESSONS --- */}
        {step === 'dashboard' && adminTab === 'lessons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-[#1E1B3A]">Lessons Management</h1>
                <p className="text-xs text-[#6B6B6F]">Create, update, delete and view statistics of language lessons</p>
              </div>
              <button onClick={() => { setShowModal('add'); setLessonForm({ lesson_name: '', lesson_date: '2026-07-22', description: '' }); }} className="bg-[#5B3DF5] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#4a32d4] transition">
                + Add Lesson
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8DEFF] max-w-xs">
              <input type="text" placeholder="Search lesson..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-1.5 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]" />
            </div>

            <div className="bg-white rounded-2xl border border-[#E8DEFF] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
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
                    lessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-[#F8F7FF]/50 transition">
                        <td className="p-4 font-semibold text-gray-500">{lesson.id}</td>
                        <td className="p-4 font-bold text-[#1E1B3A]">{lesson.lesson_name}</td>
                        <td className="p-4 text-xs text-gray-500">{lesson.lesson_date}</td>
                        <td className="p-4 text-xs max-w-xs truncate text-gray-600">{lesson.description}</td>
                        <td className="p-4 text-center space-x-2">
                          <button onClick={() => { fetchLessonStats(lesson.id); }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Stats</button>
                          <button onClick={() => { setSelectedLessonId(lesson.id); setLessonForm({ lesson_name: lesson.lesson_name, lesson_date: lesson.lesson_date, description: lesson.description }); setShowModal('edit'); }} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100">Edit</button>
                          <button onClick={() => handleDeleteLesson(lesson.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-sm text-gray-400">No lessons found. Add your first lesson!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex space-x-2 justify-end">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-white border border-[#E8DEFF] rounded-lg text-xs disabled:opacity-50">Previous</button>
              <span className="text-xs self-center px-2 font-semibold">Page {page + 1}</span>
              <button disabled={lessons.length < size} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-white border border-[#E8DEFF] rounded-lg text-xs disabled:opacity-50">Next</button>
            </div>

            {activeStats && (
              <div className="bg-[#5B3DF5]/5 border border-[#5B3DF5]/20 p-4 rounded-2xl max-w-md space-y-2 relative">
                <button onClick={() => setActiveStats(null)} className="absolute top-2 right-3 text-sm font-bold text-gray-400 hover:text-gray-700">×</button>
                <h4 className="text-sm font-bold text-[#5B3DF5]">📊 Lesson Metrics (ID: {activeStats.lesson_id})</h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-white p-2 rounded-lg border border-[#E8DEFF]"><p className="text-xs text-gray-400">Attempts</p><p className="font-bold text-lg">{activeStats.total_attempts}</p></div>
                  <div className="bg-white p-2 rounded-lg border border-[#E8DEFF]"><p className="text-xs text-gray-400">Correct</p><p className="font-bold text-lg text-green-600">{activeStats.total_correct}</p></div>
                  <div className="bg-white p-2 rounded-lg border border-[#E8DEFF]"><p className="text-xs text-gray-400">Questions</p><p className="font-bold text-lg">{activeStats.total_questions}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ADDED WORK: VOCABULARY MANAGEMENT COMPONENT INTEGRATION --- */}
        {step === 'dashboard' && adminTab === 'words' && (
          <VocabularyManagement />
        )}

      </main>

      {/* MODAL WINDOW FOR ADD / EDIT FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DEFF] w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold capitalize text-[#1E1B3A]">{showModal} Lesson</h3>
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6F] mb-1">Lesson Name</label>
                <input type="text" value={lessonForm.lesson_name} onChange={(e) => setLessonForm({...lessonForm, lesson_name: e.target.value})} placeholder="Basic Verbs" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg focus:outline-none focus:border-[#5B3DF5]" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6F] mb-1">Date</label>
                <input type="date" value={lessonForm.lesson_date} onChange={(e) => setLessonForm({...lessonForm, lesson_date: e.target.value})} className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg focus:outline-none focus:border-[#5B3DF5]" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6F] mb-1">Description</label>
                <textarea value={lessonForm.description} onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})} placeholder="Describe what this lesson contains..." rows="3" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg focus:outline-none focus:border-[#5B3DF5]" required></textarea>
              </div>
              <div className="flex space-x-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#E8DEFF] rounded-lg text-xs font-medium">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-[#5B3DF5] text-white rounded-lg text-xs font-semibold hover:bg-[#4a32d4]">
                  {isLoading ? 'Saving...' : 'Save Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}