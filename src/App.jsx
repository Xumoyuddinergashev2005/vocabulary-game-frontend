import UserManagement from "./UserManagement";
import VocabularyManagement from "./VocabularyManagement";
import UserTestFlow from "./services/UserTestFlow";       // <-- ./services/ qo'shildi
import AdminTestHistory from "./services/AdminTestHistory"; // <-- ./services/ qo'shildi
import React, { useState, useEffect } from "react";

export default function App() {
  const [step, setStep] = useState('register'); 
  const [adminTab, setAdminTab] = useState('lessons');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [registerData, setRegisterData] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [verifyData, setVerifyData] = useState({ email: '', code: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [forgotData, setForgotData] = useState({ first_name: '', email: '' });
  const [resetData, setResetData] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });

  const [lessons, setLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ lesson_name: '', lesson_date: '2026-07-22', description: '' });
  
  const [activeStats, setActiveStats] = useState(null);
  
  // -- QO'SHILDI: Testni modalda yoki sahifada ochish uchun state --
  const [activeTestLessonId, setActiveTestLessonId] = useState(null);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (step === 'dashboard' && adminTab === 'lessons') {
      fetchAdminLessons();
    }
  }, [step, adminTab, searchQuery, page]);

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
        response = await fetch(`https://vocabulary-game.duckdns.org/api/lessons/${selectedLessonId}`, {
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

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`https://vocabulary-game.duckdns.org/api/lessons/${lessonId}`, {
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

  const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  const handleVerifyChange = (e) => setVerifyData({ ...verifyData, [e.target.name]: e.target.value });
  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleForgotChange = (e) => setForgotData({ ...forgotData, [e.target.name]: e.target.value });
  const handleResetChange = (e) => setResetData({ ...resetData, [e.target.name]: e.target.value });

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
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col md:flex-row font-sans antialiased text-[#1E1B3A]">
      
      {/* MOBILE HEADER BAR */}
      {step === 'dashboard' && (
        <div className="md:hidden bg-[#5B3DF5] text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🎮</span>
            <span className="font-bold">Vocab Test</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-2xl focus:outline-none">
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      )}

      {/* SIDEBAR */}
      {step === 'dashboard' && (
        <aside className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} md:block
          w-full md:w-64 bg-[#5B3DF5] text-white flex flex-col justify-between p-6 shrink-0 transition-all duration-300
        `}>
          <div className="space-y-8">
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-2xl">🎮</span>
              <span className="text-xl font-bold tracking-wide">Vocab Test</span>
            </div>

            <nav className="space-y-6">
              <div>
                <span className="text-xs uppercase text-[#E8DEFF]/60 font-semibold block mb-2">Admin Panel</span>
                <ul className="space-y-2 text-sm">
                  <li onClick={() => { setAdminTab('dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'dashboard' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>📊</span> <span>Dashboard</span></li>
                  <li onClick={() => { setAdminTab('lessons'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'lessons' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>📚</span> <span>Lessons Management</span></li>
                  <li onClick={() => { setAdminTab('words'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'words' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>🔤</span> <span>Vocabulary Words</span></li>
                  <li onClick={() => { setAdminTab('users'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'users' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>👥</span> <span>User Management</span></li>
                  
                  {/* QO'SHILDI: Test tarixi menyusi */}
                  <li onClick={() => { setAdminTab('tests-history'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'tests-history' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>📝</span> <span>Test History</span></li>
                </ul>
              </div>
            </nav>
          </div>
          
          <button onClick={() => { localStorage.removeItem('token'); setStep('login'); }} className="flex items-center space-x-3 p-2 mt-6 rounded-lg text-red-200 hover:bg-white/5 text-sm">
            <span>🚪</span> <span>Logout</span>
          </button>
        </aside>
      )}

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
        
        {message && (
          <div className={`p-3 rounded-xl mb-4 text-sm text-center font-medium max-w-xl mx-auto w-full ${
            isError ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#22C55E]/10 text-[#22C55E]'
          }`}>
            {message}
          </div>
        )}

        {/* --- AUTH SCREENS --- */}
        {step !== 'dashboard' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#E8DEFF] w-full max-w-md">
              {step === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
                  <input type="text" name="first_name" onChange={handleRegisterChange} placeholder="First Name" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <input type="text" name="last_name" onChange={handleRegisterChange} placeholder="Last Name" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <input type="email" name="email" onChange={handleRegisterChange} placeholder="Email" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <input type="password" name="password" onChange={handleRegisterChange} placeholder="Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg text-sm font-semibold">Register</button>
                  <p className="text-xs text-center mt-2">Already account? <span onClick={() => setStep('login')} className="text-[#5B3DF5] cursor-pointer font-medium">Login</span></p>
                </form>
              )}

              {step === 'verify' && (
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Verify Email</h2>
                  <input type="number" name="code" onChange={handleVerifyChange} placeholder="Code" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-center font-bold text-sm" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg text-sm font-semibold">Verify</button>
                </form>
              )}

              {step === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
                  <input type="email" name="email" onChange={handleLoginChange} placeholder="Email" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <div className="relative">
                    <input type="password" name="password" onChange={handleLoginChange} placeholder="Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                    <span onClick={() => setStep('forgot')} className="text-xs text-[#5B3DF5] cursor-pointer block text-right mt-1 font-medium">Forgot?</span>
                  </div>
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg text-sm font-semibold">Login</button>
                  <p className="text-xs text-center mt-2">No account? <span onClick={() => setStep('register')} className="text-[#5B3DF5] cursor-pointer font-medium">Register</span></p>
                </form>
              )}

              {step === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>
                  <input type="text" name="first_name" onChange={handleForgotChange} placeholder="First Name" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <input type="email" name="email" onChange={handleForgotChange} placeholder="Email" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg text-sm font-semibold">Send Code</button>
                </form>
              )}

              {step === 'new-password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-center">New Password</h2>
                  <input type="number" name="code" onChange={handleResetChange} placeholder="OTP Code" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-center text-sm" required />
                  <input type="password" name="newPassword" onChange={handleResetChange} placeholder="New Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <input type="password" name="confirmPassword" onChange={handleResetChange} placeholder="Confirm Password" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm" required />
                  <button type="submit" className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg text-sm font-semibold">Reset Password</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* --- ADMIN DASHBOARD PANEL: LESSONS --- */}
        {step === 'dashboard' && adminTab === 'lessons' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#1E1B3A]">Lessons Management</h1>
                <p className="text-xs text-[#6B6B6F]">Create, update, delete and view statistics of language lessons</p>
              </div>
              <button onClick={() => { setShowModal('add'); setLessonForm({ lesson_name: '', lesson_date: '2026-07-22', description: '' }); }} className="bg-[#5B3DF5] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#4a32d4] transition w-full sm:w-auto text-center">
                + Add Lesson
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E8DEFF] w-full sm:max-w-xs">
              <input type="text" placeholder="Search lesson..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-1.5 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]" />
            </div>

            {/* RESPONSIVE TABLE CONTAINER */}
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
                    lessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-[#F8F7FF]/50 transition">
                        <td className="p-4 font-semibold text-gray-500">{lesson.id}</td>
                        <td className="p-4 font-bold text-[#1E1B3A]">{lesson.lesson_name}</td>
                        <td className="p-4 text-xs text-gray-500">{lesson.lesson_date}</td>
                        <td className="p-4 text-xs max-w-xs truncate text-gray-600">{lesson.description}</td>
                        
                        {/* QO'SHILDI: Actions qismiga Start Test tugmasi */}
                        <td className="p-4 text-center space-x-1 whitespace-nowrap">
                          <button onClick={() => setActiveTestLessonId(lesson.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 font-medium">Start Test</button>
                          <button onClick={() => { fetchLessonStats(lesson.id); }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium">Stats</button>
                          <button onClick={() => { setSelectedLessonId(lesson.id); setLessonForm({ lesson_name: lesson.lesson_name, lesson_date: lesson.lesson_date, description: lesson.description }); setShowModal('edit'); }} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100 font-medium">Edit</button>
                          <button onClick={() => handleDeleteLesson(lesson.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-medium">Delete</button>
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
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-white border border-[#E8DEFF] rounded-lg text-xs disabled:opacity-50 font-medium">Previous</button>
              <span className="text-xs self-center px-2 font-semibold">Page {page + 1}</span>
              <button disabled={lessons.length < size} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-white border border-[#E8DEFF] rounded-lg text-xs disabled:opacity-50 font-medium">Next</button>
            </div>

            {activeStats && (
              <div className="bg-[#5B3DF5]/5 border border-[#5B3DF5]/20 p-4 rounded-2xl w-full max-w-md space-y-2 relative">
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

        {/* --- VOCABULARY MANAGEMENT COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'words' && (
          <VocabularyManagement />
        )}

        {/* --- USER MANAGEMENT COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'users' && (
          <UserManagement />
        )}

        {/* --- QO'SHILDI: ADMIN TEST HISTORY COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'tests-history' && (
          <AdminTestHistory />
        )}

      </main>

      {/* MODAL WINDOW FOR ADD / EDIT FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DEFF] w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-lg font-bold capitalize text-[#1E1B3A]">{showModal} Lesson</h3>
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6F] mb-1">Lesson Name</label>
                <input type="text" value={lessonForm.lesson_name} onChange={(e) => setLessonForm({...lessonForm, lesson_name: e.target.value})} placeholder="Basic Verbs" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6F] mb-1">Date</label>
                <input type="date" value={lessonForm.lesson_date} onChange={(e) => setLessonForm({...lessonForm, lesson_date: e.target.value})} className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6F] sm:mb-1">Description</label>
                <textarea value={lessonForm.description} onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})} placeholder="Describe what this lesson contains..." rows="3" className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]" required></textarea>
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

      {/* QO'SHILDI: Start Test bosilganda ochiladigan Modal oynasi */}
      {activeTestLessonId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => setActiveTestLessonId(null)} 
              className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>
            <UserTestFlow lessonId={activeTestLessonId} />
          </div>
        </div>
      )}

    </div>
  );
}