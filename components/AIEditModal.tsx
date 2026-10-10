import React, { useState, useEffect } from 'react';
import { Character } from '../lib/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FaMagic, FaCheck, FaUndo, FaTimes, FaEdit, FaChevronDown, FaChevronUp, FaRobot } from 'react-icons/fa';
import { CreatorPersona, CREATOR_PERSONAS } from './QuickCreateCharacterModal';
import { CREATOR_PERSONA_PROMPTS } from '../lib/prompts';

interface AIEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  onApplyProposal: (proposedCharacter: Character) => void;
  isDarkMode: boolean;
  model: string;
  provider?: string;
  apiKey?: string;
  cloudflareAccountId?: string;
  personaPrompts?: Record<CreatorPersona, string>;
  onSavePersonaPrompts?: (prompts: Record<CreatorPersona, string>) => void;
}

type EditState = 'idle' | 'loading' | 'proposal' | 'error';
type SelectedPersonaOption = 'standard' | CreatorPersona;

const AIEditModal: React.FC<AIEditModalProps> = ({
  isOpen,
  onClose,
  character,
  onApplyProposal,
  isDarkMode,
  model,
  provider,
  apiKey,
  cloudflareAccountId,
  personaPrompts,
  onSavePersonaPrompts,
}) => {
  const [instruction, setInstruction] = useState('');
  const [proposal, setProposal] = useState<Character | null>(null);
  const [editState, setEditState] = useState<EditState>('idle');
  const [error, setError] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<SelectedPersonaOption>('standard');
  const [promptsState, setPromptsState] = useState<Record<CreatorPersona, string>>({
    wholesome: CREATOR_PERSONA_PROMPTS.wholesome,
    extreme: CREATOR_PERSONA_PROMPTS.extreme,
    erotic: CREATOR_PERSONA_PROMPTS.erotic,
  });
  const [editingPersonaPrompt, setEditingPersonaPrompt] = useState<CreatorPersona | null>(null);

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

  const handleGenerateProposal = async () => {
    if (!instruction.trim() || !character) return;
    setEditState('loading');
    setError('');
    try {
      const expertPersonaPrompt = selectedPersona !== 'standard' ? promptsState[selectedPersona] : undefined;
      const response = await fetch('/api/ai-edit-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character,
          instruction,
          model,
          provider,
          apiKey,
          cloudflareAccountId,
          expertPersonaPrompt,
        }),
      });
      if (!response.ok) {
        let errMessage = 'Failed to generate proposal.';
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch {
          const text = await response.text();
          errMessage = text || errMessage;
        }
        throw new Error(errMessage);
      }
      const proposedCharacter = await response.json();
      setProposal(proposedCharacter);
      setEditState('proposal');
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました。');
      setEditState('error');
    }
  };

  const handleClose = () => {
    setInstruction('');
    setProposal(null);
    setEditState('idle');
    setError('');
    setSelectedPersona('standard');
    setEditingPersonaPrompt(null);
    onClose();
  };

  const handleAccept = () => {
    if (proposal) {
      onApplyProposal(proposal);
      handleClose();
    }
  };

  const panelBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const inputBg = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-slate-300';

  const renderDiff = (original: any, changed: any) => {
    if (!original) return null;
    const diffs = Object.keys(original).map(key => {
      if (key === 'name' || key === 'description' || key === 'systemPrompt') {
        const originalValue = original[key as keyof Character];
        const changedValue = changed[key as keyof Character];
        if (originalValue !== changedValue) {
          return (
            <div key={key} className={`p-2 rounded-md ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className="text-xs font-semibold opacity-70 mb-1 capitalize">{key === 'systemPrompt' ? 'System Prompt' : key}</p>
              <p className="text-xs text-red-400 line-through whitespace-pre-wrap">{String(originalValue)}</p>
              <p className="text-xs text-green-400 whitespace-pre-wrap">{String(changedValue)}</p>
            </div>
          );
        }
      }
      return null;
    }).filter(Boolean);

    if (diffs.length === 0) {
      return (
        <p className="text-sm opacity-80">変更箇所はありませんでした。</p>
      );
    }

    return diffs;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBg} ${textColor} p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold flex items-center"><FaMagic className="mr-3 text-indigo-400"/>AIによる編集</h3>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-slate-500/20"><FaTimes/></button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {editState === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">担当専門家を選択 (オプション)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedPersona('standard')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPersona === 'standard'
                        ? 'border-indigo-500 bg-indigo-50/10'
                        : isDarkMode ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold text-sm">
                      <FaRobot className="text-indigo-400" />
                      <span>標準アシスタント</span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">一般的なキャラクター編集指示に従います。</p>
                  </div>

                  {(Object.keys(CREATOR_PERSONAS) as CreatorPersona[]).map(key => {
                    const isSelected = selectedPersona === key;
                    const isEditingThis = editingPersonaPrompt === key;
                    const isDefault = promptsState[key] === CREATOR_PERSONA_PROMPTS[key];
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/10'
                            : isDarkMode ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div onClick={() => setSelectedPersona(key)} className="cursor-pointer">
                          <div className="flex items-center justify-between font-bold text-sm">
                            <span className="flex items-center space-x-2">
                              {CREATOR_PERSONAS[key].icon}
                              <span>{CREATOR_PERSONAS[key].name}</span>
                            </span>
                            {!isDefault && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-normal">カスタム</span>}
                          </div>
                          <p className="text-xs opacity-75 mt-1">{CREATOR_PERSONAS[key].description}</p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPersonaPrompt(isEditingThis ? null : key);
                            }}
                            className={`w-full py-1 px-2 text-xs rounded flex items-center justify-between ${
                              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-indigo-300' : 'bg-slate-100 hover:bg-slate-200 text-indigo-600'
                            } transition-colors`}
                          >
                            <span className="flex items-center"><FaEdit className="mr-1" /> プロンプト閲覧・編集</span>
                            {isEditingThis ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                          </button>

                          {isEditingThis && (
                            <div className="mt-2 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                              <label className="block text-[11px] font-medium text-indigo-400">
                                ペルソナプロンプト (システム指示)
                              </label>
                              <textarea
                                value={promptsState[key]}
                                onChange={(e) => handlePromptChange(key, e.target.value)}
                                rows={4}
                                className={`w-full p-2 border rounded text-xs shadow-sm resize-y ${inputBg} ${textColor} ${borderColor} focus:ring-1 focus:ring-indigo-500`}
                              />
                              <div className="flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => handleResetPrompt(key)}
                                  disabled={isDefault}
                                  className="text-[11px] text-slate-400 hover:text-slate-200 disabled:opacity-40 flex items-center"
                                >
                                  <FaUndo className="mr-1" size={9} /> デフォルトに戻す
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPersona(key);
                                    setEditingPersonaPrompt(null);
                                  }}
                                  className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] hover:bg-indigo-700"
                                >
                                  選択
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

              <div>
                <label className="block text-sm font-semibold mb-1">どのようなキャラクターに修正したいですか？</label>
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="例: もっとクールでミステリアスな性格にして。一人称は「私」で、丁寧語で話すように。"
                  className={`h-28 ${inputBg} ${borderColor}`}
                />
              </div>
            </div>
          )}

          {editState === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4">AIが提案を生成中です...</p>
            </div>
          )}

          {editState === 'error' && (
            <div className="text-center text-red-400 py-6">
              <p>エラーが発生しました:</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          )}

          {editState === 'proposal' && proposal && (
            <div>
              <h4 className="font-semibold mb-2">AIからの提案</h4>
              <div className="space-y-3">{renderDiff(character, proposal)}</div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end items-center space-x-3">
          {editState === 'idle' && (
            <Button onClick={handleGenerateProposal} disabled={!instruction.trim()}>
              <FaMagic className="mr-2"/>提案を生成
            </Button>
          )}
           {(editState === 'error' || editState === 'proposal') && (
            <>
                <Button onClick={handleGenerateProposal} variant="outline">
                    <FaUndo className="mr-2"/>やり直す
                </Button>
                <Button onClick={handleAccept}>
                    <FaCheck className="mr-2"/>この内容を適用
                </Button>
            </>
           )}
        </div>
      </div>
    </div>
  );
};

export default AIEditModal;
