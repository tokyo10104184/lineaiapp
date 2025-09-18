import React, { useState, useEffect } from 'react';
import { FaDownload, FaSync, FaUser, FaHeart } from 'react-icons/fa';
import { Character } from '../lib/types'; // Using full Character type for now

// A type for the card, which might have a subset of full character data
export type PublicCharacterCard = Pick<Character, 'id' | 'name' | 'description' | 'icon' | 'color' | 'use_gauges'> & {
  likes_count?: number;
  username: string | null;
};


interface MarketplaceProps {
  onImport: (characterId: string) => void;
  isDarkMode: boolean;
}

const Marketplace: React.FC<MarketplaceProps> = ({ onImport, isDarkMode }) => {
  const [characters, setCharacters] = useState<PublicCharacterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [likedCharacters, setLikedCharacters] = useState<Set<string>>(new Set());

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public-characters?sort_by=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }
      const data = await response.json();
      setCharacters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [sortBy]); // Re-fetch when sortBy changes

  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const panelBgColor = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
  const cardBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';

  const handleLike = async (charId: string) => {
    if (likedCharacters.has(charId)) {
      // Already liked in this session, do nothing.
      return;
    }

    // Optimistic UI update
    setCharacters(prev => prev.map(c =>
      c.id === charId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c
    ));
    setLikedCharacters(prev => new Set(prev).add(charId));

    try {
      await fetch(`/api/public-characters/${charId}/like`, { method: 'POST' });
    } catch (error) {
      console.error("Failed to register like:", error);
      // Optionally, revert the optimistic update here if the API call fails
    }
  };

  return (
    <div className={`h-full w-full ${panelBgColor} ${textColor} p-4 sm:p-6 flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">キャラクター広場</h1>
            <button onClick={fetchCharacters} disabled={loading} className="p-2 rounded-full hover:bg-slate-500/20 transition-colors disabled:opacity-50">
                <FaSync className={loading ? 'animate-spin' : ''} />
            </button>
        </div>

        <div className="flex space-x-1 border-b-2 border-slate-500/20 mb-4">
          <button
            onClick={() => setSortBy('newest')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${sortBy === 'newest' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            新着順
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${sortBy === 'popular' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            人気順
          </button>
        </div>

        {loading && <div className="text-center">読み込み中...</div>}
        {error && <div className="text-center text-red-500">エラー: {error}</div>}

        {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar p-2">
                {characters.map((char) => (
                    <div key={char.id} className={`rounded-lg shadow-lg flex flex-col ${cardBgColor}`}>
                        <div className="p-5 flex-grow">
                            <div className="flex items-start">
                                <div className="text-5xl w-16 h-16 mr-4 rounded-full flex items-center justify-center shadow-md flex-shrink-0" style={{ backgroundColor: char.color || '#A0AEC0' }}>
                                    {char.icon}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg truncate">{char.name}</h3>
                                    {char.username && (
                                        <p className="text-xs opacity-60 flex items-center mt-1">
                                            <FaUser className="mr-1.5" />
                                            {char.username}
                                        </p>
                                    )}
                                    <p className="text-sm opacity-80 mt-2 line-clamp-3">{char.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} mt-auto flex items-center justify-between gap-4`}>
                            <button
                                onClick={() => handleLike(char.id)}
                                disabled={likedCharacters.has(char.id)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${likedCharacters.has(char.id) ? 'text-pink-500 cursor-default' : `hover:bg-pink-500/10 hover:text-pink-400 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}`}
                                title="いいね！"
                            >
                                <FaHeart />
                                <span>{char.likes_count || 0}</span>
                            </button>
                            <button
                                onClick={() => onImport(char.id)}
                                className="flex-grow flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                            >
                                <FaDownload className="mr-2" />
                                インポート
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default Marketplace;
