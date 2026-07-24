import React, { useState, useEffect } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Filterlar
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    fromDate: '',
    toDate: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.fromDate) queryParams.append('from_date', filters.fromDate);
      if (filters.toDate) queryParams.append('to_date', filters.toDate);

      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/users?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      } else {
        showStatus('Foydalanuvchilarni yuklashda xatolik yuz berdi.', true);
      }
    } catch (err) {
      showStatus('Tarmoq xatoligi.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const showStatus = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/users/${userId}/status?status=${newStatus}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        showStatus('Foydalanuvchi statusi o\'zgartirildi!');
        fetchUsers();
      } else {
        const errData = await res.json();
        showStatus(errData.message || 'Xatolik yuz berdi.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/users/role?user_id=${userId}&role=${newRole}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        showStatus('Foydalanuvchi roli muvaffaqiyatli o\'zgartirildi!');
        fetchUsers();
      } else {
        const errData = await res.json();
        showStatus(errData.message || 'Rolni o\'zgartirib bo\'lmadi.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?")) return;
    try {
      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showStatus('Foydalanuvchi o\'chirib tashlandi.');
        fetchUsers();
      } else {
        const errData = await res.json();
        showStatus(errData.message || 'O\'chirishda xatolik.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: editForm.firstName.trim(),
        last_name: editForm.lastName.trim(),
        email: editForm.email.trim() === '' ? selectedUser.email : editForm.email
      };

      const res = await authFetch(`https://vocabulary-game.duckdns.org/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showStatus('Foydalanuvchi ma\'lumotlari yangilandi!');
        setShowEditModal(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        showStatus(errData.message || 'Yangilashda xatolik.', true);
      }
    } catch (err) {
      showStatus('Server bilan aloqa uzildi.', true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-indigo-50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Tizimdagi foydalanuvchilarni boshqarish, rollar va statuslarni o'zgartirish paneli</p>
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

        {/* Filterlar paneli */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Qidirish</label>
            <input 
              type="text" 
              placeholder="Ism yoki Email..." 
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Barcha statuslar</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rol (Role)</label>
            <select 
              value={filters.role} 
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              <option value="">Barcha rollar</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_USER">SUPER_USER</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dan (Sana)</label>
            <input 
              type="date" 
              value={filters.fromDate}
              onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gacha (Sana)</label>
            <input 
              type="date" 
              value={filters.toDate}
              onChange={(e) => setFilters({...filters, toDate: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Foydalanuvchilar Jadvali */}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                    <th className="p-4 font-semibold">Foydalanuvchi</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Ball (Score)</th>
                    <th className="p-4 font-semibold">Rol</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">Foydalanuvchilar topilmadi.</td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">
                        {u.firstName || u.first_name} {u.lastName || u.last_name}
                      </td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4">
                     <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold">
                           ⭐ {u.total_score ?? 0} ball
                           </span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_USER">SUPER_USER</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleStatusChange(u.id, u.status)} 
                            className={`font-medium text-xs px-2.5 py-1.5 rounded-lg transition ${
                              u.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Bloklash' : 'Faol'}
                          </button>
                          <button 
                            onClick={() => openEditModal(u)} 
                            className="text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
                          >
                            Tahrir
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)} 
                            className="text-rose-600 hover:text-rose-900 font-medium text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition"
                          >
                            O'chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* TAHRIRLASH MODALI */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Foydalanuvchini Tahrirlash</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">First Name</label>
                  <input 
                    type="text" 
                    value={editForm.firstName} 
                    onChange={(e)=>setEditForm({...editForm, firstName: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Last Name</label>
                  <input 
                    type="text" 
                    value={editForm.lastName} 
                    onChange={(e)=>setEditForm({...editForm, lastName: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e)=>setEditForm({...editForm, email: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-700 hover:bg-gray-50 transition">Bekor qilish</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}