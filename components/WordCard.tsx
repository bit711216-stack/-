
import React, { useState } from 'react';
import { WordData } from '../types';
import { playPronunciation } from '../services/geminiService';

interface WordCardProps {
  data: WordData;
  onSave?: (data: WordData) => void;
  isSaved?: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({ data, onSave, isSaved }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    setIsPlaying(true);
    await playPronunciation(data.word);
    setTimeout(() => setIsPlaying(false), 1200);
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border-8 border-yellow-100 overflow-hidden transition-all p-2">
      <div className="bg-white rounded-[2.5rem] p-8">
        {/* 단어와 소리 버튼 */}
        <div className="flex flex-col items-center text-center mb-8">
          <h2 className="text-7xl font-black text-slate-800 mb-4 tracking-tight">{data.word}</h2>
          <button 
            onClick={handlePlay}
            disabled={isPlaying}
            className={`w-24 h-24 flex items-center justify-center rounded-full transition-all bubbly-button shadow-lg ${
              isPlaying ? 'bg-sky-100 text-sky-600 scale-110' : 'bg-sky-400 text-white hover:bg-sky-500 scale-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </button>
          <p className="text-2xl font-bold text-sky-200 mt-4 italic">/ {data.phonetic} /</p>
        </div>

        {/* 큰 뜻 풀이 */}
        <div className="bg-yellow-50 p-8 rounded-[2rem] border-4 border-yellow-100 text-center mb-6">
          <p className="text-5xl font-black text-slate-800">
            <span className="text-yellow-500 block text-2xl mb-2">무슨 뜻인가요?</span>
            {data.meaning_kr}
          </p>
        </div>

        {/* 예문 하나만 크게 */}
        <div className="bg-green-50 p-6 rounded-[2rem] border-4 border-green-100 text-center mb-8">
          <p className="text-2xl font-bold text-slate-700 leading-tight">"{data.example_en}"</p>
          <p className="text-xl text-green-600 font-bold mt-2">👉 {data.example_kr}</p>
        </div>

        {/* 가방에 넣기 버튼 */}
        {onSave && (
          <button 
            onClick={() => onSave(data)}
            disabled={isSaved}
            className={`w-full py-6 rounded-[2rem] text-2xl font-black transition-all bubbly-button flex items-center justify-center gap-3 ${
              isSaved ? 'bg-slate-100 text-slate-300' : 'bg-rose-400 text-white hover:bg-rose-500 shadow-rose-100 shadow-xl'
            }`}
          >
            {isSaved ? '가방에 쏙 들어갔어요! ✅' : '내 가방에 넣기 🎒'}
          </button>
        )}
      </div>
    </div>
  );
};
