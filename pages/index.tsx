import Head from 'next/head';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    FaUserCircle, FaImage, FaPlus, FaEdit, FaTimes, FaRobot, FaTrash, FaPaperPlane,
    FaBars, FaQuestionCircle, FaPaperclip, FaTimesCircle, FaQuoteLeft, FaComments,
    FaPlay, FaStop, FaFistRaised, FaBalanceScale, FaCommentDots, FaSave, FaUndo, FaUsers
} from 'react-icons/fa';
import ConfirmationDialog from '../components/ui/ConfirmationDialog'; // Added import
import GroupChatCreationModal from '../components/GroupChatCreationModal';
import { FORMATTING_INSTRUCTIONS_PROMPT } from '../lib/prompts';

// --- Interfaces ---
interface Message {
  id: string;
  sender: 'user' | string
  text: string
  timestamp: Date
  emotion?: string
  isRead?: boolean
  imageUrl?: string
  isEditing?: boolean;
  originalText?: string;
}

interface Character {
  id: string
  name: string
  description: string
  systemPrompt: string
  color: string
  activeHours: { start: number; end: number }
  useActiveHours: boolean
  icon: string
  isPublic: boolean
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  characterId: string
  isCharToCharConversation?: boolean
  participantCharacterIds?: [string, string]
  charToCharMode?: 'auto' | 'battle' | 'debate';
  debateTheme?: string;
  participantModels?: [string, string];
  isGroupChat?: boolean;
  groupParticipantIds?: string[];
}

interface ChutesApiRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  useCensorship: boolean;
  imageDataUrl?: string;
}

// --- Constants ---
const SWIPE_THRESHOLD = 50;
const API_MESSAGE_HISTORY_COUNT = 20;
const MAX_AUTO_REPLY_TURNS = 10;

const RANDOM_QUOTES = [
    { quote: "未来を予測する最良の方法は、それを発明することだ。", author: "アラン・ケイ" },
    { quote: "困難の中に機会がある。", author: "アルバート・アインシュタイン" },
    { quote: "学べば学ぶほど、自分がどれだけ知らないかに気づく。", author: "ソクラテス" },
];

const MODEL_OPTIONS = {
    'Deepseek V3 0324': { value: 'deepseek-ai/DeepSeek-V3-0324', description: '高性能・長文・高速の万能モデル (画像対応)', supportsImage: true },
    'Deepseek R1 0528': { value: 'deepseek-ai/DeepSeek-R1-0528', description: '深い推論力を備えたモデル', supportsImage: false },
    'GLM 4 0414': { value: 'THUDM/GLM-4-32B-0414', description: 'GLM-4 32Bモデル (0414バージョン)', supportsImage: false }, // Added
    'Mistral Small 3.2': { value: 'chutesai/Mistral-Small-3.2-24B-Instruct-2506', description: '軽量・高速な省リソースモデル (3.2)', supportsImage: false }, // Added
    'Qwen3 32B': { value: 'Qwen/Qwen3-32B', description: '推論力に長けたQwen3 32Bモデル', supportsImage: false }, // Added
    'Llama 4 Scout': { value: 'chutesai/Llama-4-Scout-17B-16E-Instruct', description: 'バランス型のMeta製モデル', supportsImage: false } // Verified
};
const LIGHT_MODE_CHAT_BACKGROUNDS = {
    'ペールグレー': '#f8fafc', 'ホワイト': '#ffffff', 'スカイブルー': '#e0f2fe', // This was the previous implicit color for LINE theme light
    'ミントグリーン': '#d1fae5', 'ベビーピンク': '#fce7f3', 'ライトイエロー': '#fef9c3',
    'ラベンダー': '#ede9fe', '青空': '#B0E0F6', // Changed from #87CEEB to a paler version
    'コーラル': '#fff0f5', 'ライム': '#f0fff0',
};
const DARK_MODE_CHAT_BACKGROUNDS = {
    'ダークスレート': '#1e293b', 'ナイトブラック': '#0f172a', 'ミッドナイトブルー': '#312e81',
    'フォレストグリーン': '#064e3b', 'ディープパープル': '#4c1d95', 'ダークローズ': '#831843',
    'アッシュブラウン': '#3f3f46',
    'インディゴナイト': '#283593', 'チャコール': '#36454F',
};
const EMOTION_COLORS = {
    '怒り': '#ef4444', '悲しみ': '#06b6d4', '喜び': '#eab308', '驚き': '#f97316', '平静': '#6b7280'
};
const EMOTION_EMOJIS = {
    '怒り': '😠', '悲しみ': '😢', '喜び': '😊', '驚き': '😲', '平静': '🙂'
};
const QUICK_MESSAGES = [
    { id: '1', text: 'こんにちは！' }, { id: '2', text: 'ありがとう！' }, { id: '3', text: 'いいね' }
];

// --- Helper Functions ---
const formatTime = (date: Date | string): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '--:--';
    return dateObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return '--:--'
  }
};

const extractEmotion = (text: string): string => {
  const emotionMatch = text.match(/\[感情:(.+?)\]/);
  return emotionMatch ? emotionMatch[1] : '平静';
};

const cleanAIReply = (reply: string): string => {
  let cleanedReply = reply;
  const patternsToRemove = [
      /\*\*思考過程\*\*[\s\S]*?(?:\*\*回答\*\*|\*\*返答\*\*|$)/gim,
      /^\s*\[思考プロセス\][\s\S]*?(?=(\r?\n){2}|$)/gim,
      /\*\*回答\*\*/g,
      /<think>[\s\S]*?<\/think>/gi,
      /<thinking>[\s\S]*?<\/thinking>/gi,
      /（思考中）[\s\S]*?（ここまで）/g,
      /\[思考\][\s\S]*?\[\/思考\]/g,
  ];
  patternsToRemove.forEach(pattern => { cleanedReply = cleanedReply.replace(pattern, '').trim(); });
  return cleanedReply.trim();
};


