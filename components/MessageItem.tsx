import React, { useRef, useEffect } from 'react';
import { FaUserCircle, FaUndo, FaSave, FaRedo, FaPlay, FaEdit } from 'react-icons/fa';
import { Message, Character, Conversation } from '../lib/types';

interface MessageItemProps {
  msg: Message;
  currentChatFontSize: string;
  characters: Character[];
  currentConversation: Conversation | undefined;
  currentCharacterForNormalChat: Character | undefined;
  editingMessageId: string | null;
  editingMessageText: string;
  setEditingMessageText: (text: string) => void;
  handleCancelEditMessage: () => void;
  handleSaveEditMessage: () => void;
  handleEditMessage: (id: string, text: string) => void;
  handleRetry: (id: string) => void;
  handleContinueConversation: () => void;
  isSending: boolean;
  isDarkMode: boolean;
  lineThemeActive: boolean;
  isLineDark: boolean;
  effectiveTextColor: string;
  generalTextColor: string;
  generalInputFieldBgColor: string;
  generalBorderColor: string;
  timeAndReadStatusColor: string;
  allowAICustomTextColor: boolean;
  renderFormattedText: (text: string | undefined, allowCustomColor: boolean) => React.ReactNode;
  formatTime: (date: Date | string) => string;
}

const MessageItem = React.memo(({
  msg,
  currentChatFontSize,
  characters,
  currentConversation,
  currentCharacterForNormalChat,
  editingMessageId,
  editingMessageText,
  setEditingMessageText,
  handleCancelEditMessage,
  handleSaveEditMessage,
  handleEditMessage,
  handleRetry,
  handleContinueConversation,
  isSending,
  isDarkMode,
  lineThemeActive,
  isLineDark,
  effectiveTextColor,
  generalTextColor,
  generalInputFieldBgColor,
  generalBorderColor,
  timeAndReadStatusColor,
  allowAICustomTextColor,
  renderFormattedText,
  formatTime
}: MessageItemProps) => {
  if (msg.sender === 'system') {
    return (
      <div className="text-center my-2">
        <span className={`text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
          {msg.text}
        </span>
      </div>
    );
  }

  let characterForMessage: Character | null = null;
  let messageSenderIsUser = msg.sender === 'user';
  let justifyContentClass = 'justify-start';

  if (messageSenderIsUser) {
    justifyContentClass = 'justify-end';
  } else if (currentConversation?.isCharToCharConversation && currentConversation.participantCharacterIds) {
    characterForMessage = characters.find(c => c.id === msg.sender) || null;
    if (characterForMessage && currentConversation.participantCharacterIds[1] === msg.sender) {
      justifyContentClass = 'justify-end';
    } else {
      justifyContentClass = 'justify-start';
    }
  } else {
    characterForMessage = characters.find(c => c.id === msg.sender) || currentCharacterForNormalChat || null;
  }

  let bubbleClass = '';
  let messageTextColorClass = effectiveTextColor;
  let messageContainerClass = `max-w-[90%] sm:max-w-[85%] flex ${justifyContentClass === 'justify-end' ? 'flex-row-reverse' : 'flex-row'}`;
  let messageContentContainerClass = `flex ${justifyContentClass === 'justify-end' ? 'flex-row-reverse items-end' : 'flex-row items-end'} gap-2 w-full`;
  let messageWrapperDivClass = `flex ${justifyContentClass} mb-1.5 px-2 group relative`;

  if (lineThemeActive) {
    if (justifyContentClass === 'justify-end') {
      bubbleClass = `rounded-tr-none ${isLineDark ? 'bg-green-700 text-gray-100' : 'bg-[#90EE90] text-black'}`;
      messageTextColorClass = isLineDark ? 'text-gray-100' : 'text-black';
    } else {
      bubbleClass = `rounded-tl-none ${isLineDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-black'}`;
      messageTextColorClass = isLineDark ? 'text-slate-100' : 'text-black';
    }
    bubbleClass += ' relative rounded-xl px-3.5 py-2.5 shadow-md break-words min-w-[70px]';
  } else {
    bubbleClass = 'py-1';
    messageTextColorClass = generalTextColor;
    messageContainerClass = `w-full flex ${justifyContentClass === 'justify-end' ? 'flex-row-reverse' : 'flex-row'}`;
    messageContentContainerClass = `flex flex-col w-full ${justifyContentClass === 'justify-end' ? 'items-end' : 'items-start'}`;
    messageWrapperDivClass = `flex ${justifyContentClass} mb-2 group relative`;
  }

  const isCurrentlyEditingThisMessage = editingMessageId === msg.id;

  return (
    <div className={messageWrapperDivClass}>
      <div className={messageContainerClass}>
        <div className={`flex-shrink-0 self-start mt-1 ${justifyContentClass === 'justify-end' ? 'ml-2' : 'mr-2'}`}>
          {characterForMessage && !messageSenderIsUser ? (
            <div className="w-9 h-9 rounded-full shadow-sm overflow-hidden bg-gray-300 flex items-center justify-center">
               {characterForMessage.icon?.startsWith('data:') || characterForMessage.icon?.startsWith('http') ? (
                 <img src={characterForMessage.icon} alt={characterForMessage.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="text-3xl">{characterForMessage.icon || '👤'}</div>
               )}
            </div>
          ) : messageSenderIsUser ? (
            <div className={`text-2xl w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${lineThemeActive && !isLineDark ? 'bg-slate-200 text-slate-600' : (isDarkMode || (lineThemeActive && isLineDark) ? 'bg-slate-600 text-indigo-400' : 'bg-slate-300 text-indigo-500')}`}> <FaUserCircle /> </div>
          ) : null}
        </div>
        <div className={messageContentContainerClass}>
          {isCurrentlyEditingThisMessage ? (
            <div className={`w-full p-2 rounded-lg shadow-md ${isDarkMode ? 'bg-slate-600' : 'bg-slate-100'}`}>
              <textarea
                value={editingMessageText}
                onChange={(e) => setEditingMessageText(e.target.value)}
                className={`w-full p-2 border rounded-md text-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none`}
                rows={3}
                autoFocus
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button onClick={handleCancelEditMessage} className={`px-3 py-1 text-xs rounded-md border ${generalBorderColor} hover:bg-opacity-70 transition-colors ${generalTextColor} flex items-center`}>
                  <FaUndo className="mr-1" /> キャンセル
                </button>
                <button onClick={handleSaveEditMessage} className={`px-3 py-1 text-xs rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors flex items-center`}>
                  <FaSave className="mr-1" /> 保存
                </button>
              </div>
            </div>
          ) : (
            <div className={bubbleClass}>
              {msg.imageUrl && (<img src={msg.imageUrl} alt="送信された画像" className="max-w-full max-h-60 rounded-lg mb-2 cursor-pointer shadow-sm" onClick={() => window.open(msg.imageUrl, '_blank')} />)}
              {msg.text &&
                <div
                  className={`${messageTextColorClass} ${currentChatFontSize}`}
                >
                  {renderFormattedText(msg.text, allowAICustomTextColor && !lineThemeActive)}
                </div>
              }
              {!msg.text && msg.imageUrl && <span className={`${messageTextColorClass} italic text-xs`}>画像</span>}
            </div>
          )}

          {!isCurrentlyEditingThisMessage && !messageSenderIsUser && !currentConversation?.isGroupChat && !currentConversation?.isCharToCharConversation && (
            <div className={`mt-1 flex gap-2 ${justifyContentClass === 'justify-end' ? 'justify-end' : 'justify-start'} w-full`}>
              <button
                onClick={() => handleRetry(msg.id)}
                disabled={isSending}
                className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'text-slate-400 hover:text-slate-200 bg-slate-700/70 hover:bg-slate-600' : 'text-slate-500 hover:text-slate-700 bg-slate-200 hover:bg-slate-300'} transition-colors duration-150 opacity-80 hover:opacity-100`}
                title="この時点からAIの応答を再生成"
              >
                <FaRedo size={10} className="mr-1" />
                <span>再試行</span>
              </button>

              {!isSending && currentConversation?.messages[currentConversation.messages.length - 1]?.id === msg.id && (
                <button
                  onClick={() => handleContinueConversation()}
                  disabled={isSending}
                  className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'text-slate-400 hover:text-slate-200 bg-slate-700/70 hover:bg-slate-600' : 'text-slate-500 hover:text-slate-700 bg-slate-200 hover:bg-slate-300'} transition-colors duration-150 opacity-70 hover:opacity-100`}
                  title="AIに返信を続けさせる"
                >
                  <FaPlay size={10} className="mr-1" />
                  <span>生成を続ける</span>
                </button>
              )}
            </div>
          )}

          {!isCurrentlyEditingThisMessage && (
            <div className={`text-xs flex flex-col justify-end whitespace-nowrap ${justifyContentClass === 'justify-end' ? 'items-end' : 'items-start'} ${timeAndReadStatusColor} flex-shrink-0`}>
              {lineThemeActive && msg.sender === 'user' && (<span className={`mb-0.5 ${msg.isRead ? timeAndReadStatusColor : 'text-transparent'}`}> {msg.isRead ? '既読' : '送信済'} </span>)}
              <span>{formatTime(msg.timestamp)}</span>
              {msg.sender === 'user' && !currentConversation?.isCharToCharConversation && !isSending && (
                <button
                  onClick={() => handleEditMessage(msg.id, msg.text)}
                  className={`mt-1 p-1 rounded-full ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300'} transition-colors`}
                  title="編集"
                >
                  <FaEdit size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {characterForMessage && !messageSenderIsUser && !isCurrentlyEditingThisMessage && (
        <div className={`absolute -top-5 left-12 text-xs ${lineThemeActive ? (isLineDark ? 'text-slate-400' : 'text-slate-600') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')} opacity-90 px-1 truncate max-w-[200px]`}>
          {characterForMessage.name}
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
