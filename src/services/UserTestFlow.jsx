import React, { useState, useEffect } from "react";
import { testService } from "./testService";

export default function UserTestFlow({ lessonId }) {
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Javob to'g'ri yoki xatoligini vaqtincha ko'rsatib turish uchun
  const [feedback, setFeedback] = useState(null);
  const [selectedOptId, setSelectedOptId] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        // Backenddagi yangi startTest metodi IN_PROGRESS sessiyani qaytaradi yoki yangisini ochadi
        const data = await testService.startTest(lessonId);
        setSession(data);
        const sessionId = data.sessionId || data.session_id || data.id;
        
        // Agar test allaqachon tugagan bo'lsa natijani olamiz, aks holda joriy savol
        if (data.status === "COMPLETED") {
          const resData = await testService.getResult(sessionId);
          setResult(resData);
        } else {
          await fetchCurrentQuestion(sessionId);
        }
      } catch (err) {
        setError("Testni boshlashda xatolik yuz berdi. Serverni tekshiring.");
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      initSession();
    }
  }, [lessonId]);

  const fetchCurrentQuestion = async (sessionId) => {
    try {
      const qData = await testService.getCurrentQuestion(sessionId);
      setCurrentQuestion(qData);
    } catch (err) {
      setError("Savolni yuklab bo'lmadi.");
    }
  };

  // Variantni bosishi bilanoq avtomatik javob yuborish logikasi
  const handleOptionSelect = async (optId) => {
    if (!currentQuestion || loading || feedback !== null) return;
    
    setSelectedOptId(optId);
    setLoading(true);

    try {
      const sessionId = session.sessionId || session.session_id || session.id;
      const questionId = currentQuestion.questionId || currentQuestion.question_id || currentQuestion.id;
      
      const response = await testService.submitAnswer(sessionId, questionId, optId);
      
      setFeedback({
        isCorrect: response.correct,
        selectedId: optId
      });

      // 1.2 soniya natijani ko'rsatib turib, keyingi savolga o'tamiz
      setTimeout(async () => {
        setFeedback(null);
        setSelectedOptId(null);

        if (response.finished) {
          const resData = await testService.getResult(sessionId);
          setResult(resData);
        } else {
          await fetchCurrentQuestion(sessionId);
        }
        setLoading(false);
      }, 1200);

    } catch (err) {
      setError("Javobni yuborishda xatolik yuz berdi.");
      setLoading(false);
      setFeedback(null);
      setSelectedOptId(null);
    }
  };

  const handleSkip = async () => {
    if (!currentQuestion || loading || feedback !== null) return;
    setLoading(true);
    try {
      const sessionId = session.sessionId || session.session_id || session.id;
      const questionId = currentQuestion.questionId || currentQuestion.question_id || currentQuestion.id;
      
      const response = await testService.skipQuestion(sessionId, questionId);
      
      if (response.finished) {
        const resData = await testService.getResult(sessionId);
        setResult(resData);
      } else {
        await fetchCurrentQuestion(sessionId);
        setSelectedOptId(null);
      }
    } catch (err) {
      setError("Savolni o'tkazib yuborishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentQuestion && !result) {
    return <div className="p-8 text-center text-sm text-gray-500">Test yuklanmoqda...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500 text-sm font-medium">{error}</div>;
  }

  if (result) {
    return (
      <div className="p-6 text-center space-y-4">
        <h3 className="text-xl font-bold text-[#1E1B3A]">🎉 Test Yakunlandi!</h3>
        <div className="bg-[#F8F7FF] p-6 rounded-xl border border-[#E8DEFF] space-y-3">
          <p className="text-base">To'g'ri javoblar: <span className="font-bold text-green-600 text-lg">{result.correct_answers || result.correctAnswers || 0}</span> / {result.total_questions || result.totalQuestions}</p>
          <p className="text-base">To'plangan ball: <span className="font-bold text-[#5B3DF5] text-lg">{result.earned_score || result.earnedScore || 0}</span></p>
          <p className="text-sm text-gray-500 mt-2">Urinish turi: {result.attempt_type || result.attemptType}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Yuqori sarlavha paneli */}
      <div className="flex justify-between items-center border-b pb-3 border-[#E8DEFF]">
        <h3 className="font-bold text-base text-[#1E1B3A]">Vocabulary Test</h3>
        {currentQuestion && (
           <span className="text-xs bg-[#5B3DF5]/10 text-[#5B3DF5] px-3 py-1.5 rounded-full font-semibold">
             Savol: {currentQuestion.questionOrder || currentQuestion.question_order || currentQuestion.question_index} / {session?.totalQuestions || session?.total_questions || '-'}
           </span>
        )}
      </div>

      {currentQuestion ? (
        <div className="space-y-5">
          {/* Savol matni */}
          <h4 className="font-bold text-2xl text-center text-gray-800 py-4">
            {currentQuestion.russianWord || currentQuestion.russian_word || "Savol topilmadi"}
          </h4>
          
          {/* Variantlar ro'yxati */}
          <div className="space-y-3">
            {(currentQuestion.options || []).map((option) => {
              const optId = option.optionId || option.option_id || option.id;
              
              let buttonStyle = 'border-[#E8DEFF] hover:border-[#5B3DF5]/30 bg-white text-gray-700';
              
              if (feedback) {
                if (feedback.selectedId === optId) {
                  buttonStyle = feedback.isCorrect 
                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold' 
                    : 'border-red-500 bg-red-50 text-red-700 font-semibold';
                }
              } else if (selectedOptId === optId) {
                buttonStyle = 'border-[#5B3DF5] bg-[#5B3DF5]/5 text-[#5B3DF5] shadow-sm font-semibold';
              }

              return (
                <button
                  key={optId}
                  onClick={() => handleOptionSelect(optId)}
                  disabled={loading || feedback !== null}
                  className={`w-full text-left p-4 rounded-xl border text-sm transition ${buttonStyle}`}
                >
                  {option.text || option.option_text}
                </button>
              );
            })}
          </div>

          {/* Pastki boshqaruv tugmasi (Faqat skip qoldi) */}
          <div className="flex justify-start pt-4 border-t border-gray-100">
            <button 
              onClick={handleSkip} 
              disabled={loading || feedback !== null}
              className="px-6 py-2.5 border border-[#E8DEFF] rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              O'tkazib yuborish (Skip)
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-500">Savollar yuklanmoqda...</div>
      )}
    </div>
  );
}