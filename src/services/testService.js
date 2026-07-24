export const testService = {
  startTest: async (lessonId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/${lessonId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to start test');
    return response.json();
  },

  getActiveSession: async (lessonId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/${lessonId}/active`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return null;
    return response.json();
  },

  getCurrentQuestion: async (sessionId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/${sessionId}/current-question`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch question');
    return response.json();
  },

  submitAnswer: async (sessionId, questionId, optionId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/answer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        option_id: optionId
      })
    });
    if (!response.ok) throw new Error('Failed to submit answer');
    return response.json();
  },

  skipQuestion: async (sessionId, questionId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/skip`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId
      })
    });
    if (!response.ok) throw new Error('Failed to skip question');
    return response.json();
  },

  getResult: async (sessionId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/${sessionId}/result`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch result');
    return response.json();
  },

  getTestHistory: async (params) => {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/history?${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },

  // Mening javoblarim (lessonId orqali filterlanadi)
  getMyAnswers: async (params) => {
    const token = localStorage.getItem('token');
    const queryParams = {};
    if (params.lessonId) queryParams.lessonId = params.lessonId;
    if (params.isCorrect !== '' && params.isCorrect !== undefined && params.isCorrect !== null) {
      queryParams.isCorrect = params.isCorrect;
    }
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.size !== undefined) queryParams.size = params.size;

    const query = new URLSearchParams(queryParams).toString();
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/my-answers?${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch my answers');
    return response.json();
  },

  // Admin uchun javoblar (lessonId va userId orqali filterlanadi)
  getAdminUserAnswers: async (params) => {
    const token = localStorage.getItem('token');
    const queryParams = {};
    if (params.userId) queryParams.userId = params.userId;
    if (params.lessonId) queryParams.lessonId = params.lessonId;
    if (params.isCorrect !== '' && params.isCorrect !== undefined && params.isCorrect !== null) {
      queryParams.isCorrect = params.isCorrect;
    }
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.size !== undefined) queryParams.size = params.size;

    const query = new URLSearchParams(queryParams).toString();
    const response = await fetch(`https://vocabulary-game.duckdns.org/api/tests/admin/user-answers?${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch admin user answers');
    return response.json();
  },

  // Darslar ro'yxatini olish (Dropdown uchun)
  getLessons: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('https://vocabulary-game.duckdns.org/api/lessons', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch lessons');
    return response.json();
  },

  // Admin uchun foydalanuvchilar ro'yxatini olish (Dropdown uchun)
  getUsersList: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('https://vocabulary-game.duckdns.org/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return [];
    return response.json();
  }
};