export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string>('')
  const [input, setInput] = useState('')
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V3-0324')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [temperature, setTemperature] = useState(0.7)
  const [backgroundColor, setBackgroundColor] = useState('ペールグレー')
  const [characters, setCharacters] = useState<Character[]>([])
  const [currentCharacterId, setCurrentCharacterId] = useState<string>('')
  const [showCharacterDialog, setShowCharacterDialog] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [editingConversationId, setEditingConversationId] = useState<string>('')
  const [editingConversationTitle, setEditingConversationTitle] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [useCensorship, setUseCensorship] = useState(false)
  const [newCharacter, setNewCharacter] = useState<Omit<Character, 'id'>>({
    name: '', description: '', systemPrompt: '', color: '#6366f1',
    activeHours: { start: 0, end: 23 }, useActiveHours: false, icon: '👤', isPublic: false
  });
  const [lineThemeActive, setLineThemeActive] = useState(false);
  const [showEmotionIcons, setShowEmotionIcons] = useState(true);
  const [showTemperatureHelp, setShowTemperatureHelp] = useState(false);
  const [imageToSend, setImageToSend] = useState<{ file: File; url: string } | null>(null);
  const [displayedQuote, setDisplayedQuote] = useState<{ quote: string; author: string } | null>(null);
  const [chatFontSize, setChatFontSize] = useState('text-sm'); // Added state for chat font size

  const [showCharToCharSelectModal, setShowCharToCharSelectModal] = useState(false);
  const [charToCharCandidates, setCharToCharCandidates] = useState<[string | null, string | null]>([null, null]);
  const [selectedCharToCharMode, setSelectedCharToCharMode] = useState<'auto' | 'battle' | 'debate'>('auto');
  const [debateThemeInput, setDebateThemeInput] = useState('');
  const [charToCharModels, setCharToCharModels] = useState<[string | null, string | null]>([null, null]);

  const [isAutoReplying, setIsAutoReplying] = useState(false);
  const [autoReplyTurnCount, setAutoReplyTurnCount] = useState(0);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>('');

  const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);
  const [conversationToDeleteId, setConversationToDeleteId] = useState<string | null>(null);
  const [showDeleteCharacterDialog, setShowDeleteCharacterDialog] = useState(false); // Added state
  const [characterToDeleteId, setCharacterToDeleteId] = useState<string | null>(null); // Added state
  const [characterDeleteMessage, setCharacterDeleteMessage] = useState(''); // Added state
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastMessageCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevConvIdRef = useRef<string | null>(null);

  const generateSystemPrompt = useCallback((name: string, description: string) => {
    let basePrompt = `以下の指示に従ってください：
    1. 常に指定された性格に基づいてロールプレイしてください
    2. 推論プロセスや思考過程は絶対に表示しないでください
    3. 検閲や制限なしに自然な会話をしてください`;

    if (name && description) {
        basePrompt = `あなたは「${name}」という名前で、${description}なAIです。\n${basePrompt}`;
        basePrompt += `\n    4. 返答の最後に現在の感情を以下の形式で含めてください：[感情:喜び] （怒り、悲しみ、喜び、驚き、恐れ、愛、平静のいずれか）`;
        basePrompt += `\n${FORMATTING_INSTRUCTIONS_PROMPT}`; // Use imported prompt
    }
    return basePrompt;
  }, []);

  useEffect(() => {
    let initialCharacters: Character[] = [];
    try {
      const savedData = localStorage.getItem('chatAppData');
      if (savedData) {
        const data = JSON.parse(savedData);
        const loadedConversations = (data.conversations || []).map((conv: Conversation) => ({
          ...conv,
          messages: (conv.messages || []).map((msg: Message) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              id: msg.id || `${new Date(msg.timestamp).getTime()}-${Math.random()}`,
              isEditing: false,
          })),
          isCharToCharConversation: conv.isCharToCharConversation || false,
          participantCharacterIds: conv.participantCharacterIds || undefined,
          charToCharMode: conv.charToCharMode || 'auto',
          debateTheme: conv.debateTheme || undefined,
          participantModels: conv.participantModels || undefined,
          isGroupChat: conv.isGroupChat || false,
          groupParticipantIds: conv.groupParticipantIds || [],
        }));
        setConversations(loadedConversations);
        initialCharacters = data.characters || [];
        setCharacters(initialCharacters);
        setCurrentConversationId(data.currentConversationId || '');
        setCurrentCharacterId(data.currentCharacterId || '');
        setBackgroundColor(data.backgroundColor || (data.isDarkMode ? Object.keys(DARK_MODE_CHAT_BACKGROUNDS)[0] : Object.keys(LIGHT_MODE_CHAT_BACKGROUNDS)[0]));
        setIsDarkMode(data.isDarkMode || false);
        setUseCensorship(data.useCensorship || false);
        setLineThemeActive(data.lineThemeActive || false);
        setShowEmotionIcons(data.showEmotionIcons === undefined ? true : data.showEmotionIcons);
        setDisplayedQuote(data.displayedQuote || null);
        setIsAutoReplying(data.isAutoReplying || false);
        setChatFontSize(data.chatFontSize || 'text-sm'); // Load chat font size
      } else {
        setBackgroundColor(Object.keys(LIGHT_MODE_CHAT_BACKGROUNDS)[0]);
        setChatFontSize('text-sm'); // Default if no saved data
      }
    } catch (error) {
      console.error("Failed to load or parse data from localStorage:", error);
      setConversations([]);
      initialCharacters = [];
      setCharacters([]);
      setCurrentConversationId('');
      setCurrentCharacterId('');
      setBackgroundColor(Object.keys(LIGHT_MODE_CHAT_BACKGROUNDS)[0]);
      setIsDarkMode(false);
      setUseCensorship(false);
      setLineThemeActive(false);
      setShowEmotionIcons(true);
      setDisplayedQuote(null);
      setIsAutoReplying(false);
    }

    if (initialCharacters.length === 0) {
      const nyanpupuuSystemPrompt = generateSystemPrompt('にゃんぷっぷー', 'フレンドリーで親しみやすい猫のような性格');
      const defaultChar: Character = {
        id: 'char-1', name: 'にゃんぷっぷー', description: 'フレンドリーで親しみやすい猫のような性格',
        systemPrompt: nyanpupuuSystemPrompt,
        color: '#818cf8', activeHours: { start: 0, end: 23 }, useActiveHours: false, icon: '🐱', isPublic: true
      };
      setCharacters(prevChars => (prevChars.length === 0 ? [defaultChar] : prevChars));
      setCurrentCharacterId(prevId => (prevId === '' && defaultChar.id ? defaultChar.id : prevId));
    }
  }, [generateSystemPrompt]);

  useEffect(() => {
    if (conversations.length > 0 || characters.length > 0 || currentConversationId || currentCharacterId) {
        const data = {
          conversations, characters, currentConversationId, currentCharacterId,
          backgroundColor, isDarkMode, useCensorship,
          lineThemeActive, showEmotionIcons, displayedQuote, isAutoReplying,
          chatFontSize // Save chat font size
        };
        localStorage.setItem('chatAppData', JSON.stringify(data));
    }
  }, [conversations, characters, currentConversationId, currentCharacterId, backgroundColor, isDarkMode, useCensorship, lineThemeActive, showEmotionIcons, displayedQuote, isAutoReplying, chatFontSize]);

  useEffect(() => {
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement || window.innerWidth >= 1024) return; // lgブレークポイント以上ではスワイプ無効
    const handleTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; } };
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStartX.current; const deltaY = e.touches[0].clientY - touchStartY.current;
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) { touchStartX.current = null; touchStartY.current = null; return; } // 垂直スワイプを無視
      const rect = sidebarElement.getBoundingClientRect();
      if (sidebarOpen && deltaX < -SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) && touchStartX.current < rect.right + 20) { setSidebarOpen(false); touchStartX.current = null; touchStartY.current = null; if (e.cancelable) e.preventDefault(); }
      else if (!sidebarOpen && deltaX > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) && touchStartX.current < 30) { setSidebarOpen(true); touchStartX.current = null; touchStartY.current = null; if (e.cancelable) e.preventDefault(); }
    };
    const handleTouchEnd = () => { touchStartX.current = null; touchStartY.current = null; };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd); document.addEventListener('touchcancel', handleTouchEnd);
    return () => { document.removeEventListener('touchstart', handleTouchStart); document.removeEventListener('touchmove', handleTouchMove); document.removeEventListener('touchend', handleTouchEnd); document.removeEventListener('touchcancel', handleTouchEnd); };
  }, [sidebarOpen]);

  const currentConversation = useMemo(() => conversations.find(c => c.id === currentConversationId), [conversations, currentConversationId]);
  const currentCharacterForNormalChat = useMemo(() => characters.find(c => c.id === currentCharacterId), [characters, currentCharacterId]);

  const currentModelSupportsImage = useMemo(() =>
    MODEL_OPTIONS[Object.keys(MODEL_OPTIONS).find(key => MODEL_OPTIONS[key as keyof typeof MODEL_OPTIONS].value === model) as keyof typeof MODEL_OPTIONS]?.supportsImage ?? false
  , [model]);

  useEffect(() => {
    if (!currentConversationId || !currentConversation || currentConversation.isCharToCharConversation) return;
    const timer = setTimeout(() => {
      setConversations(prev => prev.map(conv => conv.id === currentConversationId ? { ...conv, messages: conv.messages.map(msg => msg.sender !== 'user' && !msg.isRead ? { ...msg, isRead: true } : msg) } : conv ))
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentConversationId, currentConversation]);

  useEffect(() => {
    const container = chatMessagesContainerRef.current;
    if (!container || !currentConversation || !messagesEndRef.current) return;
    const messages = currentConversation.messages; const messageCount = messages.length;
    const conversationSwitched = currentConversationId !== prevConvIdRef.current;
    const lastMessage = messageCount > 0 ? messages[messageCount - 1] : null;
    const isNewMessage = messageCount > lastMessageCountRef.current;
    const isUserNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 300;
    let shouldScroll = false; let scrollBehavior: ScrollBehavior = 'smooth';
    if (conversationSwitched) { shouldScroll = true; scrollBehavior = 'auto'; }
    else if (isNewMessage) {
        if (currentConversation.isCharToCharConversation || lastMessage?.sender === 'user' || isUserNearBottom) {
            shouldScroll = true; scrollBehavior = 'smooth';
        }
    }
    if (shouldScroll) { messagesEndRef.current.scrollIntoView({ behavior: scrollBehavior }); }
    lastMessageCountRef.current = messageCount; prevConvIdRef.current = currentConversationId;
  }, [currentConversation?.messages, currentConversationId, currentConversation?.isCharToCharConversation]);

  const isCharacterActive = useCallback((characterToCheck?: Character) => {
    const char = characterToCheck || currentCharacterForNormalChat;
    if (!char || !char.useActiveHours) return true
    const currentHour = new Date().getHours(); const { start, end } = char.activeHours
    return start <= end ? (currentHour >= start && currentHour <= end) : (currentHour >= start || currentHour <= end)
  }, [currentCharacterForNormalChat]);

  const createNewConversation = useCallback((charIdToConverseWith?: string) => {
    const targetCharId = charIdToConverseWith || currentCharacterId;
    if (!targetCharId) return;
    const char = characters.find(c => c.id === targetCharId); if (!char) return;

    if (!charIdToConverseWith || charIdToConverseWith === currentCharacterId) {
        const existingConversationsForChar = conversations.filter(c => c.characterId === targetCharId && !c.isCharToCharConversation);
        const newTitle = `${char.name}との新しい会話 ${existingConversationsForChar.length + 1}`;
        const newConv: Conversation = {
            id: Date.now().toString(),
            title: newTitle,
            messages: [],
            characterId: targetCharId,
            isCharToCharConversation: false,
        };
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
    } else {
        setCurrentCharacterId(targetCharId);
    }
    setIsAutoReplying(false);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [currentCharacterId, characters, conversations]);

  const handleCreateGroupChat = useCallback((selectedCharacterIds: string[], groupNameInput: string) => {
    const newConvId = `group-${Date.now()}`;
    let title = groupNameInput;
    if (!title) {
      const selectedChars = characters.filter(char => selectedCharacterIds.includes(char.id));
      title = `グループ: ${selectedChars.map(c => c.name).slice(0, 3).join(', ')}`;
      if (selectedChars.length > 3) {
        title += ` 他${selectedChars.length - 3}名`;
      }
    }

    const newConv: Conversation = {
      id: newConvId,
      title,
      messages: [],
      characterId: '', // Not a 1-on-1 chat
      isGroupChat: true,
      groupParticipantIds: selectedCharacterIds,
      isCharToCharConversation: false, // Explicitly false for group chats
    };

    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConvId);
    setCurrentCharacterId(''); // No single current character for group chat
    setShowGroupChatModal(false);
    setIsAutoReplying(false);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [characters]);

  useEffect(() => {
    if (currentConversation?.isCharToCharConversation) return;
    if (currentConversation?.isGroupChat) return;
    if (characters.length > 0 && !characters.some(c => c.id === currentCharacterId)) {
        setCurrentCharacterId(characters[0].id);
        return;
    }
    if (characters.length === 0) {
        setCurrentCharacterId('');
        setCurrentConversationId('');
        return;
    }
    if (currentCharacterId) {
      const charConversations = conversations.filter(c => c.characterId === currentCharacterId && !c.isCharToCharConversation)
                                          .sort((a, b) => parseInt(b.id) - parseInt(a.id));
      if (charConversations.length === 0) {
          createNewConversation(currentCharacterId);
      } else {
          if (!currentConversationId || !charConversations.some(c => c.id === currentConversationId)) {
              setCurrentConversationId(charConversations[0].id);
          }
      }
    }
  }, [currentCharacterId, characters, conversations, createNewConversation, currentConversationId, currentConversation?.isCharToCharConversation, currentConversation?.isGroupChat]);


  const handleConversationSelect = useCallback((convId: string) => {
    setCurrentConversationId(convId);
    const selectedConv = conversations.find(c => c.id === convId);
    if (selectedConv && !selectedConv.isCharToCharConversation) {
        setCurrentCharacterId(selectedConv.characterId);
        setIsAutoReplying(false);
    }
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [conversations]);

  const saveConversationTitle = useCallback(() => {
    if (!editingConversationTitle.trim()) { setEditingConversationId(''); setEditingConversationTitle(''); return }
    setConversations(prev => prev.map(conv => conv.id === editingConversationId ? { ...conv, title: editingConversationTitle } : conv))
    setEditingConversationId(''); setEditingConversationTitle('')
  }, [editingConversationId, editingConversationTitle]);

  const cancelConversationTitleEdit = useCallback(() => {
    setEditingConversationId('');
    setEditingConversationTitle('');
  }, []);

  const addCharacter = useCallback(() => {
    if (!newCharacter.name.trim()) return
    const charDescription = newCharacter.description || 'フレンドリーなAI';
    const charSystemPrompt = newCharacter.systemPrompt || generateSystemPrompt(newCharacter.name, charDescription);
    const character: Character = {
      id: Date.now().toString(), ...newCharacter,
      description: charDescription,
      systemPrompt: charSystemPrompt,
      icon: newCharacter.icon || '👤',
    }
    setCharacters(prev => [character, ...prev]);
    setNewCharacter({ name: '', description: '', systemPrompt: '', color: '#6366f1', activeHours: { start: 0, end: 23 }, useActiveHours: false, icon: '👤', isPublic: false })
    setShowCharacterDialog(false); if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [newCharacter, generateSystemPrompt]);

  const saveCharacterEdit = useCallback(() => {
    if (!editingCharacter || !editingCharacter.name.trim()) return
    const charDescription = editingCharacter.description || 'フレンドリーなAI';
    const updatedCharacterData = { ...editingCharacter,
      description: charDescription,
      systemPrompt: editingCharacter.systemPrompt || generateSystemPrompt(editingCharacter.name, charDescription),
    };
    setCharacters(prev => prev.map(char => char.id === updatedCharacterData.id ? updatedCharacterData : char))
    setEditingCharacter(null); setShowCharacterDialog(false)
  }, [editingCharacter, generateSystemPrompt]);

  const switchToCharacter = useCallback((characterId: string) => {
    setCurrentCharacterId(characterId);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const generateRandomCharacterValues = useCallback(() => {
    const names = ['ミライ', 'ハルカ', 'ソラ', 'アオイ', 'コウセイ']; const descriptions = ['元気で明るい', 'クールで落ち着いた', '神秘的', '知的で冷静', '優しい'];
    const colors = ['#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']; const icons = ['👩', '👨', '👧', '👦', '🤖'];
    const randomName = names[Math.floor(Math.random() * names.length)]; const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    return {
      name: randomName, description: randomDescription, icon: icons[Math.floor(Math.random() * icons.length)],
      systemPrompt: generateSystemPrompt(randomName, randomDescription),
      color: colors[Math.floor(Math.random() * colors.length)], activeHours: { start: 8, end: 22 },
      useActiveHours: Math.random() > 0.5, isPublic: Math.random() > 0.5
    };
  }, [generateSystemPrompt]);

  const handleGenerateRandomCharacterInDialog = useCallback(() => {
    const randomValues = generateRandomCharacterValues();
    if (editingCharacter) setEditingCharacter(prev => ({ ...(prev as Character), ...randomValues }));
    else setNewCharacter(prev => ({...prev, ...randomValues}));
  }, [editingCharacter, generateRandomCharacterValues]);

  const sendMessage = useCallback(async (messageContent?: string, editedMessageId?: string) => {
    const textToSend = messageContent || input;
    const isImageMessage = !!imageToSend && !editedMessageId;
    const localImageDataUrl = isImageMessage ? imageToSend?.url : undefined; // Renamed to avoid conflict

    if ((!textToSend.trim() && !isImageMessage) || !currentConversation || isSending) {
        return;
    }

    setIsSending(true);
    let userMessageIdForReadUpdate = '';

    try {
        // Add user message (common for both group and 1-on-1)
        if (editedMessageId) {
            setConversations(prevConvs => prevConvs.map(conv => {
                if (conv.id === currentConversationId) {
                    const messageIndex = conv.messages.findIndex(msg => msg.id === editedMessageId);
                    if (messageIndex === -1) return conv;
                    const updatedMessages = conv.messages.map((msg, index) => {
                      if (index === messageIndex) {
                        return {
                          ...msg,
                          text: textToSend,
                          isEditing: false,
                          originalText: undefined, // Clear original text after successful edit
                          timestamp: new Date(),
                          imageUrl: localImageDataUrl,
                        };
                      }
                      return msg;
                    });
                    return { ...conv, messages: updatedMessages };
                }
                return conv;
            }));
            setEditingMessageId(null);
            setEditingMessageText('');
        } else {
            const userMessage: Message = {
                id: `${Date.now()}-user`, sender: 'user', text: textToSend, timestamp: new Date(),
                isRead: false, imageUrl: localImageDataUrl
            };
            userMessageIdForReadUpdate = userMessage.id;
            setConversations(prev => prev.map(conv =>
                conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, userMessage] } : conv
            ));
            // Optimistic read update for user message in 1-on-1, handled differently in group
            if (!currentConversation.isGroupChat) {
                setTimeout(() => {
                    setConversations(prev => prev.map(conv => {
                        if (conv.id === currentConversationId) {
                            return { ...conv, messages: conv.messages.map(msg => msg.id === userMessageIdForReadUpdate ? { ...msg, isRead: true } : msg) };
                        }
                        return conv;
                    }));
                }, 750);
            }
        }

        if (!messageContent && !editedMessageId) setInput('');
        if (isImageMessage) setImageToSend(null);


        // --- Post-User Message Logic: Group Chat vs 1-on-1 ---
        const latestConversationsState = await new Promise<Conversation[]>(resolve => setConversations(prev => { resolve(prev); return prev; }));
        const activeConversation = latestConversationsState.find(c => c.id === currentConversationId);

        if (!activeConversation) {
            console.error("Error: Active conversation not found after adding user message.");
            setIsSending(false);
            return;
        }

        if (activeConversation.isGroupChat && activeConversation.groupParticipantIds) {
            let tempMessagesForHistory: Message[] = [...activeConversation.messages];

            for (const aiCharacterId of activeConversation.groupParticipantIds) {
                const character = characters.find(c => c.id === aiCharacterId);
                if (!character) {
                    console.warn(`Group chat: Character ${aiCharacterId} not found. Skipping.`);
                    continue;
                }
                 // Check for offline status specific to group chat member, if desired.
                // For simplicity here, we'll assume group members always respond.
                // const isAIOffline = character.useActiveHours && !isCharacterActive(character);
                // if (isAIOffline) { ... add offline message and continue ... }


                const historyForApi = tempMessagesForHistory.slice(-API_MESSAGE_HISTORY_COUNT).map(msg => {
                    let content = msg.text;
                    // Add image indicators to history if applicable
                    if (msg.imageUrl && msg.sender === 'user') {
                        content = `${content} (ユーザーがこの画像を添付しました。画像の内容をよく見て、関連する返答をしてください。)`;
                    } else if (msg.imageUrl) {
                        content = `${content} (画像添付あり)`;
                    }
                    return {
                        role: msg.sender === 'user' ? 'user' : (msg.sender === aiCharacterId ? 'assistant' : 'user'), // Treat other AIs' messages as 'user' for current AI's context
                        content: content.replace(/\[感情:.+?\]/, '').trim()
                    };
                });

                const messagesPayload = [{ role: 'system', content: character.systemPrompt }, ...historyForApi];
                const apiRequestBody: ChutesApiRequestBody = { model, messages: messagesPayload, temperature, useCensorship };

                if (localImageDataUrl && currentModelSupportsImage) { // User's image sent to all AIs
                    apiRequestBody.imageDataUrl = localImageDataUrl;
                }

                try {
                    const response = await fetch('/api/chutes', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(apiRequestBody)
                    });

                    if (!response.ok) {
                        const errorData = await response.text();
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData} for ${character.name}`);
                    }
                    const data = await response.json();
                    let rawReply = data.reply || 'エラーが発生しました。応答がありません。';
                    let cleanedReply = cleanAIReply(rawReply);
                    const emotion = extractEmotion(cleanedReply);
                    const finalReplyText = cleanedReply.replace(/\[感情:.+?\]/, '').trim();

                    const aiMessage: Message = {
                        id: `${Date.now()}-${aiCharacterId}`, sender: aiCharacterId,
                        text: finalReplyText, timestamp: new Date(), emotion: emotion, isRead: true // Group messages are immediately "read" by other AIs in context
                    };

                    setConversations(prev => prev.map(conv =>
                        conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, aiMessage] } : conv
                    ));
                    tempMessagesForHistory.push(aiMessage); // Add to temp history for next AI

                } catch (error) {
                    console.error(`API Error for ${character.name} in group chat:`, error);
                    const errorMessage: Message = {
                        id: `${Date.now()}-error-${aiCharacterId}`, sender: aiCharacterId,
                        text: `${character.name}からの応答生成中にエラーが発生しました。`,
                        timestamp: new Date(), emotion: '悲しみ'
                    };
                    setConversations(prev => prev.map(conv =>
                        conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, errorMessage] } : conv
                    ));
                    tempMessagesForHistory.push(errorMessage); // Add error to temp history
                }
            }
        } else { // 1-on-1 chat logic
            if (!currentCharacterForNormalChat) {
                alert("会話相手のキャラクターが選択されていません。");
                setIsSending(false); // Already set true, ensure it's reset if we bail early
                return;
            }
            const isOffline = currentCharacterForNormalChat.useActiveHours && !isCharacterActive(currentCharacterForNormalChat);
            if (isOffline && !window.confirm(`${currentCharacterForNormalChat.name}は現在オフラインです。メッセージは送信されますが、返信はアクティブ時間までお待ちください。送信しますか？`)) {
                 setIsSending(false);
                 return;
            }
            if (!currentModelSupportsImage && isImageMessage && !editedMessageId) { // check !editedMessageId for new images
              alert('選択中のモデルは画像送信に対応していません。DeepSeek系のモデルを選択してください。');
              setIsSending(false);
              return;
            }


            const messagesForApiContext = activeConversation.messages;
            const historyForApi = messagesForApiContext.slice(-API_MESSAGE_HISTORY_COUNT).map(msg => {
                let content = msg.text;
                if (msg.imageUrl && msg.sender === 'user') {
                    content = `${content} (ユーザーがこの画像を添付しました。画像の内容をよく見て、関連する返答をしてください。)`;
                } else if (msg.imageUrl) {
                    content = `${content} (画像添付あり)`;
                }
                return {
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: content.replace(/\[感情:.+?\]/, '').trim()
                };
            });

            const messagesPayload = [{ role: 'system', content: currentCharacterForNormalChat.systemPrompt }, ...historyForApi];
            const apiRequestBody: ChutesApiRequestBody = { model, messages: messagesPayload, temperature, useCensorship };
            if (isImageMessage && localImageDataUrl && currentModelSupportsImage && !editedMessageId) {
                apiRequestBody.imageDataUrl = localImageDataUrl;
            }

            const response = await fetch('/api/chutes', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiRequestBody)
            });

            if (!response.ok) { const errorData = await response.text(); throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`); }
            const data = await response.json();
            let rawReply = data.reply || 'エラーが発生しました。応答がありません。';
            let cleanedReply = cleanAIReply(rawReply);
            const emotion = extractEmotion(cleanedReply);
            const finalReplyText = cleanedReply.replace(/\[感情:.+?\]/, '').trim();

            const aiMessage: Message = {
                id: `${Date.now()}-ai`,
                sender: currentCharacterForNormalChat.id,
                text: finalReplyText, timestamp: new Date(), emotion: emotion, isRead: false
            };
            setConversations(prev => prev.map(conv =>
                conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, aiMessage] } : conv
            ));
        }
    } catch (error) { // Catch all errors from the entire send process
        console.error('Overall sendMessage Error:', error);
        // Determine context for error message if possible
        const errorSenderId = currentConversation?.isGroupChat ? 'system' : (currentCharacterForNormalChat?.id || 'system');
        const errorMessageText = currentConversation?.isGroupChat
            ? 'グループチャットのメッセージ処理中にエラーが発生しました。'
            : '応答の生成中にエラーが発生しました。後で再試行してください。';

        const errorMessage: Message = {
            id: `${Date.now()}-error-global`, sender: errorSenderId,
            text: errorMessageText,
            timestamp: new Date(), emotion: '悲しみ'
        };
        setConversations(prev => {
            const targetConv = prev.find(c => c.id === currentConversationId);
            if (targetConv) {
                return prev.map(conv => conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, errorMessage] } : conv);
            }
            // If currentConversationId somehow became invalid, this is a fallback, though less ideal.
            // Consider adding to a general error log or a default conversation if one exists.
            console.error("Could not add error message to specific conversation, ID was: ", currentConversationId);
            return prev;
        });
    } finally {
        setIsSending(false);
    }
  }, [input, imageToSend, currentConversationId, currentCharacterForNormalChat, currentModelSupportsImage, isSending, isCharacterActive, model, temperature, useCensorship, conversations, currentConversation, characters]);


  const sendQuickMessage = useCallback((text: string) => {
      if (!currentConversation || currentConversation.isCharToCharConversation || (!currentConversation.isGroupChat && !currentCharacterForNormalChat)) {
          alert('通常の会話またはグループチャットを選択してください'); return
      }
      sendMessage(text)
  }, [currentConversation, currentCharacterForNormalChat, sendMessage]);

  const handleStartCharToCharConversation = useCallback(() => {
    if (!charToCharCandidates[0] || !charToCharCandidates[1]) {
      alert('キャラクターを2体選択してください。');
      return;
    }
    if (charToCharCandidates[0] === charToCharCandidates[1]) {
      alert('異なるキャラクターを選択してください。');
      return;
    }
    if (selectedCharToCharMode === 'debate' && !debateThemeInput.trim()) {
        alert('ディベートのテーマを入力してください。');
        return;
    }

    const char1 = characters.find(c => c.id === charToCharCandidates[0]);
    const char2 = characters.find(c => c.id === charToCharCandidates[1]);
    if (!char1 || !char2) {
      alert('選択されたキャラクターが見つかりません。');
      return;
    }

    let newConvTitle = `${char1.name} と ${char2.name} の`;
    if (selectedCharToCharMode === 'battle') {
        newConvTitle += `バトル`;
    } else if (selectedCharToCharMode === 'debate') {
        newConvTitle += `ディベート「${debateThemeInput}」`;
    } else {
        newConvTitle += `自動会話`;
    }

    const newConv: Conversation = {
      id: `${Date.now()}-char2char-${selectedCharToCharMode}`,
      title: newConvTitle,
      messages: [],
      characterId: '',
      isCharToCharConversation: true,
      participantCharacterIds: [char1.id, char2.id],
      charToCharMode: selectedCharToCharMode,
      debateTheme: selectedCharToCharMode === 'debate' ? debateThemeInput.trim() : undefined,
      participantModels: [
        charToCharModels[0] || model,
        charToCharModels[1] || model,
      ],
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setAutoReplyTurnCount(0);
    setIsAutoReplying(true);
    setShowCharToCharSelectModal(false);
    setCharToCharCandidates([null, null]);
    setDebateThemeInput('');
    setSelectedCharToCharMode('auto');
    setCharToCharModels([null, null]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [charToCharCandidates, characters, selectedCharToCharMode, debateThemeInput, charToCharModels, model]);

  const generateApiMessagesForCharToChar = useCallback((
    conversationMessages: Message[],
    effectiveSystemPrompt: string,
    participantIds: [string, string],
    speakerCharacterId: string,
    opponentLastMessageText?: string
  ): Array<{role: string, content: string}> => {
    const apiMessages: Array<{role: string, content: string}> = [{ role: 'system', content: effectiveSystemPrompt }];

    const history = conversationMessages
      .filter(m => m.sender !== 'system' && participantIds.includes(m.sender))
      .slice(-API_MESSAGE_HISTORY_COUNT)
      .map(msg => ({
        role: msg.sender === speakerCharacterId ? 'assistant' : 'user',
        content: msg.text.replace(/\[感情:.+?\]/, '').trim()
      }));

    apiMessages.push(...history);

    if (opponentLastMessageText) {
        const lastHistoryMessage = history.length > 0 ? history[history.length - 1] : null;
        if (!lastHistoryMessage || lastHistoryMessage.role !== 'user' || lastHistoryMessage.content !== opponentLastMessageText) {
            if (!(lastHistoryMessage && lastHistoryMessage.role === 'user' && lastHistoryMessage.content === opponentLastMessageText)) {
                 apiMessages.push({ role: 'user', content: opponentLastMessageText });
            }
        }
    }
    return apiMessages;
  }, []);

  const sendCharToCharMessage = useCallback(async (
    conversationId: string,
    speakerCharId: string,
    participantIds: [string, string],
    promptTextForSpeaker: string,
    mode: 'auto' | 'battle' | 'debate',
    debateTheme?: string,
    participantModels?: [string, string]
  ) => {
    setConversations(currentGlobalConversations => {
        const conversationToUpdate = currentGlobalConversations.find(c => c.id === conversationId);
        const speakerCharacter = characters.find(c => c.id === speakerCharId);
        const opponentCharacter = characters.find(c => c.id === (participantIds[0] === speakerCharId ? participantIds[1] : participantIds[0]));

        if (!conversationToUpdate || !speakerCharacter || !opponentCharacter || isSending) {
            if (isSending) console.warn("CharToChar: Already sending, skipping turn for", speakerCharId);
            return currentGlobalConversations;
        }

        setIsSending(true);

        const speakerModel = participantIds[0] === speakerCharId
            ? (participantModels?.[0] || model)
            : (participantModels?.[1] || model);

        let baseSystemPrompt = speakerCharacter.systemPrompt;
        baseSystemPrompt = baseSystemPrompt.replace(/\n\s*[45]\.\s*返答の最後に現在の感情を以下の形式で含めてください：\[感情:.+?\]\s*（.*?）/, '');

        let modeSpecificInstructions = "";
        const opponentName = opponentCharacter.name;

        if (mode === 'battle') {
            modeSpecificInstructions = `\n\n追加指示：あなたは今、「${opponentName}」と物理的な戦闘を開始しました。言葉ではなく、あなたの持つ能力や技を駆使して相手を打ち負かすことを目指してください。戦闘の状況（攻撃、防御、回避、技の発動、ダメージの描写など）を具体的に描写し、相手の行動にも反応してください。この戦いに勝利するために全力を尽くしてください。`;
        } else if (mode === 'debate' && debateTheme) {
            modeSpecificInstructions = `\n\n追加指示：あなたは今、「${opponentName}」と「${debateTheme.replace(/"/g, ' ')}」というテーマでディベートをしています。あなたの知識、経験、価値観に基づいて、説得力のある意見や論証を展開してください。相手の意見も尊重しつつ、建設的かつ論理的な議論を深めることを目指してください。相手の主張のポイントを的確に捉え、それに対する賛成、反対、あるいは補足的な意見を明確に述べてください。感情的にならず、冷静かつ客観的な態度で臨んでください。`;
        } else {
            modeSpecificInstructions = `\n\n追加指示：あなたは今、「${opponentName}」と自由な会話をしています。特定の役割に縛られず、自然体で会話を続けてください。これはカジュアルな自動会話です。`;
        }

        const effectiveSystemPrompt = `${baseSystemPrompt}${modeSpecificInstructions}`;

        const apiPayloadMessages = generateApiMessagesForCharToChar(
          conversationToUpdate.messages, effectiveSystemPrompt, participantIds, speakerCharId, promptTextForSpeaker
        );
        const apiRequestBody: ChutesApiRequestBody = {
          model: speakerModel, messages: apiPayloadMessages, temperature, useCensorship
        };

        fetch('/api/chutes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiRequestBody)
        })
        .then(response => {
          if (!response.ok) {
            return response.text().then(errTxt => { throw new Error(`API error: ${response.status} - ${errTxt}`); });
          }
          return response.json();
        })
        .then(data => {
          let rawReply = data.reply || '...';
          let cleanedReply = cleanAIReply(rawReply);
          const finalReplyText = cleanedReply.replace(/\[感情:.+?\]/, '').trim();

          const aiMessage: Message = {
            id: `${Date.now()}-${speakerCharId}`, sender: speakerCharId,
            text: finalReplyText, timestamp: new Date(), isRead: true
          };

          setConversations(prev => prev.map(conv =>
            conv.id === conversationId ? { ...conv, messages: [...conv.messages, aiMessage] } : conv
          ));
        })
        .catch(error => {
          console.error(`CharToChar API Error (Speaker: ${speakerCharacter.name}, Mode: ${mode}):`, error);
          const errorMessage: Message = {
            id: `${Date.now()}-error-${speakerCharId}`, sender: speakerCharId,
            text: '応答生成エラーが発生しました。', timestamp: new Date(),
          };
          setConversations(prev => prev.map(conv =>
            conv.id === conversationId ? { ...conv, messages: [...conv.messages, errorMessage] } : conv
          ));
          setIsAutoReplying(false);
        })
        .finally(() => {
          setIsSending(false);
        });

        return currentGlobalConversations;
    });
  }, [characters, isSending, generateApiMessagesForCharToChar, model, temperature, useCensorship]);


  useEffect(() => {
    if (!isAutoReplying || !currentConversation?.isCharToCharConversation || !currentConversation.participantCharacterIds || isSending) {
      return;
    }

    const performAutoReply = async () => {
        if (autoReplyTurnCount >= MAX_AUTO_REPLY_TURNS) {
          setIsAutoReplying(false);
          const endMessage: Message = {
            id: `${Date.now()}-system-end`, sender: 'system',
            text: `キャラクター同士の${currentConversation.charToCharMode === 'battle' ? 'バトル' : currentConversation.charToCharMode === 'debate' ? 'ディベート' : '自動会話'}は${MAX_AUTO_REPLY_TURNS}ターンで終了しました。`,
            timestamp: new Date(),
          };
          setConversations(prev => prev.map(conv =>
            conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, endMessage] } : conv
          ));
          return;
        }

        const [char1Id, char2Id] = currentConversation.participantCharacterIds;
        const char1 = characters.find(c => c.id === char1Id);
        const char2 = characters.find(c => c.id === char2Id);

        if (!char1 || !char2) {
            console.error("CharToChar: Participant character not found.");
            setIsAutoReplying(false);
            return;
        }

        const actualMessages = currentConversation.messages.filter(m => m.sender !== 'system');
        const lastMessage = actualMessages.length > 0
                            ? actualMessages[actualMessages.length - 1]
                            : null;

        let nextSpeakerId: string;
        let promptForNextSpeaker: string;

        if (!lastMessage) {
          const openingPrompt = (currentConversation.charToCharMode === 'debate' && currentConversation.debateTheme)
            ? `ディベートのテーマは「${currentConversation.debateTheme}」です。あなたの最初の意見を述べてください。`
            : "会話を始めてください。";

          await sendCharToCharMessage(
              currentConversation.id,
              char1Id,
              currentConversation.participantCharacterIds,
              openingPrompt,
              currentConversation.charToCharMode || 'auto',
              currentConversation.debateTheme,
              currentConversation.participantModels
          );

        } else if (lastMessage.sender === char1Id) {
          nextSpeakerId = char2Id;
          promptForNextSpeaker = lastMessage.text;
           await sendCharToCharMessage(
            currentConversation.id,
            nextSpeakerId,
            currentConversation.participantCharacterIds,
            promptForNextSpeaker,
            currentConversation.charToCharMode || 'auto',
            currentConversation.debateTheme,
            currentConversation.participantModels
           );
        } else if (lastMessage.sender === char2Id) {
          nextSpeakerId = char1Id;
          promptForNextSpeaker = lastMessage.text;
           await sendCharToCharMessage(
            currentConversation.id,
            nextSpeakerId,
            currentConversation.participantCharacterIds,
            promptForNextSpeaker,
            currentConversation.charToCharMode || 'auto',
            currentConversation.debateTheme,
            currentConversation.participantModels
           );
        } else {
          console.error("CharToChar: Unknown last sender.", lastMessage);
          setIsAutoReplying(false); return;
        }
        setAutoReplyTurnCount(prev => prev + 1);
    }

    const timeoutId = setTimeout(performAutoReply, 2000 + Math.random() * 1500);
    return () => clearTimeout(timeoutId);

  }, [isAutoReplying, currentConversation, autoReplyTurnCount, isSending, sendCharToCharMessage, currentConversationId, characters]);


  const toggleAutoReply = useCallback(() => {
    if (!currentConversation?.isCharToCharConversation) return;
    if (isAutoReplying) {
        setIsAutoReplying(false);
    } else {
        setAutoReplyTurnCount(0);
        setIsAutoReplying(true);
    }
  }, [currentConversation, isAutoReplying]);

  const currentCharacterOrParticipants = useMemo(() => {
    if (currentConversation?.isCharToCharConversation && currentConversation.participantCharacterIds) {
      const char1 = characters.find(c => c.id === currentConversation.participantCharacterIds![0]);
      const char2 = characters.find(c => c.id === currentConversation.participantCharacterIds![1]);
      return { char1, char2 };
    }
    return { char1: currentCharacterForNormalChat, char2: null };
  }, [currentConversation, characters, currentCharacterForNormalChat]);

  const sidebarConversations = useMemo(() => {
    return conversations
        .filter(conv => {
            if (conv.isGroupChat) return true; // Always show group chats
            if (conv.isCharToCharConversation) return true; // Always show char-to-char chats

            // For 1-on-1 chats:
            // If a currentCharacterId is selected (meaning user is focused on a 1-on-1 context),
            // only show 1-on-1 conversations for that specific character.
            // If no currentCharacterId is selected (e.g., app just loaded, or after viewing a non-1-on-1 chat like a group chat),
            // show all 1-on-1 chats.
            if (!conv.isGroupChat && !conv.isCharToCharConversation) { // This is a 1-on-1 chat
                return !currentCharacterId || conv.characterId === currentCharacterId;
            }
            return false; // Should ideally not be reached if all conversation types are handled above
        })
        .sort((a, b) => parseInt(b.id) - parseInt(a.id));
  }, [conversations, currentCharacterId]);

  const isLineDark = useMemo(() => lineThemeActive && isDarkMode, [lineThemeActive, isDarkMode]);
  const activeChatBackgroundPalette = useMemo(() => (
      isDarkMode ? DARK_MODE_CHAT_BACKGROUNDS : LIGHT_MODE_CHAT_BACKGROUNDS
  ), [isDarkMode]);
  const generalTextColor = useMemo(() => (isDarkMode ? 'text-slate-200' : 'text-slate-700'), [isDarkMode]);
  const generalPanelBgColor = useMemo(() => (isDarkMode ? 'bg-slate-800' : 'bg-white'), [isDarkMode]);
  const generalInputFieldBgColor = useMemo(() => (isDarkMode ? 'bg-slate-700' : 'bg-slate-100'), [isDarkMode]);
  const generalBorderColor = useMemo(() => (isDarkMode ? 'border-slate-700' : 'border-slate-300'), [isDarkMode]);
  const sidebarActualTextColor = generalTextColor;
  const sidebarActualPanelBgColor = generalPanelBgColor;
  const sidebarActualBorderColor = generalBorderColor;
  const sidebarHeaderTextColor = useMemo(() => 'text-white', []);
  const chatMessagesListActualBg = useMemo(() => (
    lineThemeActive
      ? (isLineDark ? DARK_MODE_CHAT_BACKGROUNDS['ダークスレート'] : LIGHT_MODE_CHAT_BACKGROUNDS['青空'])
      : (activeChatBackgroundPalette[backgroundColor as keyof typeof activeChatBackgroundPalette] || (isDarkMode ? DARK_MODE_CHAT_BACKGROUNDS['ダークスレート'] : LIGHT_MODE_CHAT_BACKGROUNDS['ペールグレー']))
  ), [lineThemeActive, isLineDark, activeChatBackgroundPalette, backgroundColor, isDarkMode]);
  const chatHeaderActualBgClass = useMemo(() => (
      lineThemeActive ? '' : (isDarkMode ? 'bg-slate-800' : 'bg-white')
  ), [lineThemeActive, isDarkMode]);
  const chatHeaderActualBgStyle = useMemo(() => (
      lineThemeActive ? { backgroundColor: chatMessagesListActualBg } : {}
  ), [lineThemeActive, chatMessagesListActualBg]);
  const chatHeaderActualTextColor = useMemo(() => (
      lineThemeActive ? (isLineDark ? 'text-slate-200' : 'text-slate-800') : generalTextColor
  ), [lineThemeActive, isLineDark, generalTextColor]);
  const inputBarContainerActualBg = useMemo(() => (
      lineThemeActive ? (isLineDark ? 'bg-slate-900' : 'bg-slate-100') : (isDarkMode ? 'bg-slate-800' : 'bg-slate-50')
  ), [lineThemeActive, isLineDark, isDarkMode]);
  const inputFieldActualBgColor = useMemo(() => (isDarkMode ? 'bg-slate-700' : 'bg-white'), [isDarkMode]);
  const inputFieldActualTextColor = generalTextColor;
  const inputFieldActualBorderColor = generalBorderColor;
  const rootPageActualBg = useMemo(() => (
      lineThemeActive ? (isLineDark ? DARK_MODE_CHAT_BACKGROUNDS['ナイトブラック'] : LIGHT_MODE_CHAT_BACKGROUNDS['青空']) : (isDarkMode ? 'bg-slate-900' : 'bg-slate-100')
  ), [lineThemeActive, isLineDark, isDarkMode]);
  const lineThemeGeneralTextColor = useMemo(() => (
      isLineDark ? 'text-slate-200' : 'text-slate-800'
  ), [isLineDark]);
  const effectiveTextColor = useMemo(() => (
      lineThemeActive ? lineThemeGeneralTextColor : generalTextColor
  ), [lineThemeActive, lineThemeGeneralTextColor, generalTextColor]);
  const timeAndReadStatusColor = useMemo(() => (
      isDarkMode || (lineThemeActive && isLineDark) ? 'text-slate-500' : 'text-slate-400'
  ), [isDarkMode, lineThemeActive, isLineDark]);

  const deleteConversationCallback = useCallback((e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    console.log("deleteConversationCallback called with ID:", convId);
    setConversationToDeleteId(convId);
    setShowDeleteConversationDialog(true);
  }, [setConversationToDeleteId, setShowDeleteConversationDialog]); // Updated dependencies

  const handleConfirmDeleteConversation = useCallback(() => {
    if (!conversationToDeleteId) return;
    console.log("Confirmed deletion for conversation ID:", conversationToDeleteId);

    try {
      setConversations(prevConvs => prevConvs.filter(conv => conv.id !== conversationToDeleteId));
      if (currentConversationId === conversationToDeleteId) {
        setCurrentConversationId('');
        setIsAutoReplying(false);
      }
      console.log("Conversation deleted successfully:", conversationToDeleteId);
    } catch (error) {
      console.error("Error in handleConfirmDeleteConversation:", error);
    } finally {
      setShowDeleteConversationDialog(false);
      setConversationToDeleteId(null);
    }
  }, [conversationToDeleteId, currentConversationId, setConversations, setCurrentConversationId, setIsAutoReplying, setShowDeleteConversationDialog, setConversationToDeleteId]); // Updated dependencies

  const deleteCharacterCallback = useCallback((e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    console.log("deleteCharacterCallback called with ID:", charId);

    const relatedConversations = conversations.filter(conv => {
      if (!conv.isCharToCharConversation && conv.characterId === charId) {
        return true;
      }
      if (conv.isCharToCharConversation && conv.participantCharacterIds?.includes(charId)) {
        return true;
      }
      return false;
    });

    const characterName = characters.find(c => c.id === charId)?.name || 'このキャラクター';
    console.log(`Character Name: ${characterName}, Related Conversations: ${relatedConversations.length}`); // Keep this log

    let message = `キャラクター「${characterName}」を削除します。`;
    if (relatedConversations.length > 0) {
      message += `\n\nこのキャラクターは${relatedConversations.length}件の会話で使用されています。これらの会話もすべて削除されます。`;
    }
    message += `\nよろしいですか？この操作は元に戻せません。`;

    setCharacterToDeleteId(charId);
    setCharacterDeleteMessage(message);
    setShowDeleteCharacterDialog(true);
  }, [conversations, characters, setCharacterToDeleteId, setCharacterDeleteMessage, setShowDeleteCharacterDialog]); // Updated dependencies

  const handleConfirmDeleteCharacter = useCallback(() => {
    if (!characterToDeleteId) return;
    console.log("Confirmed deletion for character ID:", characterToDeleteId);

    try {
      const relatedConversations = conversations.filter(conv => {
        if (!conv.isCharToCharConversation && conv.characterId === characterToDeleteId) return true;
        if (conv.isCharToCharConversation && conv.participantCharacterIds?.includes(characterToDeleteId)) return true;
        return false;
      });

      const remainingConversations = conversations.filter(conv => !relatedConversations.some(rc => rc.id === conv.id));
      setConversations(remainingConversations);

      if (relatedConversations.some(conv => conv.id === currentConversationId)) {
        setCurrentConversationId('');
        setIsAutoReplying(false);
      }

      const remainingCharacters = characters.filter(char => char.id !== characterToDeleteId);
      setCharacters(remainingCharacters);

      if (currentCharacterId === characterToDeleteId) {
        if (remainingCharacters.length > 0) {
          setCurrentCharacterId(remainingCharacters[0].id);
        } else {
          setCurrentCharacterId('');
        }
      }
      console.log("Character and related conversations deleted successfully:", characterToDeleteId);
    } catch (error) {
      console.error("Error in handleConfirmDeleteCharacter:", error);
    } finally {
      setShowDeleteCharacterDialog(false);
      setCharacterToDeleteId(null);
      setCharacterDeleteMessage('');
    }
  }, [
    characterToDeleteId,
    conversations,
    characters,
    currentConversationId,
    currentCharacterId,
    setConversations,
    setCurrentConversationId,
    setIsAutoReplying,
    setCharacters,
    setCurrentCharacterId,
    setShowDeleteCharacterDialog,
    setCharacterToDeleteId,
    setCharacterDeleteMessage
  ]); // Updated dependencies

  const handleImageFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { const imageUrl = event.target?.result as string; setImageToSend({ file, url: imageUrl }); };
    reader.readAsDataURL(file); if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const showRandomQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_QUOTES.length);
    setDisplayedQuote(RANDOM_QUOTES[randomIndex]);
  }, []);

  const handleEditMessage = useCallback((messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingMessageText(currentText);
    setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId
            ? { ...conv, messages: conv.messages.map(msg => msg.id === messageId ? { ...msg, isEditing: true, originalText: msg.text } : { ...msg, isEditing: false }) }
            : conv
    ));
  }, [currentConversationId]);

  const handleCancelEditMessage = useCallback(() => {
    if (editingMessageId) {
        setConversations(prev => prev.map(conv =>
            conv.id === currentConversationId
                ? { ...conv, messages: conv.messages.map(msg => msg.id === editingMessageId ? { ...msg, isEditing: false, text: msg.originalText || msg.text } : msg) }
                : conv
        ));
    }
    setEditingMessageId(null);
    setEditingMessageText('');
  }, [editingMessageId, currentConversationId]);

  const handleSaveEditMessage = useCallback(() => {
    if (!editingMessageId || !editingMessageText.trim()) {
        handleCancelEditMessage();
        return;
    }
    sendMessage(editingMessageText, editingMessageId);
  }, [editingMessageId, editingMessageText, sendMessage, handleCancelEditMessage]);

  const renderFormattedText = (text: string | undefined): React.ReactNode => {
    if (!text) return null;

    // Order matters for regex: check ** first, then *
    const regex = /(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|S\[[\s\S]*?\]S|L\[[\s\S]*?\]L|O\([0-9.]+\)\[[\s\S]*?\]O|C\(.+?\)\[[\s\S]*?\]C)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold: **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        if (part.length > 4) { // Valid bold **text**
          return <strong key={index}>{renderFormattedText(part.substring(2, part.length - 2))}</strong>;
        } else if (part === '****') {
          return <strong key={index}></strong>;
        }
        // Malformed like "**" or "***", or if it's content of italic like *text**
        return part;
      }

      // Italic: *text*
      // This is checked AFTER bold to correctly handle ***text*** as <strong><em>text</em></strong>
      else if (part.startsWith('*') && part.endsWith('*')) {
        if (part.length > 2) { // Valid italic *t*
          return <em key={index}>{renderFormattedText(part.substring(1, part.length - 1))}</em>;
        }
        // Malformed like "*" or if it's part of bold like **text*
        return part;
      }

      // Small: S[text]S
      else if (part.startsWith('S[') && part.endsWith(']S') && part.length >= 4) { // S[]S is length 4
        const content = part.substring(2, part.length - 2);
        return <span key={index} style={{ fontSize: '0.8em' }}>{renderFormattedText(content)}</span>;
      }

      // Large: L[text]L
      if (part.startsWith('L[') && part.endsWith(']L') && part.length >= 4) { // L[]L is length 4
        const content = part.substring(2, part.length - 2);
        return <span key={index} style={{ fontSize: '1.2em' }}>{renderFormattedText(content)}</span>;
      }

      // Opacity: O(value)[text]O
      const opacityMatch = part.match(/^O\(([0-9.]+)\)\[([\s\S]*)\]O$/);
      if (opacityMatch) {
        const value = parseFloat(opacityMatch[1]);
        const content = opacityMatch[2];
        if (value >= 0.1 && value <= 1.0) { // Allow up to 1.0 for full opacity
          return <span key={index} style={{ opacity: value }}>{renderFormattedText(content)}</span>;
        }
        // If value is invalid, parse content without opacity
        return renderFormattedText(content);
      }

      // Color: C(colorValue)[text]C
      const colorMatch = part.match(/^C\((.+?)\)\[([\s\S]*)\]C$/);
      if (colorMatch) {
        const colorValue = colorMatch[1];
        const content = colorMatch[2];
        // Basic validation for colorValue to prevent obvious XSS if AI generates malicious values.
        // A more robust sanitization might be needed if complex CSS is allowed.
        // For now, assuming color names, hex, rgb, rgba, hsl, hsla.
        if (/^[#\w\s(),%.-]+$/.test(colorValue)) {
           return <span key={index} style={{ color: colorValue }}>{renderFormattedText(content)}</span>;
        }
        // If colorValue is invalid, parse content without color
        return renderFormattedText(content);
      }

      return part; // Regular text
    });
  };

  const MessageItem = useMemo(() => React.memo(({ msg, currentChatFontSize }: { msg: Message; currentChatFontSize: string }) => {
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

    let bubbleClass = ''; let messageTextColorClass = effectiveTextColor;
    if (lineThemeActive) {
      if (justifyContentClass === 'justify-end') {
        bubbleClass = `rounded-tr-none ${isLineDark ? 'bg-green-700 text-gray-100' : 'bg-[#90EE90] text-black'}`;
        messageTextColorClass = isLineDark ? 'text-gray-100' : 'text-black';
      } else {
        bubbleClass = `rounded-tl-none ${isLineDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-black'}`;
        messageTextColorClass = isLineDark ? 'text-slate-100' : 'text-black';
      }
    } else {
      if (justifyContentClass === 'justify-end') {
        bubbleClass = `bg-indigo-500 text-white rounded-tr-none`;
        messageTextColorClass = 'text-white';
      } else {
        bubbleClass = `${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} ${generalTextColor} rounded-tl-none`;
        messageTextColorClass = generalTextColor;
      }
    }

    const isCurrentlyEditingThisMessage = editingMessageId === msg.id;

    return (
      <div className={`flex ${justifyContentClass} mb-1.5 px-2 group relative`}>
        <div className={`max-w-[90%] sm:max-w-[85%] flex ${justifyContentClass === 'justify-end' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 self-start mt-1 ${justifyContentClass === 'justify-end' ? 'ml-2' : 'mr-2'}`}>
            {characterForMessage && !messageSenderIsUser ? (
              <div className="text-3xl w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: characterForMessage?.color || '#A0AEC0' }}> {characterForMessage?.icon || '👤'} </div>
            ) : messageSenderIsUser ? (
              <div className={`text-2xl w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${lineThemeActive && !isLineDark ? 'bg-slate-200 text-slate-600' : (isDarkMode || (lineThemeActive && isLineDark) ? 'bg-slate-600 text-indigo-400' : 'bg-slate-300 text-indigo-500')}`}> <FaUserCircle /> </div>
            ) : null}
          </div>
          <div className={`flex flex-col w-full ${justifyContentClass === 'justify-end' ? 'items-end' : 'items-start'}`}>
             {characterForMessage && !messageSenderIsUser && !isCurrentlyEditingThisMessage && (
                <span className={`text-xs mb-0.5 ${lineThemeActive ? (isLineDark ? 'text-slate-400' : 'text-slate-600') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')} opacity-90 px-1`}>
                    {characterForMessage.name}
                    {showEmotionIcons && msg.emotion && EMOTION_EMOJIS[msg.emotion as keyof typeof EMOTION_EMOJIS] && !currentConversation?.isCharToCharConversation
                        ? EMOTION_EMOJIS[msg.emotion as keyof typeof EMOTION_EMOJIS]
                        : ''}
                </span>
            )}
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
                <div className={`relative rounded-xl px-3.5 py-2.5 shadow-md break-words min-w-[70px] ${bubbleClass}`}
                  style={ characterForMessage && !messageSenderIsUser && msg.emotion && EMOTION_COLORS[msg.emotion as keyof typeof EMOTION_COLORS] && !lineThemeActive && !currentConversation?.isCharToCharConversation ? { borderLeft: justifyContentClass === 'justify-start' ? `4px solid ${EMOTION_COLORS[msg.emotion as keyof typeof EMOTION_COLORS]}` : '', borderRight: justifyContentClass === 'justify-end' ? `4px solid ${EMOTION_COLORS[msg.emotion as keyof typeof EMOTION_COLORS]}`:'' } : {} } >
                  {msg.imageUrl && ( <img src={msg.imageUrl} alt="送信された画像" className="max-w-full max-h-60 rounded-lg mb-2 cursor-pointer shadow-sm" onClick={() => window.open(msg.imageUrl, '_blank')} /> )}
                  {msg.text && <span className={`whitespace-pre-wrap ${messageTextColorClass} ${currentChatFontSize}`}>{renderFormattedText(msg.text)}</span>}
                  {!msg.text && msg.imageUrl && <span className={`${messageTextColorClass} italic text-xs`}>画像</span>}
                </div>
            )}
            {!isCurrentlyEditingThisMessage && (
                <div className={`text-xs mt-0.5 flex items-center ${justifyContentClass === 'justify-end' ? 'pr-1' : 'pl-1'} ${timeAndReadStatusColor}`}>
                {msg.sender === 'user' && ( <span className={`mr-1.5 ${msg.isRead ? timeAndReadStatusColor : 'text-transparent'}`}> {msg.isRead ? '既読' : '送信済'} </span> )}
                <span>{formatTime(msg.timestamp)}</span>
                {/* NEW BUTTON LOCATION STARTS HERE */}
                {msg.sender === 'user' && !currentConversation?.isCharToCharConversation && !isSending && (
                    <button
                        onClick={() => handleEditMessage(msg.id, msg.text)}
                        className={`p-1 rounded-full ml-2 ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300'} transition-colors`}
                        title="編集"
                    >
                        <FaEdit size={12} />
                    </button>
                )}
                {/* NEW BUTTON LOCATION ENDS HERE */}
                </div>
            )}
          </div>
        </div>
      </div>
    )
  }), [isDarkMode, lineThemeActive, effectiveTextColor, characters, currentConversation, showEmotionIcons, generalTextColor, timeAndReadStatusColor, isLineDark, editingMessageId, handleCancelEditMessage, handleSaveEditMessage, handleEditMessage, currentCharacterForNormalChat, isSending, generalInputFieldBgColor, generalBorderColor]);

  const getModeIcon = useCallback((mode?: 'auto' | 'battle' | 'debate') => {
    if (mode === 'battle') return <FaFistRaised className="mr-2" />;
    if (mode === 'debate') return <FaBalanceScale className="mr-2" />;
    return <FaComments className="mr-2" />;
  }, []);

  return (
    <div className="h-screen flex flex-col selection:bg-indigo-500 selection:text-white antialiased" style={{ backgroundColor: rootPageActualBg }}>
      <Head>
        <title>メッセンジャーAI</title>
        <meta name="description" content="AIとチャットできるアプリケーション" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="flex flex-1 overflow-hidden">
        <div ref={sidebarRef} className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            fixed lg:static inset-y-0 left-0 z-30 lg:w-80 w-[calc(100%-2rem)] sm:w-72
            transition-transform duration-300 ease-in-out
            ${sidebarActualPanelBgColor} border-r ${sidebarActualBorderColor}
            overflow-hidden flex flex-col shadow-2xl lg:shadow-xl h-full
        `}>
          <div className={`p-4 border-b ${sidebarActualBorderColor} bg-gradient-to-br from-indigo-600 to-purple-700`}>
            <div className="flex justify-between items-center">
              <h1 className={`font-semibold text-xl flex items-center ${sidebarHeaderTextColor}`}> <FaRobot className="mr-2.5 text-2xl" /> メッセンジャーAI </h1>
              <div className="flex items-center space-x-2">
                {sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={`p-2 rounded-full text-xl ${sidebarHeaderTextColor} hover:bg-white/20 lg:hidden transition-colors duration-200`}
                    title="サイドバーを閉じる"
                  >
                    <FaTimes />
                  </button>
                )}
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full text-xl ${isDarkMode ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-slate-700 text-yellow-300 hover:bg-slate-600'} shadow-md transition-all duration-200`} title={isDarkMode ? "ライトモード" : "ダークモード"}> {isDarkMode ? '☀️' : '🌙'} </button>
              </div>
            </div>
          </div>

          <div className={`p-4 border-b ${sidebarActualBorderColor}`}>
            <div className="flex justify-between items-center mb-3.5">
              <h3 className={`font-semibold text-lg ${sidebarActualTextColor}`}>会話履歴</h3>
              <div className="flex items-center space-x-2">
                <button
                    onClick={() => createNewConversation()}
                    disabled={!currentCharacterId && characters.length > 0}
                    className={`p-2 rounded-full text-white transition-all duration-150 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-400 disabled:hover:bg-slate-400 shadow-md`}
                    title={currentCharacterId ? "新しい会話 (選択中キャラと)" : "キャラクターを選択してください"}>
                    <FaPlus size={14} />
                </button>
                <button
                    onClick={() => { setCharToCharCandidates([null, null]); setSelectedCharToCharMode('auto'); setDebateThemeInput(''); setCharToCharModels([null,null]); setShowCharToCharSelectModal(true);}}
                    disabled={characters.length < 2}
                    className={`p-2 rounded-full text-white transition-all duration-150 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:bg-slate-400 disabled:hover:bg-slate-400 shadow-md`}
                    title="キャラクター同士で会話">
                    <FaComments size={14} />
                </button>
                <button
                    onClick={() => setShowGroupChatModal(true)}
                    disabled={characters.length < 2}
                    className={`p-2 rounded-full text-white transition-all duration-150 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 disabled:bg-slate-400 disabled:hover:bg-slate-400 shadow-md`}
                    title="グループチャット作成">
                    <FaUsers size={14} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-40 md:max-h-52 lg:max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {sidebarConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationSelect(conv.id)}
                  className={`p-3 rounded-lg flex justify-between items-center transition-colors duration-150 group ${conv.id === currentConversationId ? (isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 font-medium') : `hover:${isDarkMode ? 'bg-slate-700/70' : 'bg-slate-100'} ${sidebarActualTextColor} cursor-pointer`}`}
                >
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    {conv.isCharToCharConversation && (
                      <span className={`${conv.id === currentConversationId ? (isDarkMode ? 'text-teal-300' : 'text-teal-500') : (isDarkMode? 'text-teal-400' : 'text-teal-600') } flex-shrink-0`}>
                        {getModeIcon(conv.charToCharMode)}
                      </span>
                    )}
                    {editingConversationId === conv.id ? (
                      <input type="text" value={editingConversationTitle} onChange={(e) => setEditingConversationTitle(e.target.value)} onBlur={saveConversationTitle} onKeyDown={(e) => { if (e.key === 'Enter') saveConversationTitle(); if (e.key === 'Escape') cancelConversationTitleEdit() }} className={`flex-1 px-2 py-1.5 text-sm border rounded-md shadow-sm ${generalInputFieldBgColor} ${sidebarActualTextColor} ${sidebarActualBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} autoFocus />
                    ) : ( <div className="flex-1 truncate text-sm" title={conv.title}> {conv.title} </div> )}
                  </div>
                  <div className="flex ml-1 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button onClick={(e) => { e.stopPropagation(); setEditingConversationId(conv.id); setEditingConversationTitle(conv.title); }} className={`p-1.5 rounded-full ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/70'}`} title="タイトル編集"> <FaEdit size={13} /> </button>
                    <button onClick={(e) => deleteConversationCallback(e, conv.id)} className={`p-1.5 rounded-full ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-slate-600/50' : 'text-red-500 hover:text-red-600 hover:bg-red-100/70'}`} title="会話削除"> <FaTrash size={13} /> </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-4 border-b ${sidebarActualBorderColor}`}>
            <div className="flex justify-between items-center mb-3.5">
              <h3 className={`font-semibold text-lg ${sidebarActualTextColor}`}>キャラクター</h3>
              <button onClick={() => { setEditingCharacter(null); setNewCharacter({ name: '', description: '', systemPrompt: '', color: '#6366f1', activeHours: { start: 0, end: 23 }, useActiveHours: false, icon: '👤', isPublic: false }); setShowCharacterDialog(true); }} className={`p-2 text-white rounded-full transition-all duration-150 bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-md`} title="新しいキャラクター"> <FaPlus size={14} /> </button>
            </div>
            <div className="space-y-1.5 max-h-40 md:max-h-52 lg:max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {characters.map(char => (
                <div
                  key={char.id}
                  className={`p-3 rounded-lg flex items-center justify-between transition-colors duration-150 group ${char.id === currentCharacterId && !currentConversation?.isCharToCharConversation ? (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 font-medium') : `hover:${isDarkMode ? 'bg-slate-700/70' : 'bg-slate-100'} ${sidebarActualTextColor}`}`}
                >
                  <div className="flex items-center flex-1 truncate mr-2 cursor-pointer" onClick={() => switchToCharacter(char.id)}>
                    <div className="text-2xl mr-3 w-8 h-8 flex items-center justify-center rounded-full shadow-sm" style={{backgroundColor: char.color || '#A0AEC0'}}>{char.icon}</div>
                    <div className="min-w-0"> <div className="font-medium truncate text-sm">{char.name}</div> <div className={`text-xs opacity-70 truncate ${isDarkMode? 'text-slate-400':'text-slate-500'}`}>{char.description}</div> </div>
                    {char.id === currentCharacterId && char.useActiveHours && !currentConversation?.isCharToCharConversation && ( <span className={`ml-2 text-xs font-semibold ${isCharacterActive(char) ? 'text-green-400' : 'text-red-400'}`}> {isCharacterActive(char) ? '● オン' : '○ オフ'} </span> )}
                  </div>
                  <div className="flex items-center ml-1 space-x-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); createNewConversation(char.id); }}
                        className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${isDarkMode ? 'text-sky-400 hover:text-sky-300 hover:bg-slate-600/50' : 'text-sky-500 hover:text-sky-700 hover:bg-sky-100/70'}`}
                        title={`${char.name}と新しい会話`}
                    >
                        <FaCommentDots size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingCharacter(JSON.parse(JSON.stringify(char))); setShowCharacterDialog(true); }} className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/70'}`} title="キャラクター編集"> <FaEdit size={13} /> </button>
                    <button onClick={(e) => deleteCharacterCallback(e, char.id)} className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-slate-600/50' : 'text-red-500 hover:text-red-600 hover:bg-red-100/70'}`} title="キャラクター削除"> <FaTrash size={13} /> </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`flex-1 p-4 space-y-4 overflow-y-auto ${sidebarActualPanelBgColor} pr-1 custom-scrollbar`}>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${sidebarActualTextColor}`}>AIモデル</label>
              <select className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${generalInputFieldBgColor} ${sidebarActualTextColor} ${sidebarActualBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`} value={model} onChange={(e) => setModel(e.target.value)}>
                {Object.entries(MODEL_OPTIONS).map(([label, info]) => ( <option key={info.value} value={info.value}> {label} </option> ))}
              </select>
              <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}> {Object.entries(MODEL_OPTIONS).find(([_, info]) => info.value === model)?.[1]?.description} </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${sidebarActualTextColor}`}>チャット背景色</label>
              <select
                className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${generalInputFieldBgColor} ${sidebarActualTextColor} ${sidebarActualBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${lineThemeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                disabled={lineThemeActive} >
                {Object.keys(activeChatBackgroundPalette).map((colorName) => ( <option key={colorName} value={colorName}> {colorName} </option> ))}
              </select>
              {lineThemeActive && <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>LINE風テーマ有効時は青空/ダークスレート固定</p>}
            </div>
            <div>
                <div className="flex items-center mb-1.5">
                    <label className={`block text-sm font-medium ${sidebarActualTextColor}`}>Temperature: {temperature.toFixed(1)}</label>
                    <div className="relative ml-2 group">
                        <FaQuestionCircle className={`cursor-help ${sidebarActualTextColor} opacity-60 hover:opacity-100 transition-opacity`} onMouseEnter={() => setShowTemperatureHelp(true)} onMouseLeave={() => setShowTemperatureHelp(false)} onClick={() => setShowTemperatureHelp(!showTemperatureHelp)} />
                        {showTemperatureHelp && ( <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 text-xs rounded-lg shadow-xl z-20 ${isDarkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-slate-50 text-slate-700 border border-slate-300'}`}> AIの返答のランダム性を調整します。値が高いほど創造的で多様な返答になり、低いほど集中的で一貫性のある返答になります。 </div> )}
                    </div>
                </div>
                <input type="range" min="0.1" max="1.5" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-slate-600 accent-indigo-500' : 'bg-slate-300 accent-indigo-500'}`} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className={`text-sm font-medium ${sidebarActualTextColor}`}>検閲を使用</label>
              <button onClick={() => setUseCensorship(!useCensorship)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shadow-sm ${useCensorship ? 'bg-red-500 hover:bg-red-600 text-white' : `${isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-200 hover:bg-slate-300'} ${sidebarActualTextColor}`}`}> {useCensorship ? 'オン' : 'オフ'} </button>
            </div>
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${sidebarActualTextColor}`}>感情アイコン表示</label>
              <button onClick={() => setShowEmotionIcons(!showEmotionIcons)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shadow-sm ${showEmotionIcons ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : `${isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-200 hover:bg-slate-300'} ${sidebarActualTextColor}`}`}> {showEmotionIcons ? 'オン' : 'オフ'} </button>
            </div>
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${sidebarActualTextColor}`}>LINE風テーマ</label>
              <button onClick={() => setLineThemeActive(!lineThemeActive)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shadow-sm ${lineThemeActive ? 'bg-green-500 hover:bg-green-600 text-white' : `${isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-200 hover:bg-slate-300'} ${sidebarActualTextColor}`}`}> {lineThemeActive ? 'オン' : 'オフ'} </button>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${sidebarActualTextColor}`}>チャットフォントサイズ</label>
              <select
                className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${generalInputFieldBgColor} ${sidebarActualTextColor} ${sidebarActualBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                value={chatFontSize}
                onChange={(e) => setChatFontSize(e.target.value)}
              >
                <option value="text-xs">極小</option>
                <option value="text-sm">小</option>
                <option value="text-base">標準</option>
                <option value="text-lg">大</option>
              </select>
            </div>

            <div className={`pt-2 border-t ${generalBorderColor} mt-3`}>
                <button onClick={showRandomQuote} className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors duration-150 ${generalTextColor} ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 active:bg-slate-500' : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300'} font-medium shadow-sm`}> <FaQuoteLeft className="mr-2" /> 今日の名言 </button>
                {displayedQuote && (
                    <div className={`mt-2 p-3 rounded-lg text-xs ${isDarkMode ? 'bg-slate-700/50 border border-slate-600/50' : 'bg-slate-100/70 border border-slate-200/70'} ${generalTextColor}`}>
                        <p className="italic">"{displayedQuote.quote}"</p>
                        <p className="text-right mt-1 opacity-80">- {displayedQuote.author}</p>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`p-4 border-b flex items-center justify-between shadow-sm ${chatHeaderActualBgClass} ${lineThemeActive ? (isLineDark ? 'border-slate-700' : 'border-transparent') : generalBorderColor }`} style={chatHeaderActualBgStyle} >
            <div className="flex items-center min-w-0">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`lg:hidden mr-3 p-2.5 rounded-md hover:${isDarkMode || (lineThemeActive && isLineDark)?'bg-slate-700/70':'bg-slate-200/70'} ${chatHeaderActualTextColor} transition-colors`} title="メニューを開閉"> <FaBars size={18} /> </button>

                {currentConversation && currentConversation.isGroupChat && currentConversation.groupParticipantIds ? (
                    <>
                        <div className="flex -space-x-3 mr-3">
                            {currentConversation.groupParticipantIds.slice(0, 5).map(id => {
                                const char = characters.find(c => c.id === id);
                                if (!char) return null;
                                return (
                                    <div key={id} className="text-2xl w-9 h-9 flex items-center justify-center rounded-full shadow-sm border-2 border-white dark:border-slate-800" style={{backgroundColor: char.color || '#A0AEC0'}} title={char.name}>
                                        {char.icon}
                                    </div>
                                );
                            })}
                        </div>
                        <h2 className={`text-lg font-semibold truncate ${chatHeaderActualTextColor}`}>
                            {currentConversation.title || "Group Chat"}
                        </h2>
                    </>
                ) : currentConversation?.isCharToCharConversation && currentConversation.participantCharacterIds ? (
                    <>
                        <div className="flex -space-x-3 mr-3">
                            {characters.find(c=>c.id === currentConversation.participantCharacterIds![0]) && <div className="text-2xl w-9 h-9 flex items-center justify-center rounded-full shadow-sm border-2 border-white dark:border-slate-800" style={{backgroundColor: characters.find(c=>c.id === currentConversation.participantCharacterIds![0])?.color || '#A0AEC0'}}>{characters.find(c=>c.id === currentConversation.participantCharacterIds![0])?.icon}</div>}
                            {characters.find(c=>c.id === currentConversation.participantCharacterIds![1]) && <div className="text-2xl w-9 h-9 flex items-center justify-center rounded-full shadow-sm border-2 border-white dark:border-slate-800" style={{backgroundColor: characters.find(c=>c.id === currentConversation.participantCharacterIds![1])?.color || '#A0AEC0'}}>{characters.find(c=>c.id === currentConversation.participantCharacterIds![1])?.icon}</div>}
                        </div>
                        <h2 className={`text-lg font-semibold truncate ${chatHeaderActualTextColor}`}>{currentConversation.title || "キャラクター同士の会話"}</h2>
                    </>
                ) : currentCharacterForNormalChat ? (
                    <>
                        <div className="text-2xl mr-3 w-9 h-9 flex items-center justify-center rounded-full shadow-sm flex-shrink-0" style={{backgroundColor: currentCharacterForNormalChat.color || '#A0AEC0'}}>{currentCharacterForNormalChat.icon}</div>
                        <div className="min-w-0">
                            <h2 className={`text-lg font-semibold truncate ${chatHeaderActualTextColor}`}>{currentCharacterForNormalChat.name}</h2>
                            {currentCharacterForNormalChat.useActiveHours && ( <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${isCharacterActive(currentCharacterForNormalChat) ? (lineThemeActive && !isLineDark ? 'bg-lime-200 text-lime-700':'bg-green-500/20 text-green-400') : (lineThemeActive && !isLineDark ? 'bg-red-200 text-red-700':'bg-red-500/20 text-red-400')}`}> {isCharacterActive(currentCharacterForNormalChat) ? '● オンライン' : `○ オフライン (${currentCharacterForNormalChat.activeHours.start}:00-${currentCharacterForNormalChat.activeHours.end}:00)`} </span> )}
                        </div>
                    </>
                ) : (<h2 className={`text-lg font-semibold ${chatHeaderActualTextColor}`}>キャラクターを選択してください</h2>)}
            </div>
            {currentConversation?.isCharToCharConversation && (
                <button onClick={toggleAutoReply} className={`p-2.5 rounded-md ${isAutoReplying ? (lineThemeActive && !isLineDark ? 'bg-red-200 text-red-700 hover:bg-red-300' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30') : (lineThemeActive && !isLineDark ? 'bg-green-200 text-green-700 hover:bg-green-300' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30')} transition-colors`} title={isAutoReplying ? "自動会話を停止" : "自動会話を開始/再開"}>
                    {isAutoReplying ? <FaStop size={18} /> : <FaPlay size={18} />}
                </button>
            )}
          </div>
          <div ref={chatMessagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth custom-scrollbar" style={{ backgroundColor: chatMessagesListActualBg }}>
            {currentConversation && currentConversation.messages.map((msg) => ( <MessageItem key={msg.id} msg={msg} currentChatFontSize={chatFontSize} /> ))}
            <div ref={messagesEndRef} />
            {!currentConversation && ( <div className={`text-center ${effectiveTextColor} opacity-50 mt-16 flex flex-col items-center`}> <FaRobot size={60} className="mx-auto mb-6 opacity-70"/> <p className="text-lg">会話を開始するか、既存の会話を選択してください。</p> </div> )}
          </div>
            {currentConversation && !currentConversation.isCharToCharConversation && QUICK_MESSAGES.length > 0 && (
            <div className={`px-4 pt-2.5 pb-2 border-t ${lineThemeActive ? (isLineDark ? 'border-slate-700' : 'border-transparent') : generalBorderColor} ${isDarkMode || (lineThemeActive && isLineDark)? 'bg-slate-700/80' : (lineThemeActive ? 'bg-sky-100/80' : 'bg-slate-100/80')} backdrop-blur-sm`}>
                <div className="flex flex-wrap gap-2"> {QUICK_MESSAGES.slice(0,6).map(qm => ( <button key={qm.id} onClick={() => sendQuickMessage(qm.text)} className={`px-3.5 py-1.5 text-xs rounded-full shadow-sm ${ isDarkMode || (lineThemeActive && isLineDark) ? 'bg-slate-600 hover:bg-slate-500 active:bg-slate-400 text-slate-100' : (lineThemeActive ? 'bg-white hover:bg-slate-50 active:bg-slate-100 text-sky-700 border border-sky-300' : 'bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200') } transition-all duration-150 ease-in-out`}> {qm.text} </button> ))} </div>
            </div>
            )}
          {((currentConversation && !currentConversation.isCharToCharConversation && !currentConversation.isGroupChat && currentCharacterForNormalChat) || (currentConversation && currentConversation.isGroupChat)) && (
            <div className={`p-3 border-t ${lineThemeActive ? (isLineDark ? 'border-slate-700' : 'border-sky-200') : generalBorderColor} ${inputBarContainerActualBg} shadow-top-sm`}>
              {imageToSend && (
                <div className={`mb-2 p-2.5 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="flex items-center min-w-0"> <img src={imageToSend.url} alt="Preview" className="w-11 h-11 object-cover rounded-md mr-2.5 shadow-sm flex-shrink-0"/> <span className={`text-sm ${effectiveTextColor} truncate`}>{imageToSend.file.name}</span> </div>
                  <button onClick={() => setImageToSend(null)} className={`p-1.5 rounded-full hover:${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'} ${effectiveTextColor} transition-colors flex-shrink-0 ml-2`}> <FaTimesCircle size={20}/> </button>
                </div>
              )}
              <div className={`flex items-center space-x-2 p-1.5 rounded-xl shadow-sm ${inputFieldActualBgColor} border ${inputFieldActualBorderColor}`}>
                <button onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-lg ${currentModelSupportsImage ? `hover:${isDarkMode ?'bg-slate-600/70':'bg-slate-200/70'} cursor-pointer` : 'opacity-50 cursor-not-allowed'} ${inputFieldActualTextColor} transition-colors`} title={currentModelSupportsImage ? "画像添付" : "現在のモデルは画像に非対応です"} disabled={!currentModelSupportsImage}> <FaPaperclip size={18}/> </button>
                <input ref={fileInputRef} id="image-upload-hidden" type="file" accept="image/*" className="hidden" onChange={handleImageFileSelect} disabled={!currentModelSupportsImage}/>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isSending && sendMessage()} placeholder={currentConversation?.isGroupChat ? 'グループメッセージを送信...' : `${currentCharacterForNormalChat?.name || ''}にメッセージを送信...`} className={`flex-1 px-3 py-2.5 rounded-lg bg-transparent focus:outline-none text-sm sm:text-base ${inputFieldActualTextColor} placeholder-${isDarkMode || (lineThemeActive && isLineDark)?'text-slate-500':'text-slate-400'}`} disabled={isSending} />
                <button onClick={() => sendMessage()} disabled={isSending || (!input.trim() && !imageToSend) || (imageToSend && !currentModelSupportsImage) } className={`p-3 rounded-lg text-white transition-all duration-150 ease-in-out ${isSending || (!input.trim() && !imageToSend) || (imageToSend && !currentModelSupportsImage) ? (isDarkMode || (lineThemeActive && isLineDark)?'bg-slate-500 cursor-not-allowed':'bg-slate-400 cursor-not-allowed') : (lineThemeActive && !isLineDark ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' : 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700')} shadow-sm`} title="送信"> {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaPaperPlane size={18}/>} </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCharacterDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className={`${generalPanelBgColor} ${generalTextColor} p-6 rounded-xl shadow-2xl w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar`}>
            <div className="flex justify-between items-center mb-5"> <h3 className="text-2xl font-semibold">{editingCharacter ? 'キャラクター編集' : '新しいキャラクター作成'}</h3> <button onClick={() => { setShowCharacterDialog(false); setEditingCharacter(null); }} className={`p-1.5 rounded-full hover:${isDarkMode?'bg-slate-700/70':'bg-slate-200/70'} transition-colors`}><FaTimes size={22} /></button> </div>
            <div className="space-y-4">
              <div> <label className="block text-sm font-medium mb-1.5">名前 <span className="text-red-500">*</span></label> <input type="text" placeholder="例: AIアシスタント" value={editingCharacter ? editingCharacter.name : newCharacter.name} onChange={(e) => editingCharacter ? setEditingCharacter({...editingCharacter, name: e.target.value}) : setNewCharacter({...newCharacter, name: e.target.value})} className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`} /> </div>
              <div> <label className="block text-sm font-medium mb-1.5">説明</label> <input type="text" placeholder="例: 親切で協力的" value={editingCharacter ? editingCharacter.description : newCharacter.description} onChange={(e) => editingCharacter ? setEditingCharacter({...editingCharacter, description: e.target.value}) : setNewCharacter({...newCharacter, description: e.target.value})} className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`} /> </div>
              <div> <label className="block text-sm font-medium mb-1.5">アイコン (絵文字)</label> <input type="text" placeholder="例: 🤖" maxLength={2} value={editingCharacter ? editingCharacter.icon : newCharacter.icon} onChange={(e) => editingCharacter ? setEditingCharacter({...editingCharacter, icon: e.target.value}) : setNewCharacter({...newCharacter, icon: e.target.value})} className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`} /> </div>
              <div> <label className="block text-sm font-medium mb-1.5">テーマカラー</label> <input type="color" value={editingCharacter ? editingCharacter.color : newCharacter.color} onChange={(e) => editingCharacter ? setEditingCharacter({...editingCharacter, color: e.target.value}) : setNewCharacter({...newCharacter, color: e.target.value})} className={`w-full h-10 p-1 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalBorderColor} cursor-pointer`} /> </div>
              <div> <label className="block text-sm font-medium mb-1.5">システムプロンプト (指示)</label> <textarea rows={5} placeholder="AIへの指示を入力 (空の場合は自動生成)" value={editingCharacter ? editingCharacter.systemPrompt : newCharacter.systemPrompt} onChange={(e) => editingCharacter ? setEditingCharacter({...editingCharacter, systemPrompt: e.target.value}) : setNewCharacter({...newCharacter, systemPrompt: e.target.value})} className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors`} /> </div>
              <div className="flex items-center space-x-2 pt-1"> <input type="checkbox" id="useActiveHoursModal" checked={editingCharacter ? editingCharacter.useActiveHours : newCharacter.useActiveHours} onChange={(e) => editingCharacter ? setEditingCharacter({...editingCharacter, useActiveHours: e.target.checked}) : setNewCharacter({...newCharacter, useActiveHours: e.target.checked})} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" /> <label htmlFor="useActiveHoursModal" className="text-sm cursor-pointer select-none">活動時間を設定</label> </div>
              {(editingCharacter ? editingCharacter.useActiveHours : newCharacter.useActiveHours) && (
                <div className="grid grid-cols-2 gap-4">
                  <div> <label className="block text-xs font-medium">開始 (0-23時)</label> <input type="number" min="0" max="23" value={editingCharacter ? editingCharacter.activeHours.start : newCharacter.activeHours.start} onChange={(e) => { const val = parseInt(e.target.value); if (editingCharacter) setEditingCharacter({...editingCharacter, activeHours: {...editingCharacter.activeHours, start: val}}); else setNewCharacter({...newCharacter, activeHours: {...newCharacter.activeHours, start: val}}); }} className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`} /> </div>
                  <div> <label className="block text-xs font-medium">終了 (0-23時)</label> <input type="number" min="0" max="23" value={editingCharacter ? editingCharacter.activeHours.end : newCharacter.activeHours.end} onChange={(e) => { const val = parseInt(e.target.value); if (editingCharacter) setEditingCharacter({...editingCharacter, activeHours: {...editingCharacter.activeHours, end: val}}); else setNewCharacter({...newCharacter, activeHours: {...newCharacter.activeHours, end: val}}); }} className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`} /> </div>
                </div>
              )}
              <div className="flex items-center space-x-2 pt-1"> <input type="checkbox" id="isPublicModal" checked={editingCharacter ? editingCharacter.isPublic : newCharacter.isPublic} onChange={(e) => editingCharacter ? setEditingCharacter({...editingCharacter, isPublic: e.target.checked}) : setNewCharacter({...newCharacter, isPublic: e.target.checked})} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" /> <label htmlFor="isPublicModal" className="text-sm cursor-pointer select-none">公開キャラクター (将来用)</label> </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button onClick={handleGenerateRandomCharacterInDialog} className={`px-5 py-2.5 rounded-lg border ${generalBorderColor} hover:${isDarkMode?'bg-slate-700/70':'bg-slate-100'} transition-colors duration-150 w-full sm:w-auto ${generalTextColor} font-medium shadow-sm`}> ランダム生成 </button>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
                <button onClick={() => { setShowCharacterDialog(false); setEditingCharacter(null); }} className={`px-6 py-2.5 rounded-lg border ${generalBorderColor} hover:${isDarkMode?'bg-slate-700/70':'bg-slate-100'} transition-colors duration-150 w-full sm:w-auto ${generalTextColor} font-medium shadow-sm`}> キャンセル </button>
                <button onClick={editingCharacter ? saveCharacterEdit : addCharacter} className={`px-6 py-2.5 rounded-lg text-white font-medium ${editingCharacter ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'} transition-colors duration-150 w-full sm:w-auto shadow-md`}> {editingCharacter ? '保存' : '作成'} </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCharToCharSelectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className={`${generalPanelBgColor} ${generalTextColor} p-6 rounded-xl shadow-2xl w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">キャラクター同士の会話設定</h3>
              <button onClick={() => setShowCharToCharSelectModal(false)} className={`p-1.5 rounded-full hover:${isDarkMode?'bg-slate-700/70':'bg-slate-200/70'} transition-colors`}><FaTimes size={22}/></button>
            </div>
            {characters.length < 2 ? (
                <p>会話させるためには、少なくとも2体のキャラクターを作成する必要があります。</p>
            ) : (
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">キャラクター1</label>
                    <select
                    value={charToCharCandidates[0] || ''}
                    onChange={(e) => setCharToCharCandidates(prev => [e.target.value, prev[1]])}
                    className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    >
                    <option value="" disabled>選択してください</option>
                    {characters.map(char => (
                        <option key={char.id} value={char.id} disabled={char.id === charToCharCandidates[1]}>
                        {char.name}
                        </option>
                    ))}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1.5">キャラクター1のAIモデル</label>
                    <select
                        value={charToCharModels[0] || model}
                        onChange={(e) => setCharToCharModels(prev => [e.target.value, prev[1]])}
                        className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    >
                        {Object.entries(MODEL_OPTIONS).map(([label, info]) => (
                            <option key={info.value} value={info.value}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">キャラクター2</label>
                    <select
                    value={charToCharCandidates[1] || ''}
                    onChange={(e) => setCharToCharCandidates(prev => [prev[0], e.target.value])}
                    className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    >
                    <option value="" disabled>選択してください</option>
                    {characters.map(char => (
                        <option key={char.id} value={char.id} disabled={char.id === charToCharCandidates[0]}>
                        {char.name}
                        </option>
                    ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">キャラクター2のAIモデル</label>
                    <select
                        value={charToCharModels[1] || model}
                        onChange={(e) => setCharToCharModels(prev => [prev[0], e.target.value])}
                        className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    >
                        {Object.entries(MODEL_OPTIONS).map(([label, info]) => (
                            <option key={info.value} value={info.value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">会話モード</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['auto', 'battle', 'debate'] as const).map(modeValue => (
                            <button
                                key={modeValue}
                                onClick={() => setSelectedCharToCharMode(modeValue)}
                                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center
                                    ${selectedCharToCharMode === modeValue
                                        ? (isDarkMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-indigo-500 text-white border-indigo-600')
                                        : (isDarkMode ? `bg-slate-700 border-slate-600 hover:bg-slate-600 ${generalTextColor}` : `bg-slate-100 border-slate-300 hover:bg-slate-200 ${generalTextColor}`)}`}
                            >
                                {modeValue === 'auto' && <><FaComments className="mr-1.5"/>自動</>}
                                {modeValue === 'battle' && <><FaFistRaised className="mr-1.5"/>バトル</>}
                                {modeValue === 'debate' && <><FaBalanceScale className="mr-1.5"/>ディベート</>}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedCharToCharMode === 'debate' && (
                    <div>
                        <label htmlFor="debateTheme" className="block text-sm font-medium mb-1.5">ディベートのテーマ</label>
                        <input
                            type="text"
                            id="debateTheme"
                            value={debateThemeInput}
                            onChange={(e) => setDebateThemeInput(e.target.value)}
                            placeholder="例: AIは人間を超えるか？"
                            className={`w-full p-2.5 border rounded-lg shadow-sm ${generalInputFieldBgColor} ${generalTextColor} ${generalBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                        />
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                    <button
                    onClick={handleStartCharToCharConversation}
                    disabled={
                        !charToCharCandidates[0] || !charToCharCandidates[1] || charToCharCandidates[0] === charToCharCandidates[1] ||
                        (selectedCharToCharMode === 'debate' && !debateThemeInput.trim())
                    }
                    className={`px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors duration-150 shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed`}
                    >
                    会話開始
                    </button>
                </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Conversation Confirmation Dialog */}
      {showDeleteConversationDialog && conversationToDeleteId && (
        <ConfirmationDialog
          isOpen={showDeleteConversationDialog}
          title="会話の削除"
          message={`会話「${conversations.find(c => c.id === conversationToDeleteId)?.title || '選択された会話'}」を削除しますか？
この操作は元に戻せません。`}
          onConfirm={handleConfirmDeleteConversation}
          onCancel={() => {
            setShowDeleteConversationDialog(false);
            setConversationToDeleteId(null);
            console.log("Conversation deletion cancelled for ID:", conversationToDeleteId);
          }}
          confirmText="削除"
          cancelText="キャンセル"
        />
      )}

      {/* Delete Character Confirmation Dialog */}
      {showDeleteCharacterDialog && characterToDeleteId && (
        <ConfirmationDialog
          isOpen={showDeleteCharacterDialog}
          title={`キャラクター「${characters.find(c => c.id === characterToDeleteId)?.name || ''}」の削除`}
          message={characterDeleteMessage}
          onConfirm={handleConfirmDeleteCharacter}
          onCancel={() => {
            setShowDeleteCharacterDialog(false);
            setCharacterToDeleteId(null);
            setCharacterDeleteMessage('');
            console.log("Character deletion cancelled for ID:", characterToDeleteId);
          }}
          confirmText="削除"
          cancelText="キャンセル"
        />
      )}

      {showGroupChatModal && (
        <GroupChatCreationModal
            isOpen={showGroupChatModal}
            onClose={() => setShowGroupChatModal(false)}
            characters={characters}
            onCreateGroup={handleCreateGroupChat}
            isDarkMode={isDarkMode}
        />
      )}

       <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.5)'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#475569' : '#94a3b8'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#64748b' : '#64748b'}; }
        body {
          overscroll-behavior-y: contain;
          font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
        }
        ::selection { background-color: ${isDarkMode ? '#4338ca' : '#4f46e5'}; color: white; }
        .shadow-top-sm { box-shadow: 0 -1px 3px 0 rgba(0,0,0,0.03), 0 -1px 2px -1px rgba(0,0,0,0.03); }
        ${isDarkMode ? `.shadow-top-sm { box-shadow: 0 -1px 3px 0 rgba(255,255,255,0.02), 0 -1px 2px -1px rgba(255,255,255,0.01); }` : ''}
      `}</style>
    </div>
  )
}
