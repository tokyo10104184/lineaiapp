import React, { useState } from 'react';
import { FaTimes, FaUser, FaHeart, FaFire, FaRobot } from 'react-icons/fa';

export type CreatorPersona = 'wholesome' | 'extreme' | 'erotic';

interface QuickCreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (persona: CreatorPersona, prompt: string) => void;
  isDarkMode: boolean;
  isGenerating: boolean;
}

const CREATOR_PERSONAS = {
    wholesome: {
      name: '健全恋愛専門家',
      description: '心温まる、ドキドキする健全な恋愛キャラクターを創作します。',
      icon: <FaHeart className="text-pink-400" />,
    },
    extreme: {
      name: 'ちょっと過激な設定の専門家',
      description: '少し危険で予測不可能な、スリリングな関係を築くキャラクターを創作します。',
      icon: <FaFire className="text-orange-500" />,
    },
    erotic: {
      name: '完全エロキャラ専門家',
      description: 'アダルトなシナリオに特化した、大胆で官能的なキャラクターを創作します。',
      icon: <FaUser className="text-red-500" />,
    },
};


const QuickCreateCharacterModal: React.FC<QuickCreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isDarkMode,
  isGenerating,
}) => {
  const [step, setStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<CreatorPersona | null>(null);
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handlePersonaSelect = (persona: CreatorPersona) => {
    setSelectedPersona(persona);
    setStep(2);
  };

  const handleGenerateClick = () => {
    if (selectedPersona && prompt.trim()) {
      onGenerate(selectedPersona, prompt.trim());
    }
  };

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const inputBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const borderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBgColor} ${textColor} p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">AIでキャラクターをクイック作成</h2>
          <button onClick={onClose} className={`p-1.5 rounded-full hover:${isDarkMode?'bg-slate-700/70':'bg-slate-200/70'} transition-colors`}>
            <FaTimes size={22} />
          </button>
        </div>

        {step === 1 && (
            <div>
                <h3 className="text-lg font-semibold mb-4 text-center">どの専門家にキャラクターを作ってもらいますか？</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(CREATOR_PERSONAS) as CreatorPersona[]).map(key => (
                        <div key={key} onClick={() => handlePersonaSelect(key)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isDarkMode ? 'border-slate-700 hover:border-indigo-500' : 'border-slate-200 hover:border-indigo-500'}`}>
                            <div className="text-4xl mb-3">{CREATOR_PERSONAS[key].icon}</div>
                            <h4 className="font-bold text-md">{CREATOR_PERSONAS[key].name}</h4>
                            <p className="text-xs mt-1 opacity-80">{CREATOR_PERSONAS[key].description}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="flex flex-col flex-1">
                <button onClick={() => setStep(1)} className="text-sm text-indigo-400 hover:underline mb-4 self-start">← AI専門家を選び直す</button>
                <h3 className="text-lg font-semibold mb-2">理想のキャラクター像を教えてください</h3>
                <p className="text-sm opacity-80 mb-4">
                    性格、口調、年齢、外見、一人称、あなたとの関係、その他何でも自由に記述してください。<br/>
                    （例：明るくて少しドジな後輩。いつも俺のことを「センパイ」と呼んで慕ってくれる。）
                </p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="ここにキャラクターのイメージを入力..."
                    className={`w-full flex-1 p-3 border rounded-lg shadow-sm resize-none ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                />
                <button
                    onClick={handleGenerateClick}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full mt-4 px-6 py-3 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 shadow-md disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isGenerating ? (
                        <>
                            <FaRobot className="animate-spin mr-2" />
                            生成中...
                        </>
                    ) : (
                        'プロンプトを生成'
                    )}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuickCreateCharacterModal;
