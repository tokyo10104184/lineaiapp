import React from 'react';
import { FaUserPlus, FaMagic } from 'react-icons/fa';

import { Character } from '../lib/types';

interface CharacterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onSelectCharacter: (characterId: string) => void;
  onCreateNew: () => void;
  onQuickCreate: () => void;
  isDarkMode: boolean;
}

const CharacterSelectionModal: React.FC<CharacterSelectionModalProps> = ({
  isOpen,
  onClose,
  characters,
  onSelectCharacter,
  onCreateNew,
  onQuickCreate,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const cardBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const cardHoverBgColor = isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBgColor} ${textColor} p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        <h2 className="text-3xl font-bold text-center mb-6">キャラクターを選択</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar p-2">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`rounded-lg p-4 text-center cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg ${cardBgColor} ${cardHoverBgColor}`}
              onClick={() => onSelectCharacter(char.id)}
            >
              <div
                className="text-6xl w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: char.color || '#A0AEC0' }}
              >
                {char.icon}
              </div>
              <h3 className="font-bold text-xl">{char.name}</h3>
              <p className="text-sm opacity-80 mt-1">{char.description}</p>
            </div>
          ))}
          <div
            className={`rounded-lg p-4 text-center cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center ${cardBgColor} ${cardHoverBgColor} border-2 border-dashed border-indigo-400/50`}
            onClick={onQuickCreate}
          >
            <div className="text-6xl w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 bg-opacity-50 text-indigo-400"
                 style={{backgroundColor: isDarkMode ? '#4a5568' : '#e2e8f0'}}>
              <FaMagic />
            </div>
            <h3 className="font-bold text-xl">クイック作成</h3>
            <p className="text-sm opacity-80 mt-1">AIにキャラクターを作ってもらう</p>
          </div>
          <div
            className={`rounded-lg p-4 text-center cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg flex flex-col items-center justify-center ${cardBgColor} ${cardHoverBgColor}`}
            onClick={onCreateNew}
          >
            <div className="text-6xl w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 bg-opacity-50"
                 style={{backgroundColor: isDarkMode ? '#4a5568' : '#e2e8f0'}}>
              <FaUserPlus />
            </div>
            <h3 className="font-bold text-xl">新規作成</h3>
            <p className="text-sm opacity-80 mt-1">自分だけのキャラクターを作る</p>
          </div>
        </div>
        <div className="text-center mt-6">
            <button onClick={onClose} className={`px-6 py-2 rounded-lg border ${isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'} transition-colors`}>
                閉じる
            </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectionModal;
