import React, { useState, useEffect } from "react";

export default function UserProfile() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Faqat o'zingizning ma'lumotlaringizni localStorage'dan o'qib olish
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setFormData({
          firstName: userObj.firstName || userObj.first_name || localStorage.getItem('firstName') || '',
          lastName: userObj.lastName || userObj.last_name || localStorage.getItem('lastName') || '',
          email: userObj.email || localStorage.getItem('email') || ''
        });
      }
    } catch (e) {
      console.error("Error reading user profile", e);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://vocabulary-game.duckdns.org/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        
        // LocalStorage'dagi ma'lumotlarni ham yangilab qo'yamiz
        localStorage.setItem('firstName', formData.firstName);
        localStorage.setItem('lastName', formData.lastName);
        localStorage.setItem('email', formData.email);

        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            userObj.firstName = formData.firstName;
            userObj.lastName = formData.lastName;
            userObj.email = formData.email;
            localStorage.setItem('user', JSON.stringify(userObj));
          } catch (e) {}
        }
      } else {
        setIsError(true);
        setMessage('Failed to update profile.');
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl bg-white p-6 md:p-8 rounded-2xl border border-[#E8DEFF] shadow-sm">
      <h2 className="text-xl font-bold text-[#1E1B3A] mb-1">My Profile</h2>
      <p className="text-xs text-gray-400 mb-6">Update your personal information</p>

      {message && (
        <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${isError ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#22C55E]/10 text-[#22C55E]'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#E8DEFF] rounded-lg text-sm focus:outline-none focus:border-[#5B3DF5]"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#5B3DF5] text-white py-2 rounded-lg text-sm font-semibold hover:bg-opacity-95 transition"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}