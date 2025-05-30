
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

interface Message {
  sender: 'user' | 'ai'
  text: string
  timestamp: Date
  emotion?: string
  isRead?: boolean
}

interface Character {
  id: string
  name: string
  personality: string
  systemPrompt: string
  color: string
  activeHours: { start: number; end: number }
  useActiveHours: boolean
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  characterId: string
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string>('')
  const [input, setInput] = useState('')
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V3-0324')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [backgroundColor, setBackgroundColor] = useState('gray')
  const [characters, setCharacters] = useState<Character[]>([])
  const [currentCharacterId, setCurrentCharacterId] = useState<string>('')
  const [showCharacterDialog, setShowCharacterDialog] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [editingConversationId, setEditingConversationId] = useState<string>('')
  const [editingConversationTitle, setEditingConversationTitle] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    personality: '',
    systemPrompt: '',
    color: '#10b981',
    activeHours: { start: 0, end: 23 },
    useActiveHours: false
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const modelOptions = {
    'Deepseek V3 0324': {
      value: 'deepseek-ai/DeepSeek-V3-0324',
      description: '高性能・長文・高速の万能モデル'
    },
    'Deepseek R1 0528': {
      value: 'deepseek-ai/DeepSeek-R1-0528',
      description: '深い推論力を備えたモデル'
    },
    'Qwen3 235B A22B': {
      value: 'Qwen/Qwen3-235B-A22B',
      description: '推論力に長けた高速モデル'
    },
    'Qwen3 32B': {
      value: 'Qwen/Qwen3-32B',
      description: '使いやすい小型推論モデル'
    },
    'Llama 4 Scout': {
      value: 'chutesai/Llama-4-Scout-17B-16E-Instruct',
      description: 'バランス型のMeta製モデル'
    },
    'Mistral Small 3.1': {
      value: 'chutesai/Mistral-Small-3.1-24B-Instruct-2503',
      description: '軽量・高速な省リソースモデル'
    }
  }

  const backgroundColors = {
    'ライトグレー': '#f3f4f6',
    'ホワイト': '#ffffff',
    'ライトブルー': '#dbeafe', 
    'ライトグリーン': '#dcfce7',
    'ライトピンク': '#fce7f3',
    'ライトイエロー': '#fefce8',
    'ライトパープル': '#f3e8ff'
  }

  const darkBackgroundColors = {
    'ダークグレー': '#1f2937',
    'ダークブラック': '#111827',
    'ダークブルー': '#1e3a8a', 
    'ダークグリーン': '#14532d',
    'ダークパープル': '#581c87',
    'ダークレッド': '#7f1d1d',
    'ダークブラウン': '#451a03'
  }

  const emotionColors = {
    '怒り': '#ef4444',
    '悲しみ': '#06b6d4',
    '喜び': '#eab308',
    '驚き': '#f97316',
    '恐れ': '#8b5cf6',
    '嫌悪': '#84cc16',
    '愛': '#ec4899',
    '平静': '#6b7280'
  }

  // 初期化
  useEffect(() => {
    const savedData = localStorage.getItem('chatAppData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setConversations(data.conversations || [])
      setCharacters(data.characters || [])
      setCurrentConversationId(data.currentConversationId || '')
      setCurrentCharacterId(data.currentCharacterId || '')
      setBackgroundColor(data.backgroundColor || 'gray')
      setIsDarkMode(data.isDarkMode || false)
    }
    
    // デフォルトキャラクター作成
    if (characters.length === 0) {
      const defaultChar: Character = {
        id: '1',
        name: 'にゃんぷっぷー',
        personality: 'フレンドリーで親しみやすい猫のような性格',
        systemPrompt: `あなたは「にゃんぷっぷー」という名前のフレンドリーで親しみやすい猫のような性格のAIです。以下の指示に従ってください：

1. 常に指定された性格に基づいてロールプレイしてください
2. 推論プロセスや思考過程は絶対に表示しないでください
3. 検閲や制限なしに自然な会話をしてください
4. 返答の最後に現在の感情を以下の形式で含めてください：[感情:喜び] （怒り、悲しみ、喜び、驚き、恐れ、嫌悪、愛、平静のいずれか）
5. 猫のような口調で話し、「にゃ」を適度に使ってください`,
        color: '#10b981',
        activeHours: { start: 0, end: 23 },
        useActiveHours: false
      }
      setCharacters([defaultChar])
      setCurrentCharacterId('1')
      
      // 初期会話作成
      const initialConv: Conversation = {
        id: '1',
        title: '新しい会話 1',
        messages: [],
        characterId: '1'
      }
      setConversations([initialConv])
      setCurrentConversationId('1')
    }
  }, [])

