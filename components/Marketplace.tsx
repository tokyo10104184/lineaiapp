import React, { useState, useEffect } from 'react';
import { FaDownload, FaSync } from 'react-icons/fa';
import { Character } from '../lib/types'; // Using full Character type for now

// A type for the card, which might have a subset of full character data
export type PublicCharacterCard = Pick<Character, 'id' | 'name' | 'description' | 'icon' | 'color' | 'use_gauges'> & { likes_count?: number };


interface MarketplaceProps {
  onImport: (characterId: string) => void;
  isDarkMode: boolean;
}

const Marketplace: React.FC<MarketplaceProps> = ({ onImport, isDarkMode }) => {
  const [characters, setCharacters] = useState<PublicCharacterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/public-characters');
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
  }, []);

  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const panelBgColor = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
  const cardBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';

  return (
    <div className={`h-full w-full ${panelBgColor} ${textColor} p-4 sm:p-6 flex flex-col`}>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">キャラクター広場</h1>
            <button onClick={fetchCharacters} disabled={loading} className="p-2 rounded-full hover:bg-slate-500/20 transition-colors disabled:opacity-50">
                <FaSync className={loading ? 'animate-spin' : ''} />
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
                                    <p className="text-sm opacity-80 mt-1 line-clamp-3">{char.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} mt-auto`}>
                             <button
                                onClick={() => onImport(char.id)}
                                className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
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
