import React, { useState, useEffect } from 'react';
import { AppTab, WordData, SavedWord } from './types';
import { lookupWord, generateDailyWord, playPronunciation } from './services/geminiService';
import { WordCard } from './components/WordCard';

interface QuizQuestion {
  word: string;
  correctAnswer: string;
  options: string[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DISCOVER);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<WordData | null>(null);
  const [dailyWord, setDailyWord] = useState<WordData | null>(null);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDailyLoading, setIsDailyLoading] = useState(true);

  // 퀴즈 관련 상태
  const [quizState, setQuizState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const word = await generateDailyWord();
        setDailyWord(word);
      } catch (e) {
        console.error("Daily fetch failed", e);
      } finally {
        setIsDailyLoading(false);
      }
    };
    fetchDaily();

    const saved = localStorage.getItem('voxlingo_words');
    if (saved) {
      setSavedWords(JSON.parse(saved));
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const result = await lookupWord(searchTerm);
      setSearchResult(result);
    } catch (error) {
      alert("단어를 찾지 못했어요. 쉬운 단어부터 검색해볼까요?");
    } finally {
      setIsLoading(false);
    }
  };

  const saveWord = (word: WordData) => {
    if (savedWords.some(w => w.word.toLowerCase() === word.word.toLowerCase())) return;
    const newWord: SavedWord = {
      ...word,
      id: crypto.randomUUID(),
      dateAdded: Date.now(),
      lastReviewed: Date.now(),
      mastery: 0
    };
    const updated = [newWord, ...savedWords];
    setSavedWords(updated);
    localStorage.setItem('voxlingo_words', JSON.stringify(updated));
  };

  const deleteWord = (id: string) => {
    const updated = savedWords.filter(w => w.id !== id);
    setSavedWords(updated);
    localStorage.setItem('voxlingo_words', JSON.stringify(updated));
  };

  // 퀴즈 시작 로직
  const startQuiz = () => {
    if (savedWords.length < 5) return;
    
    const shuffled = [...savedWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5); 
    
    const questions: QuizQuestion[] = selected.map(target => {
      const others = savedWords
        .filter(w => w.word !== target.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.meaning_kr);
      
      const options = [target.meaning_kr, ...others].sort(() => 0.5 - Math.random());
      
      return {
        word: target.word,
        correctAnswer: target.meaning_kr,
        options
      };
    });

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setScore(0);
    setQuizState('running');
    setSelectedOption(null);
    setIsAnswerCorrect(null);
  };

  const handleQuizAnswer = (option: string) => {
    if (selectedOption !== null) return; 
    
    setSelectedOption(option);
    const correct = option === quizQuestions[currentQuizIndex].correctAnswer;
    setIsAnswerCorrect(correct);
    
    if (correct) {
      setScore(s => s + 1);
      const targetWord = quizQuestions[currentQuizIndex].word;
      const updated = savedWords.map(w => {
        if (w.word === targetWord) {
          return { ...w, mastery: Math.min(100, (w.mastery || 0) + 20) };
        }
        return w;
      });
      setSavedWords(updated);
      localStorage.setItem('voxlingo_words', JSON.stringify(updated));
    }

    setTimeout(() => {
      if (currentQuizIndex + 1 < quizQuestions.length) {
        setCurrentQuizIndex(i => i + 1);
        setSelectedOption(null);
        setIsAnswerCorrect(null);
      } else {
        setQuizState('finished');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBEB] pb-32">
      <header className="p-8 text-center bg-white border-b-8 border-yellow-200 rounded-b-[4rem] shadow-sm">
        <div className="flex items-center justify-center gap-4">
          <span className="text-5xl animate-bounce cursor-pointer" onClick={() => { setActiveTab(AppTab.DISCOVER); setQuizState('idle'); }}>🦖</span>
          <h1 className="text-5xl font-black text-yellow-500 tracking-tighter cursor-pointer" onClick={() => { setActiveTab(AppTab.DISCOVER); setQuizState('idle'); }}>VoxLingo</h1>
          <span className="text-5xl animate-bounce" style={{animationDelay: '0.2s'}}>⭐</span>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {activeTab === AppTab.DISCOVER && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <form onSubmit={handleSearch} className="relative mt-8">
              <input 
                type="text" 
                placeholder="궁금한 단어 써보기!"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-24 pl-20 pr-44 bg-white border-8 border-yellow-200 rounded-[3rem] shadow-2xl focus:ring-8 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all text-3xl font-black placeholder:text-slate-200"
              />
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-5xl">🔍</span>
              <button 
                type="submit"
                disabled={isLoading}
                className="absolute right-4 top-4 bottom-4 px-10 bg-yellow-400 text-white rounded-[2rem] text-2xl font-black bubbly-button hover:bg-yellow-500 disabled:bg-slate-200 shadow-md"
              >
                {isLoading ? '...' : '찾기!'}
              </button>
            </form>

            {searchResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-6">
                  <h3 className="text-2xl font-black text-slate-800">찾은 단어! ✨</h3>
                  <button onClick={() => setSearchResult(null)} className="text-slate-400 font-bold underline">지우기</button>
                </div>
                <WordCard 
                  data={searchResult} 
                  onSave={saveWord} 
                  isSaved={savedWords.some(w => w.word.toLowerCase() === searchResult.word.toLowerCase())}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-800 text-center">오늘 배우면 좋은 단어 🎁</h3>
                {isDailyLoading ? (
                  <div className="h-80 bg-white rounded-[3rem] border-8 border-dashed border-yellow-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-7xl animate-spin inline-block mb-4">🍭</div>
                      <p className="text-2xl font-black text-slate-300">선물을 고르는 중...</p>
                    </div>
                  </div>
                ) : dailyWord && (
                  <WordCard 
                    data={dailyWord} 
                    onSave={saveWord}
                    isSaved={savedWords.some(w => w.word.toLowerCase() === dailyWord.word.toLowerCase())}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.MY_WORDS && (
          <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
            <div className="bg-white p-8 rounded-[3rem] border-8 border-rose-100 text-center shadow-lg">
              <span className="text-8xl block mb-4">🎒</span>
              <h2 className="text-4xl font-black text-slate-800">내 가방 속 단어</h2>
              <p className="text-2xl font-bold text-rose-400 mt-2">총 {savedWords.length}개를 모았어요!</p>
            </div>

            {savedWords.length === 0 ? (
              <div className="text-center py-16 opacity-30">
                <p className="text-3xl font-black">가방이 비어있어요!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {savedWords.map((word) => (
                  <div key={word.id} className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-100 flex items-center justify-between shadow-sm hover:scale-[1.02] transition-all">
                    <div className="flex-1 cursor-pointer" onClick={() => { setSearchTerm(word.word); setSearchResult(word); setActiveTab(AppTab.DISCOVER); }}>
                      <h4 className="text-4xl font-black text-slate-800">{word.word}</h4>
                      <p className="text-2xl text-slate-500 font-bold mt-1">✨ {word.meaning_kr}</p>
                    </div>
                    <button 
                      onClick={() => deleteWord(word.id)}
                      className="w-16 h-16 flex items-center justify-center rounded-3xl bg-rose-50 text-rose-300 hover:text-rose-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.QUIZ && (
          <div className="h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-500 w-full">
            {quizState === 'idle' && (
              <div className="bg-white p-12 rounded-[4rem] border-8 border-indigo-100 shadow-2xl text-center max-w-md w-full">
                <span className="text-9xl block mb-8 animate-pulse">🎮</span>
                <h2 className="text-5xl font-black text-slate-800">퀴즈 놀이</h2>
                <p className="text-2xl font-bold text-slate-400 mt-4">단어 실력을 뽐내볼까요?</p>
                
                <div className="mt-12">
                  <button 
                    onClick={startQuiz}
                    disabled={savedWords.length < 5}
                    className="w-full py-8 bg-indigo-500 text-white rounded-[2.5rem] text-3xl font-black bubbly-button hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 shadow-lg"
                  >
                    시작하기!
                  </button>
                  {savedWords.length < 5 && (
                    <p className="mt-6 text-xl font-bold text-rose-400 italic">가방에 단어를 5개 더 넣어주세요!</p>
                  )}
                </div>
              </div>
            )}

            {quizState === 'running' && (
              <div className="w-full space-y-8">
                <div className="flex justify-between items-center bg-white px-8 py-4 rounded-full border-4 border-indigo-100">
                  <span className="text-xl font-black text-indigo-400">문제 {currentQuizIndex + 1} / {quizQuestions.length}</span>
                  <span className="text-xl font-black text-rose-400">점수: {score}</span>
                </div>

                <div className="bg-white p-12 rounded-[4rem] border-8 border-yellow-200 shadow-2xl text-center">
                  <h3 className="text-2xl font-black text-yellow-500 mb-4 uppercase tracking-widest">이 단어의 뜻은?</h3>
                  <div className="text-7xl font-black text-slate-800 mb-12">{quizQuestions[currentQuizIndex].word}</div>
                  
                  <div className="grid gap-4">
                    {quizQuestions[currentQuizIndex].options.map((option, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleQuizAnswer(option)}
                        disabled={selectedOption !== null}
                        className={`w-full py-6 rounded-3xl text-2xl font-black transition-all border-4 shadow-sm ${
                          selectedOption === null 
                            ? 'bg-white border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95' 
                            : option === quizQuestions[currentQuizIndex].correctAnswer
                              ? 'bg-green-100 border-green-500 text-green-700 scale-105'
                              : option === selectedOption
                                ? 'bg-rose-100 border-rose-500 text-rose-700'
                                : 'bg-slate-50 border-slate-100 opacity-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {isAnswerCorrect !== null && (
                  <div className="text-center animate-bounce">
                    <span className="text-8xl">{isAnswerCorrect ? '🎉' : '💨'}</span>
                    <p className={`text-3xl font-black mt-2 ${isAnswerCorrect ? 'text-green-500' : 'text-rose-400'}`}>
                      {isAnswerCorrect ? '우와! 맞았어요!' : '조금 아쉬워요!'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {quizState === 'finished' && (
              <div className="bg-white p-12 rounded-[4rem] border-8 border-green-200 shadow-2xl text-center max-w-md w-full">
                <span className="text-9xl block mb-8">🏆</span>
                <h2 className="text-4xl font-black text-slate-800">퀴즈 끝!</h2>
                <div className="my-8">
                  <p className="text-2xl font-bold text-slate-400">내 점수는...</p>
                  <p className="text-8xl font-black text-green-500">{score}점!</p>
                  <p className="text-xl font-bold text-slate-400 mt-2">{quizQuestions.length}개 중에 {score}개를 맞혔어요!</p>
                </div>
                
                <button 
                  onClick={() => setQuizState('idle')}
                  className="w-full py-6 bg-green-500 text-white rounded-[2.5rem] text-3xl font-black bubbly-button hover:bg-green-600 shadow-lg"
                >
                  다시 하기!
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t-8 border-yellow-100 flex justify-around items-center z-50 rounded-t-[3rem]">
        <NavButton 
          active={activeTab === AppTab.DISCOVER} 
          onClick={() => { setActiveTab(AppTab.DISCOVER); setQuizState('idle'); }}
          icon="🏠"
          label="찾기"
          color="bg-sky-400"
        />
        <NavButton 
          active={activeTab === AppTab.MY_WORDS} 
          onClick={() => { setActiveTab(AppTab.MY_WORDS); setQuizState('idle'); }}
          icon="🎒"
          label="가방"
          color="bg-rose-400"
          count={savedWords.length}
        />
        <NavButton 
          active={activeTab === AppTab.QUIZ} 
          onClick={() => { setActiveTab(AppTab.QUIZ); setQuizState('idle'); }}
          icon="🎮"
          label="퀴즈"
          color="bg-indigo-400"
        />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  color: string;
  count?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, color, count }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-4 rounded-3xl transition-all relative ${
        active 
          ? `scale-125 -translate-y-4` 
          : 'opacity-50'
      }`}
    >
      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all ${
        active ? `${color} text-white` : 'bg-slate-100 text-slate-400'
      }`}>
        {icon}
      </div>
      <span className={`font-black text-xl ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="absolute top-2 right-2 bg-rose-500 text-white text-sm font-black w-8 h-8 rounded-full flex items-center justify-center border-4 border-white">
          {count}
        </span>
      )}
    </button>
  );
};

export default App;
