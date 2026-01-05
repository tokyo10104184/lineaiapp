import React, { useEffect, useState } from 'react';

export const AgeVerificationModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isVerified = localStorage.getItem('age_verified');
    if (!isVerified) {
      setIsVisible(true);
    }
  }, []);

  const handleYes = () => {
    localStorage.setItem('age_verified', 'true');
    setIsVisible(false);
  };

  const handleNo = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-zinc-900 p-6 shadow-xl border border-zinc-800 text-center">
        <h2 className="text-xl font-bold text-white mb-6">
          あなたは18歳以上ですか？
        </h2>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleYes}
            className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            はい
          </button>
          <button
            onClick={handleNo}
            className="px-6 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white font-medium transition-colors"
          >
            いいえ
          </button>
        </div>
      </div>
    </div>
  );
};
