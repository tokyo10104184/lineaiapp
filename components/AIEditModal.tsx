import React, { useState } from 'react';
import { Character } from '../lib/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FaMagic, FaCheck, FaUndo, FaTimes } from 'react-icons/fa';

interface AIEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  onApplyProposal: (proposedCharacter: Character) => void;
  isDarkMode: boolean;
  model: string;
}

type EditState = 'idle' | 'loading' | 'proposal' | 'error';

const AIEditModal: React.FC<AIEditModalProps> = ({ isOpen, onClose, character, onApplyProposal, isDarkMode, model }) => {
  const [instruction, setInstruction] = useState('');
  const [proposal, setProposal] = useState<Character | null>(null);
  const [editState, setEditState] = useState<EditState>('idle');
  const [error, setError] = useState('');

  const handleGenerateProposal = async () => {
    if (!instruction.trim() || !character) return;
    setEditState('loading');
    setError('');
    try {
      const response = await fetch('/api/ai-edit-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, instruction, model }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate proposal.');
      }
      const proposedCharacter = await response.json();
      setProposal(proposedCharacter);
      setEditState('proposal');
    } catch (err: any) {
      setError(err.message);
      setEditState('error');
    }
  };

  const handleClose = () => {
    setInstruction('');
    setProposal(null);
    setEditState('idle');
    setError('');
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

  if (!isOpen) return null;

  const renderDiff = (original: any, changed: any) => {
    if (!original) return null; // GUARD CLAUSE for the crash
    return Object.keys(original).map(key => {
      if (key === 'name' || key === 'description' || key === 'systemPrompt') {
        const originalValue = original[key as keyof Character];
        const changedValue = changed[key as keyof Character];
        if (originalValue !== changedValue) {
          return (
            <div key={key} className={`p-2 rounded-md ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className="text-xs font-semibold opacity-70 mb-1 capitalize">{key === 'systemPrompt' ? 'System Prompt' : key}</p>
              <p className="text-xs text-red-400 line-through">{String(originalValue)}</p>
              <p className="text-xs text-green-400">{String(changedValue)}</p>
            </div>
          );
        }
      }
      return null;
    }).filter(Boolean);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBg} ${textColor} p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold flex items-center"><FaMagic className="mr-3 text-indigo-400"/>AIによる編集</h3>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-slate-500/20"><FaTimes/></button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
          {editState === 'idle' && (
            <div className="space-y-4">
              <p>どのようにキャラクターを改善したいですか？ 具体的に指示してください。</p>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="例: もっとクールでミステリアスな性格にして。一人称は「私」で、丁寧語で話すように。"
                className={`h-32 ${inputBg} ${borderColor}`}
              />
            </div>
          )}

          {editState === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4">AIが提案を生成中です...</p>
            </div>
          )}

          {editState === 'error' && (
            <div className="text-center text-red-400">
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
