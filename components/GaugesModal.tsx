import React from 'react';
import { FaTimes } from 'react-icons/fa';

import { Character } from '../lib/types';

interface GaugesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  isDarkMode: boolean;
}

const GaugeBar = ({ name, value, color }: { name: string, value: number, color: string }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-medium">{name}</span>
      <span className="text-sm font-bold" style={{ color }}>{value} / 100</span>
    </div>
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
      <div className="h-2.5 rounded-full" style={{ width: `${value}%`, backgroundColor: color }}></div>
    </div>
  </div>
);

const GaugesModal: React.FC<GaugesModalProps> = ({
  isOpen,
  onClose,
  character,
  isDarkMode,
}) => {
  if (!isOpen || !character) return null;

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';

  const gaugeColors = {
    intimacy: '#ec4899',
    trust: '#86efac',
    mood: '#fde047',
    dependence: '#a78bfa',
    excitement: '#f97316',
    jealousy: '#ef4444',
    curiosity: '#38bdf8',
    comfort: '#22c55e',
    pleasure: '#fb7185',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBgColor} ${textColor} p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{character.name}の感情ゲージ</h2>
          <button onClick={onClose} className={`p-1.5 rounded-full hover:${isDarkMode?'bg-slate-700/70':'bg-slate-200/70'} transition-colors`}>
            <FaTimes size={22} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
            <GaugeBar name="親密度" value={character.gauges.intimacy} color={gaugeColors.intimacy} />
            <GaugeBar name="信頼" value={character.gauges.trust} color={gaugeColors.trust} />
            <GaugeBar name="気分" value={character.gauges.mood} color={gaugeColors.mood} />
            <GaugeBar name="依存度" value={character.gauges.dependence} color={gaugeColors.dependence} />
            <GaugeBar name="ドキドキ" value={character.gauges.excitement} color={gaugeColors.excitement} />
            <GaugeBar name="嫉妬" value={character.gauges.jealousy} color={gaugeColors.jealousy} />
            <GaugeBar name="好奇心" value={character.gauges.curiosity} color={gaugeColors.curiosity} />
            <GaugeBar name="安心感" value={character.gauges.comfort} color={gaugeColors.comfort} />
            <GaugeBar name="快楽" value={character.gauges.pleasure} color={gaugeColors.pleasure} />
        </div>
      </div>
    </div>
  );
};

export default GaugesModal;
