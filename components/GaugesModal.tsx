import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUndo } from 'react-icons/fa';

import { Character, EmotionGauges } from '../lib/types';

interface GaugesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  isDarkMode: boolean;
  cheatMode: boolean;
  onGaugesChange: (newGauges: EmotionGauges) => void;
  onGaugesReset: () => void;
}

const gaugeColors: { [key in keyof EmotionGauges]: string } = {
  intimacy: '#ec4899',   // Pink
  trust: '#86efac',      // Green
  mood: '#fde047',       // Yellow
  dependence: '#a78bfa', // Purple
  excitement: '#f97316', // Orange
  jealousy: '#ef4444',   // Red
  curiosity: '#38bdf8',  // Sky Blue
  comfort: '#22c55e',    // Emerald Green
  pleasure: '#fb7185',    // Rose
};

const gaugeNames: { [key in keyof EmotionGauges]: string } = {
    intimacy: '親密度',
    trust: '信頼',
    mood: '気分',
    dependence: '依存度',
    excitement: 'ドキドキ',
    jealousy: '嫉妬',
    curiosity: '好奇心',
    comfort: '安心感',
    pleasure: '快楽',
};

const GaugeBar = ({ name, value, color, cheatMode, onEdit }: { name: string, value: number, color: string, cheatMode: boolean, onEdit: (value: number) => void }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-medium">{name}</span>
      <span className="text-sm font-bold" style={{ color }}>{value} / 100</span>
    </div>
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
      <div className="h-2.5 rounded-full transition-all duration-300 ease-in-out" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
    {!cheatMode && (
        <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onEdit(Number(e.target.value))}
            className="w-full h-2 mt-2 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
    )}
  </div>
);

const GaugesModal: React.FC<GaugesModalProps> = ({
  isOpen,
  onClose,
  character,
  isDarkMode,
  cheatMode,
  onGaugesChange,
  onGaugesReset,
}) => {
  const [editedGauges, setEditedGauges] = useState<EmotionGauges | null>(null);

  useEffect(() => {
    if (character) {
      setEditedGauges(character.gauges);
    }
  }, [character]);

  if (!isOpen || !character || !editedGauges) return null;

  const handleGaugeEdit = (key: keyof EmotionGauges, value: number) => {
    setEditedGauges(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSaveChanges = () => {
    if (editedGauges) {
        onGaugesChange(editedGauges);
        onClose();
    }
  };

  const handleReset = () => {
    onGaugesReset();
    onClose();
  };

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBgColor} ${textColor} p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{character.name}の感情ゲージ</h2>
          <button onClick={onClose} className={`p-1.5 rounded-full hover:${isDarkMode?'bg-slate-700/70':'bg-slate-200/70'} transition-colors`}>
            <FaTimes size={22} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-3 pb-2">
            {Object.keys(editedGauges).map((key) => (
                <GaugeBar
                    key={key}
                    name={gaugeNames[key as keyof EmotionGauges]}
                    value={editedGauges[key as keyof EmotionGauges]}
                    color={gaugeColors[key as keyof EmotionGauges]}
                    cheatMode={cheatMode}
                    onEdit={(value) => handleGaugeEdit(key as keyof EmotionGauges, value)}
                />
            ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
          <button
            onClick={handleReset}
            className={`flex items-center justify-center px-4 py-2 text-sm rounded-md border transition-colors ${isDarkMode ? 'border-red-500/50 text-red-400 hover:bg-red-500/20' : 'border-red-300 text-red-600 hover:bg-red-100'}`}
          >
            <FaUndo className="mr-2" />
            リセット
          </button>
          {!cheatMode && (
            <button
              onClick={handleSaveChanges}
              className={`flex items-center justify-center px-4 py-2 text-sm rounded-md text-white transition-colors bg-indigo-600 hover:bg-indigo-700`}
            >
              <FaSave className="mr-2" />
              変更を保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GaugesModal;