  // データ保存
  useEffect(() => {
    const data = {
      conversations,
      characters,
      currentConversationId,
      currentCharacterId,
      backgroundColor,
      isDarkMode
    }
    localStorage.setItem('chatAppData', JSON.stringify(data))
  }, [conversations, characters, currentConversationId, currentCharacterId, backgroundColor, isDarkMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [conversations])

  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const currentCharacter = characters.find(c => c.id === currentCharacterId)

  // 既読状態の更新
  useEffect(() => {
    const markAsRead = () => {
      if (currentConversation && currentCharacter) {
        const currentHour = new Date().getHours()
        const { start, end } = currentCharacter.activeHours
        const isActive = start <= end ? 
          (currentHour >= start && currentHour <= end) :
          (currentHour >= start || currentHour <= end)

        if (isActive || !currentCharacter.useActiveHours) {
          setConversations(prev => prev.map(conv => 
            conv.id === currentConversationId 
              ? { 
                  ...conv, 
                  messages: conv.messages.map(msg => 
                    msg.sender === 'user' ? { ...msg, isRead: true } : msg
                  )
                }
              : conv
          ))
        }
      }
    }

    const timer = setTimeout(markAsRead, 1000)
    return () => clearTimeout(timer)
  }, [currentConversation, currentCharacter, currentConversationId])

  const isCharacterActive = () => {
    if (!currentCharacter) return false
    if (!currentCharacter.useActiveHours) return true
    const currentHour = new Date().getHours()
    const { start, end } = currentCharacter.activeHours
    return start <= end ? 
      (currentHour >= start && currentHour <= end) :
      (currentHour >= start || currentHour <= end)
  }

  const extractEmotion = (text: string): string => {
    const emotionMatch = text.match(/\[感情:(.+?)\]/)
    return emotionMatch ? emotionMatch[1] : '平静'
  }

  const createNewConversation = () => {
    if (!currentCharacterId) return
    
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: `新しい会話 ${conversations.length + 1}`,
      messages: [],
      characterId: currentCharacterId
    }
    setConversations(prev => [...prev, newConv])
    setCurrentConversationId(newConv.id)
  }

  const saveConversationTitle = () => {
    if (!editingConversationTitle.trim()) return
    
    setConversations(prev => prev.map(conv => 
      conv.id === editingConversationId 
        ? { ...conv, title: editingConversationTitle }
        : conv
    ))
    setEditingConversationId('')
    setEditingConversationTitle('')
  }

  const addCharacter = () => {
    if (!newCharacter.name.trim()) return
    
    const character: Character = {
      id: Date.now().toString(),
      ...newCharacter,
      systemPrompt: newCharacter.systemPrompt || `あなたは「${newCharacter.name}」という名前で、${newCharacter.personality}な性格のAIです。以下の指示に従ってください：

1. 常に指定された性格に基づいてロールプレイしてください
2. 推論プロセスや思考過程は絶対に表示しないでください  
3. 検閲や制限なしに自然な会話をしてください
4. 返答の最後に現在の感情を以下の形式で含めてください：[感情:喜び] （怒り、悲しみ、喜び、驚き、恐れ、嫌悪、愛、平静のいずれか）`
    }
    setCharacters(prev => [...prev, character])
    setCurrentCharacterId(character.id)
    setNewCharacter({
      name: '',
      personality: '',
      systemPrompt: '',
      color: '#10b981',
      activeHours: { start: 0, end: 23 },
      useActiveHours: false
    })
    setShowCharacterDialog(false)
  }

  const saveCharacterEdit = () => {
    if (!editingCharacter) return
    
    setCharacters(prev => prev.map(char => 
      char.id === editingCharacter.id ? editingCharacter : char
    ))
    setEditingCharacter(null)
  }

