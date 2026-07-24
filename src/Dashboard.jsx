import React, { useEffect, useState } from 'react';

export default function Dashboard({ setStep }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (setStep) setStep('login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('https://vocabulary-game.duckdns.org/api/tests/leaderboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(Array.isArray(data) ? data : data.content || []);
      }
    } catch (err) {
      console.error("Reytingni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard & Reyting</h1>
        <p className="text-sm text-gray-500">Eng ko'p ball to'plagan peshqadam foydalanuvchilar</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">O'rin</th>
              <th className="p-4 font-semibold">Foydalanuvchi</th>
              <th className="p-4 font-semibold text-right">To'plangan Ball</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-400">Yuklanmoqda...</td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-400">Hozircha ma'lumotlar yo'q</td>
              </tr>
            ) : (
              leaderboard.map((item, index) => {
                // Backenddan kelayotgan fullName'ni to'g'ridan-to'g'ri olamiz
                const fullName = item.fullName || item.full_name || `Foydalanuvchi #${index + 1}`;
                const score = item.score !== undefined ? item.score : (item.totalScore || item.total_score || 0);
                const rank = item.rank !== undefined ? item.rank : index + 1;

                return (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-[#5B3DF5]">
                      {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
                    </td>
                    <td className="p-4 font-medium text-gray-900">{fullName}</td>
                    <td className="p-4 text-right font-bold text-green-600">{score} ball</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}