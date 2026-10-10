import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaHeart, FaFire, FaRobot, FaEdit, FaUndo, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CREATOR_PERSONA_PROMPTS } from '../lib/prompts';

export type CreatorPersona = 'wholesome' | 'extreme' | 'erotic';

interface QuickCreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (persona: CreatorPersona, prompt: string, customSystemPrompt?: string) => void;
  isDarkMode: boolean;
  isGenerating: boolean;
  personaPrompts?: Record<CreatorPersona, string>;
  onSavePersonaPrompts?: (prompts: Record<CreatorPersona, string>) => void;
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
  personaPrompts,
  onSavePersonaPrompts,
}) => {
  const [step, setStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<CreatorPersona | null>(null);
  const [prompt, setPrompt] = useState('');
  const [promptsState, setPromptsState] = useState<Record<CreatorPersona, string>>({
    wholesome: CREATOR_PERSONA_PROMPTS.wholesome,
    extreme: CREATOR_PERSONA_PROMPTS.extreme,
    erotic: CREATOR_PERSONA_PROMPTS.erotic,
  });
  const [editingPersonaPrompt, setEditingPersonaPrompt] = useState<CreatorPersona | null>(null);
  const [showStep2PromptEditor, setShowStep2PromptEditor] = useState(false);

  useEffect(() => {
    if (personaPrompts) {
      setPromptsState({
        wholesome: personaPrompts.wholesome || CREATOR_PERSONA_PROMPTS.wholesome,
        extreme: personaPrompts.extreme || CREATOR_PERSONA_PROMPTS.extreme,
        erotic: personaPrompts.erotic || CREATOR_PERSONA_PROMPTS.erotic,
      });
    }
  }, [personaPrompts]);

  if (!isOpen) return null;

  const handlePersonaSelect = (persona: CreatorPersona) => {
    setSelectedPersona(persona);
    setStep(2);
  };

  const handlePromptChange = (persona: CreatorPersona, newPrompt: string) => {
    const updated = { ...promptsState, [persona]: newPrompt };
    setPromptsState(updated);
    if (onSavePersonaPrompts) {
      onSavePersonaPrompts(updated);
    }
  };

  const handleResetPrompt = (persona: CreatorPersona) => {
    const updated = { ...promptsState, [persona]: CREATOR_PERSONA_PROMPTS[persona] };
    setPromptsState(updated);
    if (onSavePersonaPrompts) {
      onSavePersonaPrompts(updated);
    }
  };

  const handleGenerateClick = () => {
    if (selectedPersona && prompt.trim()) {
      onGenerate(selectedPersona, prompt.trim(), promptsState[selectedPersona]);
    }
  };

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const inputBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const borderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBgColor} ${textColor} p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-y-auto custom-scrollbar`}>
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
                    {(Object.keys(CREATOR_PERSONAS) as CreatorPersona[]).map(key => {
                        const isEditingThis = editingPersonaPrompt === key;
                        const isDefault = promptsState[key] === CREATOR_PERSONA_PROMPTS[key];
                        return (
                          <div key={key} className={`p-4 rounded-lg border-2 flex flex-col justify-between transition-all ${isDarkMode ? 'border-slate-700 hover:border-indigo-500' : 'border-slate-200 hover:border-indigo-500'}`}>
                            <div>
                              <div onClick={() => handlePersonaSelect(key)} className="cursor-pointer">
                                <div className="text-4xl mb-3">{CREATOR_PERSONAS[key].icon}</div>
                                <h4 className="font-bold text-md flex items-center justify-between">
                                  {CREATOR_PERSONAS[key].name}
                                  {!isDefault && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded ml-1 font-normal">カスタム</span>}
                                </h4>
                                <p className="text-xs mt-1 opacity-80 mb-3">{CREATOR_PERSONAS[key].description}</p>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPersonaPrompt(isEditingThis ? null : key);
                                }}
                                className={`w-full py-1.5 px-2 text-xs rounded flex items-center justify-between ${
                                  isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-indigo-300' : 'bg-slate-100 hover:bg-slate-200 text-indigo-600'
                                } transition-colors`}
                              >
                                <span className="flex items-center"><FaEdit className="mr-1" /> プロンプト閲覧・編集</span>
                                {isEditingThis ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                              </button>

                              {isEditingThis && (
                                <div className="mt-3 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                                  <label className="block text-xs font-medium text-indigo-400">
                                    ペルソナプロンプト (システム指示)
                                  </label>
                                  <textarea
                                    value={promptsState[key]}
                                    onChange={(e) => handlePromptChange(key, e.target.value)}
                                    rows={5}
                                    className={`w-full p-2 border rounded text-xs shadow-sm resize-y ${inputBgColor} ${textColor} ${borderColor} focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                  />
                                  <div className="flex justify-between items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleResetPrompt(key)}
                                      disabled={isDefault}
                                      className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 flex items-center"
                                    >
                                      <FaUndo className="mr-1" size={10} /> デフォルトに戻す
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handlePersonaSelect(key)}
                                      className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                                    >
                                      この選択で進む
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                    })}
                </div>
            </div>
        )}

        {step === 2 && selectedPersona && (
            <div className="flex flex-col flex-1 space-y-4">
                <button onClick={() => setStep(1)} className="text-sm text-indigo-400 hover:underline self-start">← AI専門家を選び直す</button>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{CREATOR_PERSONAS[selectedPersona].icon}</span>
                    <span className="font-bold">{CREATOR_PERSONAS[selectedPersona].name}</span>
                    {promptsState[selectedPersona] !== CREATOR_PERSONA_PROMPTS[selectedPersona] && (
                      <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">カスタムプロンプト適用中</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-1">理想のキャラクター像を教えてください</h3>
                  <p className="text-sm opacity-80 mb-3">
                      性格、口調、年齢、外見、一人称、あなたとの関係、その他何でも自由に記述してください。<br/>
                      （例：明るくて少しドジな後輩。いつも俺のことを「センパイ」と呼んで慕ってくれる。）
                  </p>
                  <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="ここにキャラクターのイメージを入力..."
                      rows={4}
                      className={`w-full p-3 border rounded-lg shadow-sm resize-none ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowStep2PromptEditor(!showStep2PromptEditor)}
                    className={`w-full py-2 px-3 text-xs rounded-lg flex items-center justify-between ${
                      isDarkMode ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    } transition-colors`}
                  >
                    <span className="flex items-center font-medium">
                      <FaEdit className="mr-1.5 text-indigo-400" />
                      専門家のプロンプト（ペルソナ指示）を閲覧・編集
                    </span>
                    {showStep2PromptEditor ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                  </button>

                  {showStep2PromptEditor && (
                    <div className="mt-3 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-indigo-400">
                          {CREATOR_PERSONAS[selectedPersona].name} のシステムプロンプト
                        </label>
                        <button
                          type="button"
                          onClick={() => handleResetPrompt(selectedPersona)}
                          disabled={promptsState[selectedPersona] === CREATOR_PERSONA_PROMPTS[selectedPersona]}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-500 disabled:opacity-40 flex items-center"
                        >
                          <FaUndo className="mr-1" size={10} /> デフォルトに戻す
                        </button>
                      </div>
                      <textarea
                        value={promptsState[selectedPersona]}
                        onChange={(e) => handlePromptChange(selectedPersona, e.target.value)}
                        rows={5}
                        className={`w-full p-2.5 border rounded text-xs shadow-sm resize-y ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                    </div>
                  )}
                </div>

                <button
                    onClick={handleGenerateClick}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full mt-2 px-6 py-3 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 shadow-md disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center"
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