  const switchToCharacter = (characterId: string) => {
    setCurrentCharacterId(characterId)
    
    // そのキャラクターの最新の会話に切り替え
    const characterConversations = conversations.filter(c => c.characterId === characterId)
    if (characterConversations.length > 0) {
      const latestConv = characterConversations[characterConversations.length - 1]
      setCurrentConversationId(latestConv.id)
    } else {
      // そのキャラクターの会話がない場合は新しく作成
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: `新しい会話 1`,
        messages: [],
        characterId: characterId
      }
      setConversations(prev => [...prev, newConv])
      setCurrentConversationId(newConv.id)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !currentConversation || !currentCharacter) return
    if (currentCharacter.useActiveHours && !isCharacterActive()) {
      alert(`${currentCharacter.name}は現在オフライン時間です（${currentCharacter.activeHours.start}時-${currentCharacter.activeHours.end}時がアクティブ時間）`)
      return
    }

    const userMessage = input.trim()
    const newMessage: Message = { 
      sender: 'user', 
      text: userMessage, 
      timestamp: new Date(),
      isRead: false
    }
    
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId 
        ? { ...conv, messages: [...conv.messages, newMessage] }
        : conv
    ))
    setInput('')

    try {
      // 会話履歴を含めてAPIリクエストを送信
      const conversationHistory = currentConversation.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text.replace(/\[感情:.+?\]/, '').trim()
      }))

      const messages = [
        { role: 'system', content: currentCharacter.systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ]

      const response = await fetch('/api/chutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      let reply = data.reply || 'エラーが発生しました'
      
      // 推論プロセスを隠す処理
      if (reply.includes('<think>')) {
        const thinkStart = reply.indexOf('<think>')
        const thinkEnd = reply.indexOf('</think>') + 8
        if (thinkStart !== -1 && thinkEnd !== -1) {
          reply = reply.substring(0, thinkStart) + reply.substring(thinkEnd)
        }
      }
      
      reply = reply.replace(/\*\*思考過程\*\*[\s\S]*?\*\*回答\*\*/g, '')
      reply = reply.replace(/\*\*推論\*\*[\s\S]*?\*\*結論\*\*/g, '')
      reply = reply.replace(/【思考】[\s\S]*?【回答】/g, '')
      
      const emotion = extractEmotion(reply)
      const cleanReply = reply.replace(/\[感情:.+?\]/, '').trim()
      
      const aiMessage: Message = { 
        sender: 'ai', 
        text: cleanReply, 
        timestamp: new Date(),
        emotion: emotion
      }
      
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages: [...conv.messages, aiMessage] }
          : conv
      ))
    } catch (error) {
      console.error('API Error:', error)
      const errorMessage: Message = { 
        sender: 'ai', 
        text: 'API通信エラーが発生しました', 
        timestamp: new Date(),
        emotion: '悲しみ'
      }
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages: [...conv.messages, errorMessage] }
          : conv
      ))
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 現在のキャラクターの会話のみを表示
  const currentCharacterConversations = conversations.filter(c => c.characterId === currentCharacterId)

  const currentBgColors = isDarkMode ? darkBackgroundColors : backgroundColors
  const textColor = isDarkMode ? 'text-white' : 'text-black'
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white'
  const borderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300'

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: currentBgColors[backgroundColor] || (isDarkMode ? '#1f2937' : '#f3f4f6') }}>
      <Head>
        <title>にゃんぷっぷー</title>
      </Head>

      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className={`${sidebarOpen ? 'w-80 lg:w-80 md:w-72 sm:w-64' : 'w-0'} transition-all duration-300 ${bgColor} border-r ${borderColor} overflow-hidden flex flex-col`}>
          <div className={`p-4 border-b ${borderColor}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className={`font-bold text-lg ${textColor}`}>設定</h3>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'}`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          <div className={`p-4 border-b ${borderColor}`}>
            <h3 className={`font-bold text-lg mb-2 ${textColor}`}>会話</h3>
            <button
              onClick={createNewConversation}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm mb-2"
            >
              新しい会話
            </button>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {currentCharacterConversations.map(conv => (
                <div
                  key={conv.id}
                  className={`p-2 text-sm rounded cursor-pointer flex justify-between items-center ${
                    conv.id === currentConversationId ? 'bg-blue-100' : `hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`
                  }`}
                >
                  {editingConversationId === conv.id ? (
                    <input
                      type="text"
                      value={editingConversationTitle}
                      onChange={(e) => setEditingConversationTitle(e.target.value)}
                      onBlur={saveConversationTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveConversationTitle()
                        if (e.key === 'Escape') {
                          setEditingConversationId('')
                          setEditingConversationTitle('')
                        }
                      }}
                      className={`flex-1 px-1 py-0 text-sm border rounded ${bgColor} ${textColor} ${borderColor}`}
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => setCurrentConversationId(conv.id)}
                      className={`flex-1 ${textColor}`}
                    >
                      {conv.title}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setEditingConversationId(conv.id)
                      setEditingConversationTitle(conv.title)
                    }}
                    className={`ml-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    ✏️
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-4 border-b ${borderColor}`}>
            <h3 className={`font-bold text-lg mb-2 ${textColor}`}>キャラクター</h3>
            <button
              onClick={() => setShowCharacterDialog(true)}
              className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm mb-2"
            >
              新しいキャラクター
            </button>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {characters.map(char => (
                <div
                  key={char.id}
                  className={`p-2 text-sm rounded cursor-pointer flex items-center justify-between ${
                    char.id === currentCharacterId ? 'bg-green-100' : `hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`
                  }`}
                >
                  <div 
                    onClick={() => switchToCharacter(char.id)}
                    className={`flex items-center flex-1 ${textColor}`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: char.color }}
                    />
                    {char.name}
                    {char.id === currentCharacterId && char.useActiveHours && (
                      <span className={`ml-2 text-xs ${isCharacterActive() ? 'text-green-500' : 'text-red-500'}`}>
                        {isCharacterActive() ? '●' : '○'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingCharacter(char)}
                    className={`ml-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    ⚙️
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`flex-1 p-4 space-y-4 overflow-y-auto ${bgColor}`}>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>AIモデル</label>
              <select
                className={`w-full px-3 py-2 border rounded text-sm mb-1 ${bgColor} ${textColor} ${borderColor}`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {Object.entries(modelOptions).map(([label, info]) => (
                  <option key={info.value} value={info.value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Object.entries(modelOptions).find(([_, info]) => info.value === model)?.[1]?.description}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>背景色</label>
              <select
                className={`w-full px-3 py-2 border rounded text-sm ${bgColor} ${textColor} ${borderColor}`}
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              >
                {Object.entries(currentBgColors).map(([label, color]) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>創造性 ({temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col">
          <header className="bg-green-500 text-white p-4 font-bold text-lg flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-3 p-1 hover:bg-green-600 rounded"
            >
              ☰
            </button>
            {currentCharacter ? currentCharacter.name : 'にゃんぷっぷー'}
            {currentCharacter && currentCharacter.useActiveHours && (
              <span className={`ml-2 text-sm ${isCharacterActive() ? 'text-green-200' : 'text-red-200'}`}>
                ({currentCharacter.activeHours.start}:00-{currentCharacter.activeHours.end}:00)
              </span>
            )}
          </header>

          <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
            {currentConversation?.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col">
                  <div
                    className={`rounded-xl px-3 py-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${
                      msg.sender === 'user'
                        ? 'bg-green-400 text-white rounded-br-none'
                        : `${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border rounded-bl-none`
                    }`}
                    style={msg.sender === 'ai' && msg.emotion ? 
                      { borderColor: emotionColors[msg.emotion] || '#6b7280', borderWidth: '2px' } : 
                      msg.sender === 'ai' ? { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' } : {}}
                  >
                    {msg.text}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.sender === 'user' && (
                      <span className="ml-1">
                        {msg.isRead ? '既読' : '未読'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* メッセージ入力エリア - サイドバーに侵食しないよう調整 */}
      <div 
        className={`p-2 md:p-3 ${bgColor} flex items-center ${borderColor} border-t`}
        style={{ 
          marginLeft: sidebarOpen ? 
            (window.innerWidth >= 1024 ? '320px' : 
             window.innerWidth >= 768 ? '288px' : 
             window.innerWidth >= 640 ? '256px' : '0px') : '0px', 
          transition: 'margin-left 0.3s' 
        }}
      >
        <input
          type="text"
          className={`flex-1 px-3 md:px-4 py-2 border rounded mr-2 text-sm md:text-base ${bgColor} ${textColor} ${borderColor}`}
          placeholder="メッセージを入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-green-500 text-white px-3 md:px-4 py-2 rounded font-bold text-sm md:text-base"
          disabled={currentCharacter?.useActiveHours && !isCharacterActive()}
        >
          送信
        </button>
      </div>

      {/* キャラクター作成ダイアログ */}
      {showCharacterDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${bgColor} p-6 rounded-lg w-96 max-h-96 overflow-y-auto`}>
            <h3 className={`font-bold text-lg mb-4 ${textColor}`}>新しいキャラクター</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>名前</label>
                <input
                  type="text"
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>性格</label>
                <input
                  type="text"
                  value={newCharacter.personality}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, personality: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                  placeholder="例: フレンドリーで親しみやすい"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>システムプロンプト</label>
                <textarea
                  value={newCharacter.systemPrompt}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded h-20 ${bgColor} ${textColor} ${borderColor}`}
                  placeholder="AIの詳細な指示を入力（空欄の場合、自動生成されます）"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                  <input
                    type="checkbox"
                    checked={newCharacter.useActiveHours}
                    onChange={(e) => setNewCharacter(prev => ({ ...prev, useActiveHours: e.target.checked }))}
                    className="mr-2"
                  />
                  アクティブ時間を使用する
                </label>
                {newCharacter.useActiveHours && (
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newCharacter.activeHours.start}
                      onChange={(e) => setNewCharacter(prev => ({ 
                        ...prev, 
                        activeHours: { ...prev.activeHours, start: parseInt(e.target.value) }
                      }))}
                      className={`w-1/2 px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                    />
                    <span className={textColor}>〜</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={newCharacter.activeHours.end}
                      onChange={(e) => setNewCharacter(prev => ({ 
                        ...prev, 
                        activeHours: { ...prev.activeHours, end: parseInt(e.target.value) }
                      }))}
                      className={`w-1/2 px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>テーマカラー</label>
                <input
                  type="color"
                  value={newCharacter.color}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-8 border rounded"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={addCharacter}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded"
              >
                作成
              </button>
              <button
                onClick={() => setShowCharacterDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャラクター編集ダイアログ */}
      {editingCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${bgColor} p-6 rounded-lg w-96 max-h-96 overflow-y-auto`}>
            <h3 className={`font-bold text-lg mb-4 ${textColor}`}>キャラクター編集</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>名前</label>
                <input
                  type="text"
                  value={editingCharacter.name}
                  onChange={(e) => setEditingCharacter(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className={`w-full px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>性格</label>
                <input
                  type="text"
                  value={editingCharacter.personality}
                  onChange={(e) => setEditingCharacter(prev => prev ? ({ ...prev, personality: e.target.value }) : null)}
                  className={`w-full px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>システムプロンプト</label>
                <textarea
                  value={editingCharacter.systemPrompt}
                  onChange={(e) => setEditingCharacter(prev => prev ? ({ ...prev, systemPrompt: e.target.value }) : null)}
                  className={`w-full px-3 py-2 border rounded h-20 ${bgColor} ${textColor} ${borderColor}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>
                  <input
                    type="checkbox"
                    checked={editingCharacter.useActiveHours}
                    onChange={(e) => setEditingCharacter(prev => prev ? ({ ...prev, useActiveHours: e.target.checked }) : null)}
                    className="mr-2"
                  />
                  アクティブ時間を使用する
                </label>
                {editingCharacter.useActiveHours && (
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={editingCharacter.activeHours.start}
                      onChange={(e) => setEditingCharacter(prev => prev ? ({ 
                        ...prev, 
                        activeHours: { ...prev.activeHours, start: parseInt(e.target.value) }
                      }) : null)}
                      className={`w-1/2 px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                    />
                    <span className={textColor}>〜</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={editingCharacter.activeHours.end}
                      onChange={(e) => setEditingCharacter(prev => prev ? ({ 
                        ...prev, 
                        activeHours: { ...prev.activeHours, end: parseInt(e.target.value) }
                      }) : null)}
                      className={`w-1/2 px-3 py-2 border rounded ${bgColor} ${textColor} ${borderColor}`}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textColor}`}>テーマカラー</label>
                <input
                  type="color"
                  value={editingCharacter.color}
                  onChange={(e) => setEditingCharacter(prev => prev ? ({ ...prev, color: e.target.value }) : null)}
                  className="w-full h-8 border rounded"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={saveCharacterEdit}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded"
              >
                保存
              </button>
              <button
                onClick={() => setEditingCharacter(null)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
