import React, { useState } from 'react';
import { Message, Character, ChutesApiRequestBody } from '../lib/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FaMagic, FaCheck, FaUndo, FaTimes } from 'react-icons/fa';

interface AIMessageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  character: Character | null;
  onApplyEdit: (messageId: string, newText: string) => void;
  isDarkMode: boolean;
  model: string;
  provider?: string;
  apiKey?: string;
  cloudflareAccountId?: string;
}

type EditState = 'idle' | 'loading' | 'proposal' | 'error';

const EDIT_MESSAGE_SYSTEM_PROMPT = `You are an AI assistant that rewrites AI-generated chat messages according to the user's specific instructions.
Your goal is to modify the provided message while preserving the character's persona and tone.

Rules:
1. Output ONLY the rewritten message text.
2. Do NOT add any extra commentary, explanations, greetings, or preambles (e.g. do NOT say "Here is the rewritten text:").
3. Preserve the original language (Japanese unless instructed otherwise).
4. Clean any internal thinking tags if present.`;

const AIMessageEditModal: React.FC<AIMessageEditModalProps> = ({
  isOpen,
  onClose,
  message,
  character,
  onApplyEdit,
  isDarkMode,
  model,
  provider,
  apiKey,
  cloudflareAccountId,
}) => {
  const [instruction, setInstruction] = useState('');
  const [proposedText, setProposedText] = useState('');
  const [editState, setEditState] = useState<EditState>('idle');
  const [error, setError] = useState('');

  if (!isOpen || !message) return null;

  const handleGenerateProposal = async () => {
    if (!instruction.trim()) return;
    setEditState('loading');
    setError('');

    try {
      const messagesPayload: Array<{ role: string; content: string }> = [
        { role: 'system', content: EDIT_MESSAGE_SYSTEM_PROMPT },
      ];

      if (character?.systemPrompt) {
        messagesPayload.push({ role: 'system', content: character.systemPrompt });
      }

      const promptUserContent = `元メッセージ:
${message.text || '（画像メッセージ）'}

ユーザーからの編集指示:
${instruction}

(指示に従って元メッセージを作り替え、修正後のメッセージ本文のみを日本語で返答してください。)`;

      messagesPayload.push({ role: 'user', content: promptUserContent });

      const apiRequestBody: ChutesApiRequestBody = {
        model,
        messages: messagesPayload,
        temperature: 0.7,
        useCensorship: false,
        provider,
        apiKey,
        cloudflareAccountId,
        stream: false,
      };

      const response = await fetch('/api/chutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiRequestBody),
      });

      if (!response.ok) {
        let errMessage = 'AIによる編集の生成に失敗しました。';
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch {
          const text = await response.text();
          errMessage = text || errMessage;
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      let replyText = data.reply || '';

      // Clean thinking tags or codeblocks
      replyText = replyText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      if (replyText.startsWith('```')) {
        replyText = replyText.replace(/^```(?:[a-zA-Z]+)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      setProposedText(replyText);
      setEditState('proposal');
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました。');
      setEditState('error');
    }
  };

  const handleClose = () => {
    setInstruction('');
    setProposedText('');
    setEditState('idle');
    setError('');
    onClose();
  };

  const handleAccept = () => {
    if (proposedText && message) {
      onApplyEdit(message.id, proposedText);
      handleClose();
    }
  };

  const panelBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const inputBg = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-slate-300';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBg} ${textColor} p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold flex items-center">
            <FaMagic className="mr-3 text-indigo-400" />
            AIでメッセージを編集
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-slate-500/20">
            <FaTimes />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
          <div className={`p-3 rounded-md ${inputBg} ${borderColor} border`}>
            <p className="text-xs font-semibold opacity-70 mb-1">元メッセージ:</p>
            <p className="text-sm whitespace-pre-wrap">{message.text || '（画像メッセージ）'}</p>
          </div>

          {(editState === 'idle' || editState === 'error') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">編集のリクエスト / 指示:</label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="例: もっと優しく甘い口調にして、絵文字を追加して。"
                className={`h-28 ${inputBg} ${borderColor}`}
              />
            </div>
          )}

          {editState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm opacity-80">AIがメッセージの書き換え案を生成中です...</p>
            </div>
          )}

          {editState === 'error' && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <p className="font-semibold mb-1">エラーが発生しました:</p>
              <p>{error}</p>
            </div>
          )}

          {editState === 'proposal' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold opacity-70 mb-1">AIによる修正案:</p>
                <div className={`p-3 rounded-md border ${isDarkMode ? 'bg-slate-700/60 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{proposedText}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium opacity-70">さらに再調整したい場合（追加指示）:</label>
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="例: もう少し長めにして、最後に一言付け加えて。"
                  className={`h-20 ${inputBg} ${borderColor}`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end items-center space-x-3">
          {editState === 'idle' && (
            <Button onClick={handleGenerateProposal} disabled={!instruction.trim()}>
              <FaMagic className="mr-2" />
              提案を生成
            </Button>
          )}

          {editState === 'error' && (
            <Button onClick={handleGenerateProposal} disabled={!instruction.trim()}>
              <FaUndo className="mr-2" />
              再試行
            </Button>
          )}

          {editState === 'proposal' && (
            <>
              <Button onClick={handleGenerateProposal} variant="outline" disabled={!instruction.trim()}>
                <FaMagic className="mr-2" />
                追加指示で再生成
              </Button>
              <Button onClick={handleAccept}>
                <FaCheck className="mr-2" />
                この内容を適用
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMessageEditModal;
