import React, { useState, useEffect } from "react";
import UserManagement from "./UserManagement";
import VocabularyManagement from "./VocabularyManagement";
import AdminTestHistory from "./services/AdminTestHistory"; 
import LessonManagement from "./LessonManagement";
import Dashboard from "./Dashboard";
import MyAnswersPage from "./MyAnswersPage"; // <-- 1. MyAnswersPage import qilindi
import AdminAnswersPage from "./AdminAnswersPage"; // <-- 2. AdminAnswersPage import qilindi

export default function App() {
  const [step, setStep] = useState('register'); 
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [registerData, setRegisterData] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [verifyData, setVerifyData] = useState({ email: '', code: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [forgotData, setForgotData] = useState({ first_name: '', email: '' });
  const [resetData, setResetData] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Auto-Login tekshiruvi
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setStep('dashboard');
    }
  }, []);

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
          setAdminTab('dashboard');
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
                  <li onClick={() => { setAdminTab('tests-history'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'tests-history' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>📝</span> <span>Test History</span></li>
                  
                  {/* --- YANGI MENYU ELEMENTLARI --- */}
                  <li onClick={() => { setAdminTab('my-answers'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'my-answers' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>📖</span> <span>My Answers</span></li>
                  <li onClick={() => { setAdminTab('admin-answers'); setIsMobileMenuOpen(false); }} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${adminTab === 'admin-answers' ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}><span>🛡️</span> <span>User Answers (Admin)</span></li>
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
        
        {message && step !== 'dashboard' && (
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

        {/* --- MAIN DASHBOARD OVERVIEW PANEL & LEADERBOARD --- */}
        {step === 'dashboard' && adminTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1E1B3A]">Dashboard Overview</h1>
              <p className="text-xs text-[#6B6B6F]">Welcome to your vocabulary application control center</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div onClick={() => setAdminTab('lessons')} className="bg-white p-5 rounded-2xl border border-[#E8DEFF] shadow-sm hover:border-[#5B3DF5] cursor-pointer transition">
                <span className="text-2xl">📚</span>
                <h3 className="font-bold text-[#1E1B3A] mt-2">Lessons</h3>
                <p className="text-xs text-gray-400">Manage language modules</p>
              </div>
              <div onClick={() => setAdminTab('words')} className="bg-white p-5 rounded-2xl border border-[#E8DEFF] shadow-sm hover:border-[#5B3DF5] cursor-pointer transition">
                <span className="text-2xl">🔤</span>
                <h3 className="font-bold text-[#1E1B3A] mt-2">Vocabulary</h3>
                <p className="text-xs text-gray-400">Word lists and dictionaries</p>
              </div>
              <div onClick={() => setAdminTab('users')} className="bg-white p-5 rounded-2xl border border-[#E8DEFF] shadow-sm hover:border-[#5B3DF5] cursor-pointer transition">
                <span className="text-2xl">👥</span>
                <h3 className="font-bold text-[#1E1B3A] mt-2">Users</h3>
                <p className="text-xs text-gray-400">Track student statistics</p>
              </div>
              <div onClick={() => setAdminTab('tests-history')} className="bg-white p-5 rounded-2xl border border-[#E8DEFF] shadow-sm hover:border-[#5B3DF5] cursor-pointer transition">
                <span className="text-2xl">📝</span>
                <h3 className="font-bold text-[#1E1B3A] mt-2">Test History</h3>
                <p className="text-xs text-gray-400">Review overall results</p>
              </div>
            </div>

            <Dashboard setStep={setStep} />
          </div>
        )}

        {/* --- DARS MANAJMENT KOMPONENTI --- */}
        {step === 'dashboard' && adminTab === 'lessons' && (
          <LessonManagement setStep={setStep} />
        )}

        {/* --- VOCABULARY MANAGEMENT COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'words' && (
          <VocabularyManagement />
        )}

        {/* --- USER MANAGEMENT COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'users' && (
          <UserManagement />
        )}

        {/* --- ADMIN TEST HISTORY COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'tests-history' && (
          <AdminTestHistory />
        )}

        {/* --- MY ANSWERS COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'my-answers' && (
          <MyAnswersPage />
        )}

        {/* --- ADMIN ANSWERS COMPONENT --- */}
        {step === 'dashboard' && adminTab === 'admin-answers' && (
          <AdminAnswersPage />
        )}

      </main>
    </div>
  );
}